'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Flame, Tag, Zap, ArrowRight, Percent, Clock } from 'lucide-react';
import { getProducts, onStoreChange, type AdminProduct } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

export default function OffersClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    setProducts(getProducts());
    return onStoreChange(() => setProducts(getProducts()));
  }, []);

  // Only live products with a real discount qualify as an "offer".
  const deals = useMemo(
    () =>
      products
        .filter(p => p.active !== false && (p.discount ?? 0) > 0)
        .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)),
    [products],
  );

  const topDeal = deals[0];
  const maxDiscount = topDeal?.discount ?? 0;
  const totalSaving = useMemo(
    () => deals.reduce((sum, p) => sum + Math.max(0, (p.originalPrice ?? p.price) - p.price), 0),
    [deals],
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/20 via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl" />
        <div className="container-max relative py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold uppercase tracking-wider mb-5">
              <Flame size={14} /> Offers &amp; Deals
            </span>
            <h1 className="font-[var(--font-montserrat)] font-black text-4xl sm:text-6xl text-white leading-[1.05] max-w-3xl">
              Grab the Hottest <span className="text-gradient">Supplement Deals</span>
            </h1>
            <p className="text-[rgba(245,245,245,0.55)] text-base sm:text-lg mt-5 max-w-xl">
              Genuine products, unbeatable prices. Save big on your favourite whey, creatine,
              pre-workout &amp; more — all offers live right now.
            </p>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="flex items-center gap-2.5 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                  <Percent size={18} />
                </span>
                <div>
                  <p className="text-white font-bold text-lg leading-none">Up to {maxDiscount}%</p>
                  <p className="text-[rgba(245,245,245,0.45)] text-xs mt-1">Max discount</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                  <Tag size={18} />
                </span>
                <div>
                  <p className="text-white font-bold text-lg leading-none">{deals.length} deals</p>
                  <p className="text-[rgba(245,245,245,0.45)] text-xs mt-1">Live right now</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                  <Zap size={18} />
                </span>
                <div>
                  <p className="text-white font-bold text-lg leading-none">₹{totalSaving.toLocaleString('en-IN')}+</p>
                  <p className="text-[rgba(245,245,245,0.45)] text-xs mt-1">Total savings on offer</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Deal of the day */}
      {topDeal && (
        <section className="container-max py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-[#FF6B00]/25 bg-gradient-to-r from-[#140b04] to-[#0a0a0a]"
          >
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="relative h-64 md:h-full min-h-[280px]">
                <Image
                  src={topDeal.image}
                  alt={topDeal.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
                  <Flame size={13} /> {topDeal.discount}% OFF
                </span>
              </div>
              <div className="p-7 md:p-10">
                <span className="inline-flex items-center gap-2 text-[#FF6B00] text-xs font-bold uppercase tracking-wider mb-3">
                  <Clock size={14} /> Deal of the Day
                </span>
                <p className="text-[rgba(245,245,245,0.5)] text-sm mb-1">{topDeal.brand}</p>
                <h2 className="font-[var(--font-montserrat)] font-black text-2xl sm:text-3xl text-white mb-4">
                  {topDeal.name}
                </h2>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-black text-white">₹{topDeal.price.toLocaleString('en-IN')}</span>
                  {topDeal.originalPrice > topDeal.price && (
                    <span className="text-lg text-[rgba(245,245,245,0.4)] line-through mb-1">
                      ₹{topDeal.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-emerald-400 text-sm font-bold mb-1.5">
                    Save ₹{(topDeal.originalPrice - topDeal.price).toLocaleString('en-IN')}
                  </span>
                </div>
                <Link
                  href={`/products/${topDeal.id}`}
                  className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#ff7d1f] text-white font-bold px-6 py-3.5 rounded-xl transition-all"
                >
                  Grab This Deal <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* All deals grid */}
      <section className="container-max pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[var(--font-montserrat)] font-black text-2xl sm:text-3xl text-white">
            All <span className="text-gradient">Offers</span>
          </h2>
          <Link
            href="/products"
            className="text-sm text-[rgba(245,245,245,0.6)] hover:text-[#FF6B00] transition-colors inline-flex items-center gap-1"
          >
            View all products <ArrowRight size={15} />
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl">
            <Tag size={40} className="mx-auto text-[rgba(245,245,245,0.25)] mb-4" />
            <p className="text-[rgba(245,245,245,0.6)]">No active offers right now — check back soon!</p>
            <Link href="/products" className="inline-block mt-4 text-[#FF6B00] font-semibold hover:underline">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {deals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
