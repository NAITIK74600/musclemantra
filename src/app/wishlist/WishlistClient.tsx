'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { getProducts, getWishlist, onStoreChange, type AdminProduct } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

export default function WishlistClient() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      const ids = getWishlist();
      const all = getProducts();
      setItems(all.filter(p => ids.includes(p.id) && p.active !== false));
      setReady(true);
    };
    load();
    return onStoreChange(load);
  }, []);

  return (
    <section className="container-max py-10 sm:py-14 min-h-[70vh]">
      <div className="flex items-center gap-3 mb-2">
        <Heart size={22} className="text-[#FF6B00] fill-[#FF6B00]" />
        <h1 className="font-[var(--font-montserrat)] font-black text-2xl sm:text-3xl text-white">
          Your Wishlist
        </h1>
      </div>
      <p className="text-[rgba(245,245,245,0.5)] text-sm mb-8">
        {ready && items.length > 0
          ? `${items.length} product${items.length > 1 ? 's' : ''} saved for later.`
          : 'Tap the heart icon on any product to save it here.'}
      </p>

      {ready && items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center mb-5">
            <Heart size={28} className="text-[#FF6B00]" />
          </div>
          <h2 className="font-bold text-white text-lg mb-2">Your wishlist is empty</h2>
          <p className="text-[rgba(245,245,245,0.5)] text-sm max-w-sm mb-6">
            Save your favourite supplements and come back to them anytime. They&apos;ll be waiting right here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-colors"
          >
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </section>
  );
}
