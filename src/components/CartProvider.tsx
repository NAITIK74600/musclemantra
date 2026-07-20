'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { validateCouponServer } from '@/lib/store';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  flavor?: string;
  size?: string;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  maxDiscount: number | null;
  minAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  appliedCoupon: AppliedCoupon | null;
  discount: number;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

/** Compute the coupon discount for a given subtotal (mirrors the server rules). */
function couponDiscount(c: AppliedCoupon | null, subtotal: number): number {
  if (!c || subtotal < c.minAmount) return 0;
  let d = c.discountType === 'flat' ? c.discountValue : (subtotal * c.discountValue) / 100;
  if (c.maxDiscount != null && d > c.maxDiscount) d = c.maxDiscount;
  if (d > subtotal) d = subtotal;
  return Math.round(d);
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => { setItems([]); setAppliedCoupon(null); };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = couponDiscount(appliedCoupon, totalPrice);

  const applyCoupon = async (code: string): Promise<{ ok: boolean; message: string }> => {
    const trimmed = code.trim();
    if (!trimmed) return { ok: false, message: 'Enter a coupon code' };
    const res = await validateCouponServer(trimmed, totalPrice);
    if (!res.ok || !res.code) return { ok: false, message: res.message ?? 'Invalid coupon code' };
    setAppliedCoupon({
      code: res.code,
      discountType: res.discountType ?? 'percent',
      discountValue: res.discountValue ?? 0,
      maxDiscount: res.maxDiscount ?? null,
      minAmount: res.minAmount ?? 0,
    });
    return { ok: true, message: `Coupon ${res.code} applied` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice,
      appliedCoupon, discount, applyCoupon, removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}
