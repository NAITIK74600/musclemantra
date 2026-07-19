'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, FileText, ShoppingBag, ChevronRight,
  Clock, CheckCircle, Truck, XCircle,
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes('delivered')) return <CheckCircle size={14} className="text-green-400" />;
  if (s.includes('shipped') || s.includes('transit')) return <Truck size={14} className="text-blue-400" />;
  if (s.includes('cancelled') || s.includes('failed')) return <XCircle size={14} className="text-red-400" />;
  return <Clock size={14} className="text-[#FF6B00]" />;
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('delivered')) return 'bg-[rgba(34,197,94,0.1)] text-green-400 border-[rgba(34,197,94,0.2)]';
  if (s.includes('shipped') || s.includes('transit')) return 'bg-[rgba(59,130,246,0.1)] text-blue-400 border-[rgba(59,130,246,0.2)]';
  if (s.includes('cancelled') || s.includes('failed')) return 'bg-[rgba(239,68,68,0.1)] text-red-400 border-[rgba(239,68,68,0.2)]';
  return 'bg-[rgba(255,107,0,0.1)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]';
}

const PM_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery', upi: 'UPI',
  card: 'Credit / Debit Card', netbanking: 'Net Banking',
};

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Get order IDs stored on this device
        const ids: string[] = JSON.parse(localStorage.getItem('mb_order_ids') || '[]');
        // Migrate legacy orders (stored as full objects)
        const legacy: Order[] = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        const legacyIds = legacy.map(o => o.id);
        const allIds = [...new Set([...ids, ...legacyIds])];

        if (allIds.length === 0) { setLoaded(true); return; }

        // Fetch from server
        const res = await fetch(`/api/get-orders?ids=${allIds.join(',')}`);
        if (res.ok) {
          const data: Order[] = await res.json();
          setOrders(data);
        } else {
          // Fallback to legacy localStorage orders if API fails
          setOrders(legacy.slice().reverse());
        }
      } catch {
        const legacy: Order[] = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        setOrders(legacy.slice().reverse());
      }
      setLoaded(true);
    };
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.15)] flex items-center justify-center mb-5">
          <Package size={36} className="text-[rgba(255,107,0,0.5)]" />
        </div>
        <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-2">No Orders Yet</h2>
        <p className="text-[rgba(245,245,245,0.45)] text-sm mb-7 max-w-xs">
          Your order history will appear here once you place your first order.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm"
        >
          <ShoppingBag size={16} /> Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-8">
        <div className="container-max">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Account</p>
          <h1 className="font-[var(--font-montserrat)] font-black text-3xl text-white">My Orders</h1>
          <p className="text-sm text-[rgba(245,245,245,0.4)] mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container-max py-8 space-y-4">
        <AnimatePresence>
          {orders.map((order, idx) => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            });
            const preview = order.items.slice(0, 2).map(i => i.name).join(', ')
              + (order.items.length > 2 ? ` +${order.items.length - 2} more` : '');

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden hover:border-[rgba(255,107,0,0.2)] transition-colors"
              >
                {/* Top bar */}
                <div className="bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.05)] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-[rgba(245,245,245,0.4)]">
                    <span>Order <span className="font-bold text-white">#{order.id}</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{date}</span>
                    <span>•</span>
                    <span>{PM_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${statusColor(order.status)}`}>
                    <StatusIcon status={order.status} />
                    {order.status}
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[rgba(245,245,245,0.65)] truncate">{preview}</p>
                    <p className="text-xs text-[rgba(245,245,245,0.35)] mt-1">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
                      {' '}•{' '}{order.shippingAddress.area}, {order.shippingAddress.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-[var(--font-montserrat)] font-black text-xl text-white">{formatINR(order.total)}</div>
                    <div className="text-[11px] text-[rgba(245,245,245,0.3)] mt-0.5">{date}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-3 border-t border-[rgba(255,255,255,0.05)] flex flex-wrap gap-2">
                  <Link
                    href={`/invoice/${order.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.18)] text-[#FF6B00] border border-[rgba(255,107,0,0.2)] rounded-xl transition-all"
                  >
                    <FileText size={13} /> View Invoice
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xl transition-all"
                  >
                    <ShoppingBag size={13} /> Buy Again <ChevronRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
