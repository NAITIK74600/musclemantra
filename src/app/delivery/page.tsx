'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Truck, MapPin, Phone, MessageCircle, Navigation, LocateFixed,
  Radio, PackageCheck, KeyRound, RefreshCw, LogOut, Loader2, ShieldCheck, IndianRupee,
} from 'lucide-react';

const KEY_STORE = 'mb_delivery_key';

interface RiderOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total: number;
  payment_method: string;
  status: string;
  items: { name: string; price: number; quantity: number }[];
  hasOtp: boolean;
  delivered_at: string | null;
  rider_loc_at: string | null;
}

const ORANGE = '#FF6B00';

function fullAddress(o: RiderOrder) {
  return [o.address, o.city, o.state, o.pincode].filter(Boolean).join(', ');
}

export default function DeliveryPanel() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [riderName, setRiderName] = useState('');
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [liveId, setLiveId] = useState('');
  const watchRef = useRef<number | null>(null);

  // Restore saved key
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(KEY_STORE) : '';
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('mb_rider_name') || '' : '';
    setRiderName(savedName);
    if (saved) { setKey(saved); setAuthed(true); }
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(`/api/${path}`, {
        ...init,
        headers: {
          'x-delivery-key': key,
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init?.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      return data;
    },
    [key],
  );

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setErr('');
    try {
      const data = await api('delivery-orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [api, key]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [authed, load]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const k = keyInput.trim();
    if (!k) return;
    // Validate by trying to fetch with this key.
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-orders', { headers: { 'x-delivery-key': k } });
      if (!res.ok) throw new Error('Invalid delivery key');
      sessionStorage.setItem(KEY_STORE, k);
      if (riderName) localStorage.setItem('mb_rider_name', riderName);
      setKey(k);
      setAuthed(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid delivery key');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setLiveId('');
    sessionStorage.removeItem(KEY_STORE);
    setKey('');
    setAuthed(false);
    setOrders([]);
  };

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setErr('');
    try {
      await api('delivery-update', {
        method: 'POST',
        body: JSON.stringify({ id, status, rider: riderName }),
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const confirmDelivery = async (id: string) => {
    const otp = (otpInputs[id] || '').trim();
    if (otp.length < 4) { setErr('Enter the 6-digit code from the customer'); return; }
    setBusyId(id);
    setErr('');
    try {
      await api('verify-delivery', { method: 'POST', body: JSON.stringify({ id, otp }) });
      setOtpInputs((p) => ({ ...p, [id]: '' }));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Wrong code');
    } finally {
      setBusyId('');
    }
  };

  // One-shot: share current location against an order (autofill from GPS).
  const shareLocation = (id: string) => {
    if (!navigator.geolocation) { setErr('GPS not supported on this device'); return; }
    setBusyId(id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api('delivery-update', {
            method: 'POST',
            body: JSON.stringify({
              id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              rider: riderName,
            }),
          });
          await load();
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Could not share location');
        } finally {
          setBusyId('');
        }
      },
      () => { setErr('Location permission denied'); setBusyId(''); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Continuous live location for one active order.
  const toggleLive = (id: string) => {
    if (liveId === id) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setLiveId('');
      return;
    }
    if (!navigator.geolocation) { setErr('GPS not supported on this device'); return; }
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    setLiveId(id);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        api('delivery-update', {
          method: 'POST',
          body: JSON.stringify({
            id, lat: pos.coords.latitude, lng: pos.coords.longitude, rider: riderName,
          }),
        }).catch(() => {});
      },
      () => { setErr('Location permission denied'); setLiveId(''); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  // ── Login gate ───────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5">
        <form
          onSubmit={signIn}
          className="w-full max-w-sm bg-[#0d0d0d] border border-white/8 rounded-2xl p-7"
        >
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center mb-4">
            <Truck size={22} style={{ color: ORANGE }} />
          </div>
          <h1 className="text-white font-black text-xl mb-1">Delivery Panel</h1>
          <p className="text-white/40 text-sm mb-6">Riders only — enter your delivery key to continue.</p>

          <label className="block text-[11px] font-bold tracking-wide text-white/40 uppercase mb-1.5">Your name</label>
          <input
            value={riderName}
            onChange={(e) => setRiderName(e.target.value)}
            placeholder="e.g. Rahul"
            className="w-full mb-4 px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[rgba(255,107,0,0.5)]"
          />

          <label className="block text-[11px] font-bold tracking-wide text-white/40 uppercase mb-1.5">Delivery key</label>
          <input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            type="password"
            placeholder="Enter delivery key"
            className="w-full mb-4 px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[rgba(255,107,0,0.5)]"
          />

          {err && <p className="text-red-400 text-xs mb-3">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: ORANGE }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Enter panel
          </button>
        </form>
      </div>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] pb-16">
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[rgba(255,107,0,0.12)] flex items-center justify-center">
              <Truck size={18} style={{ color: ORANGE }} />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Delivery Panel</h1>
              <p className="text-white/40 text-[11px] leading-tight">{riderName || 'Rider'} · {orders.length} active</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={load}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {err && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{err}</div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-20 text-white/30 text-sm">
            <PackageCheck size={34} className="mx-auto mb-3 opacity-40" />
            No active deliveries right now.
          </div>
        )}

        {orders.map((o) => {
          const addr = fullAddress(o);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
          const phone = (o.customer_phone || '').replace(/[^\d+]/g, '');
          const waPhone = phone.replace(/^\+?/, '').replace(/^0/, '');
          const busy = busyId === o.id;
          const isOut = o.status === 'Out for Delivery';

          return (
            <div key={o.id} className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <p className="text-white font-bold text-[15px]">{o.customer_name || 'Customer'}</p>
                    <p className="text-[#FF6B00] text-[11px] font-semibold">#{o.id}</p>
                  </div>
                  <span
                    className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                    style={{
                      background: isOut ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isOut ? ORANGE : 'rgba(245,245,245,0.7)',
                      borderColor: isOut ? 'rgba(255,107,0,0.25)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {o.status}
                  </span>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 text-white/60 text-[13px] leading-snug mb-3 hover:text-white transition-colors"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: ORANGE }} />
                  <span>{addr || 'No address'}</span>
                </a>

                <div className="flex items-center justify-between text-[12px] mb-3">
                  <span className="text-white/50">
                    {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-white font-bold">
                    <IndianRupee size={12} />{o.total.toLocaleString('en-IN')}
                    <span className="text-white/40 font-normal ml-1">· {o.payment_method?.toUpperCase() || 'COD'}</span>
                  </span>
                </div>

                {/* Contact + navigate */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <a href={phone ? `tel:${phone}` : undefined}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-semibold transition-colors">
                    <Phone size={14} /> Call
                  </a>
                  <a href={waPhone ? `https://wa.me/91${waPhone}` : undefined} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[12px] font-semibold transition-colors">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <a href={mapsUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-semibold transition-colors">
                    <Navigation size={14} /> Navigate
                  </a>
                </div>

                {/* Location sharing */}
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <button onClick={() => shareLocation(o.id)} disabled={busy}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-semibold transition-colors disabled:opacity-50">
                    <LocateFixed size={14} /> Share location
                  </button>
                  <button onClick={() => toggleLive(o.id)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
                    style={
                      liveId === o.id
                        ? { background: 'rgba(255,107,0,0.15)', color: ORANGE }
                        : { background: 'rgba(255,255,255,0.05)', color: '#fff' }
                    }>
                    <Radio size={14} className={liveId === o.id ? 'animate-pulse' : ''} />
                    {liveId === o.id ? 'Live ON' : 'Go live'}
                  </button>
                </div>

                {/* Status actions */}
                {!isOut ? (
                  <button onClick={() => setStatus(o.id, 'Out for Delivery')} disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[13px] font-bold transition-all disabled:opacity-60"
                    style={{ background: ORANGE }}>
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
                    Start delivery (sends code to customer)
                  </button>
                ) : (
                  <div className="rounded-xl border border-[rgba(255,107,0,0.2)] bg-[rgba(255,107,0,0.05)] p-3">
                    <p className="flex items-center gap-1.5 text-white/60 text-[12px] mb-2">
                      <KeyRound size={13} style={{ color: ORANGE }} />
                      Ask the customer for their 6-digit delivery code
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={otpInputs[o.id] || ''}
                        onChange={(e) => setOtpInputs((p) => ({ ...p, [o.id]: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        inputMode="numeric"
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2.5 bg-black border border-white/10 rounded-lg text-white text-center tracking-[0.3em] text-sm outline-none focus:border-[rgba(255,107,0,0.5)]"
                      />
                      <button onClick={() => confirmDelivery(o.id)} disabled={busy}
                        className="flex items-center gap-1.5 px-4 rounded-lg text-white text-[13px] font-bold transition-all disabled:opacity-60"
                        style={{ background: ORANGE }}>
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <PackageCheck size={15} />}
                        Delivered
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
