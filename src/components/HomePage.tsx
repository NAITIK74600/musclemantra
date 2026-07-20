'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Shield, Tag, HeadphonesIcon, RotateCcw, Truck,
  Flame, Award, CheckCircle2, ArrowRight, MapPin, Star, Dumbbell,
} from 'lucide-react';
import {
  getBrands, getPromos, getProducts, getCategories, onStoreChange,
  defaultBrands, defaultPromos, defaultAdminProducts, defaultCategories,
  type Brand, type Promo, type AdminProduct, type AdminCategory,
} from '@/lib/store';
import ProductCard from './ProductCard';
import { useToast } from './ToastProvider';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SHARED DESIGN PRIMITIVES
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/** Consistent reveal-on-scroll wrapper.
 *  SEO-safe: server-rendered as plain visible <div>. Animation only runs
 *  after client mount to keep initial HTML free of opacity:0 styles that
 *  would look like hidden content to Google's crawler. */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: 'opacity, transform' }}
      className={className}>
      {children}
    </motion.div>
  );
}

/** Client-only motion wrapper — same SSR-safe pattern as Reveal but with configurable props.
 *  Renders plain wrapper (or the given fallback element) during SSR + first paint,
 *  then upgrades to framer-motion after hydration. Used for hero elements so Google
 *  bot sees fully visible text on first fetch. */
function ClientMotion({
  as = 'div', className, style, children, initial, animate, transition,
}: {
  as?: 'div' | 'h1' | 'p';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  transition?: Record<string, number | string>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag className={className} style={style}>{children}</Tag>;
  }
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag className={className} style={style} initial={initial} animate={animate} transition={transition}>
      {children}
    </MotionTag>
  );
}

/** Unified section heading â€” eyebrow + title + optional link, for visual rhythm */
function SectionHeader({
  eyebrow, title, accent, href, linkLabel = 'View all',
}: { eyebrow?: string; title: string; accent?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-px bg-[#FF6B00]" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF6B00]">{eyebrow}</span>
          </div>
        )}
        <h2 className="font-[var(--font-montserrat)] font-black text-2xl md:text-3xl text-white tracking-tight">
          {title} {accent && <span className="text-[#FF6B00]">{accent}</span>}
        </h2>
      </div>
      {href && (
        <Link href={href}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(245,245,245,0.6)] hover:text-[#FF6B00] transition-colors group shrink-0">
          {linkLabel}
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────── */
const HERO_IMAGES = ['/hero-1.jpg', '/hero-2.jpg'];

function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 'min(88vh, 640px)' }}>
      {/* Sliding background images */}
      {HERO_IMAGES.map((src, i) => (
        <div key={src} className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === activeIdx ? 1 : 0, backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      ))}

      {/* Legibility gradient â€” strong on the left, image clear on the right */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.8) 40%, rgba(5,5,5,0.28) 66%, transparent 82%)' }} />
      {/* Mobile bottom-heavy vignette so text sits over darker area */}
      <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.4) 40%, rgba(5,5,5,0.85) 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050505] to-transparent" />

      {/* Slide dots */}
      <div className="absolute bottom-6 right-5 sm:bottom-8 sm:right-8 z-20 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} aria-label={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === activeIdx ? 'bg-[#FF6B00] w-6' : 'w-2 bg-white/30 hover:bg-white/60'}`} />
        ))}
      </div>

      <div className="container-max relative z-10 py-10 sm:py-14 md:py-20">
        <div className="min-h-[54vh] flex items-center">
          <div className="w-full lg:max-w-[54%]">

            {/* Eyebrow trust line */}
            <ClientMotion initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-5 sm:mb-6 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
              <CheckCircle2 size={13} className="text-[#FF6B00]" />
              <span className="text-[10.5px] sm:text-[11px] font-semibold text-white/90 tracking-wide">100% Authentic · Patna&apos;s Supplement Store</span>
            </ClientMotion>

            {/* Headline — H1 explicitly starts with "Muscle Mantra" (both cases) to match OAuth app name */}
            <ClientMotion as="h1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
              className="font-[var(--font-montserrat)] font-black uppercase leading-[0.95] tracking-tight mb-4 sm:mb-5 text-white">
              <span className="block text-[#FF6B00] text-[15px] sm:text-[16px] font-black tracking-[0.28em] mb-2 sm:mb-3">
                Muscle Mantra
              </span>
              <span className="block" style={{ fontSize: 'clamp(2.25rem, 5.4vw + 0.5rem, 5rem)' }}>
                Fuel Your<br />
                <span className="text-gradient">Strength</span>
              </span>
            </ClientMotion>

            {/* Subcopy — clearly explains the app's purpose for OAuth verification */}
            <ClientMotion as="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="text-white/70 text-[14.5px] sm:text-base md:text-lg mb-6 sm:mb-7 leading-relaxed max-w-lg">
              <strong className="text-white/90 font-semibold">Muscle Mantra</strong> is an online supplement e-commerce store based in India. Shop 100% authentic whey protein, creatine, pre-workout, mass gainer &amp; BCAA — sourced directly from official brands, with unbeatable prices and fast doorstep delivery across India.
            </ClientMotion>

            {/* CTAs */}
            <ClientMotion initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <Link href="/products"
                className="group inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl text-[12.5px] sm:text-sm tracking-wide uppercase transition-all hover:shadow-[0_8px_30px_rgba(255,107,0,0.4)]">
                Shop Now
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/stack-builder"
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-white/5 backdrop-blur-md border border-white/15 text-white font-bold rounded-xl text-[12.5px] sm:text-sm tracking-wide uppercase hover:bg-white/10 transition-all">
                Build Your Stack
              </Link>
              <Link href="/trainers"
                className="group inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-white/5 backdrop-blur-md border border-[#FF6B00]/40 text-white font-bold rounded-xl text-[12.5px] sm:text-sm tracking-wide uppercase hover:bg-[#FF6B00]/10 hover:border-[#FF6B00] transition-all">
                <Dumbbell size={16} className="text-[#FF6B00]" />
                Book a Trainer
              </Link>
            </ClientMotion>

            {/* Inline trust chips */}
            <ClientMotion initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="flex flex-wrap items-center gap-x-5 sm:gap-x-6 gap-y-2 text-[12.5px] sm:text-[13px] text-white/70">
              <span className="flex items-center gap-1.5"><Truck size={15} className="text-[#FF6B00]" /> 30-min delivery</span>
              <span className="flex items-center gap-1.5"><Shield size={15} className="text-[#FF6B00]" /> 100% genuine</span>
              <span className="flex items-center gap-1.5"><Award size={15} className="text-[#FF6B00]" /> Top brands</span>
            </ClientMotion>
          </div>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TRUST STRIP  (social proof â€” placed directly under hero)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TrustStrip() {
  const items = [
    { icon: Shield, title: '100% Authentic', sub: 'Sourced directly from brands' },
    { icon: Truck, title: '30-Min Delivery', sub: 'Across all of Patna' },
    { icon: Tag, title: 'Best Prices', sub: 'Lowest price guarantee' },
    { icon: RotateCcw, title: 'Easy Returns', sub: '7-day hassle-free returns' },
    { icon: HeadphonesIcon, title: 'Expert Support', sub: '24Ã—7 nutrition guidance' },
  ];
  return (
    <section className="bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)]">
      <div className="container-max py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-5">
          {items.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.18)] flex items-center justify-center shrink-0">
                <t.icon size={18} className="text-[#FF6B00]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white leading-tight">{t.title}</p>
                <p className="text-[11px] text-[rgba(245,245,245,0.45)] leading-tight mt-0.5 truncate">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CATEGORIES
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const catImages = [
  'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&q=75',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=75',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=75',
  'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=300&q=75',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=300&q=75',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=75',
  'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=300&q=75',
  'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=75',
];

function CategoriesSection() {
  // Read from the shared store so admin edits (add / hide / upload tile image)
  // flow through automatically. Fallback to a hardcoded Unsplash tile only when
  // the admin has not uploaded an image for a category yet.
  const [cats, setCats] = useState<AdminCategory[]>(defaultCategories);
  const [prods, setProds] = useState<AdminProduct[]>(defaultAdminProducts);
  useEffect(() => {
    const load = () => { setCats(getCategories()); setProds(getProducts()); };
    load();
    return onStoreChange(load);
  }, []);

  const visible = cats.filter(c => c.active !== false);
  const countFor = (id: string) => prods.filter(p => p.active !== false && p.category === id).length;

  if (visible.length === 0) return null;

  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#0a0a0a]">
      <div className="container-max">
        <Reveal>
          <SectionHeader eyebrow="Browse" title="Shop by" accent="Category" href="/products" />
        </Reveal>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {visible.map((cat, i) => {
            const src = cat.image || catImages[i % catImages.length];
            // Uploaded data-URLs must skip Next/Image optimization.
            const isDataUrl = src.startsWith('data:');
            return (
              <Reveal key={cat.id} delay={i * 0.04}>
                <Link href={`/products?category=${cat.id}`}
                  className="group block rounded-xl sm:rounded-2xl bg-[#111] border border-white/6 hover:border-[rgba(255,107,0,0.4)] overflow-hidden transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-[#1a1a1a] flex items-center justify-center"
                    style={{ background: cat.image ? undefined : `${cat.color}15` }}>
                    <Image src={src} alt={cat.label} fill unoptimized={isDataUrl}
                      className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 33vw, (max-width:1024px) 25vw, 160px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {!cat.image && (
                      <span aria-hidden className="absolute text-2xl sm:text-3xl opacity-30" style={{ color: cat.color }}>{cat.icon}</span>
                    )}
                  </div>
                  <div className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center">
                    <p className="text-[11.5px] sm:text-[12px] font-bold text-white leading-tight group-hover:text-[#FF6B00] transition-colors line-clamp-1">{cat.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{countFor(cat.id)} item{countFor(cat.id) === 1 ? '' : 's'}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FLASH DEALS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useCountdown(targetSecs: number) {
  const [secs, setSecs] = useState(targetSecs);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s <= 0 ? targetSecs : s - 1)), 1000);
    return () => clearInterval(t);
  }, [targetSecs]);
  return {
    h: Math.floor(secs / 3600).toString().padStart(2, '0'),
    m: Math.floor((secs % 3600) / 60).toString().padStart(2, '0'),
    s: (secs % 60).toString().padStart(2, '0'),
  };
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#1a1a1a] border border-[rgba(255,107,0,0.2)] flex items-center justify-center">
        <span className="font-[var(--font-montserrat)] font-black text-[#FF6B00] text-[15px] sm:text-lg tabular-nums">{value}</span>
      </div>
      <span className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function FlashDealsSection() {
  const { h, m, s } = useCountdown(9930);
  // Consume admin-managed products so edits to the catalogue reflect here.
  const [prods, setProds] = useState<AdminProduct[]>(defaultAdminProducts);
  useEffect(() => {
    const load = () => setProds(getProducts());
    load();
    return onStoreChange(load);
  }, []);
  const visible = prods.filter(p => p.active !== false).slice(0, 6);
  if (visible.length === 0) return null;
  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#050505]">
      <div className="container-max">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-[#FF6B00]" />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF6B00]">Limited time</span>
              </div>
              <h2 className="font-[var(--font-montserrat)] font-black text-2xl md:text-3xl text-white tracking-tight">
                Flash <span className="text-[#FF6B00]">Deals</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] sm:text-[12px] text-white/50 hidden sm:block">Ends in</span>
              <div className="flex items-end gap-1.5 sm:gap-2">
                <TimeBlock value={h} label="Hrs" />
                <span className="text-[#FF6B00] font-black text-base sm:text-lg pb-4 sm:pb-5">:</span>
                <TimeBlock value={m} label="Min" />
                <span className="text-[#FF6B00] font-black text-base sm:text-lg pb-4 sm:pb-5">:</span>
                <TimeBlock value={s} label="Sec" />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="product-grid">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BESTSELLERS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BestsellersSection() {
  const [prods, setProds] = useState<AdminProduct[]>(defaultAdminProducts);
  useEffect(() => {
    const load = () => setProds(getProducts());
    load();
    return onStoreChange(load);
  }, []);
  const visible = prods.filter(p => p.active !== false);
  if (visible.length === 0) return null;
  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#0a0a0a]">
      <div className="container-max">
        <Reveal>
          <SectionHeader eyebrow="Most loved" title="Best" accent="Sellers" href="/products" />
        </Reveal>
        <div className="product-grid">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TOP BRANDS  (clean, professional carousel)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TopBrandsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [brandData, setBrandData] = useState<Brand[]>(defaultBrands);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const ITEM_W = 132;

  // Load admin-managed brands from the shared store + live updates.
  useEffect(() => {
    setBrandData(getBrands());
    return onStoreChange(() => setBrandData(getBrands()));
  }, []);

  const brands = [...brandData, ...brandData];

  const scrollTo = (idx: number) => trackRef.current?.scrollTo({ left: idx * ITEM_W, behavior: 'smooth' });

  useEffect(() => {
    if (isPaused || brandData.length === 0) { if (autoTimer.current) clearInterval(autoTimer.current); return; }
    autoTimer.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % brandData.length;
        if (trackRef.current) {
          if (trackRef.current.scrollLeft >= brandData.length * ITEM_W) trackRef.current.scrollLeft = 0;
          trackRef.current.scrollTo({ left: next * ITEM_W, behavior: 'smooth' });
        }
        return next;
      });
    }, 2200);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [isPaused, brandData.length]);

  const handleScroll = () => {
    if (!trackRef.current || brandData.length === 0) return;
    setActiveIdx(Math.round(trackRef.current.scrollLeft / ITEM_W) % brandData.length);
  };

  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#050505] border-y border-[rgba(255,255,255,0.06)]">
      <div className="container-max">
        <Reveal>
          <SectionHeader eyebrow="Trusted partners" title="Top" accent="Brands" href="/products" />
        </Reveal>

        <div ref={trackRef} onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}
          className="no-scrollbar fade-edges-x flex gap-3 sm:gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing -mx-4 sm:mx-0 px-4 sm:px-0"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
          {brands.map((b, i) => {
            const realIdx = i % brandData.length;
            const isActive = realIdx === activeIdx && i < brandData.length + 1;
            return (
              <Link key={`${b.id}-${i}`} href={`/products?brand=${encodeURIComponent(b.name)}`}
                onClick={() => { setActiveIdx(realIdx); scrollTo(realIdx); }}
                draggable={false} style={{ scrollSnapAlign: 'start' }}
                className="shrink-0 w-[92px] sm:w-[116px] flex flex-col items-center gap-2.5 sm:gap-3 group select-none">
                <div className={`w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden flex items-center justify-center font-[var(--font-montserrat)] font-black text-base sm:text-lg border transition-all duration-300
                  ${isActive
                    ? 'bg-[rgba(255,107,0,0.12)] border-[#FF6B00] text-[#FF6B00] shadow-[0_0_24px_rgba(255,107,0,0.25)] scale-105'
                    : 'bg-[#141414] border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.55)] group-hover:border-[rgba(255,107,0,0.4)] group-hover:text-white'}`}>
                  {b.logo
                    ? <Image src={b.logo} alt={b.name} width={88} height={88} className="w-full h-full object-cover" unoptimized />
                    : b.short}
                </div>
                <span className={`text-[11.5px] sm:text-[12px] font-semibold text-center leading-tight line-clamp-1 transition-colors ${isActive ? 'text-white' : 'text-[rgba(245,245,245,0.45)] group-hover:text-white'}`}>
                  {b.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {brandData.map((_, i) => (
            <motion.button key={i} onClick={() => { setActiveIdx(i); scrollTo(i); }}
              aria-label={`Go to brand ${i + 1}`}
              animate={{ width: i === activeIdx ? 22 : 6, background: i === activeIdx ? '#FF6B00' : 'rgba(255,255,255,0.15)' }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full cursor-pointer" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   WHY CHOOSE US  (value proposition + stats)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WhyChooseUs() {
  const points = [
    { icon: Shield, title: 'Lab-Verified Authenticity', desc: 'Every product is sourced directly from authorised distributors and scan-verified for genuineness.' },
    { icon: Truck, title: 'Lightning-Fast Delivery', desc: 'Get your supplements delivered across Patna in as little as 30 minutes â€” no long waits.' },
    { icon: Award, title: 'Expert-Curated Range', desc: 'Hand-picked products and stacks recommended by certified nutritionists and trainers.' },
  ];
  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#0a0a0a]">
      <div className="container-max">
        <Reveal>
          <SectionHeader eyebrow="Why Muscle Mantra" title="Built on" accent="Trust" />
        </Reveal>

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((pt, i) => (
            <Reveal key={pt.title} delay={i * 0.08}>
              <div className="h-full p-5 sm:p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,107,0,0.3)] transition-all duration-300">
                <div className="icon-chip icon-chip-md mb-3 sm:mb-4">
                  <pt.icon size={20} className="text-[#FF6B00]" />
                </div>
                <h3 className="font-[var(--font-montserrat)] font-bold text-white text-[16px] sm:text-lg mb-1.5 sm:mb-2">{pt.title}</h3>
                <p className="text-[13.5px] sm:text-[14px] text-white/55 leading-relaxed">{pt.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NEWSLETTER CTA BAND
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function NewsletterBand() {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      push({ title: 'Please enter a valid email', variant: 'error' });
      return;
    }
    setBusy(true);
    // Simulate signup â€” front-end demo only.
    setTimeout(() => {
      setBusy(false);
      setEmail('');
      push({
        title: '🎉 You\u2019re in!',
        description: 'Check your inbox for a \u20b9200 off code.',
        variant: 'success',
      });
    }, 500);
  };

  return (
    <section className="py-10 md:py-16 bg-[#050505]">
      <div className="container-max">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,107,0,0.2)] bg-gradient-to-br from-[#160a02] via-[#0d0d0d] to-[#0d0d0d] px-5 py-7 sm:px-8 sm:py-8 md:px-10 md:py-9">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[rgba(255,107,0,0.1)] rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={13} className="text-[#FF6B00]" />
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#FF6B00]">Now serving Patna</span>
              </div>
              <h2 className="font-[var(--font-montserrat)] font-black text-[20px] sm:text-xl md:text-2xl text-white tracking-tight mb-1.5 leading-tight">
                Get ₹200 off your first order
              </h2>
              <p className="text-[rgba(245,245,245,0.55)] text-sm">
                Subscribe for exclusive deals, new arrivals and nutrition tips.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto md:min-w-[380px]" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                maxLength={120}
                className="flex-1 bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.35)] outline-none focus:border-[rgba(255,107,0,0.5)] transition-colors"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all whitespace-nowrap"
              >
                {busy ? 'Submittingâ€¦' : 'Claim Offer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PROMO BANNERS  (admin-managed photo / video)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PromoBanner() {
  const [promos, setPromos] = useState<Promo[]>(defaultPromos);

  useEffect(() => {
    setPromos(getPromos());
    return onStoreChange(() => setPromos(getPromos()));
  }, []);

  const active = promos.filter(p => p.active);
  if (active.length === 0) return null;

  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[#0a0a0a]">
      <div className="container-max">
        <Reveal>
          <SectionHeader eyebrow="Featured" title="Hot" accent="Offers" href="/offers" />
        </Reveal>

        <div className={`grid gap-4 ${active.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          {active.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link href={p.link || '/products'}
                className="group relative block rounded-2xl overflow-hidden aspect-[16/7] border border-[rgba(255,255,255,0.06)]">
                {p.type === 'photo' ? (
                  <Image src={p.url} alt={p.title} fill unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <video src={p.url} autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 md:p-6">
                  <h3 className="font-[var(--font-montserrat)] font-black text-xl md:text-2xl text-white drop-shadow">{p.title}</h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6B00] group-hover:gap-2.5 transition-all">
                    Shop Now <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TESTIMONIALS  (removed â€” no fabricated customer quotes)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <CategoriesSection />
      <FlashDealsSection />
      <BestsellersSection />
      <PromoBanner />
      <TopBrandsSection />
      <WhyChooseUs />
      <NewsletterBand />
    </>
  );
}
