'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Check, Clock } from 'lucide-react';
import { Product } from '@/lib/data';
import { useCart } from './CartProvider';
import { useToast } from './ToastProvider';

const badgeStyle: Record<string, string> = {
  bestseller: 'bg-emerald-500/90',
  new: 'bg-blue-500/90',
  trending: 'bg-[#FF6B00]/90',
  sale: 'bg-red-500/90',
};

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product: p, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { push } = useToast();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  const handleAdd = () => {
    addItem({ id: p.id, name: p.name, brand: p.brand, price: p.price, originalPrice: p.originalPrice, image: p.image });
    setAdded(true);
    push({
      title: 'Added to cart',
      description: p.name,
      variant: 'success',
    });
    setTimeout(() => setAdded(false), 1400);
  };

  const handleWish = () => {
    setWished(w => {
      const next = !w;
      push({
        title: next ? 'Saved to wishlist' : 'Removed from wishlist',
        description: p.name,
        variant: next ? 'success' : 'info',
        durationMs: 2000,
      });
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: 'opacity, transform' }}
      className="group h-full flex flex-col bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden hover:border-[rgba(255,107,0,0.35)] transition-colors duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-b from-[#1c1c1c] to-[#141414] overflow-hidden">
        <Link href={`/products/${p.id}`} className="absolute inset-0 z-[1]">
          <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw" />
        </Link>
        {p.badge && (
          <span className={`absolute top-2 left-2 z-[2] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide text-white ${badgeStyle[p.badge] || 'bg-[#FF6B00]/90'}`}>
            {p.badge}
          </span>
        )}
        {p.discount > 0 && (
          <span className="absolute top-2 right-2 z-[2] px-2 py-0.5 rounded-md text-[10px] font-black text-white bg-[#FF6B00]">
            -{p.discount}%
          </span>
        )}
        <button onClick={handleWish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute bottom-2 right-2 z-[2] w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75">
          <Heart size={13} className={wished ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-white'} />
        </button>
        <span className="absolute bottom-2 left-2 z-[2] flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <Clock size={9} className="text-[#FF6B00]" />
          <span className="text-[9px] text-white font-medium">{p.deliveryTime}</span>
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-[rgba(245,245,245,0.4)] uppercase tracking-wider mb-1 truncate">{p.brand}</p>
        <Link href={`/products/${p.id}`}>
          <h3 className="text-[13px] font-semibold text-white line-clamp-2 leading-snug min-h-[34px] hover:text-[#FF6B00] transition-colors">{p.name}</h3>
        </Link>
        <div className="mt-1.5 mb-2 flex items-center gap-0.5">
          {[...Array(5)].map((_, j) => (
            <Star key={j} size={11} className={j < Math.floor(p.rating) ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.18)]'} />
          ))}
          <span className="text-[11px] text-[rgba(245,245,245,0.45)] ml-1">{p.rating}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3 mt-auto">
          <span className="text-[17px] font-black text-white">₹{p.price.toLocaleString()}</span>
          {p.originalPrice > p.price && (
            <span className="text-[11px] text-[rgba(245,245,245,0.35)] line-through">₹{p.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <button onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold tracking-wide uppercase transition-colors ${added ? 'bg-emerald-600 text-white' : 'bg-[#FF6B00] hover:bg-[#E55A00] text-white'}`}>
          {added ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Add to Cart</>}
        </button>
      </div>
    </motion.div>
  );
}
