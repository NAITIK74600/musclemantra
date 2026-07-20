'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet is loaded from a
   CDN at runtime (static export) and ships no bundled types, so its map/marker
   instances are necessarily untyped here. */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Truck, Phone, RefreshCw, Loader2, Radio, PackageCheck,
  ArrowLeft, ShieldCheck, Navigation,
} from 'lucide-react';

const ORANGE = '#FF6B00';

type Track = {
  id: string;
  status: string;
  customer: string | null;
  riderName: string | null;
  lat: number | null;
  lng: number | null;
  updatedAt: string | null;
  live: boolean;
  destination: string;
  deliveredAt: string | null;
};

// Journey stages shown as a progress rail.
const STAGES = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
function stageIndex(status: string): number {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('ship')) return 2;
  if (s.includes('pack')) return 1;
  return 0;
}

/** Lazy-load Leaflet from CDN (works with static export — no bundling needed). */
function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { L?: unknown };
    if (w.L) { resolve(w.L); return; }
    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link');
      css.id = 'leaflet-css';
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as unknown as { L: unknown }).L));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.id = 'leaflet-js';
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.async = true;
    s.onload = () => resolve((window as unknown as { L: unknown }).L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

/** Great-circle distance in km — fallback ETA when routing is unavailable. */
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Glide a Leaflet marker from → to over `duration` ms so the rider never jumps. */
function animateMarker(
  marker: any,
  from: [number, number],
  to: [number, number],
  duration: number,
  animRef: { current: number | null },
  onFrame: (p: [number, number]) => void,
) {
  if (animRef.current != null) cancelAnimationFrame(animRef.current);
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
    const lat = from[0] + (to[0] - from[0]) * e;
    const lng = from[1] + (to[1] - from[1]) * e;
    marker.setLatLng([lat, lng]);
    onFrame([lat, lng]);
    if (t < 1) animRef.current = requestAnimationFrame(step);
    else animRef.current = null;
  };
  animRef.current = requestAnimationFrame(step);
}

export default function TrackPage() {
  const [id, setId] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<Track | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [eta, setEta] = useState<{ km: number; mins: number } | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const destGeocodedRef = useRef(false);
  const destCoordsRef = useRef<[number, number] | null>(null);
  const riderPosRef = useRef<[number, number] | null>(null);
  const animRef = useRef<number | null>(null);
  const routeAtRef = useRef(0);

  // Prefill from ?id= & ?phone= in the URL (e.g. from the tracking email link).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qid = q.get('id');
    const qphone = q.get('phone');
    if (qid) setId(qid);
    if (qphone) setPhone(qphone);
    if (qid && qphone) setSubmitted(true);
  }, []);

  const fetchTrack = useCallback(async () => {
    if (!id || !phone) return;
    try {
      const res = await fetch(`/api/track-order?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (json?.error) { setError(json.error); setData(null); return; }
      setError('');
      setData(json as Track);
    } catch {
      setError('Network error — retrying…');
    } finally {
      setLoading(false);
    }
  }, [id, phone]);

  // Poll every 5s while tracking (feels live, like a quick-commerce app).
  useEffect(() => {
    if (!submitted) return;
    setLoading(true);
    fetchTrack();
    const t = setInterval(fetchTrack, 5000);
    return () => clearInterval(t);
  }, [submitted, fetchTrack]);

  // Stop any in-flight marker animation when the page unmounts.
  useEffect(() => () => { if (animRef.current != null) cancelAnimationFrame(animRef.current); }, []);

  // Draw / move the rider on the map (smooth, Blinkit-style with live route + ETA).
  useEffect(() => {
    if (!submitted || !data || data.lat == null || data.lng == null) return;
    let cancelled = false;
    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;
        const target: [number, number] = [data.lat!, data.lng!];

        if (!leafletRef.current) {
          leafletRef.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
            .setView(target, 15);
          // Dark, clean tiles that match the app theme.
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20, subdomains: 'abcd',
          }).addTo(leafletRef.current);
        }
        const map = leafletRef.current;

        const riderIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:38px;height:38px">
            <div class="mb-rider-pulse"></div>
            <div style="position:absolute;inset:0;background:${ORANGE};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(255,107,0,0.25),0 4px 14px rgba(0,0,0,0.5)">
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
            </div>
          </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        if (!riderMarkerRef.current) {
          riderMarkerRef.current = L.marker(target, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
          riderPosRef.current = target;
        } else {
          animateMarker(riderMarkerRef.current, riderPosRef.current || target, target, 900, animRef, (p) => {
            riderPosRef.current = p;
          });
        }
        map.panTo(target, { animate: true, duration: 0.9 });

        // Geocode the destination once and drop a pin.
        if (!destGeocodedRef.current && data.destination) {
          destGeocodedRef.current = true;
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(data.destination)}`,
              { headers: { 'Accept-Language': 'en' } },
            );
            const arr = await r.json();
            if (!cancelled && Array.isArray(arr) && arr[0]) {
              const dlat = parseFloat(arr[0].lat);
              const dlng = parseFloat(arr[0].lon);
              destCoordsRef.current = [dlat, dlng];
              const destIcon = L.divIcon({
                className: '',
                html: `<div style="background:#22c55e;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.5);border:2px solid #fff"></div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 24],
              });
              destMarkerRef.current = L.marker([dlat, dlng], { icon: destIcon })
                .addTo(map).bindPopup('Delivery address');
              const group = L.featureGroup([riderMarkerRef.current, destMarkerRef.current]);
              map.fitBounds(group.getBounds().pad(0.4));
            }
          } catch { /* geocode is best-effort */ }
        }

        // Draw the real road route + compute a live ETA (throttled to ~15s).
        if (destCoordsRef.current && (!routeLineRef.current || Date.now() - routeAtRef.current > 15000)) {
          routeAtRef.current = Date.now();
          const dest = destCoordsRef.current;
          try {
            const rr = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${target[1]},${target[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`,
            );
            const rj = await rr.json();
            const route = rj?.routes?.[0];
            if (!cancelled && route) {
              const coords = (route.geometry.coordinates as number[][]).map((c) => [c[1], c[0]] as [number, number]);
              if (routeLineRef.current) routeLineRef.current.setLatLngs(coords);
              else routeLineRef.current = L.polyline(coords, {
                color: ORANGE, weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round',
              }).addTo(map);
              setEta({ km: route.distance / 1000, mins: Math.max(1, Math.round(route.duration / 60)) });
            } else throw new Error('no route');
          } catch {
            if (!cancelled) {
              const km = haversineKm(target, dest);
              setEta({ km, mins: Math.max(1, Math.round((km / 22) * 60)) }); // ~22 km/h city speed
            }
          }
        }
      } catch { /* leaflet failed to load */ }
    })();
    return () => { cancelled = true; };
  }, [submitted, data]);

  const delivered = data ? stageIndex(data.status) >= 4 : false;
  const outForDelivery = data ? data.status.toLowerCase().includes('out for') : false;

  // ── Entry form ────────────────────────────────────────────────────────
  if (!submitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-md">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={15} /> My orders
          </Link>
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,107,0,0.12)' }}>
              <Truck size={22} color={ORANGE} />
            </div>
            <h1 className="text-xl font-bold mb-1">Track your order</h1>
            <p className="text-[13px] text-white/50 mb-6">Enter your order ID and phone number to watch your rider live.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (id && phone) { setError(''); setSubmitted(true); } }}
              className="space-y-3"
            >
              <input
                value={id} onChange={(e) => setId(e.target.value)}
                placeholder="Order ID"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#FF6B00]/50"
              />
              <input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number on the order"
                inputMode="numeric"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#FF6B00]/50"
              />
              <button
                type="submit"
                className="w-full bg-[#FF6B00] hover:brightness-110 text-white font-semibold text-[14px] rounded-xl py-3 transition-all"
              >
                Track live
              </button>
            </form>
            <p className="mt-4 text-[11px] text-white/30 flex items-center gap-1.5">
              <ShieldCheck size={13} /> We verify with your phone so only you can track this order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Tracking view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSubmitted(false); setData(null); setEta(null);
              if (animRef.current != null) cancelAnimationFrame(animRef.current);
              animRef.current = null;
              leafletRef.current = null; riderMarkerRef.current = null; destMarkerRef.current = null;
              routeLineRef.current = null; destGeocodedRef.current = false;
              destCoordsRef.current = null; riderPosRef.current = null; routeAtRef.current = 0;
            }}
            className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Track another
          </button>
          <button onClick={() => fetchTrack()} className="inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-[13px] text-red-300 mb-4">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center justify-center py-24 text-white/40">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}

        {data && (
          <>
            {/* Status banner */}
            <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-1">
                {delivered ? <PackageCheck size={18} color="#22c55e" /> : <Truck size={18} color={ORANGE} />}
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: delivered ? '#22c55e' : ORANGE }}>
                  {delivered ? 'Delivered' : data.status}
                </span>
                {data.live && !delivered && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-green-400">
                    <Radio size={12} className="animate-pulse" /> Live
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold">Order #{data.id}</h1>
              {data.riderName && !delivered && (
                <p className="text-[13px] text-white/50 mt-0.5">
                  Rider: <span className="text-white/80">{data.riderName}</span>
                </p>
              )}

              {/* Progress rail */}
              <div className="flex items-center mt-5">
                {STAGES.map((label, i) => {
                  const active = i <= stageIndex(data.status);
                  return (
                    <div key={label} className="flex-1 flex items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: active ? (delivered && i === 4 ? '#22c55e' : ORANGE) : 'rgba(255,255,255,0.15)' }}
                        />
                        <span className="text-[8px] mt-1 text-white/40 whitespace-nowrap hidden sm:block">{label}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className="flex-1 h-[2px] mx-1" style={{ background: i < stageIndex(data.status) ? ORANGE : 'rgba(255,255,255,0.12)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live map */}
            {outForDelivery && data.lat != null && data.lng != null ? (
              <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                <style dangerouslySetInnerHTML={{ __html: `@keyframes mbTrackPulse{0%{transform:scale(.6);opacity:.7}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}.mb-rider-pulse{position:absolute;inset:0;border-radius:9999px;background:rgba(255,107,0,.45);animation:mbTrackPulse 1.8s ease-out infinite}` }} />
                <div className="relative">
                  <div ref={mapRef} style={{ height: 360, width: '100%', background: '#0a0a0a' }} />
                  {eta && (
                    <div className="absolute top-3 left-3 z-[500] bg-[#0d0d0d]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2 shadow-xl">
                      <p className="text-[9px] uppercase tracking-widest text-white/40 leading-none mb-1">Arriving in</p>
                      <p className="text-[19px] font-extrabold leading-none" style={{ color: ORANGE }}>~{eta.mins} min</p>
                      <p className="text-[11px] text-white/50 mt-1 leading-none">{eta.km.toFixed(1)} km away</p>
                    </div>
                  )}
                  {data.live && (
                    <div className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 bg-[#0d0d0d]/90 backdrop-blur border border-green-500/30 rounded-full px-2.5 py-1 text-[11px] font-semibold text-green-400">
                      <Radio size={12} className="animate-pulse" /> Live
                    </div>
                  )}
                </div>
                <div className="bg-[#0d0d0d] px-4 py-3 flex items-center gap-2 text-[12px] text-white/50">
                  <Navigation size={13} color={ORANGE} />
                  {eta && eta.km <= 0.3
                    ? <span className="text-green-400 font-semibold">Your rider is arriving now! 🎉</span>
                    : data.live ? 'Rider is on the move — updating live' : 'Waiting for the next location update…'}
                  {data.updatedAt && <span className="ml-auto text-white/30">Updated {new Date(data.updatedAt).toLocaleTimeString()}</span>}
                </div>
              </div>
            ) : delivered ? (
              <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 text-center mb-4">
                <PackageCheck size={30} color="#22c55e" className="mx-auto mb-2" />
                <p className="text-[14px] font-semibold text-green-300">Delivered — enjoy your gains fuel! 💪</p>
                {data.deliveredAt && <p className="text-[12px] text-white/40 mt-1">{new Date(data.deliveredAt).toLocaleString()}</p>}
              </div>
            ) : (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 text-center mb-4">
                <MapPin size={26} className="mx-auto mb-2 text-white/30" />
                <p className="text-[13px] text-white/50">
                  Live map appears once your order is <span className="text-white/80">Out for Delivery</span>.
                </p>
              </div>
            )}

            {/* Destination */}
            {data.destination && (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <MapPin size={16} color={ORANGE} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/40 mb-0.5">Delivering to</p>
                  <p className="text-[13px] text-white/75 leading-relaxed">{data.destination}</p>
                </div>
              </div>
            )}

            <p className="text-center text-[11px] text-white/30 mt-5 flex items-center justify-center gap-1.5">
              <Phone size={12} /> Need help? Reply to your order email — our team will assist.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
