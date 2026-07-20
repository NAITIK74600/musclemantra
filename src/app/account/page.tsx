'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package, Heart, RefreshCw, MapPin, CreditCard, Star, Bell,
  HeadphonesIcon, User, ChevronRight, TrendingUp, Gift, Medal,
  ShoppingBag, Zap, Award,
  Plus, Edit2, Trash2, Copy, Calendar, Pause, Truck,
  Save, MessageSquare, Share2, ShoppingCart, LogOut
} from 'lucide-react';
import { products } from '@/lib/data';
import { getWishlist, removeWishlist, onStoreChange } from '@/lib/store';
import { getCurrentUser, onAuthChange, signOut, initials, getToken, type User as AuthUser } from '@/lib/auth';

const sidebarItems = [
  { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
  { id: 'orders', icon: Package, label: 'My Orders' },
  { id: 'wishlist', icon: Heart, label: 'Wishlist' },
  { id: 'subscriptions', icon: RefreshCw, label: 'Subscriptions' },
  { id: 'addresses', icon: MapPin, label: 'Saved Addresses' },
  { id: 'payments', icon: CreditCard, label: 'Payment Methods' },
  { id: 'reviews', icon: Star, label: 'My Reviews' },
  { id: 'rewards', icon: Gift, label: 'Rewards & Points' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'support', icon: HeadphonesIcon, label: 'Support Tickets' },
  { id: 'referral', icon: Medal, label: 'Referral Earnings' },
  { id: 'profile', icon: User, label: 'Profile Settings' },
];

interface AccountOrder {
  id: string;
  date: string;
  status: string;   // raw server status label
  total: number;
  product: string;  // item preview
}

interface SavedAddress {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

// No fake demo data — these sections are populated from real user data only.
const paymentMethods: { id: number; kind: string; last4: string; expiry: string; default: boolean }[] = [];
const subscriptions: { id: number; product: string; freq: string; next: string; price: number; status: string }[] = [];
const myReviews: { id: number; product: string; rating: number; comment: string; date: string }[] = [];
const referrals: { name: string; status: string; earned: number }[] = [];
const rewardHistory: { label: string; points: string; date: string; positive: boolean }[] = [];

const statusColors: Record<string, string> = {
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

// Map any server status label to a badge colour bucket.
function statusBucket(status: string): keyof typeof statusColors {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('fail') || s.includes('return')) return 'cancelled';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('ship') || s.includes('transit') || s.includes('out for')) return 'shipped';
  return 'processing';
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setAuthChecked(true);
    if (!u) router.replace('/login');
    return onAuthChange(() => {
      const cu = getCurrentUser();
      setUser(cu);
      if (!cu) router.replace('/login');
    });
  }, [router]);

  // Fetch the signed-in account's real orders (token-scoped on the server).
  // A fresh account has none — no fake/demo orders are ever shown.
  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token) { setOrders([]); setOrdersLoaded(true); return; }
      try {
        const res = await fetch('/api/get-orders', { headers: { Authorization: `Bearer ${token}` } });
        const data: Record<string, unknown>[] = res.ok ? await res.json() : [];
        const mapped: AccountOrder[] = (Array.isArray(data) ? data : []).map(r => {
          const items = Array.isArray(r.items) ? (r.items as { name?: string }[]) : [];
          const names = items.map(i => i?.name).filter(Boolean) as string[];
          const preview = names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
          const created = String(r.created_at ?? r.createdAt ?? '');
          const d = created ? new Date(created) : null;
          return {
            id: String(r.id ?? ''),
            date: d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            status: String(r.status ?? 'Pending'),
            total: Number(r.total) || 0,
            product: preview || 'Order',
          };
        });
        setOrders(mapped);
      } catch {
        setOrders([]);
      }
      setOrdersLoaded(true);
    };
    load();
    return onAuthChange(() => load());
  }, []);

  // Real wishlist (from the shared store) + saved addresses (from checkout).
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [notifications, setNotifications] = useState<{ id: number; icon: typeof Truck; title: string; body: string; time: string; unread: boolean; color: string }[]>([]);
  useEffect(() => {
    setWishlist(getWishlist());
    try {
      const raw = localStorage.getItem('mb_addresses');
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) setSavedAddresses(list);
    } catch { /* ignore */ }
    return onStoreChange(() => setWishlist(getWishlist()));
  }, []);
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const referralCode = ((user?.name || user?.email || 'MUSCLE').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'MUSCLE') + '200';
  const removeWish = (id: string) => { removeWishlist(id); setWishlist(getWishlist()); };
  const markRead = (id: number) => setNotifications(n => n.map(x => x.id === id ? { ...x, unread: false } : x));
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, unread: false })));

  const logout = () => {
    signOut();
    router.push('/');
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(245,245,245,0.5)] text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="container-max py-8">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* ─── SIDEBAR ─── */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Profile card */}
            <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 text-center">
              <div className="relative w-16 h-16 mx-auto mb-3">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={64} height={64} unoptimized className="w-16 h-16 rounded-full border-2 border-[#FF6B00] object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-[#FF6B00] bg-[#FF6B00] flex items-center justify-center text-white text-lg font-black">{initials(user.name)}</div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#111]" />
              </div>
              <h3 className="font-bold text-white">{user.name}</h3>
              <p className="text-xs text-[rgba(245,245,245,0.4)] mt-0.5">{user.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#E55A00] text-white text-[10px] font-black">
                <Award size={11} /> M3 ELITE MEMBER
              </div>
            </div>

            {/* Nav */}
            <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-all ${activeSection === item.id ? 'bg-[rgba(255,107,0,0.08)] text-white border-l-2 border-l-[#FF6B00]' : 'text-[rgba(245,245,245,0.5)] hover:text-white hover:bg-white/[0.03]'}`}>
                  <item.icon size={14} className={activeSection === item.id ? 'text-[#FF6B00]' : ''} />
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight size={12} className="ml-auto opacity-30" />
                </button>
              ))}
            </div>

            {/* Logout */}
            <button onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#111] border border-red-500/20 rounded-2xl text-[13px] font-bold text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={15} /> Log Out
            </button>
          </aside>

          {/* ─── MAIN ─── */}
          <main className="lg:col-span-3 space-y-5">

            {/* Dashboard */}
            {activeSection === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: Package, label: 'Total Orders', value: String(orders.length), color: '#FF6B00' },
                    { icon: Heart, label: 'Wishlist Items', value: String(wishlistProducts.length), color: '#f472b6' },
                    { icon: Gift, label: 'Reward Points', value: '0', color: '#a78bfa' },
                    { icon: ShoppingBag, label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: '#34d399' },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 text-center">
                      <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${s.color}18` }}>
                        <s.icon size={18} style={{ color: s.color }} />
                      </div>
                      <div className="text-xl font-black text-white">{s.value}</div>
                      <div className="text-[10px] text-[rgba(245,245,245,0.4)] mt-0.5">{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* M3 Elite Card */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF6B00] via-[#E55A00] to-[#cc4700] p-6">
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-white" />
                        <span className="font-[var(--font-montserrat)] font-black text-white text-lg tracking-widest">M3 ELITE</span>
                      </div>
                      <p className="text-white/80 text-sm mb-1">{(user.name || user.email || 'Member').toUpperCase()}</p>
                      <p className="text-white font-bold text-sm">Earn points on every order <span className="text-yellow-300">⚡ 0 Points</span></p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-white/20 flex-1">
                          <div className="h-full w-[2%] bg-white rounded-full" />
                        </div>
                        <span className="text-white/80 text-[11px]">0 / 1000 pts to ELITE+</span>
                      </div>
                    </div>
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <Zap size={36} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Package, label: 'Track Order', sub: 'Live tracking', color: '#FF6B00', href: '/orders' },
                    { icon: RefreshCw, label: 'Reorder', sub: 'Buy again', color: '#a78bfa', href: '/products' },
                    { icon: HeadphonesIcon, label: 'Support', sub: '24/7 Help', color: '#34d399', href: '/contact' },
                  ].map(a => (
                    <Link key={a.label} href={a.href}
                      className="group flex flex-col items-center gap-2 p-4 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl hover:border-[rgba(255,107,0,0.3)] transition-all text-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}18` }}>
                        <a.icon size={18} style={{ color: a.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{a.label}</div>
                        <div className="text-[10px] text-[rgba(245,245,245,0.4)]">{a.sub}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
                    <h3 className="font-bold text-white">Recent Orders</h3>
                    <button onClick={() => setActiveSection('orders')} className="text-xs text-[#FF6B00] font-bold flex items-center gap-1">View All <ChevronRight size={12} /></button>
                  </div>
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {ordersLoaded && orders.length === 0 && (
                      <div className="px-5 py-10 text-center text-[13px] text-[rgba(245,245,245,0.4)]">
                        No orders yet. <Link href="/products" className="text-[#FF6B00] font-bold">Start shopping</Link>
                      </div>
                    )}
                    {orders.slice(0, 4).map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,0,0.1)] flex items-center justify-center shrink-0">
                          <Package size={16} className="text-[#FF6B00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white line-clamp-1">{o.product}</p>
                          <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{o.id} · {o.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold text-white">₹{o.total.toLocaleString('en-IN')}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[statusBucket(o.status)]}`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* MY ORDERS */}
            {activeSection === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">My Orders</h2>
                {ordersLoaded && orders.length === 0 && (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <Package size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No orders yet</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)] mb-5">Your orders will appear here once you place one.</p>
                    <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl text-sm transition-all"><ShoppingBag size={15} /> Shop Now</Link>
                  </div>
                )}
                {orders.map(o => (
                  <div key={o.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.1)] flex items-center justify-center shrink-0">
                          <Package size={20} className="text-[#FF6B00]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">{o.product}</p>
                          <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{o.id} · Placed {o.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[statusBucket(o.status)]}`}>{o.status}</span>
                        <span className="text-[15px] font-black text-white">₹{o.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <Link href="/orders" className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-all"><Truck size={13} /> Track</Link>
                      <Link href="/products" className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-all"><RefreshCw size={13} /> Reorder</Link>
                      <Link href={`/invoice/${o.id}`} className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all ml-auto">Invoice</Link>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* WISHLIST */}
            {activeSection === 'wishlist' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Wishlist</h2>
                  <span className="text-sm text-[rgba(245,245,245,0.4)]">{wishlistProducts.length} items</span>
                </div>
                {wishlistProducts.length === 0 ? (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-20 text-center">
                    <Heart size={40} className="text-[rgba(245,245,245,0.2)] mx-auto mb-3" />
                    <p className="text-[rgba(245,245,245,0.5)] mb-4">Your wishlist is empty.</p>
                    <Link href="/products" className="inline-flex px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">Browse Products</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {wishlistProducts.map(p => (
                      <div key={p.id} className="flex gap-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#1a1a1a] shrink-0">
                          <Image src={p.image} alt={p.name} fill className="object-cover" sizes="80px" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className="text-[10px] font-bold text-[rgba(245,245,245,0.4)] uppercase">{p.brand}</p>
                          <p className="text-[13px] font-semibold text-white line-clamp-1">{p.name}</p>
                          <p className="text-[15px] font-black text-white mt-auto">₹{p.price.toLocaleString()}</p>
                          <div className="flex gap-2 mt-2">
                            <Link href={`/products/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-white bg-[#FF6B00] hover:bg-[#E55A00] rounded-lg transition-all"><ShoppingCart size={12} /> View</Link>
                            <button onClick={() => removeWish(p.id)} aria-label="Remove" className="px-2.5 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* SUBSCRIPTIONS */}
            {activeSection === 'subscriptions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Subscriptions</h2>
                {subscriptions.length === 0 && (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <RefreshCw size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No active subscriptions</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)]">You have no auto-delivery subscriptions yet.</p>
                  </div>
                )}
                {subscriptions.map(s => (
                  <div key={s.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.1)] flex items-center justify-center shrink-0"><RefreshCw size={18} className="text-[#FF6B00]" /></div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">{s.product}</p>
                          <p className="text-[11px] text-[rgba(245,245,245,0.4)] flex items-center gap-1.5"><Calendar size={11} /> {s.freq} · Next: {s.next}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${s.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{s.status}</span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="text-[15px] font-black text-white mr-auto">₹{s.price.toLocaleString()}<span className="text-[11px] font-medium text-[rgba(245,245,245,0.4)]">/delivery</span></span>
                      <button className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-all">{s.status === 'active' ? <><Pause size={13} /> Pause</> : <><RefreshCw size={13} /> Resume</>}</button>
                      <button className="px-3.5 py-2 text-[12px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all">Cancel</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ADDRESSES */}
            {activeSection === 'addresses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Saved Addresses</h2>
                  <Link href="/checkout" className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> Add Address</Link>
                </div>
                {savedAddresses.length === 0 ? (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <MapPin size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No saved addresses</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)]">Addresses you use at checkout will be saved here.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedAddresses.map((a, i) => (
                      <div key={i} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><MapPin size={16} className="text-[#FF6B00]" /></div>
                          <span className="text-white font-bold text-[14px]">{a.name || 'Saved Address'}</span>
                        </div>
                        <p className="text-[12px] text-[rgba(245,245,245,0.5)]">{[a.address, a.area].filter(Boolean).join(', ')}</p>
                        <p className="text-[12px] text-[rgba(245,245,245,0.5)]">{[a.city, a.state, a.pincode].filter(Boolean).join(', ')}</p>
                        {a.phone && <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-1">{a.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PAYMENT METHODS */}
            {activeSection === 'payments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Payment Methods</h2>
                  <span className="text-[11px] text-[rgba(245,245,245,0.4)]">Pay securely at checkout</span>
                </div>
                {paymentMethods.length === 0 && (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <CreditCard size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No saved payment methods</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)]">We never store your card details. Pay via UPI, cards or Cash on Delivery at checkout.</p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {paymentMethods.map(m => (
                    <div key={m.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><CreditCard size={18} className="text-[#FF6B00]" /></div>
                        {m.default && <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/20">DEFAULT</span>}
                      </div>
                      <p className="text-white font-bold text-[14px]">{m.kind}{m.expiry ? ` ····  ${m.last4}` : ''}</p>
                      <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-0.5">{m.expiry ? `Expires ${m.expiry}` : m.last4}</p>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        {!m.default && <button className="text-[12px] font-bold text-[#FF6B00] hover:underline mr-auto">Set Default</button>}
                        <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-auto"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* MY REVIEWS */}
            {activeSection === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">My Reviews</h2>
                {myReviews.length === 0 && (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <Star size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No reviews yet</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)]">Reviews you write on products will appear here.</p>
                  </div>
                )}
                {myReviews.map(r => (
                  <div key={r.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} size={13} className={j < r.rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.18)]'} />
                            ))}
                          </div>
                          <span className="text-[13px] text-white font-bold">{r.product}</span>
                        </div>
                        <p className="text-[13px] text-[rgba(245,245,245,0.7)]">&ldquo;{r.comment}&rdquo;</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-1.5">Reviewed on {r.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* REWARDS & POINTS */}
            {activeSection === 'rewards' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Rewards & Points</h2>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF6B00] via-[#E55A00] to-[#cc4700] p-6">
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm">Available Balance</p>
                    <p className="font-[var(--font-montserrat)] font-black text-white text-4xl mt-1 mb-3">0 <span className="text-lg">pts</span></p>
                    <p className="text-white/80 text-[12px]">Earn points on every order · 100 pts = ₹100</p>
                    <Link href="/products" className="inline-block mt-4 px-5 py-2.5 bg-white text-[#FF6B00] text-sm font-black rounded-xl hover:bg-white/90 transition-all">Start Earning</Link>
                  </div>
                  <Gift size={120} className="absolute -right-4 -bottom-6 text-white/10" />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: ShoppingBag, label: 'Shop & earn', sub: '1 pt per ₹10' },
                    { icon: Star, label: 'Write reviews', sub: '+20 pts each' },
                    { icon: Share2, label: 'Refer friends', sub: '+200 pts each' },
                  ].map(e => (
                    <div key={e.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center mx-auto mb-2"><e.icon size={18} className="text-[#FF6B00]" /></div>
                      <p className="text-[13px] font-bold text-white">{e.label}</p>
                      <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{e.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]"><h3 className="font-bold text-white">Points History</h3></div>
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {rewardHistory.length === 0 && (
                      <p className="px-5 py-8 text-center text-[13px] text-[rgba(245,245,245,0.4)]">No points activity yet.</p>
                    )}
                    {rewardHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-[13px] text-white font-medium">{h.label}</p>
                          <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{h.date}</p>
                        </div>
                        <span className={`text-[14px] font-black ${h.positive ? 'text-emerald-400' : 'text-red-400'}`}>{h.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Notifications</h2>
                  <button onClick={markAllRead} className="text-[12px] font-bold text-[#FF6B00] hover:underline">Mark all read</button>
                </div>
                {notifications.length === 0 && (
                  <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                    <Bell size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No notifications</p>
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)]">Order updates and offers will show up here.</p>
                  </div>
                )}
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden divide-y divide-[rgba(255,255,255,0.04)]">
                  {notifications.map(n => (
                    <button key={n.id} onClick={() => markRead(n.id)} className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors ${n.unread ? 'bg-[rgba(255,107,0,0.04)] hover:bg-[rgba(255,107,0,0.07)]' : 'hover:bg-white/[0.02]'}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${n.color}18` }}><n.icon size={17} style={{ color: n.color }} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white">{n.title}</p>
                        <p className="text-[12px] text-[rgba(245,245,245,0.5)]">{n.body}</p>
                        <p className="text-[10px] text-[rgba(245,245,245,0.35)] mt-1">{n.time}</p>
                      </div>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUPPORT TICKETS */}
            {activeSection === 'support' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Support Tickets</h2>
                  <Link href="/contact" className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> New Ticket</Link>
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] py-16 text-center">
                  <HeadphonesIcon size={40} className="text-[rgba(255,107,0,0.4)] mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">No support tickets</p>
                  <p className="text-[13px] text-[rgba(245,245,245,0.4)] mb-5">Need help? Reach out and we&rsquo;ll get back to you.</p>
                  <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl text-sm transition-all"><MessageSquare size={15} /> Contact Support</Link>
                </div>
              </motion.div>
            )}

            {/* REFERRAL EARNINGS */}
            {activeSection === 'referral' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Referral Earnings</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total Earned', value: '₹0', color: '#34d399' },
                    { label: 'Friends Joined', value: '0', color: '#60a5fa' },
                    { label: 'Pending', value: '0', color: '#fbbf24' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 text-center">
                      <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <p className="text-[13px] font-bold text-white mb-1">Your Referral Code</p>
                  <p className="text-[12px] text-[rgba(245,245,245,0.4)] mb-3">Share &amp; earn ₹200 for every friend who orders.</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] rounded-xl">
                      <span className="font-mono font-black text-[#FF6B00] tracking-widest">{referralCode}</span>
                    </div>
                    <button onClick={() => { navigator.clipboard?.writeText(referralCode); }} className="flex items-center gap-2 px-4 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Copy size={14} /> Copy</button>
                  </div>
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]"><h3 className="font-bold text-white">Invited Friends</h3></div>
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {referrals.length === 0 && (
                      <p className="px-5 py-8 text-center text-[13px] text-[rgba(245,245,245,0.4)]">No friends invited yet. Share your code to start earning.</p>
                    )}
                    {referrals.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[rgba(255,107,0,0.15)] flex items-center justify-center text-[#FF6B00] text-[12px] font-black">{r.name.charAt(0)}</div>
                          <span className="text-[13px] text-white font-medium">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${r.status === 'joined' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{r.status}</span>
                          <span className="text-[13px] font-bold text-white w-12 text-right">{r.earned ? `₹${r.earned}` : '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROFILE SETTINGS */}
            {activeSection === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Profile Settings</h2>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="w-16 h-16 rounded-full border-2 border-[#FF6B00] bg-[rgba(255,107,0,0.15)] flex items-center justify-center text-[#FF6B00] text-xl font-black">{initials(user.name || user.email || 'U')}</div>
                    <div>
                      <p className="text-white font-bold text-[15px]">{user.name || 'Your Account'}</p>
                      <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: user.name || '' },
                      { label: 'Email', value: user.email || '' },
                      { label: 'Phone', value: user.phone || '' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">{f.label}</label>
                        <input defaultValue={f.value} className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Save size={15} /> Save Changes</button>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

