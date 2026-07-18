'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, User, Menu, X, MapPin, Package, Heart, ChevronDown, BarChart2, Repeat, Check, LogOut, LogIn, Settings, UserPlus } from 'lucide-react';
import { useCart } from './CartProvider';
import { getCurrentUser, onAuthChange, signOut, initials, safeAvatar, type User as AuthUser } from '@/lib/auth';
import { products } from '@/lib/data';

function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    return onAuthChange(() => setUser(getCurrentUser()));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    signOut();
    setOpen(false);
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 pl-3 ml-1 border-l border-[rgba(255,255,255,0.08)]">
        <Link href="/login"
          className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white hover:text-[#FF6B00] transition-colors">
          <LogIn size={15} /> Login
        </Link>
        <Link href="/signup"
          className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-[#FF6B00] hover:bg-[#E55A00] rounded-lg transition-all">
          <UserPlus size={15} /> Sign Up
        </Link>
      </div>
    );
  }

  const menu = [
    { icon: User, label: 'My Account', href: '/account' },
    { icon: Package, label: 'My Orders', href: '/orders' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
    { icon: Settings, label: 'Settings', href: '/account' },
  ];

  return (
    <div ref={ref} className="relative pl-3 ml-1 border-l border-[rgba(255,255,255,0.08)]">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-black overflow-hidden">
          {(() => {
            const a = safeAvatar(user.avatar);
            return a
              ? <img src={a} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              : initials(user.name);
          })()}
        </div>
        <div className="text-left">
          <div className="text-[10px] text-[rgba(245,245,245,0.4)] leading-none mb-0.5">Hi, {user.name.split(' ')[0]}</div>
          <div className="text-[12px] text-white font-semibold leading-none flex items-center gap-1">My Profile <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 w-60 bg-[#141414] border border-[rgba(255,107,0,0.2)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-[60]">
            <div className="px-4 py-3.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,107,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-sm font-black overflow-hidden shrink-0">
                  {(() => {
                    const a = safeAvatar(user.avatar);
                    return a
                      ? <img src={a} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      : initials(user.name);
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] text-white font-bold leading-tight truncate">{user.name}</div>
                  <div className="text-[11px] text-[rgba(245,245,245,0.45)] truncate">{user.email}</div>
                </div>
              </div>
            </div>
            <div className="py-1">
              {menu.map(m => (
                <Link key={m.label} href={m.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(245,245,245,0.7)] hover:text-white hover:bg-[rgba(255,107,0,0.08)] transition-all">
                  <m.icon size={15} className="text-[rgba(245,245,245,0.4)]" /> {m.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] py-1">
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const menuLinks = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/products' },
  { label: 'CATEGORIES', href: '/products', sub: ['Protein', 'Creatine', 'Pre-Workout', 'Mass Gainer', 'BCAA', 'Vitamins', 'Fat Burners', 'Accessories'] },
  { label: 'BRANDS', href: '/brands' },
  { label: 'STACK BUILDER', href: '/stack-builder' },
  { label: 'OFFERS', href: '/offers' },
  { label: 'BOOK APPT', href: '/book' },
  { label: 'SERVICES', href: '/services' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
];

/* Patna localities we currently deliver to */
const PATNA_AREAS = [
  'Boring Road', 'Rajendra Nagar', 'Patliputra Colony', 'Kankarbagh',
  'Bailey Road', 'Ashok Rajpath', 'Gandhi Maidan', 'Dak Bungalow',
  'Frazer Road', 'Exhibition Road', 'Mithapur', 'Rupaspur',
  'Anisabad', 'Jagdev Path', 'Phulwari Sharif', 'Kurji',
];

function LocationPicker() {
  const [area, setArea] = useState('Select area');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Persist selection in localStorage */
  useEffect(() => {
    const saved = localStorage.getItem('mb_delivery_area');
    if (saved) setArea(saved);
  }, []);

  const pick = (a: string) => {
    setArea(a);
    localStorage.setItem('mb_delivery_area', a);
    setOpen(false);
  };

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="hidden md:block relative shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex flex-col items-start group min-w-[148px]">
        <span className="text-[10px] text-[rgba(245,245,245,0.4)] leading-none mb-0.5">Delivering to · Patna</span>
        <div className="flex items-center gap-1 text-white text-[12px] font-semibold">
          <MapPin size={11} className="text-[#FF6B00] shrink-0" />
          <span className="line-clamp-1 max-w-[110px]">{area}</span>
          <ChevronDown size={11} className={`text-[rgba(245,245,245,0.4)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-64 bg-[#141414] border border-[rgba(255,107,0,0.2)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-[60]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,107,0,0.06)]">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-[#FF6B00]" />
                <span className="text-[11px] font-black text-white tracking-wider">PATNA DELIVERY AREAS</span>
              </div>
              <p className="text-[10px] text-[rgba(245,245,245,0.4)] mt-0.5">We currently serve within Patna city only</p>
            </div>
            {/* Area list */}
            <div className="max-h-64 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
              {PATNA_AREAS.map(a => (
                <button key={a} onClick={() => pick(a)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] text-[rgba(245,245,245,0.7)] hover:text-white hover:bg-[rgba(255,107,0,0.08)] transition-all group">
                  <span className="flex items-center gap-2">
                    <MapPin size={11} className="text-[rgba(245,245,245,0.25)] group-hover:text-[#FF6B00] transition-colors shrink-0" />
                    {a}
                  </span>
                  {area === a && <Check size={13} className="text-[#FF6B00]" />}
                </button>
              ))}
            </div>
            {/* Footer note */}
            <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.3)]">
              <p className="text-[10px] text-[rgba(245,245,245,0.3)] text-center">30-min delivery across all Patna areas</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { totalItems } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Fuzzy-lite product/brand suggestions
  const trimmed = searchQuery.trim().toLowerCase();
  const suggestions = trimmed.length >= 2
    ? (() => {
        const seenBrands = new Set<string>();
        const brandHits: { type: 'brand'; name: string }[] = [];
        const productHits: { type: 'product'; id: string; name: string; brand: string; image: string; price: number }[] = [];
        for (const p of products) {
          const hay = `${p.name} ${p.brand} ${p.tags.join(' ')}`.toLowerCase();
          if (hay.includes(trimmed)) {
            productHits.push({ type: 'product', id: p.id, name: p.name, brand: p.brand, image: p.image, price: p.price });
          }
          if (!seenBrands.has(p.brand) && p.brand.toLowerCase().includes(trimmed)) {
            seenBrands.add(p.brand);
            brandHits.push({ type: 'brand', name: p.brand });
          }
          if (productHits.length >= 6 && brandHits.length >= 3) break;
        }
        return { brands: brandHits.slice(0, 3), items: productHits.slice(0, 5) };
      })()
    : { brands: [], items: [] };

  const hasResults = suggestions.brands.length + suggestions.items.length > 0;

  const submitSearch = (q: string = searchQuery) => {
    const cleaned = q.trim();
    if (!cleaned) return;
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(cleaned)}`);
  };

  // Close suggestions on outside click / Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
        {/* â”€â”€ Row 1 â”€â”€ */}
        <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)]">
          <div className="container-max py-2.5 flex items-center gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo.png" alt="Muscle Mantra" width={48} height={48} className="w-12 h-12 object-contain" priority />
            </Link>

            {/* Location picker â€” Patna only */}
            <LocationPicker />

            {/* Search */}
            <div ref={searchWrapRef} className="flex-1 relative max-w-2xl">
              <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} role="search">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)] pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search supplements, brands..."
                  autoComplete="off"
                  aria-label="Search products"
                  className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-24 py-2.5 text-[13px] text-white placeholder-[rgba(245,245,245,0.3)] outline-none focus:border-[rgba(255,107,0,0.5)] transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 bottom-0 px-4 bg-[#FF6B00] hover:bg-[#E55A00] text-white rounded-r-lg text-xs font-bold transition-colors"
                >
                  SEARCH
                </button>
              </form>

              {/* Live suggestions */}
              <AnimatePresence>
                {searchOpen && trimmed.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-[#141414] border border-[rgba(255,107,0,0.2)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-[60]"
                  >
                    {hasResults ? (
                      <>
                        {suggestions.brands.length > 0 && (
                          <div className="border-b border-[rgba(255,255,255,0.05)]">
                            <div className="px-4 pt-3 pb-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-[rgba(245,245,245,0.4)]">Brands</div>
                            {suggestions.brands.map(b => (
                              <Link
                                key={b.name}
                                href={`/products?brand=${encodeURIComponent(b.name)}`}
                                onClick={() => setSearchOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(245,245,245,0.75)] hover:text-white hover:bg-[rgba(255,107,0,0.08)] transition-colors"
                              >
                                <span className="w-6 h-6 rounded-full bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.3)] flex items-center justify-center text-[9px] font-black text-[#FF6B00]">
                                  {b.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="font-semibold">{b.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {suggestions.items.length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-[rgba(245,245,245,0.4)]">Products</div>
                            {suggestions.items.map(it => (
                              <Link
                                key={it.id}
                                href={`/products/${it.id}`}
                                onClick={() => setSearchOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-[13px] text-white hover:bg-[rgba(255,107,0,0.08)] transition-colors"
                              >
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#0a0a0a] shrink-0 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={it.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] font-semibold text-white line-clamp-1">{it.name}</p>
                                  <p className="text-[10px] text-[rgba(245,245,245,0.45)]">{it.brand}</p>
                                </div>
                                <span className="text-[12px] font-black text-[#FF6B00] tabular-nums">₹{it.price.toLocaleString()}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => submitSearch()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-[rgba(255,255,255,0.05)] text-[12px] font-bold text-[#FF6B00] hover:bg-[rgba(255,107,0,0.06)] transition-colors"
                        >
                          View all results for “{searchQuery.trim()}”
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-[13px] text-[rgba(245,245,245,0.55)]">No matches for “{searchQuery.trim()}”</p>
                        <button
                          type="button"
                          onClick={() => submitSearch()}
                          className="mt-2 text-[11px] font-bold text-[#FF6B00] hover:underline"
                        >
                          Search anyway
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right icons */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { icon: Package, label: 'Track Order', href: '/orders' },
                { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                { icon: Repeat, label: 'Reorder', href: '/account' },
                { icon: BarChart2, label: 'Reports', href: '/account' },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={label} href={href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[rgba(245,245,245,0.55)] hover:text-white transition-colors group">
                  <Icon size={18} className="group-hover:text-[#FF6B00] transition-colors" />
                  <span className="text-[9px] whitespace-nowrap">{label}</span>
                </Link>
              ))}

              <Link href="/cart"
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[rgba(245,245,245,0.55)] hover:text-white transition-colors group">
                <ShoppingCart size={18} className="group-hover:text-[#FF6B00] transition-colors" />
                <span className="text-[9px]">Cart</span>
                {totalItems > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-0.5 right-1.5 w-4 h-4 bg-[#FF6B00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </motion.span>
                )}
              </Link>

              <Link href="/account"
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[rgba(245,245,245,0.55)] hover:text-white transition-colors group">
                <User size={18} className="group-hover:text-[#FF6B00] transition-colors" />
                <span className="text-[9px]">My Account</span>
              </Link>

              {/* Auth-aware user menu */}
              <UserMenu />
            </div>

            {/* Mobile icons */}
            <div className="flex lg:hidden items-center gap-2 ml-auto">
              <Link href="/cart" className="relative p-2 text-[rgba(245,245,245,0.6)] hover:text-white">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6B00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>
                )}
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[rgba(245,245,245,0.6)] hover:text-white">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* â”€â”€ Row 2 â€“ Menu bar â”€â”€ */}
        <div className="bg-[#111] border-b border-[rgba(255,255,255,0.05)]">
          <div className="container-max">
            <nav className="flex items-stretch overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {menuLinks.map(link => (
                <div key={link.label} className="relative"
                  onMouseEnter={() => link.sub && setHoveredMenu(link.label)}
                  onMouseLeave={() => setHoveredMenu(null)}>
                  <Link href={link.href}
                    className={`flex items-center gap-1 px-4 py-2.5 text-[11px] font-bold tracking-wider whitespace-nowrap transition-all text-[rgba(245,245,245,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]`}>
                    {link.label}
                    {link.sub && <ChevronDown size={11} className={`transition-transform ${hoveredMenu === link.label ? 'rotate-180' : ''}`} />}
                  </Link>
                  {link.sub && hoveredMenu === link.label && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 w-48 bg-[#111] border border-[rgba(255,107,0,0.15)] rounded-b-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                      {link.sub.map(s => (
                        <Link key={s} href={`/products?category=${s.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2.5 text-[13px] text-[rgba(245,245,245,0.65)] hover:text-white hover:bg-[rgba(255,107,0,0.1)] transition-all border-b border-[rgba(255,255,255,0.04)] last:border-0">
                          {s}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] pt-[104px] px-5 overflow-y-auto">
            <nav className="py-4 flex flex-col gap-1">
              {menuLinks.map(link => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 text-sm font-bold tracking-wide rounded-xl transition-all text-[rgba(245,245,245,0.7)] hover:text-white hover:bg-white/5`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
