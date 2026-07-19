'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, totalItems, clearCart } = useCart();
  const shipping = totalPrice >= 999 ? 0 : 99;
  const discount = Math.floor(totalPrice * 0.05);
  const finalTotal = totalPrice + shipping - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] pt-[72px] flex flex-col items-center justify-center px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="font-[var(--font-montserrat)] font-black text-3xl text-white mb-3">Your cart is empty</h2>
          <p className="text-[rgba(245,245,245,0.5)] mb-8">Add supplements to your cart and they&apos;ll appear here.</p>
          <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E55A00] transition-all">
            <ShoppingBag size={18} /> Shop Now
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-9 sm:py-12">
        <div className="container-max">
          <h1 className="font-[var(--font-montserrat)] font-black text-3xl text-white">
            Your <span className="text-gradient">Cart</span>
            <span className="ml-3 text-lg text-[rgba(245,245,245,0.4)] font-normal">({totalItems} items)</span>
          </h1>
        </div>
      </div>

      <div className="container-max py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                  className="flex gap-4 p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#1a1a1a] shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold tracking-widest text-[#FF6B00] uppercase mb-0.5">{item.brand}</p>
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1">{item.name}</p>
                    {item.flavor && <p className="text-xs text-[rgba(245,245,245,0.4)] mb-2">{item.flavor}</p>}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-1.5">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="text-[rgba(245,245,245,0.6)] hover:text-white transition-colors"><Minus size={14} /></button>
                        <span className="text-sm font-bold text-white min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="text-[rgba(245,245,245,0.6)] hover:text-white transition-colors"><Plus size={14} /></button>
                      </div>
                      <span className="text-base font-black text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                      {item.originalPrice && <span className="text-sm text-[rgba(245,245,245,0.3)] line-through">₹{(item.originalPrice * item.quantity).toLocaleString()}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="shrink-0 text-[rgba(245,245,245,0.3)] hover:text-white transition-colors p-1">
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Coupon input */}
            <div className="p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)]">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]" />
                  <input placeholder="Enter coupon code" className="w-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.3)] outline-none focus:border-[rgba(255,107,0,0.4)]" />
                </div>
                <button className="px-5 py-3 bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.25)] text-[#FF6B00] font-semibold rounded-xl hover:bg-[#FF6B00] hover:text-white transition-all text-sm">
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-[90px] h-fit">
            <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6">
              <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-5">Order Summary</h2>
              
              {/* Free shipping progress */}
              {shipping > 0 && (
                <div className="mb-5 p-3 bg-[rgba(255,107,0,0.08)] rounded-xl border border-[rgba(255,107,0,0.15)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-[#FF6B00]" />
                    <p className="text-xs font-semibold text-[rgba(245,245,245,0.7)]">
                      Add ₹{(999 - totalPrice).toLocaleString()} more for FREE delivery
                    </p>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6B00] rounded-full transition-all" style={{ width: `${Math.min(100, (totalPrice / 999) * 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-[rgba(245,245,245,0.6)]">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-white">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[rgba(245,245,245,0.6)]">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-400' : 'text-white'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Member Discount (5%)</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between font-black text-white text-lg py-4 border-t border-[rgba(255,255,255,0.08)] mb-5">
                <span>Total</span>
                <span className="text-gradient">₹{finalTotal.toLocaleString()}</span>
              </div>

              <Link href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] text-base mb-3">
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
              <Link href="/products" className="flex items-center justify-center gap-2 w-full py-3 text-sm text-[rgba(245,245,245,0.5)] hover:text-white transition-colors">
                ← Continue Shopping
              </Link>

              {/* Payment icons */}
              <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <p className="text-xs text-center text-[rgba(245,245,245,0.3)] mb-3">Secure Payment via</p>
                <div className="flex justify-center gap-2 flex-wrap text-xs text-[rgba(245,245,245,0.4)]">
                  {['UPI', 'Visa', 'Mastercard', 'PayTM', 'COD'].map(p => (
                    <span key={p} className="px-2.5 py-1 bg-[#1a1a1a] rounded-lg">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
