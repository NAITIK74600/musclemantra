'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, Smartphone, CreditCard, Landmark, ShoppingBag,
  ChevronRight, CheckCircle, MapPin, User, Phone, Package,
  Lock, ArrowLeft, Truck, LogIn, Navigation, X,
} from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { getCurrentUser, getToken, onAuthChange, type User as AuthUser } from '@/lib/auth';

type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking';

interface ShippingForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

const PATNA_AREAS = [
  'Boring Road', 'Rajendra Nagar', 'Patliputra Colony', 'Kankarbagh',
  'Bailey Road', 'Ashok Rajpath', 'Gandhi Maidan', 'Dak Bungalow',
  'Frazer Road', 'Exhibition Road', 'Mithapur', 'Rupaspur',
  'Anisabad', 'Jagdev Path', 'Phulwari Sharif', 'Kurji',
  'Other (Patna)',
];

const paymentMethods = [
  {
    id: 'cod' as PaymentMethod,
    icon: Banknote,
    label: 'Cash on Delivery',
    sub: 'Pay in cash when your order arrives',
    badge: 'Most Popular',
    badgeCss: 'bg-[rgba(34,197,94,0.12)] text-green-400 border-[rgba(34,197,94,0.2)]',
  },
  {
    id: 'upi' as PaymentMethod,
    icon: Smartphone,
    label: 'UPI',
    sub: 'GPay, PhonePe, Paytm, BHIM & more',
  },
  {
    id: 'card' as PaymentMethod,
    icon: CreditCard,
    label: 'Credit / Debit Card',
    sub: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'netbanking' as PaymentMethod,
    icon: Landmark,
    label: 'Net Banking',
    sub: 'All major Indian banks supported',
  },
];

function Field({
  label, value, onChange, placeholder, type = 'text', error, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">
        {label} {required && <span className="text-[#FF6B00]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.25)] outline-none transition-colors ${error ? 'border-red-500 focus:border-red-400' : 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,107,0,0.4)]'}`}
      />
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState<ShippingForm>({
    name: '', phone: '', email: '', address: '', area: '', city: 'Patna', state: 'Bihar', pincode: '',
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ShippingForm[]>([]);
  const [locating, setLocating] = useState(false);

  // Load saved address book (autofill).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mb_addresses');
      if (raw) {
        const list = JSON.parse(raw) as ShippingForm[];
        if (Array.isArray(list)) setSavedAddresses(list);
      }
    } catch { /* ignore */ }
  }, []);

  const addrKey = (a: ShippingForm) => `${a.address}|${a.pincode}|${a.phone}`.trim().toLowerCase();

  const persistAddress = (a: ShippingForm) => {
    try {
      const existing: ShippingForm[] = JSON.parse(localStorage.getItem('mb_addresses') || '[]');
      const deduped = [a, ...existing.filter(x => addrKey(x) !== addrKey(a))].slice(0, 5);
      localStorage.setItem('mb_addresses', JSON.stringify(deduped));
      setSavedAddresses(deduped);
    } catch { /* ignore */ }
  };

  const applyAddress = (a: ShippingForm) => {
    setForm(f => ({ ...f, ...a }));
    setErrors({});
  };

  const removeAddress = (a: ShippingForm) => {
    const next = savedAddresses.filter(x => addrKey(x) !== addrKey(a));
    setSavedAddresses(next);
    try { localStorage.setItem('mb_addresses', JSON.stringify(next)); } catch { /* ignore */ }
  };

  // Auto-fill address fields from the device GPS (best-effort reverse geocode).
  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setApiError('Location is not supported on this device.');
      return;
    }
    setLocating(true);
    setApiError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } },
          );
          const data = await res.json();
          const a = data.address || {};
          setForm(f => ({
            ...f,
            address: f.address || [a.house_number, a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', '),
            city: a.city || a.town || a.village || a.county || f.city,
            state: a.state || f.state,
            pincode: a.postcode || f.pincode,
          }));
        } catch {
          setApiError('Could not detect your address. Please enter it manually.');
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); setApiError('Location permission denied.'); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  // ── Auth gate ────────────────────────────────────────────────────────────
  useEffect(() => {
    const u = getCurrentUser();
    setAuthUser(u);
    setAuthChecked(true);
    if (u) {
      setForm(f => ({
        ...f,
        name:  f.name  || u.name  || '',
        email: f.email || u.email || '',
        phone: f.phone || u.phone || '',
      }));
    }
    const off = onAuthChange(() => {
      const nu = getCurrentUser();
      setAuthUser(nu);
      if (nu) {
        setForm(f => ({
          ...f,
          name:  f.name  || nu.name  || '',
          email: f.email || nu.email || '',
          phone: f.phone || nu.phone || '',
        }));
      }
    });
    return off;
  }, []);

  // Pre-fill from localStorage (delivery area)
  useEffect(() => {
    const saved = localStorage.getItem('mb_delivery_area');
    if (saved) setForm(f => ({ ...f, area: saved }));
  }, []);

  const shipping = totalPrice >= 999 ? 0 : 99;
  const discount = Math.floor(totalPrice * 0.05);
  const finalTotal = totalPrice + shipping - discount;

  const set = (key: keyof ShippingForm) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<ShippingForm> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) e.address = 'Street address is required';
    if (!form.area.trim()) e.area = 'Please select your area';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    if (!authUser) { router.push('/login?redirect=/checkout'); return; }
    setLoading(true);
    setApiError(null);

    const txnid = 'MM' + Date.now().toString().slice(-8);
    const amountStr = finalTotal.toFixed(2);
    const productinfo = items.map(i => i.name).join(', ').slice(0, 100);

    // Server payload — flat shape expected by PHP create-order.php
    const orderPayload = (status: string) => ({
      id: txnid,
      name:  form.name.trim(),
      email: form.email.trim() || authUser.email,
      phone: form.phone.trim(),
      address: {
        line1:   form.address.trim(),
        area:    form.area.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        pincode: form.pincode.trim(),
      },
      items,
      paymentMethod,
      subtotal: totalPrice,
      shipping,
      discount,
      total: finalTotal,
      status,
      createdAt: new Date().toISOString(),
    });

    const authHeaders = (): Record<string, string> => {
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      const t = getToken();
      if (t) h['Authorization'] = `Bearer ${t}`;
      return h;
    };

    const cacheOrderId = (id: string) => {
      try {
        const ids: string[] = JSON.parse(localStorage.getItem('mb_order_ids') || '[]');
        ids.push(id);
        localStorage.setItem('mb_order_ids', JSON.stringify(ids));
      } catch { /* ignore */ }
    };

    // ── COD flow (no PayU) ──────────────────────────────────────────────────
    if (paymentMethod === 'cod') {
      try {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(orderPayload('Confirmed — Pay on Delivery')),
        });
        const data = await res.json().catch(() => ({} as { error?: string }));
        if (!res.ok) {
          setLoading(false);
          setApiError(data?.error || `Order failed (HTTP ${res.status}). Please try again.`);
          return;
        }
        cacheOrderId(txnid);
        clearCart();
        persistAddress(form);
        setOrderId(txnid);
        setLoading(false);
        setStep('success');
      } catch {
        setLoading(false);
        setApiError('Network error. Check your connection and try again.');
      }
      return;
    }

    // ── Online payment via PayU ─────────────────────────────────────────────
    try {
      const res = await fetch('/api/payu-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid,
          amount: amountStr,
          productinfo,
          firstname: form.name.trim(),
          email: form.email.trim() || authUser.email,
          udf1: form.phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.hash) {
        setLoading(false);
        setApiError(data.error ?? 'Payment gateway error. Please try COD.');
        return;
      }

      // Save order info so success page can display it
      sessionStorage.setItem('mm_payu_order', JSON.stringify({ txnid, amount: amountStr }));

      // Save pending order to server — must succeed before redirecting to PayU
      const saveRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(orderPayload('Payment Pending')),
      });
      const saveData = await saveRes.json().catch(() => ({} as { error?: string }));
      if (!saveRes.ok) {
        setLoading(false);
        setApiError(saveData?.error || 'Could not save order. Please try again.');
        return;
      }
      cacheOrderId(txnid);

      clearCart();
      persistAddress(form);

      // Build the PayU form and submit it programmatically
      const siteUrl = window.location.origin;
      const params: Record<string, string> = {
        key:         data.key,
        txnid,
        amount:      amountStr,
        productinfo,
        firstname:   form.name.trim(),
        email:       form.email.trim() || authUser.email,
        phone:       form.phone.trim(),
        surl:        `${siteUrl}/api/payu-return`,
        furl:        `${siteUrl}/api/payu-return`,
        hash:        data.hash,
        udf1:        form.phone.trim(),
        service_provider: 'payu_paisa',
      };

      const form$ = document.createElement('form');
      form$.method = 'POST';
      form$.action = data.payuUrl;
      Object.entries(params).forEach(([k, v]) => {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = v;
        form$.appendChild(inp);
      });
      document.body.appendChild(form$);
      form$.submit();

    } catch {
      setLoading(false);
      setApiError('Network error. Please try again or use COD.');
    }
  };

  /* ---- Empty cart ---- */
  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-7xl mb-5">🛒</div>
        <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-2">Your cart is empty</h2>
        <p className="text-[rgba(245,245,245,0.5)] mb-7 text-sm">Add some supplements and come back to checkout.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E55A00] transition-all">
          <ShoppingBag size={16} /> Shop Now
        </Link>
      </div>
    );
  }

  /* ---- Login required ---- */
  if (authChecked && !authUser && step !== 'success') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,107,0,0.12)] border-2 border-[#FF6B00] flex items-center justify-center mb-6">
          <Lock size={32} className="text-[#FF6B00]" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-2">Login Required</p>
        <h1 className="font-[var(--font-montserrat)] font-black text-2xl md:text-3xl text-white mb-3">Sign in to place your order</h1>
        <p className="text-[rgba(245,245,245,0.55)] mb-7 text-sm max-w-sm">
          Please log in or create a free account so we can track your order, send updates, and let you re-order easily.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/login?redirect=/checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm">
            <LogIn size={16} /> Login
          </Link>
          <Link href="/signup?redirect=/checkout" className="inline-flex items-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white font-bold rounded-xl transition-all text-sm">
            Create Account
          </Link>
        </div>
        <Link href="/cart" className="mt-6 text-[12px] text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">← Back to cart</Link>
      </div>
    );
  }

  /* ---- Success ---- */
  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.12)] border-2 border-green-400 flex items-center justify-center mb-6">
          <CheckCircle size={38} className="text-green-400" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-green-400 mb-2">Order Placed Successfully</p>
        <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white mb-3">Thank You!</h1>
        <p className="text-[rgba(245,245,245,0.55)] mb-2 text-sm max-w-sm">
          Your order <span className="font-bold text-white">#{orderId}</span> has been confirmed and is being prepared for delivery.
        </p>
        {paymentMethod === 'cod' && (
          <p className="text-[13px] text-[rgba(245,245,245,0.45)] mb-7 max-w-xs">
            Please keep <span className="font-bold text-white">₹{finalTotal.toLocaleString()}</span> ready in cash for the delivery agent.
          </p>
        )}
        <div className="flex gap-3 flex-wrap justify-center mt-4">
          <Link href={`/invoice/${orderId}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm">
            <Package size={16} /> View Invoice
          </Link>
          <Link href="/orders" className="inline-flex items-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white font-bold rounded-xl transition-all text-sm">
            <ShoppingBag size={16} /> My Orders
          </Link>
        </div>
      </motion.div>
    );
  }

  /* ---- Checkout form ---- */
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Page header */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-5">
        <div className="container-max">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/cart" className="text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-[var(--font-montserrat)] font-black text-2xl text-white">Secure Checkout</h1>
            <Lock size={14} className="text-[#FF6B00] ml-1" />
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 text-[11px] text-[rgba(245,245,245,0.35)] mt-3">
            <span className="flex items-center gap-1 text-white font-semibold"><span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-black">1</span> Shipping</span>
            <ChevronRight size={12} />
            <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.4)] flex items-center justify-center text-[10px] font-black">2</span> Payment</span>
            <ChevronRight size={12} />
            <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.4)] flex items-center justify-center text-[10px] font-black">3</span> Confirm</span>
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ---- LEFT: Form ---- */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping address */}
            <div className="p-6 bg-[#0d0d0d] rounded-2xl border border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#FF6B00]" />
                  <h2 className="font-[var(--font-montserrat)] font-bold text-white text-[15px]">Shipping Address</h2>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.18)] border border-[rgba(255,107,0,0.25)] text-[#FF6B00] text-[11px] font-bold transition-all disabled:opacity-60"
                >
                  <Navigation size={13} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Detecting…' : 'Use my location'}
                </button>
              </div>

              {/* Saved addresses — tap to autofill */}
              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-2">Saved addresses</p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((a, i) => (
                      <div
                        key={i}
                        className="group flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-[#111] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,107,0,0.35)] transition-all"
                      >
                        <button type="button" onClick={() => applyAddress(a)} className="text-left">
                          <span className="block text-[12px] font-semibold text-white leading-tight">{a.name || 'Address'}</span>
                          <span className="block text-[11px] text-[rgba(245,245,245,0.45)] leading-tight truncate max-w-[180px]">
                            {[a.address, a.area, a.pincode].filter(Boolean).join(', ')}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAddress(a)}
                          aria-label="Remove saved address"
                          className="p-1 rounded-md text-[rgba(245,245,245,0.3)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Full Name" value={form.name} onChange={set('name')} placeholder="Amarjeet Kumar" error={errors.name} required />
                </div>
                <Field label="Mobile Number" value={form.phone} onChange={set('phone')} placeholder="98765 43210" type="tel" error={errors.phone} required />
                <Field label="Email (Optional)" value={form.email} onChange={set('email')} placeholder="you@example.com" type="email" />
                <div className="sm:col-span-2">
                  <Field label="Street Address" value={form.address} onChange={set('address')} placeholder="House / Flat No., Street, Landmark" error={errors.address} required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">
                    Area <span className="text-[#FF6B00]">*</span>
                  </label>
                  <select
                    value={form.area}
                    onChange={e => { set('area')(e.target.value); setErrors(er => ({ ...er, area: undefined })); }}
                    className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors ${errors.area ? 'border-red-500' : 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,107,0,0.4)]'}`}
                  >
                    <option value="" className="bg-[#1a1a1a]">Select your area</option>
                    {PATNA_AREAS.map(a => <option key={a} value={a} className="bg-[#1a1a1a]">{a}</option>)}
                  </select>
                  {errors.area && <p className="mt-1 text-[11px] text-red-400">{errors.area}</p>}
                </div>
                <Field label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="800001" error={errors.pincode} required />
                <Field label="City" value={form.city} onChange={set('city')} placeholder="Patna" />
                <Field label="State" value={form.state} onChange={set('state')} placeholder="Bihar" />
              </div>
            </div>

            {/* Delivery info */}
            <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.12)] flex gap-3">
              <Truck size={16} className="text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-white">Express Delivery — 10 to 30 Minutes</p>
                <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">
                  {totalPrice >= 999 ? 'FREE delivery on this order!' : `₹99 delivery fee applies (free on orders ₹999+)`}
                </p>
              </div>
            </div>

            {/* Payment methods */}
            <div className="p-6 bg-[#0d0d0d] rounded-2xl border border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center gap-2 mb-5">
                <Lock size={15} className="text-[#FF6B00]" />
                <h2 className="font-[var(--font-montserrat)] font-bold text-white text-[15px]">Payment Method</h2>
              </div>
              <div className="space-y-3">
                {paymentMethods.map(({ id, icon: Icon, label, sub, badge, badgeCss }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === id
                        ? 'bg-[rgba(255,107,0,0.08)] border-[rgba(255,107,0,0.35)]'
                        : 'bg-[#111] border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === id ? 'bg-[rgba(255,107,0,0.15)]' : 'bg-[rgba(255,255,255,0.05)]'}`}>
                      <Icon size={19} className={paymentMethod === id ? 'text-[#FF6B00]' : 'text-[rgba(245,245,245,0.45)]'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-[14px] font-semibold ${paymentMethod === id ? 'text-white' : 'text-[rgba(245,245,245,0.7)]'}`}>{label}</p>
                        {badge && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCss}`}>{badge}</span>}
                      </div>
                      <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-0.5">{sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${paymentMethod === id ? 'border-[#FF6B00]' : 'border-[rgba(255,255,255,0.2)]'}`}>
                      {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                    </div>
                  </label>
                ))}
              </div>

              {/* COD notice */}
              <AnimatePresence>
                {paymentMethod === 'cod' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)] text-[12px] text-[rgba(245,245,245,0.6)]">
                      <span className="font-bold text-green-400">Cash on Delivery selected.</span> Please keep exact change of <span className="font-bold text-white">₹{finalTotal.toLocaleString()}</span> ready when the delivery agent arrives.
                    </div>
                  </motion.div>
                )}
                {(paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 rounded-xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)] text-[12px] text-[rgba(245,245,245,0.6)]">
                      <span className="font-bold text-[#FF6B00]">Secured by PayU</span> — you will be redirected to PayU's secure payment page to complete your payment. All major UPI apps, cards &amp; net banking supported.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ---- RIGHT: Order summary ---- */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              <div className="p-5 bg-[#0d0d0d] rounded-2xl border border-[rgba(255,255,255,0.07)]">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={15} className="text-[#FF6B00]" />
                  <h2 className="font-[var(--font-montserrat)] font-bold text-white text-[14px]">Order Summary</h2>
                  <span className="ml-auto text-[11px] text-[rgba(245,245,245,0.4)]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wide">{item.brand}</p>
                        <p className="text-[12px] text-white leading-snug line-clamp-2">{item.name}</p>
                        {item.flavor && <p className="text-[11px] text-[rgba(245,245,245,0.35)]">{item.flavor}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-bold text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.35)]">×{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="border-t border-[rgba(255,255,255,0.07)] pt-4 space-y-2">
                  {[
                    { label: 'Subtotal', value: `₹${totalPrice.toLocaleString()}` },
                    { label: 'Delivery Fee', value: shipping === 0 ? 'FREE' : `₹${shipping}`, highlight: shipping === 0 },
                    { label: 'Loyalty Discount (5%)', value: `-₹${discount.toLocaleString()}`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[rgba(245,245,245,0.5)]">{label}</span>
                      <span className={highlight ? 'text-green-400 font-semibold' : 'text-white'}>{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[15px] font-black pt-2 border-t border-[rgba(255,255,255,0.07)]">
                    <span className="text-white">Total</span>
                    <span className="text-[#FF6B00]">₹{finalTotal.toLocaleString()}</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)] text-center pt-1">Pay ₹{finalTotal.toLocaleString()} in cash on delivery</p>
                  )}
                </div>
              </div>

              {/* API error banner */}
              {apiError && (
                <div className="mb-4 p-3.5 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.28)] text-[13px] text-red-300 leading-snug">
                  <p className="font-semibold text-red-200 mb-0.5">Order could not be placed</p>
                  <p className="text-[12.5px]">{apiError}</p>
                </div>
              )}

              {/* Place order button */}
              <button
                onClick={placeOrder}
                disabled={loading}
                className="w-full py-4 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-[15px] rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Placing Order...
                  </>
                ) : (
                  <>  
                    {paymentMethod === 'cod' ? <Banknote size={18} /> : <Lock size={18} />}
                    {paymentMethod === 'cod'
                      ? 'Place Order (Pay on Delivery)'
                      : `Pay ₹${finalTotal.toLocaleString()} via PayU`}
                  </>
                )}
              </button>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-[rgba(245,245,245,0.3)]">
                <span className="flex items-center gap-1"><Lock size={10} /> Secure</span>
                <span>•</span>
                <span>100% Authentic</span>
                <span>•</span>
                <span>Easy Returns</span>
                {paymentMethod !== 'cod' && <><span>•</span><span className="text-[rgba(255,107,0,0.5)]">Powered by PayU</span></>}
              </div>

              {/* Policies */}
              <p className="text-center text-[11px] text-[rgba(245,245,245,0.3)] leading-relaxed">
                By placing this order you agree to our{' '}
                <Link href="/terms" className="text-[rgba(255,107,0,0.7)] hover:text-[#FF6B00]">Terms</Link>,{' '}
                <Link href="/refund-policy" className="text-[rgba(255,107,0,0.7)] hover:text-[#FF6B00]">Refund Policy</Link>, &amp;{' '}
                <Link href="/cancellation-policy" className="text-[rgba(255,107,0,0.7)] hover:text-[#FF6B00]">Cancellation Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
