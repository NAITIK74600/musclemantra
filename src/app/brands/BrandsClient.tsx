'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { getProducts, getBrands, syncBrandsFromServer, onStoreChange, type AdminProduct, type Brand } from '@/lib/store';

type BrandEntry = {
  name: string;
  short: string;
  logo?: string;
  count: number;
  minPrice: number | null;
};

export default function BrandsClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const sync = () => {
      setProducts(getProducts());
      setBrands(getBrands());
    };
    sync();
    void syncBrandsFromServer();
    return onStoreChange(sync);
  }, []);

  // Merge the curated brand directory with brands discovered from live products,
  // and attach product counts / starting prices so cards feel real.
  const entries = useMemo<BrandEntry[]>(() => {
    const live = products.filter(p => p.active !== false);
    const byName = new Map<string, BrandEntry>();

    const short = (name: string) =>
      name
        .split(/\s+/)
        .map(w => w[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();

    // Seed from curated directory
    brands.forEach(b => {
      byName.set(b.name.toLowerCase(), {
        name: b.name,
        short: b.short || short(b.name),
        logo: b.logo,
        count: 0,
        minPrice: null,
      });
    });

    // Overlay live product data
    live.forEach(p => {
      if (!p.brand) return;
      const key = p.brand.toLowerCase();
      const existing = byName.get(key);
      if (existing) {
        existing.count += 1;
        existing.minPrice = existing.minPrice === null ? p.price : Math.min(existing.minPrice, p.price);
      } else {
        byName.set(key, {
          name: p.brand,
          short: short(p.brand),
          count: 1,
          minPrice: p.price,
        });
      }
    });

    return Array.from(byName.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products, brands]);

  const filtered = useMemo(
    () => (query ? entries.filter(e => e.name.toLowerCase().includes(query.toLowerCase())) : entries),
    [entries, query],
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/15 via-transparent to-transparent" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl" />
        <div className="container-max relative py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold uppercase tracking-wider mb-5">
              <Award size={14} /> Brands
            </span>
            <h1 className="font-[var(--font-montserrat)] font-black text-4xl sm:text-6xl text-white leading-[1.05] max-w-3xl">
              Top Brands, <span className="text-gradient">100% Authentic</span>
            </h1>
            <p className="text-[rgba(245,245,245,0.55)] text-base sm:text-lg mt-5 max-w-xl">
              Shop only genuine supplements from the world&apos;s most trusted brands. Every product
              is sourced directly and quality-checked.
            </p>

            <div className="flex items-center gap-2 mt-6 text-[rgba(245,245,245,0.5)] text-sm">
              <ShieldCheck size={16} className="text-emerald-400" />
              Authenticity guaranteed on every order
            </div>

            {/* Search */}
            <div className="relative mt-8 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search brands..."
                className="w-full bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.35)] outline-none focus:border-[rgba(255,107,0,0.4)]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand grid */}
      <section className="container-max py-12">
        <p className="text-[rgba(245,245,245,0.5)] text-sm mb-6">{filtered.length} brands available</p>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl">
            <Award size={40} className="mx-auto text-[rgba(245,245,245,0.25)] mb-4" />
            <p className="text-[rgba(245,245,245,0.6)]">No brands match “{query}”.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
              >
                <Link
                  href={`/products?brand=${encodeURIComponent(b.name)}`}
                  className="group block h-full bg-[#0d0d0d] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 hover:border-[#FF6B00]/40 hover:bg-[#111] transition-all"
                >
                  <div className="flex items-center justify-center h-20 mb-4">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt={b.name} className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="font-[var(--font-montserrat)] font-black text-3xl text-gradient tracking-tight">
                        {b.short}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-center text-sm sm:text-base leading-tight mb-1 group-hover:text-[#FF6B00] transition-colors">
                    {b.name}
                  </h3>
                  <p className="text-[rgba(245,245,245,0.4)] text-xs text-center">
                    {b.count > 0
                      ? `${b.count} product${b.count > 1 ? 's' : ''}${b.minPrice !== null ? ` · from ₹${b.minPrice.toLocaleString('en-IN')}` : ''}`
                      : 'Coming soon'}
                  </p>
                  <span className="mt-4 flex items-center justify-center gap-1 text-[#FF6B00] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop now <ArrowRight size={13} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
