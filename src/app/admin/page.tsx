'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users, Store,
  BarChart2, Tag, Star, HeadphonesIcon, FileText, Settings, LogOut,
  TrendingUp, ArrowUpRight, DollarSign, ShoppingBag, UserCheck, Box,
  ChevronRight, Eye, Edit2, Trash2, PlusCircle, Filter,
  Search, Mail, Check, X, Truck, AlertTriangle, Percent,
  MessageSquare, Save, Plus, Image as ImageIcon,
  Megaphone, Film, Upload, Award, Play, LayoutGrid, Minus,
  Loader2, KeyRound, Shield, UserPlus, MailCheck, Crown,
} from 'lucide-react';
import {
  getBrands, saveBrands, getPromos, savePromos, fileToDataURL, uid,
  onStoreChange, type Brand, type Promo,
  updateBrand,
  getProducts, saveProducts, addProduct, updateProduct, deleteProduct, type AdminProduct,
  getCategories, saveCategories, addCategory, updateCategory, deleteCategory, type AdminCategory,
} from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import AdminGate from '@/components/AdminGate';
import {
  signOutAdmin, getAdminEmail, changeAdminPassword, isAdminOwner,
  listAdmins, appointAdmin, revokeAdmin, type AdminUser,
} from '@/lib/adminAuth';

const sidebarItems = [
  { id: 'dashboard',     icon: LayoutDashboard,  label: 'Dashboard' },
  { id: 'orders',        icon: ShoppingCart,      label: 'Orders' },
  { id: 'products',      icon: Box,               label: 'Products' },
  { id: 'categories',    icon: LayoutGrid,        label: 'Categories' },
  { id: 'promotions',    icon: Megaphone,         label: 'Promotions' },
  { id: 'brands',        icon: Award,             label: 'Brands' },
  { id: 'inventory',     icon: Warehouse,         label: 'Inventory' },
  { id: 'customers',     icon: Users,             label: 'Customers' },
  { id: 'vendors',       icon: Store,             label: 'Vendors' },
  { id: 'reports',       icon: BarChart2,         label: 'Sales & Reports' },
  { id: 'coupons',       icon: Tag,               label: 'Coupons' },
  { id: 'reviews',       icon: Star,              label: 'Reviews' },
  { id: 'support',       icon: HeadphonesIcon,    label: 'Support Tickets' },
  { id: 'cms',           icon: FileText,          label: 'CMS' },
  { id: 'admins',        icon: Shield,            label: 'Admins',          ownerOnly: true },
  { id: 'settings',      icon: Settings,          label: 'Settings' },
];

// Stats are derived at runtime from the store inside AdminDashboard.
// (Removed the hardcoded fake const here.)

const statusColors: Record<string, string> = {
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

// Simple bar chart using divs
const chartData = [
  { day: 'Mon', val: 65 }, { day: 'Tue', val: 82 }, { day: 'Wed', val: 54 },
  { day: 'Thu', val: 91 }, { day: 'Fri', val: 78 }, { day: 'Sat', val: 100 },
  { day: 'Sun', val: 69 },
];

// ── Inventory ──────────────────────────────────────────────
const inventory = [
  { name: 'ON Whey Protein 2kg', sku: 'ON-WHEY-2KG', stock: 120, reorder: 40, value: '₹3,59,880', status: 'healthy' },
  { name: 'MB Creatine 300g', sku: 'MB-CRT-300', stock: 200, reorder: 60, value: '₹2,59,800', status: 'healthy' },
  { name: 'MB Mass Gainer 2kg', sku: 'MB-MASS-2KG', stock: 85, reorder: 50, value: '₹2,71,915', status: 'healthy' },
  { name: 'Dymatize ISO 100 2kg', sku: 'DYM-ISO-2KG', stock: 45, reorder: 50, value: '₹2,02,455', status: 'low' },
  { name: 'C4 Pre-Workout 390g', sku: 'C4-PRE-390', stock: 18, reorder: 40, value: '₹39,582', status: 'low' },
  { name: 'ON Serious Mass 6kg', sku: 'ON-MASS-6KG', stock: 0, reorder: 30, value: '₹0', status: 'out' },
];

// ── Customers ──────────────────────────────────────────────
type DemoCustomer = { name: string; email: string; orders: number; spent: string; status: string; joined: string };
type DemoVendor   = { name: string; contact: string; products: number; status: string };
type DemoCoupon   = { code: string; desc: string; value: string; used: number; limit: number; status: string };
type DemoReview   = { product: string; customer: string; rating: number; comment: string; status: string };
type DemoTicket   = { id: string; customer: string; subject: string; priority: string; status: string; date: string };
type DemoCmsPage  = { title: string; type: string; updated: string; status: string };

const initialCustomers: DemoCustomer[] = [];
const initialVendors:   DemoVendor[]   = [];
const initialCoupons:   DemoCoupon[]   = [];
const initialReviews:   DemoReview[]   = [];
const initialTickets:   DemoTicket[]   = [];
const cmsPages:         DemoCmsPage[]  = [];

/* ── Change Admin Password (embedded in Settings section) ──────────────── */
function AdminPasswordChange({ adminEmail }: { adminEmail: string }) {
  const toast = useToast();
  const [curPw, setCurPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');
  const [busy, setBusy]     = useState(false);

  const submit = async () => {
    if (!curPw || !newPw || !confPw) { toast.push({ variant: 'error', title: 'Fill all fields' }); return; }
    if (newPw !== confPw) { toast.push({ variant: 'error', title: 'Passwords do not match' }); return; }
    setBusy(true);
    const res = await changeAdminPassword(curPw, newPw);
    setBusy(false);
    if (res.ok) {
      toast.push({ variant: 'success', title: 'Password changed', description: 'You will be signed out in 3 seconds.' });
      setTimeout(() => { signOutAdmin(); window.location.reload(); }, 3000);
    } else {
      toast.push({ variant: 'error', title: 'Error', description: res.error });
    }
  };

  return (
    <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
        <KeyRound size={16} className="text-[#FF6B00]" /> Admin Security
      </h3>
      <p className="text-[11px] text-[rgba(245,245,245,0.4)] mb-4">
        Signed in as <span className="text-[rgba(245,245,245,0.7)]">{adminEmail}</span>. Change your admin password below.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { label: 'Current password', value: curPw, set: setCurPw },
          { label: 'New password',     value: newPw, set: setNewPw },
          { label: 'Confirm new',      value: confPw, set: setConfPw },
        ] as const).map(f => (
          <div key={f.label}>
            <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">{f.label}</label>
            <input type="password" value={f.value} onChange={e => f.set(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}

// ── Admins management (owner only) ──────────────────────────────────────────
function AdminsSection() {
  const toast = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listAdmins();
    setLoading(false);
    if (res.ok) setAdmins(res.admins ?? []);
    else toast.push({ variant: 'error', title: 'Could not load admins', description: res.error });
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const appoint = async () => {
    if (!name.trim() || !email.trim()) { toast.push({ variant: 'error', title: 'Enter name and email' }); return; }
    setBusy(true);
    const res = await appointAdmin(name, email);
    setBusy(false);
    if (res.ok) {
      toast.push({
        variant: 'success',
        title: 'Admin appointed',
        description: res.emailed ? 'A set-password OTP was emailed to them.' : 'User promoted (email could not be sent).',
      });
      setName(''); setEmail('');
      load();
    } else {
      toast.push({ variant: 'error', title: 'Could not appoint', description: res.error });
    }
  };

  const revoke = async (u: AdminUser) => {
    if (u.isOwner) return;
    if (!confirm(`Remove admin access for ${u.email}?`)) return;
    const res = await revokeAdmin(u.id);
    if (res.ok) { toast.push({ variant: 'info', title: 'Admin access removed', description: u.email }); load(); }
    else toast.push({ variant: 'error', title: 'Could not revoke', description: res.error });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-4xl">
      <div>
        <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white flex items-center gap-2">
          <Shield size={20} className="text-[#FF6B00]" /> Admins
        </h2>
        <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Appoint or remove admins. New admins get an email to set their password.</p>
      </div>

      {/* Appoint form */}
      <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-[#FF6B00]" /> Appoint a new admin
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={appoint} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {busy ? 'Appointing…' : 'Appoint admin'}
          </button>
        </div>
      </div>

      {/* Admin list */}
      <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[rgba(245,245,245,0.4)]">Current admins</p>
          <button onClick={load} className="text-[11px] text-[#FF6B00] font-bold hover:underline">Refresh</button>
        </div>
        {loading ? (
          <div className="p-10 text-center"><Loader2 size={20} className="text-[#FF6B00] animate-spin mx-auto" /></div>
        ) : admins.length === 0 ? (
          <div className="p-10 text-center text-[rgba(245,245,245,0.4)] text-sm">No admins yet.</div>
        ) : (
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {admins.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[rgba(255,107,0,0.12)] flex items-center justify-center text-[#FF6B00] font-bold text-sm shrink-0">
                  {(u.name || u.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white font-semibold flex items-center gap-1.5">
                    {u.name || '—'}
                    {u.isOwner && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full"><Crown size={9} /> OWNER</span>}
                  </p>
                  <p className="text-[11px] text-[rgba(245,245,245,0.4)] truncate">{u.email}</p>
                </div>
                {u.isOwner ? (
                  <span className="text-[10px] font-bold text-[rgba(245,245,245,0.35)]">Super admin</span>
                ) : u.activated ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><MailCheck size={10} /> Active</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending setup</span>
                )}
                {!u.isOwner && (
                  <button onClick={() => revoke(u)} title="Remove admin"
                    className="p-1.5 text-[rgba(245,245,245,0.3)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const adminEmail = getAdminEmail() ?? 'admin';
  const [owner, setOwner] = useState(false);
  useEffect(() => { setOwner(isAdminOwner()); }, []);

  // ── Demo-data sections (client-side manage / delete) ─────────────────────
  const [customerList, setCustomerList] = useState(initialCustomers);
  const [vendorList, setVendorList]     = useState(initialVendors);
  const [couponList, setCouponList]     = useState(initialCoupons);
  const [reviewList, setReviewList]     = useState(initialReviews);
  const [ticketList, setTicketList]     = useState(initialTickets);
  const [replyTicket, setReplyTicket]   = useState<(typeof initialTickets)[number] | null>(null);
  const [replyText, setReplyText]       = useState('');
  const [toggles, setToggles] = useState({
    cod: true, onlinePay: true, sameDay: true, lowStockAlerts: true, reviews: false, maintenance: false,
  });
  const flip = (k: keyof typeof toggles) => setToggles(t => ({ ...t, [k]: !t[k] }));

  // ── Orders (fetched from server) ─────────────────────────────────────────
  const ADMIN_KEY_VAL = process.env.NEXT_PUBLIC_ADMIN_SETUP_KEY ?? '';

  interface AdminOrder {
    id: string;
    items: { name: string; price: number; quantity: number }[];
    shippingAddress: { name: string; phone: string; email?: string; address: string; area: string; city: string; state?: string; pincode: string };
    paymentMethod: string;
    total: number;
    status: string;
    createdAt: string;
  }

  const [orderList, setOrderList] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/get-orders', {
        headers: { 'x-admin-key': ADMIN_KEY_VAL },
      });
      if (res.ok) {
        const data = await res.json();
        // Normalize DB rows (snake_case, flat address) → admin shape
        const norm = (r: Record<string, unknown>): AdminOrder => {
          const sa = (r.shippingAddress ?? {}) as Record<string, unknown>;
          const str = (v: unknown) => (v == null ? '' : String(v));
          return {
            id: str(r.id),
            items: Array.isArray(r.items) ? (r.items as AdminOrder['items']) : [],
            shippingAddress: {
              name: str(r.customer_name ?? sa.name),
              phone: str(r.customer_phone ?? sa.phone),
              email: str(r.customer_email ?? sa.email),
              address: str(r.address ?? sa.address),
              area: str(r.area ?? sa.area),
              city: str(r.city ?? sa.city),
              state: str(r.state ?? sa.state),
              pincode: str(r.pincode ?? sa.pincode),
            },
            paymentMethod: str(r.payment_method ?? r.paymentMethod ?? 'cod'),
            total: Number(r.total) || 0,
            status: str(r.status ?? 'Pending'),
            createdAt: str(r.created_at ?? r.createdAt),
          };
        };
        setOrderList(Array.isArray(data) ? data.map(norm) : []);
      }
    } catch { /* silent */ }
    setOrdersLoading(false);
  }, [ADMIN_KEY_VAL]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime-ish: refresh orders every 20s so badges/status stay live.
  useEffect(() => {
    const t = setInterval(() => { fetchOrders(); }, 20000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  // ── New-order alert: sound + toast + desktop notification ────────────────
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const ordersHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const ids = new Set(orderList.map(o => o.id));
    if (!ordersHydratedRef.current) {
      knownOrderIdsRef.current = ids;
      ordersHydratedRef.current = true;
      return;
    }
    const fresh = orderList.filter(o => !knownOrderIdsRef.current.has(o.id));
    knownOrderIdsRef.current = ids;
    if (fresh.length === 0) return;

    // Chime (Web Audio — no asset needed): two quick beeps.
    try {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const beep = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + 0.32);
      };
      beep(880, 0);
      beep(1175, 0.18);
      setTimeout(() => ctx.close().catch(() => {}), 800);
    } catch { /* audio unavailable */ }

    const first = fresh[0];
    toast.push({
      variant: 'success',
      title: fresh.length === 1 ? 'New order received!' : `${fresh.length} new orders received!`,
      description: `#${first.id} · ${first.shippingAddress.name || 'Customer'} · ₹${first.total.toLocaleString('en-IN')}`,
    });

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Muscle Mantra · New order', {
          body: `#${first.id} · ₹${first.total.toLocaleString('en-IN')}`,
        });
      } catch { /* ignore */ }
    }
  }, [orderList, toast]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    await fetch('/api/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY_VAL },
      body: JSON.stringify({ id, status }),
    });
    setOrderList(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.push({ variant: 'success', title: `Order updated: ${status}` });
  }, [ADMIN_KEY_VAL, toast]);

  const resendOrderEmail = useCallback(async (id: string) => {
    toast.push({ variant: 'info', title: `Resending email for #${id}…` });
    try {
      const res = await fetch('/api/resend-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY_VAL },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.sent) {
        toast.push({ variant: 'success', title: 'Email resent', description: `Sent to ${data.to}` });
      } else {
        toast.push({ variant: 'error', title: 'Could not resend', description: data?.error || 'Check SMTP settings' });
      }
    } catch {
      toast.push({ variant: 'error', title: 'Network error while resending' });
    }
  }, [ADMIN_KEY_VAL, toast]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!confirm(`Delete order #${id}? This permanently removes it.`)) return;
    try {
      const res = await fetch('/api/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY_VAL },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setOrderList(prev => prev.filter(o => o.id !== id));
        toast.push({ variant: 'info', title: 'Order deleted' });
      } else {
        toast.push({ variant: 'error', title: 'Could not delete order' });
      }
    } catch {
      toast.push({ variant: 'error', title: 'Network error while deleting' });
    }
  }, [ADMIN_KEY_VAL, toast]);

  const sendTicketReply = () => {
    if (!replyTicket) return;
    if (!replyText.trim()) { toast.push({ variant: 'error', title: 'Type a reply first' }); return; }
    setTicketList(prev => prev.map(t => t.id === replyTicket.id ? { ...t, status: 'resolved' } : t));
    toast.push({ variant: 'success', title: `Reply sent to ${replyTicket.customer}`, description: 'Ticket marked resolved.' });
    setReplyTicket(null);
    setReplyText('');
  };

  // Load persisted store settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mb_admin_settings');
      if (raw) setToggles(prev => ({ ...prev, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
  }, []);

  const saveSettings = () => {
    try {
      localStorage.setItem('mb_admin_settings', JSON.stringify(toggles));
      toast.push({ variant: 'success', title: 'Settings saved', description: toggles.maintenance ? 'Maintenance mode is ON.' : 'Preferences updated.' });
    } catch {
      toast.push({ variant: 'error', title: 'Could not save settings' });
    }
  };

  const filteredOrders = useMemo(() => {
    let list = orderList;
    if (orderFilter !== 'All') {
      list = list.filter(o => o.status.toLowerCase().includes(orderFilter.toLowerCase()));
    }
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.shippingAddress.name.toLowerCase().includes(q) ||
        o.shippingAddress.phone?.includes(q)
      );
    }
    return list;
  }, [orderList, orderFilter, orderSearch]);

  // ── Brands & Promotions (persisted via shared store) ──
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [promoList, setPromoList] = useState<Promo[]>([]);
  const [productList, setProductList] = useState<AdminProduct[]>([]);
  const [categoryList, setCategoryList] = useState<AdminCategory[]>([]);
  useEffect(() => {
    setBrandList(getBrands());
    setPromoList(getPromos());
    setProductList(getProducts());
    setCategoryList(getCategories());
    return onStoreChange(() => {
      setBrandList(getBrands());
      setPromoList(getPromos());
      setProductList(getProducts());
      setCategoryList(getCategories());
    });
  }, []);

  // Brand form
  const [brandForm, setBrandForm] = useState({ name: '', short: '', logo: '' });
  const brandFileRef = useRef<HTMLInputElement>(null);
  const onBrandLogo = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataURL(file);
    setBrandForm(f => ({ ...f, logo: url }));
  };
  const addBrand = () => {
    if (!brandForm.name.trim()) return;
    const short = (brandForm.short.trim() || brandForm.name.trim().slice(0, 3)).toUpperCase();
    const next = [...brandList, { id: uid(), name: brandForm.name.trim(), short, logo: brandForm.logo || undefined }];
    setBrandList(next); saveBrands(next);
    setBrandForm({ name: '', short: '', logo: '' });
    if (brandFileRef.current) brandFileRef.current.value = '';
  };
  const removeBrand = (id: string) => { const next = brandList.filter(b => b.id !== id); setBrandList(next); saveBrands(next); };

  // Promo form
  const [promoForm, setPromoForm] = useState<{ title: string; type: 'photo' | 'video'; url: string; link: string }>({ title: '', type: 'photo', url: '', link: '/products' });
  const promoFileRef = useRef<HTMLInputElement>(null);
  const onPromoFile = async (file?: File) => {
    if (!file) return;
    if (promoForm.type === 'photo') {
      const url = await fileToDataURL(file);
      setPromoForm(f => ({ ...f, url }));
    } else {
      // videos are too large for localStorage — use a session object URL for preview
      setPromoForm(f => ({ ...f, url: URL.createObjectURL(file) }));
    }
  };
  const addPromo = () => {
    if (!promoForm.title.trim() || !promoForm.url.trim()) return;
    const next = [{ id: uid(), title: promoForm.title.trim(), type: promoForm.type, url: promoForm.url.trim(), link: promoForm.link.trim() || '/products', active: true }, ...promoList];
    setPromoList(next); savePromos(next);
    setPromoForm({ title: '', type: 'photo', url: '', link: '/products' });
    if (promoFileRef.current) promoFileRef.current.value = '';
  };
  const removePromo = (id: string) => { const next = promoList.filter(p => p.id !== id); setPromoList(next); savePromos(next); };
  const togglePromo = (id: string) => { const next = promoList.map(p => p.id === id ? { ...p, active: !p.active } : p); setPromoList(next); savePromos(next); };

  // ── Products (persisted, admin-managed CRUD) ─────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productDraft, setProductDraft] = useState<AdminProduct | null>(null); // null = modal closed
  const productImgRef = useRef<HTMLInputElement>(null);

  const emptyProduct = (): AdminProduct => ({
    id: 'p_' + uid(),
    name: '', brand: '', category: categoryList[0]?.id ?? 'protein', sku: '',
    price: 0, originalPrice: 0, discount: 0,
    rating: 0, reviews: 0,
    image: '', images: [],
    flavors: [], sizes: [],
    deliveryTime: '15 min',
    stock: 0, reorderAt: 20,
    description: '',
    tags: [],
    active: true,
    updatedAt: Date.now(),
  });

  const openNewProduct = () => setProductDraft(emptyProduct());
  const openEditProduct = (p: AdminProduct) => setProductDraft({ ...p, images: p.images?.length ? p.images : (p.image ? [p.image] : []) });
  const closeProductModal = () => setProductDraft(null);

  const onProductImagesPick = async (files: FileList | null) => {
    if (!productDraft || !files || !files.length) return;
    const arr = Array.from(files).slice(0, 6);
    const dataUrls = await Promise.all(arr.map(f => fileToDataURL(f)));
    setProductDraft(d => d ? { ...d, images: [...d.images, ...dataUrls].slice(0, 6) } : d);
    if (productImgRef.current) productImgRef.current.value = '';
  };
  const removeProductImage = (idx: number) => {
    setProductDraft(d => d ? { ...d, images: d.images.filter((_, i) => i !== idx) } : d);
  };
  const setPrimaryImage = (idx: number) => {
    setProductDraft(d => {
      if (!d) return d;
      const list = [...d.images];
      const [pick] = list.splice(idx, 1);
      return { ...d, images: [pick, ...list] };
    });
  };

  const saveProductDraft = () => {
    if (!productDraft) return;
    if (!productDraft.name.trim()) { toast.push({ variant: 'error', title: 'Name is required' }); return; }
    if (!productDraft.images.length) { toast.push({ variant: 'error', title: 'At least one product image is required' }); return; }
    const existing = productList.find(p => p.id === productDraft.id);
    const discount = productDraft.originalPrice > 0 && productDraft.price > 0 && productDraft.originalPrice > productDraft.price
      ? Math.round(((productDraft.originalPrice - productDraft.price) / productDraft.originalPrice) * 100)
      : productDraft.discount;
    const payload: AdminProduct = { ...productDraft, discount, image: productDraft.images[0] };
    if (existing) {
      const updated = updateProduct(payload.id, payload);
      if (updated) toast.push({ variant: 'success', title: 'Product updated', description: updated.name });
    } else {
      const added = addProduct(payload);
      toast.push({ variant: 'success', title: 'Product added', description: added.name });
    }
    setProductList(getProducts());
    closeProductModal();
  };

  const removeProduct = (id: string) => {
    const p = productList.find(x => x.id === id);
    deleteProduct(id);
    setProductList(getProducts());
    if (p) toast.push({ variant: 'info', title: 'Product removed', description: p.name });
  };

  const toggleProductActive = (id: string) => {
    const p = productList.find(x => x.id === id);
    if (!p) return;
    updateProduct(id, { active: !p.active });
    setProductList(getProducts());
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return productList.filter(p => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [productList, productSearch, productCategoryFilter]);

  // ── Categories (persisted, admin-managed) ────────────────────────────────
  const [categoryForm, setCategoryForm] = useState<Omit<AdminCategory, 'active'>>({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const categoryImgRef = useRef<HTMLInputElement>(null);

  const onCategoryImage = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataURL(file);
    setCategoryForm(f => ({ ...f, image: url }));
  };

  const submitCategory = () => {
    if (!categoryForm.label.trim()) { toast.push({ variant: 'error', title: 'Category label required' }); return; }
    if (editingCategoryId) {
      updateCategory(editingCategoryId, { label: categoryForm.label, icon: categoryForm.icon, color: categoryForm.color, image: categoryForm.image });
      toast.push({ variant: 'success', title: 'Category updated' });
    } else {
      addCategory({ ...categoryForm, active: true });
      toast.push({ variant: 'success', title: 'Category added' });
    }
    setCategoryList(getCategories());
    setCategoryForm({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
    setEditingCategoryId(null);
    if (categoryImgRef.current) categoryImgRef.current.value = '';
  };
  const editCategory = (c: AdminCategory) => {
    setEditingCategoryId(c.id);
    setCategoryForm({ id: c.id, label: c.label, icon: c.icon, color: c.color, image: c.image ?? '' });
  };
  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
    if (categoryImgRef.current) categoryImgRef.current.value = '';
  };
  const removeCategoryLocal = (id: string) => {
    const inUse = productList.some(p => p.category === id);
    if (inUse) { toast.push({ variant: 'error', title: 'Category in use', description: 'Reassign products before deleting.' }); return; }
    deleteCategory(id);
    setCategoryList(getCategories());
    toast.push({ variant: 'info', title: 'Category removed' });
  };
  const toggleCategoryActive = (id: string) => {
    const c = categoryList.find(x => x.id === id);
    if (!c) return;
    updateCategory(id, { active: !c.active });
    setCategoryList(getCategories());
  };

  // ── Brand per-card logo edit ─────────────────────────────────────────────
  // A single hidden file input is targeted at whichever brand card the admin
  // clicked. Keeping only one input in the DOM avoids remount issues.
  const brandEditFileRef = useRef<HTMLInputElement>(null);
  const [brandLogoTargetId, setBrandLogoTargetId] = useState<string | null>(null);
  const startBrandLogoEdit = (id: string) => {
    setBrandLogoTargetId(id);
    // trigger picker on next tick so state has committed
    setTimeout(() => brandEditFileRef.current?.click(), 0);
  };
  const onBrandLogoEditFile = async (file?: File) => {
    if (!file || !brandLogoTargetId) return;
    const url = await fileToDataURL(file);
    const updated = updateBrand(brandLogoTargetId, { logo: url });
    setBrandList(getBrands());
    if (updated) toast.push({ variant: 'success', title: 'Logo updated', description: updated.name });
    if (brandEditFileRef.current) brandEditFileRef.current.value = '';
    setBrandLogoTargetId(null);
  };
  const clearBrandLogo = (id: string) => {
    const updated = updateBrand(id, { logo: undefined });
    setBrandList(getBrands());
    if (updated) toast.push({ variant: 'info', title: 'Logo removed', description: updated.name });
  };

  // ── Inventory (uses product list — inline stock/reorder edit) ────────────
  const [invSearch, setInvSearch] = useState('');
  const setStock = (id: string, stock: number) => {
    updateProduct(id, { stock: Math.max(0, Math.floor(stock)) });
    setProductList(getProducts());
  };
  const setReorder = (id: string, reorderAt: number) => {
    updateProduct(id, { reorderAt: Math.max(0, Math.floor(reorderAt)) });
    setProductList(getProducts());
  };
  const bumpStock = (id: string, delta: number) => {
    const p = productList.find(x => x.id === id);
    if (!p) return;
    setStock(id, p.stock + delta);
  };
  const inventorySummary = useMemo(() => {
    const total = productList.length;
    const value = productList.reduce((sum, p) => sum + p.price * p.stock, 0);
    const low = productList.filter(p => p.stock > 0 && p.stock < (p.reorderAt || 0)).length;
    const out = productList.filter(p => p.stock === 0).length;
    return { total, value, low, out };
  }, [productList]);
  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    if (!q) return productList;
    return productList.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [productList, invSearch]);

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className={`shrink-0 ${sidebarCollapsed ? 'w-14' : 'w-56'} bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.06)] flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Muscle Mantra" className="w-8 h-8 object-contain" />
              <div className="leading-none">
                <div className="text-[11px] font-black text-white">ADMIN PANEL</div>
                <div className="text-[9px] text-[rgba(245,245,245,0.4)]">MUSCLE MANTRA</div>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 mx-auto">
              <img src="/logo.png" alt="MM" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {sidebarItems.filter(item => owner || !item.ownerOnly).map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[12px] transition-all relative ${activeSection === item.id ? 'bg-[rgba(255,107,0,0.1)] text-white border-l-2 border-[#FF6B00]' : 'text-[rgba(245,245,245,0.5)] hover:text-white hover:bg-white/5'}`}>
              <item.icon size={15} className={activeSection === item.id ? 'text-[#FF6B00]' : ''} />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {(() => {
                    const n =
                      item.id === 'orders'
                        ? orderList.filter(o => !['Delivered', 'Cancelled', 'Returned'].includes(o.status)).length
                        : item.id === 'support'
                        ? ticketList.filter(t => t.status === 'open').length
                        : 0;
                    return n > 0 ? (
                      <span className="ml-auto bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {n}
                      </span>
                    ) : null;
                  })()}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
          <a href="/delivery" target="_blank" rel="noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#FF6B00] transition-all rounded-lg hover:bg-[rgba(255,107,0,0.08)]">
            <Truck size={14} />
            {!sidebarCollapsed && <span>Delivery Panel</span>}
          </a>
          <button onClick={() => { signOutAdmin(); window.location.reload(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-[rgba(245,245,245,0.4)] hover:text-red-400 transition-all rounded-lg hover:bg-red-500/5">
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">
              <LayoutDashboard size={16} />
            </button>
            <h1 className="font-[var(--font-montserrat)] font-black text-base text-white">
              {sidebarItems.find(s => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[rgba(245,245,245,0.4)]">15 May, 2024</span>
            <div className="flex items-center gap-2 pl-3 border-l border-[rgba(255,255,255,0.08)]">
              <div className="w-7 h-7 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-black">
                {adminEmail[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <div className="text-[11px] text-white font-semibold leading-none">Admin</div>
                <div className="text-[9px] text-[rgba(245,245,245,0.4)] max-w-[120px] truncate">{adminEmail}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* Live stats from store */}
              {(() => {
                const activeProds = productList.filter(p => p.active !== false);
                const activeCategories = categoryList.filter(c => c.active !== false);
                const invValue = productList.reduce((s, p) => s + p.price * p.stock, 0);
                const liveStats = [
                  { label: 'Total Products', value: String(activeProds.length), sub: `${productList.length} in catalogue`, icon: Box, color: '#60a5fa' },
                  { label: 'Categories', value: String(activeCategories.length), sub: `${categoryList.length} total`, icon: LayoutGrid, color: '#34d399' },
                  { label: 'Inventory Value', value: `₹${invValue.toLocaleString('en-IN')}`, sub: 'live from store', icon: DollarSign, color: '#FF6B00' },
                  { label: 'Brands', value: String(brandList.length), sub: 'active brands', icon: Award, color: '#a78bfa' },
                ];
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {liveStats.map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                            <s.icon size={17} style={{ color: s.color }} />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Live</span>
                        </div>
                        <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                        <p className="text-[10px] text-[rgba(245,245,245,0.25)] mt-0.5">{s.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}

              <div className="grid lg:grid-cols-3 gap-5">
                {/* Sales chart */}
                <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-white">Sales Overview</h3>
                    <div className="flex gap-1">
                      {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(t => (
                        <button key={t} className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${t === 'Daily' ? 'bg-[#FF6B00] text-white' : 'text-[rgba(245,245,245,0.4)] hover:text-white'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div className="flex items-end gap-3 h-32">
                    {chartData.map(d => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg bg-[rgba(255,107,0,0.15)] hover:bg-[rgba(255,107,0,0.4)] transition-all cursor-pointer relative group"
                          style={{ height: `${d.val}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ₹{(d.val * 1250).toLocaleString()}
                          </div>
                        </div>
                        <span className="text-[9px] text-[rgba(245,245,245,0.4)]">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top products */}
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Top Selling</h3>
                    <Link href="/admin/products" className="text-xs text-[#FF6B00] font-bold">View All</Link>
                  </div>
                  <div className="space-y-3">
                    {productList.slice(0, 4).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[rgba(255,107,0,0.1)] flex items-center justify-center text-[10px] font-black text-[#FF6B00]">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-[rgba(245,245,245,0.4)]">₹{p.price.toLocaleString('en-IN')} · Stock: {p.stock}</p>
                        </div>
                        <span className="text-[11px] font-bold text-white shrink-0">₹{(p.price * p.stock).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {productList.length === 0 && (
                      <p className="text-xs text-[rgba(245,245,245,0.3)] text-center py-4">No products yet. Add products to see them here.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h3 className="font-bold text-white">Recent Orders</h3>
                  <button onClick={() => setActiveSection('orders')} className="text-xs text-[#FF6B00] font-bold flex items-center gap-1">View All <ChevronRight size={12} /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.05)]">
                        {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderList.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-8 text-center text-xs text-[rgba(245,245,245,0.3)]">
                          {ordersLoading ? 'Loading orders…' : 'No orders yet'}
                        </td></tr>
                      )}
                      {orderList.slice(0, 5).map(o => {
                        const preview = o.items.slice(0, 1).map(i => i.name).join(', ') + (o.items.length > 1 ? ` +${o.items.length - 1}` : '');
                        const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        const sKey = o.status.toLowerCase().includes('deliver') ? 'delivered' : o.status.toLowerCase().includes('ship') ? 'shipped' : o.status.toLowerCase().includes('cancel') ? 'cancelled' : 'processing';
                        return (
                          <tr key={o.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3 text-[#FF6B00] text-[12px] font-bold">#{o.id}</td>
                            <td className="px-5 py-3 text-white text-[12px]">{o.shippingAddress.name}</td>
                            <td className="px-5 py-3 text-[rgba(245,245,245,0.6)] text-[12px] max-w-[160px]"><span className="line-clamp-1">{preview}</span></td>
                            <td className="px-5 py-3 text-white text-[12px] font-bold">₹{o.total.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${statusColors[sKey] ?? statusColors.processing}`}>{o.status}</span></td>
                            <td className="px-5 py-3 text-[rgba(245,245,245,0.4)] text-[12px]">{date}</td>
                            <td className="px-5 py-3"><button onClick={() => setActiveSection('orders')} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/5 rounded-lg transition-all"><Eye size={13} /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS — image upload, add / edit / remove */}
          {activeSection === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Product Management</h2>
                  <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">
                    {productList.length} product{productList.length === 1 ? '' : 's'} total
                    {' · '}<span className="text-emerald-400">{productList.filter(p => p.active).length} active</span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search name / SKU / brand"
                      className="pl-9 pr-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-64" />
                  </div>
                  <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                    <option value="all">All categories</option>
                    {categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <button onClick={openNewProduct}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                    <PlusCircle size={15} /> Add Product
                  </button>
                </div>
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                {filteredProducts.length === 0 ? (
                  <div className="p-10 text-center text-[rgba(245,245,245,0.4)] text-sm">
                    No products match your filter. <button onClick={openNewProduct} className="text-[#FF6B00] font-bold ml-1">Add one →</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                          {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Action'].map(h => (
                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(p => {
                          const cat = categoryList.find(c => c.id === p.category);
                          const status = p.stock === 0 ? 'out' : p.stock < (p.reorderAt || 0) ? 'low' : 'active';
                          return (
                            <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                                    {p.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Box size={14} className="text-[rgba(245,245,245,0.3)]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-white text-[13px] font-semibold line-clamp-1">{p.name || 'Untitled'}</div>
                                    <div className="text-[11px] text-[rgba(245,245,245,0.4)] line-clamp-1">{p.brand}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px] font-mono">{p.sku}</td>
                              <td className="px-5 py-3.5">
                                <span className="px-2.5 py-1 bg-[rgba(255,107,0,0.1)] text-[#FF6B00] text-[11px] font-semibold rounded-full">{cat?.label ?? p.category}</span>
                              </td>
                              <td className="px-5 py-3.5 text-white font-bold text-[13px]">₹{p.price.toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: p.stock === 0 ? '#f87171' : p.stock < (p.reorderAt || 0) ? '#fbbf24' : '#34d399' }}>
                                {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                              </td>
                              <td className="px-5 py-3.5">
                                <button onClick={() => toggleProductActive(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${!p.active ? 'bg-white/5 text-[rgba(245,245,245,0.5)] border-white/10' : status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : status === 'low' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                                  {!p.active ? 'Hidden' : status === 'active' ? 'Active' : status === 'low' ? 'Low' : 'Out'}
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex gap-1.5">
                                  <button onClick={() => openEditProduct(p)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all" aria-label="Edit"><Edit2 size={13} /></button>
                                  <button onClick={() => removeProduct(p.id)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="Delete"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CATEGORIES — add / edit / remove */}
          {activeSection === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Category Management</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Organise your catalogue. Categories are used across the storefront filters.</p>
              </div>

              {/* Form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  {editingCategoryId ? <Edit2 size={16} className="text-[#FF6B00]" /> : <Plus size={16} className="text-[#FF6B00]" />}
                  {editingCategoryId ? 'Edit category' : 'New category'}
                </h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Label</label>
                    <input value={categoryForm.label}
                      onChange={e => setCategoryForm(f => ({ ...f, label: e.target.value, id: editingCategoryId ? f.id : e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="e.g. Peanut Butter" maxLength={60}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Icon</label>
                    <input value={categoryForm.icon} onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value }))}
                      placeholder="💪" maxLength={6}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white text-center focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Colour</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                        className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] cursor-pointer" />
                      <input value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                        className="flex-1 px-3 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white font-mono focus:border-[#FF6B00] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Category tile image */}
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Tile image (shown on homepage)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                      {categoryForm.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={categoryForm.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xl" style={{ color: categoryForm.color }}>{categoryForm.icon || '?'}</span>
                      )}
                    </div>
                    <button type="button" onClick={() => categoryImgRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.7)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      <Upload size={14} /> {categoryForm.image ? 'Replace image' : 'Upload image'}
                    </button>
                    {categoryForm.image && (
                      <button type="button" onClick={() => setCategoryForm(f => ({ ...f, image: '' }))}
                        className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.6)] hover:text-red-400 rounded-xl text-sm font-semibold transition-all">
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                    <input type="text" value={categoryForm.image?.startsWith('data:') ? '' : (categoryForm.image ?? '')}
                      onChange={e => setCategoryForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="…or paste an image URL"
                      className="flex-1 min-w-[180px] px-3 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <input ref={categoryImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => onCategoryImage(e.target.files?.[0])} />
                  </div>
                  <p className="text-[10px] text-[rgba(245,245,245,0.35)] mt-1.5">Optional — uploaded images stay on this browser (localStorage). Icon/colour are used as fallback.</p>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  {editingCategoryId && (
                    <button onClick={cancelEditCategory}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.6)] hover:text-white text-sm font-semibold rounded-xl transition-all">
                      Cancel
                    </button>
                  )}
                  <button onClick={submitCategory}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                    <Save size={14} /> {editingCategoryId ? 'Save changes' : 'Add category'}
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryList.length === 0 && (
                  <div className="col-span-full bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-10 text-center text-[rgba(245,245,245,0.4)] text-sm">
                    No categories yet — add your first one above.
                  </div>
                )}
                {categoryList.map(c => {
                  const count = productList.filter(p => p.category === c.id).length;
                  return (
                    <div key={c.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl overflow-hidden shrink-0" style={{ background: c.image ? '#0a0a0a' : `${c.color}22`, color: c.color }}>
                          {c.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : c.icon}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => toggleCategoryActive(c.id)}
                            title={c.active ? 'Hide' : 'Show'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${c.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[rgba(245,245,245,0.4)] hover:bg-white/5'}`}>
                            {c.active ? <Eye size={13} /> : <X size={13} />}
                          </button>
                          <button onClick={() => editCategory(c)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                          <button onClick={() => removeCategoryLocal(c.id)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="text-white font-bold text-[15px]">{c.label}</div>
                      <div className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5 font-mono">{c.id}</div>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(245,245,245,0.5)]">{count} product{count === 1 ? '' : 's'}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${c.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-[rgba(245,245,245,0.5)]'}`}>
                          {c.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PROMOTIONS (photo / video) */}
          {activeSection === 'promotions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Promotions</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Add photo &amp; video banners shown on the homepage.</p>
              </div>

              {/* Add promo form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-[#FF6B00]" /> New Promotion</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Title</label>
                    <input value={promoForm.title} onChange={e => setPromoForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mega Protein Sale"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Type</label>
                    <div className="flex gap-2">
                      {(['photo', 'video'] as const).map(t => (
                        <button key={t} onClick={() => setPromoForm(f => ({ ...f, type: t, url: '' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${promoForm.type === t ? 'bg-[#FF6B00] text-white' : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.5)] hover:text-white'}`}>
                          {t === 'photo' ? <ImageIcon size={14} /> : <Film size={14} />} {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">
                      {promoForm.type === 'photo' ? 'Upload Image' : 'Upload Video'}
                    </label>
                    <button onClick={() => promoFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.6)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      <Upload size={15} /> Choose {promoForm.type === 'photo' ? 'image' : 'video'}
                    </button>
                    <input ref={promoFileRef} type="file" accept={promoForm.type === 'photo' ? 'image/*' : 'video/*'} className="hidden"
                      onChange={e => onPromoFile(e.target.files?.[0])} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">…or paste a URL</label>
                    <input value={promoForm.url.startsWith('data:') || promoForm.url.startsWith('blob:') ? '' : promoForm.url}
                      onChange={e => setPromoForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Click-through Link</label>
                    <input value={promoForm.link} onChange={e => setPromoForm(f => ({ ...f, link: e.target.value }))} placeholder="/products"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  {/* Preview */}
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Preview</label>
                    <div className="w-full h-[44px] rounded-xl overflow-hidden bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                      {promoForm.url ? (
                        promoForm.type === 'photo'
                          ? <img src={promoForm.url} alt="preview" className="w-full h-full object-cover" />
                          : <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold"><Play size={12} /> Video ready</span>
                      ) : <span className="text-[11px] text-[rgba(245,245,245,0.3)]">No media yet</span>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={addPromo} disabled={!promoForm.title.trim() || !promoForm.url.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all">
                    <Plus size={15} /> Add Promotion
                  </button>
                </div>
              </div>

              {/* Promo list */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {promoList.map(p => (
                  <div key={p.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="relative aspect-video bg-[#0a0a0a]">
                      {p.type === 'photo'
                        ? <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                        : <video src={p.url} className="w-full h-full object-cover" muted />}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white bg-black/60 backdrop-blur-sm flex items-center gap-1">
                        {p.type === 'photo' ? <ImageIcon size={10} /> : <Film size={10} />} {p.type}
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${p.active ? 'bg-emerald-500/90 text-white' : 'bg-[rgba(0,0,0,0.6)] text-[rgba(245,245,245,0.6)]'}`}>
                        {p.active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-semibold text-white line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-[rgba(245,245,245,0.4)] truncate">→ {p.link}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => togglePromo(p.id)} className="flex-1 py-2 text-[11px] font-bold text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-all">
                          {p.active ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => removePromo(p.id)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {promoList.length === 0 && (
                  <div className="sm:col-span-2 lg:col-span-3 py-16 text-center text-[rgba(245,245,245,0.4)] text-sm">No promotions yet. Add one above.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* BRANDS (carousel logos) */}
          {activeSection === 'brands' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Brands</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Manage the brand logos shown in the homepage carousel.</p>
              </div>

              {/* Add brand form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-[#FF6B00]" /> Add Brand</h3>
                <div className="grid sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Brand Name</label>
                    <input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Optimum Nutrition"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Short (fallback)</label>
                    <input value={brandForm.short} onChange={e => setBrandForm(f => ({ ...f, short: e.target.value }))} placeholder="ON" maxLength={4}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Logo</label>
                    <button onClick={() => brandFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.6)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      {brandForm.logo ? <><Check size={14} className="text-emerald-400" /> Selected</> : <><Upload size={14} /> Upload</>}
                    </button>
                    <input ref={brandFileRef} type="file" accept="image/*" className="hidden" onChange={e => onBrandLogo(e.target.files?.[0])} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {brandForm.logo && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a]">
                      <img src={brandForm.logo} alt="logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button onClick={addBrand} disabled={!brandForm.name.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all ml-auto">
                    <Plus size={15} /> Add Brand
                  </button>
                </div>
              </div>

              {/* Brand grid */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-1">Current Brands ({brandList.length})</h3>
                <p className="text-[11px] text-[rgba(245,245,245,0.4)] mb-4">Click a brand card to upload or replace its logo — e.g. add the MyProtein logo.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {brandList.map(b => (
                    <div key={b.id} className="group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,107,0,0.3)] transition-all">
                      <button type="button" onClick={() => startBrandLogoEdit(b.id)}
                        title="Upload / replace logo"
                        className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#141414] border border-[rgba(255,255,255,0.08)] hover:border-[#FF6B00] transition-colors">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo} alt={b.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-[var(--font-montserrat)] font-black text-[#FF6B00]">{b.short}</span>
                        )}
                        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload size={16} className="text-white" />
                        </span>
                      </button>
                      <span className="text-[12px] font-semibold text-white text-center leading-tight line-clamp-1">{b.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.logo && (
                          <button onClick={() => clearBrandLogo(b.id)} aria-label={`Remove ${b.name} logo`} title="Remove logo"
                            className="p-1 text-[rgba(245,245,245,0.5)] hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-all">
                            <ImageIcon size={12} />
                          </button>
                        )}
                        <button onClick={() => removeBrand(b.id)} aria-label={`Remove ${b.name}`} title="Delete brand"
                          className="p-1 text-[rgba(245,245,245,0.5)] hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Single hidden input reused by every brand card */}
                <input ref={brandEditFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => onBrandLogoEditFile(e.target.files?.[0])} />
              </div>
            </motion.div>
          )}

          {/* ORDERS */}
          {activeSection === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Order Management</h2>
                <div className="flex gap-2 flex-wrap">
                  {['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'].map(s => (
                    <button key={s} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${s === 'All' ? 'bg-[#FF6B00] text-white' : 'bg-[#111] border border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.5)] hover:text-white'}`}>{s}</button>
                  ))}
                </div>
              </div>
              {/* Search + Refresh */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                  <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search order / customer"
                    className="w-full pl-8 pr-3 py-2 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[rgba(255,107,0,0.4)] focus:outline-none" />
                </div>
                <button onClick={fetchOrders} disabled={ordersLoading}
                  className="px-4 py-2 text-xs font-bold bg-[rgba(255,107,0,0.1)] text-[#FF6B00] border border-[rgba(255,107,0,0.2)] rounded-xl hover:bg-[rgba(255,107,0,0.18)] transition-all disabled:opacity-50">
                  {ordersLoading ? 'Loading…' : 'Refresh'}
                </button>
                <span className="text-xs text-[rgba(245,245,245,0.35)]">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                      {['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-[rgba(245,245,245,0.3)]">
                        {ordersLoading ? 'Loading orders…' : 'No orders found'}
                      </td></tr>
                    )}
                    {filteredOrders.map(o => {
                      const preview = o.items.map(i => `${i.name} ×${i.quantity}`).join(', ');
                      const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                      const sKey = o.status.toLowerCase().includes('deliver') ? 'delivered' : o.status.toLowerCase().includes('ship') ? 'shipped' : o.status.toLowerCase().includes('cancel') ? 'cancelled' : 'processing';
                      const pmLabel: Record<string, string> = { cod: 'COD', upi: 'UPI', card: 'Card', netbanking: 'NetBanking' };
                      return (
                        <tr key={o.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-[#FF6B00] text-[12px] font-bold whitespace-nowrap">#{o.id}</td>
                          <td className="px-4 py-3">
                            <div className="text-white text-[12px] font-semibold">{o.shippingAddress.name}</div>
                            <div className="text-[11px] text-[rgba(245,245,245,0.4)]">{o.shippingAddress.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-[rgba(245,245,245,0.6)] text-[11px] max-w-[180px]"><span className="line-clamp-2">{preview}</span></td>
                          <td className="px-4 py-3 text-white text-[12px] font-bold whitespace-nowrap">₹{o.total.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-[rgba(245,245,245,0.5)] text-[11px] whitespace-nowrap">{pmLabel[o.paymentMethod] ?? o.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <select value={o.status}
                              onChange={e => updateOrderStatus(o.id, e.target.value)}
                              className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-1 text-[11px] text-white focus:border-[#FF6B00] focus:outline-none">
                              {['Confirmed — Pay on Delivery','Payment Pending','Payment Received','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-[rgba(245,245,245,0.4)] text-[11px] whitespace-nowrap">{date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <a href={`/invoice/${o.id}`} target="_blank" rel="noreferrer"
                                className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all inline-flex">
                                <Eye size={13} />
                              </a>
                              <button onClick={() => resendOrderEmail(o.id)} title="Resend order email to customer"
                                className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all">
                                <Mail size={13} />
                              </button>
                              <button onClick={() => deleteOrder(o.id)} title="Delete order"
                                className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* INVENTORY — live stock levels, inline edit + quick restock */}
          {activeSection === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Stock Value', value: `₹${inventorySummary.value.toLocaleString('en-IN')}`, icon: DollarSign, color: '#FF6B00' },
                  { label: 'Total SKUs', value: inventorySummary.total.toString(), icon: Box, color: '#60a5fa' },
                  { label: 'Low Stock Items', value: inventorySummary.low.toString(), icon: AlertTriangle, color: '#fbbf24' },
                  { label: 'Out of Stock', value: inventorySummary.out.toString(), icon: X, color: '#f87171' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
                      <s.icon size={17} style={{ color: s.color }} />
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] gap-3 flex-wrap">
                  <h3 className="font-bold text-white">Stock Levels</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                      <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search product / SKU"
                        className="pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-56" />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.05)]">
                        {['Product', 'SKU', 'In Stock', 'Reorder At', 'Stock Value', 'Status', 'Quick Restock'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[rgba(245,245,245,0.4)]">No matching products.</td></tr>
                      )}
                      {filteredInventory.map(p => {
                        const status = p.stock === 0 ? 'out' : p.stock < (p.reorderAt || 0) ? 'low' : 'healthy';
                        return (
                          <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center shrink-0">
                                  {p.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : <Box size={13} className="text-[rgba(245,245,245,0.3)]" />}
                                </div>
                                <span className="text-white text-[13px] font-semibold line-clamp-1">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px] font-mono">{p.sku}</td>
                            <td className="px-5 py-3.5">
                              <input type="number" min={0} value={p.stock}
                                onChange={e => setStock(p.id, Number(e.target.value))}
                                className="w-20 px-2.5 py-1.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[13px] font-bold text-white text-center focus:border-[#FF6B00] focus:outline-none"
                                style={{ color: status === 'out' ? '#f87171' : status === 'low' ? '#fbbf24' : '#34d399' }} />
                              <span className="ml-1 text-[11px] text-[rgba(245,245,245,0.4)]">units</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <input type="number" min={0} value={p.reorderAt}
                                onChange={e => setReorder(p.id, Number(e.target.value))}
                                className="w-20 px-2.5 py-1.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[12px] text-white text-center focus:border-[#FF6B00] focus:outline-none" />
                            </td>
                            <td className="px-5 py-3.5 text-white text-[12px] font-bold">₹{(p.price * p.stock).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status === 'healthy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : status === 'low' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                                {status === 'healthy' ? 'Healthy' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => bumpStock(p.id, -1)} disabled={p.stock === 0}
                                  className="p-1.5 text-[rgba(245,245,245,0.5)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"><Minus size={12} /></button>
                                <button onClick={() => bumpStock(p.id, 1)}
                                  className="p-1.5 text-[rgba(245,245,245,0.5)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Plus size={12} /></button>
                                <button onClick={() => bumpStock(p.id, 10)}
                                  className="ml-1 px-2 py-1 text-[10px] font-bold text-[#FF6B00] bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.2)] rounded-lg transition-all">+10</button>
                                <button onClick={() => bumpStock(p.id, 50)}
                                  className="px-2 py-1 text-[10px] font-bold text-[#FF6B00] bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.2)] rounded-lg transition-all">+50</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* CUSTOMERS */}
          {activeSection === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Customers</h2>
                  <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">{customerList.length} total customer{customerList.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                  <input placeholder="Search customers..." className="pl-9 pr-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-64" />
                </div>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                        {['Customer', 'Email', 'Orders', 'Total Spent', 'Joined', 'Tier', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customerList.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[rgba(245,245,245,0.3)]">No customers yet.</td></tr>
                      )}
                      {customerList.map(c => (
                        <tr key={c.email} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[rgba(255,107,0,0.15)] flex items-center justify-center text-[#FF6B00] text-[12px] font-black">{c.name.charAt(0)}</div>
                              <span className="text-white text-[13px] font-semibold">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.5)] text-[12px]">{c.email}</td>
                          <td className="px-5 py-3.5 text-white text-[12px] font-semibold">{c.orders}</td>
                          <td className="px-5 py-3.5 text-white text-[12px] font-bold">{c.spent}</td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{c.joined}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'vip' ? 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]' : c.status === 'new' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>{c.status}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => setCustomerList(prev => prev.filter(x => x.email !== c.email))}
                              className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* VENDORS */}
          {activeSection === 'vendors' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Vendors & Suppliers</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> Add Vendor</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {vendorList.length === 0 && (
                  <p className="sm:col-span-2 text-center text-sm text-[rgba(245,245,245,0.3)] py-12">No vendors yet.</p>
                )}
                {vendorList.map(v => (
                  <div key={v.name} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><Store size={18} className="text-[#FF6B00]" /></div>
                        <div>
                          <p className="text-white font-bold text-[14px]">{v.name}</p>
                          <p className="text-[rgba(245,245,245,0.4)] text-[11px] flex items-center gap-1"><Mail size={10} /> {v.contact}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{v.status}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="text-[12px] text-[rgba(245,245,245,0.5)]"><span className="text-white font-bold">{v.products}</span> products supplied</span>
                      <button onClick={() => setVendorList(prev => prev.filter(x => x.name !== v.name))}
                        className="flex items-center gap-1.5 text-[12px] text-red-400 font-bold hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-all"><Trash2 size={13} /> Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REPORTS */}
          {activeSection === 'reports' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Revenue (30d)', value: '₹8,45,230', change: '+53.5%', icon: DollarSign, color: '#FF6B00' },
                  { label: 'Avg Order Value', value: '₹2,184', change: '+6.1%', icon: ShoppingBag, color: '#a78bfa' },
                  { label: 'Conversion Rate', value: '3.8%', change: '+0.4%', icon: TrendingUp, color: '#34d399' },
                  { label: 'Refund Rate', value: '1.2%', change: '-0.3%', icon: ArrowUpRight, color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}><s.icon size={17} style={{ color: s.color }} /></div>
                      <span className="text-[11px] font-bold text-emerald-400">{s.change}</span>
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="font-bold text-white mb-5">Revenue by Day</h3>
                  <div className="flex items-end gap-3 h-40">
                    {chartData.map(d => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-[#FF6B00] to-[rgba(255,107,0,0.3)] hover:opacity-80 transition-all cursor-pointer" style={{ height: `${d.val}%` }} />
                        <span className="text-[9px] text-[rgba(245,245,245,0.4)]">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="font-bold text-white mb-4">Sales by Category</h3>
                  <div className="space-y-3.5">
                    {[
                      { cat: 'Protein', pct: 42, color: '#FF6B00' },
                      { cat: 'Mass Gainer', pct: 24, color: '#a78bfa' },
                      { cat: 'Pre-Workout', pct: 18, color: '#34d399' },
                      { cat: 'Creatine', pct: 11, color: '#60a5fa' },
                      { cat: 'Others', pct: 5, color: '#fbbf24' },
                    ].map(c => (
                      <div key={c.cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-[rgba(245,245,245,0.6)]">{c.cat}</span>
                          <span className="text-[12px] text-white font-bold">{c.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COUPONS */}
          {activeSection === 'coupons' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Coupons & Discounts</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> Create Coupon</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {couponList.length === 0 && (
                  <p className="sm:col-span-2 text-center text-sm text-[rgba(245,245,245,0.3)] py-12">No coupons yet.</p>
                )}
                {couponList.map(c => (
                  <div key={c.code} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><Percent size={18} className="text-[#FF6B00]" /></div>
                        <div>
                          <p className="text-white font-black text-[15px] tracking-wide font-mono">{c.code}</p>
                          <p className="text-[rgba(245,245,245,0.4)] text-[12px]">{c.desc}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>{c.status}</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[rgba(245,245,245,0.4)]">{c.used} / {c.limit} used</span>
                        <span className="text-[11px] text-white font-bold">{Math.round((c.used / c.limit) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${Math.min((c.used / c.limit) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <button className="flex-1 py-2 text-[12px] text-[rgba(245,245,245,0.6)] hover:text-white border border-[rgba(255,255,255,0.1)] rounded-lg transition-all flex items-center justify-center gap-1.5"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => setCouponList(prev => prev.filter(x => x.code !== c.code))} className="py-2 px-3 text-[12px] text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REVIEWS */}
          {activeSection === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Product Reviews</h2>
              <div className="space-y-3">
                {reviewList.length === 0 && (
                  <p className="text-center text-sm text-[rgba(245,245,245,0.3)] py-12">No reviews yet.</p>
                )}
                {reviewList.map((r, i) => (
                  <div key={i} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} size={13} className={j < r.rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.18)]'} />
                            ))}
                          </div>
                          <span className="text-[12px] text-white font-bold">{r.product}</span>
                        </div>
                        <p className="text-[13px] text-[rgba(245,245,245,0.7)] mb-1.5">&ldquo;{r.comment}&rdquo;</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">by {r.customer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${r.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{r.status}</span>
                        {r.status === 'pending' && (
                          <button onClick={() => setReviewList(prev => prev.map((x, j) => j === i ? { ...x, status: 'approved' } : x))} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={15} /></button>
                        )}
                        <button onClick={() => setReviewList(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SUPPORT TICKETS */}
          {activeSection === 'support' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Support Tickets</h2>
                <span className="px-3 py-1.5 bg-[rgba(255,107,0,0.15)] text-[#FF6B00] text-[11px] font-bold rounded-lg">{ticketList.filter(t => t.status === 'open').length} open</span>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                        {['Ticket', 'Customer', 'Subject', 'Priority', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ticketList.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[rgba(245,245,245,0.3)]">No support tickets.</td></tr>
                      )}
                      {ticketList.map(t => (
                        <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-[#FF6B00] text-[12px] font-bold">{t.id}</td>
                          <td className="px-5 py-3.5 text-white text-[12px]">{t.customer}</td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.6)] text-[12px]">{t.subject}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${t.priority === 'high' ? 'bg-red-500/15 text-red-400 border-red-500/20' : t.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/15 text-blue-400 border-blue-500/20'}`}>{t.priority}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]'}`}>{t.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{t.date}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setReplyTicket(t); setReplyText(''); }} title="Reply"
                                className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><MessageSquare size={13} /></button>
                              <button onClick={() => setTicketList(prev => prev.filter(x => x.id !== t.id))} title="Delete"
                                className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* CMS */}
          {activeSection === 'cms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Content Management</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> New Content</button>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                      {['Title', 'Type', 'Last Updated', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cmsPages.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[rgba(245,245,245,0.3)]">No content pages yet.</td></tr>
                    )}
                    {cmsPages.map(c => (
                      <tr key={c.title} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                              {c.type === 'Banner' ? <ImageIcon size={14} className="text-[rgba(245,245,245,0.35)]" /> : <FileText size={14} className="text-[rgba(245,245,245,0.35)]" />}
                            </div>
                            <span className="text-white text-[13px] font-semibold">{c.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[rgba(245,245,245,0.5)] text-[12px]">{c.type}</td>
                        <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{c.updated}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ADMINS (owner only) */}
          {activeSection === 'admins' && owner && <AdminsSection />}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-3xl">
              <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Store Settings</h2>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Store size={16} className="text-[#FF6B00]" /> Store Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Store Name', value: 'Muscle Mantra' },
                    { label: 'Support Email', value: 'admin@musclemantra.shop' },
                    { label: 'Phone', value: '+91 84096 12737' },
                    { label: 'City', value: 'Patna, Bihar' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">{f.label}</label>
                      <input defaultValue={f.value} className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Admin security / change password ──────────────────── */}
              <AdminPasswordChange adminEmail={adminEmail} />

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Settings size={16} className="text-[#FF6B00]" /> Preferences</h3>
                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {([
                    { key: 'cod', label: 'Cash on Delivery', desc: 'Allow customers to pay on delivery' },
                    { key: 'onlinePay', label: 'Online Payments', desc: 'Accept UPI, cards & netbanking' },
                    { key: 'sameDay', label: 'Same-Day Delivery', desc: 'Offer 30-minute delivery in Patna' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Email me when stock runs low' },
                    { key: 'reviews', label: 'Auto-Approve Reviews', desc: 'Publish reviews without moderation' },
                    { key: 'maintenance', label: 'Maintenance Mode', desc: 'Temporarily take the store offline' },
                  ] as const).map(opt => (
                    <div key={opt.key} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{opt.desc}</p>
                      </div>
                      <button onClick={() => flip(opt.key)} aria-label={`Toggle ${opt.label}`}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${toggles[opt.key] ? 'bg-[#FF6B00]' : 'bg-[rgba(255,255,255,0.12)]'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${toggles[opt.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={saveSettings} className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Save size={15} /> Save Changes</button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Product editor modal — image upload/remove + full CRUD */}
      <AnimatePresence>
        {productDraft && (
          <motion.div
            key="product-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-4xl my-8 bg-[#0d0d0d] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d0d]">
                <div>
                  <h3 className="font-[var(--font-montserrat)] font-black text-lg text-white">
                    {productList.some(p => p.id === productDraft.id) ? 'Edit product' : 'Add product'}
                  </h3>
                  <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">All fields are saved locally to this browser.</p>
                </div>
                <button onClick={closeProductModal} className="p-2 text-[rgba(245,245,245,0.5)] hover:text-white hover:bg-white/5 rounded-lg transition-all" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Images */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide">Product Images</label>
                    <span className="text-[10px] text-[rgba(245,245,245,0.4)]">{productDraft.images.length} / 6 · First image is used as the primary</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {productDraft.images.map((src, i) => (
                      <div key={i} className={`relative group aspect-square rounded-xl overflow-hidden border ${i === 0 ? 'border-[#FF6B00]' : 'border-[rgba(255,255,255,0.08)]'} bg-[#0a0a0a]`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`image-${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-[#FF6B00] text-white text-[9px] font-black px-1.5 py-0.5 rounded">PRIMARY</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {i !== 0 && (
                            <button onClick={() => setPrimaryImage(i)} title="Make primary"
                              className="p-1.5 bg-[#FF6B00]/90 hover:bg-[#FF6B00] text-white rounded-lg"><Star size={12} /></button>
                          )}
                          <button onClick={() => removeProductImage(i)} title="Remove"
                            className="p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                    {productDraft.images.length < 6 && (
                      <button onClick={() => productImgRef.current?.click()} type="button"
                        className="aspect-square rounded-xl border border-dashed border-[rgba(255,107,0,0.5)] bg-[#0a0a0a] hover:bg-[rgba(255,107,0,0.05)] flex flex-col items-center justify-center gap-1.5 text-[rgba(245,245,245,0.6)] hover:text-white transition-all">
                        <Upload size={16} />
                        <span className="text-[10px] font-bold">Upload</span>
                      </button>
                    )}
                  </div>
                  <input ref={productImgRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => onProductImagesPick(e.target.files)} />

                  {/* URL fallback */}
                  <div className="mt-3 flex gap-2">
                    <input placeholder="…or paste an image URL (https://…)"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setProductDraft(d => d ? { ...d, images: [...d.images, val].slice(0, 6) } : d);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[13px] text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <span className="text-[10px] text-[rgba(245,245,245,0.4)] self-center">press Enter to add</span>
                  </div>
                </section>

                {/* Basic info */}
                <section className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Product name *</label>
                    <input value={productDraft.name} onChange={e => setProductDraft(d => d ? { ...d, name: e.target.value } : d)}
                      maxLength={200} placeholder="e.g. Gold Standard Whey 2kg"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Brand</label>
                    <input value={productDraft.brand} onChange={e => setProductDraft(d => d ? { ...d, brand: e.target.value } : d)}
                      list="admin-brand-list" placeholder="e.g. Optimum Nutrition" maxLength={100}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <datalist id="admin-brand-list">
                      {brandList.map(b => <option key={b.id} value={b.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Category</label>
                    <select value={productDraft.category} onChange={e => setProductDraft(d => d ? { ...d, category: e.target.value } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                      {categoryList.length === 0 && <option value="">— add a category first —</option>}
                      {categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">SKU</label>
                    <input value={productDraft.sku} onChange={e => setProductDraft(d => d ? { ...d, sku: e.target.value } : d)}
                      placeholder="Auto-generated on save" maxLength={60}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white font-mono placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                {/* Pricing & inventory */}
                <section className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Selling Price (₹)</label>
                    <input type="number" min={0} value={productDraft.price}
                      onChange={e => setProductDraft(d => d ? { ...d, price: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">MRP (₹)</label>
                    <input type="number" min={0} value={productDraft.originalPrice}
                      onChange={e => setProductDraft(d => d ? { ...d, originalPrice: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Stock (units)</label>
                    <input type="number" min={0} value={productDraft.stock}
                      onChange={e => setProductDraft(d => d ? { ...d, stock: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Reorder at</label>
                    <input type="number" min={0} value={productDraft.reorderAt}
                      onChange={e => setProductDraft(d => d ? { ...d, reorderAt: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                {/* Options */}
                <section className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Flavors (comma-separated)</label>
                    <input value={productDraft.flavors.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, flavors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="Chocolate, Vanilla"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Sizes (comma-separated)</label>
                    <input value={productDraft.sizes.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="1kg, 2kg, 5lb"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Tags (comma-separated)</label>
                    <input value={productDraft.tags.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="whey, protein, muscle gain"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                <section className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Delivery time</label>
                    <input value={productDraft.deliveryTime}
                      onChange={e => setProductDraft(d => d ? { ...d, deliveryTime: e.target.value } : d)}
                      placeholder="e.g. 15 min"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Badge</label>
                    <select value={productDraft.badge ?? ''}
                      onChange={e => setProductDraft(d => d ? { ...d, badge: (e.target.value || undefined) as AdminProduct['badge'] } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                      <option value="">— none —</option>
                      <option value="bestseller">Bestseller</option>
                      <option value="new">New</option>
                      <option value="sale">Sale</option>
                      <option value="trending">Trending</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productDraft.active}
                        onChange={e => setProductDraft(d => d ? { ...d, active: e.target.checked } : d)}
                        className="w-4 h-4 accent-[#FF6B00]" />
                      <span className="text-sm text-white font-semibold">Visible on storefront</span>
                    </label>
                  </div>
                </section>

                <div>
                  <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Description</label>
                  <textarea value={productDraft.description}
                    onChange={e => setProductDraft(d => d ? { ...d, description: e.target.value } : d)}
                    rows={3} maxLength={2000} placeholder="Short product description shown on the detail page."
                    className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none resize-none" />
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0d0d0d]">
                <button onClick={closeProductModal}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.7)] hover:text-white text-sm font-semibold rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={saveProductDraft}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                  <Save size={14} /> Save product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support ticket reply modal */}
      <AnimatePresence>
        {replyTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setReplyTicket(null)}>
            <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 12 }}
              className="w-full max-w-lg bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Reply to ticket</h3>
                  <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">
                    {replyTicket.id} · {replyTicket.customer} — <span className="text-[rgba(245,245,245,0.7)]">{replyTicket.subject}</span>
                  </p>
                </div>
                <button onClick={() => setReplyTicket(null)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/10 rounded-lg transition-all"><X size={16} /></button>
              </div>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5}
                placeholder="Type your reply to the customer…"
                className="w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.3)] focus:outline-none focus:border-[#FF6B00] resize-none" />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setReplyTicket(null)} className="px-4 py-2.5 text-sm font-semibold text-[rgba(245,245,245,0.6)] hover:text-white transition-colors">Cancel</button>
                <button onClick={sendTicketReply} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><MessageSquare size={15} /> Send reply</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
