'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, ArrowLeft, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  total: number;
  shipping?: number;
  discount?: number;
  status: string;
  createdAt: string;
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const PM_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  upi: 'UPI',
  card: 'Credit / Debit Card',
  netbanking: 'Net Banking',
};

/** Map a server row (flat snake_case) or legacy object into the Order shape. */
function normalizeOrder(o: Record<string, unknown>): Order {
  if (o.shippingAddress) {
    return {
      ...(o as unknown as Order),
      items: Array.isArray(o.items) ? (o.items as OrderItem[]) : [],
    };
  }
  let items: OrderItem[] = [];
  if (Array.isArray(o.items)) items = o.items as OrderItem[];
  else if (typeof o.items === 'string') { try { items = JSON.parse(o.items) || []; } catch { items = []; } }
  return {
    id: String(o.id ?? ''),
    items,
    shippingAddress: {
      name: (o.customer_name ?? o.name ?? '') as string,
      phone: (o.customer_phone ?? o.phone ?? '') as string,
      email: (o.customer_email ?? o.email ?? '') as string,
      address: (o.address ?? '') as string,
      area: (o.area ?? '') as string,
      city: (o.city ?? '') as string,
      state: (o.state ?? '') as string,
      pincode: (o.pincode ?? '') as string,
    },
    paymentMethod: (o.payment_method ?? o.paymentMethod ?? '') as string,
    total: Number(o.total ?? 0),
    shipping: o.shipping != null ? Number(o.shipping) : 0,
    discount: o.discount != null ? Number(o.discount) : 0,
    status: (o.status ?? '') as string,
    createdAt: (o.created_at ?? o.createdAt ?? '') as string,
  };
}

export default function InvoiceClient() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId || orderId === '_') { setNotFound(true); return; }

    const load = async () => {
      // 1. Try localStorage legacy first (fast, offline-capable)
      try {
        const orders: Order[] = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        const found = orders.find(o => o.id === orderId);
        if (found) { setOrder(normalizeOrder(found as unknown as Record<string, unknown>)); return; }
      } catch { /* ignore */ }

      // 2. Fetch from server API
      try {
        const res = await fetch(`/api/get-orders?ids=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data: Record<string, unknown>[] = await res.json();
          if (Array.isArray(data) && data.length > 0) { setOrder(normalizeOrder(data[0])); return; }
        }
      } catch { /* ignore */ }

      setNotFound(true);
    };

    load();
  }, [orderId]);

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <Package size={48} className="text-[rgba(255,255,255,0.2)] mb-4" />
        <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-2">Invoice Not Found</h2>
        <p className="text-[rgba(245,245,245,0.45)] text-sm mb-6">This invoice doesn&apos;t exist or was placed on a different device.</p>
        <Link href="/orders" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white font-bold rounded-xl text-sm hover:bg-[#E55A00] transition-all">
          <ArrowLeft size={15} /> My Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal = order.total - (order.shipping ?? 0) + (order.discount ?? 0);
  const dateObj = order.createdAt ? new Date(order.createdAt) : null;
  const date = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="print:hidden bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-4 sticky top-0 z-20">
        <div className="container-max flex items-center justify-between gap-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[rgba(245,245,245,0.5)] hover:text-white transition-colors">
            <ArrowLeft size={15} /> My Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl text-sm transition-all"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="min-h-screen bg-[#050505] py-10 px-4 print:bg-white print:py-0">
        <div className="max-w-[700px] mx-auto bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none print:bg-white">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a0a00] to-[#0d0d0d] px-9 py-8 border-b-2 border-[#FF6B00] print:from-white print:to-white print:border-orange-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Muscle Mantra" width={52} height={52} className="rounded-xl" />
                <div>
                  <div className="font-[var(--font-montserrat)] font-black text-xl text-[#FF6B00] tracking-tight">MUSCLE MANTRA</div>
                  <div className="text-[10px] text-[rgba(245,245,245,0.35)] tracking-[2px] uppercase print:text-gray-400">Fuel Your Strength</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-[rgba(245,245,245,0.35)] print:text-gray-400">Invoice</div>
                <div className="font-[var(--font-montserrat)] font-black text-2xl text-white print:text-black mt-1">#{order.id}</div>
                <div className="text-xs text-[rgba(245,245,245,0.45)] mt-1 print:text-gray-500">{date}</div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="px-9 py-7 grid grid-cols-2 gap-6 border-b border-[rgba(255,255,255,0.06)] print:border-gray-200">
            <div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#FF6B00] mb-2">Bill To</div>
              <div className="font-bold text-white text-base print:text-black">{order.shippingAddress.name}</div>
              <div className="text-sm text-[rgba(245,245,245,0.5)] mt-1 print:text-gray-500">{order.shippingAddress.phone}</div>
              {order.shippingAddress.email && (
                <div className="text-sm text-[rgba(245,245,245,0.5)] print:text-gray-500">{order.shippingAddress.email}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#FF6B00] mb-2">Ship To</div>
              <div className="text-sm text-[rgba(245,245,245,0.6)] leading-relaxed print:text-gray-600">
                {order.shippingAddress.address},<br />
                {order.shippingAddress.area}, {order.shippingAddress.city},<br />
                {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-9 py-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] print:bg-gray-100">
                  <th className="py-2.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-left print:text-gray-500">Item</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-center print:text-gray-500">Qty</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-right print:text-gray-500">Unit</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-right print:text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] print:border-gray-100">
                    <td className="py-3 px-3 text-[rgba(245,245,245,0.85)] print:text-gray-800">{item.name}</td>
                    <td className="py-3 px-3 text-[rgba(245,245,245,0.5)] text-center print:text-gray-500">{item.quantity}</td>
                    <td className="py-3 px-3 text-[rgba(245,245,245,0.5)] text-right print:text-gray-500">{formatINR(item.price)}</td>
                    <td className="py-3 px-3 font-semibold text-white text-right print:text-black">{formatINR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-5 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                {(order.shipping ?? 0) > 0 ? (
                  <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                    <span>Shipping</span><span>{formatINR(order.shipping ?? 0)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Shipping</span><span>Free</span>
                  </div>
                )}
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount (5%)</span><span>−{formatINR(order.discount ?? 0)}</span>
                  </div>
                )}
                <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 flex justify-between items-center print:border-gray-200">
                  <span className="font-[var(--font-montserrat)] font-black text-base text-white print:text-black">Total</span>
                  <span className="font-[var(--font-montserrat)] font-black text-xl text-[#FF6B00]">{formatINR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-[#1a1a1a] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 print:bg-gray-50 print:border-gray-200">
              <span className="text-[11px] text-[rgba(245,245,245,0.4)] uppercase tracking-wider print:text-gray-400">Payment</span>
              <span className="text-sm font-bold text-white print:text-black">{PM_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
              <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.status.toLowerCase().includes('confirm') || order.status.toLowerCase().includes('paid')
                  ? 'bg-[rgba(34,197,94,0.12)] text-green-400 border border-[rgba(34,197,94,0.2)]'
                  : 'bg-[rgba(255,107,0,0.1)] text-[#FF6B00] border border-[rgba(255,107,0,0.2)]'
              }`}>{order.status}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#0a0a0a] px-9 py-6 border-t border-[rgba(255,255,255,0.06)] text-center print:bg-gray-50 print:border-gray-200">
            <p className="text-xs text-[rgba(245,245,245,0.3)] print:text-gray-400">Thank you for shopping with Muscle Mantra!</p>
            <p className="text-[11px] text-[rgba(245,245,245,0.25)] mt-1 print:text-gray-400">
              +91 84096 12737 &nbsp;•&nbsp; admin@musclemantra.shop &nbsp;•&nbsp; musclemantra.shop
            </p>
            <p className="text-[10px] text-[rgba(245,245,245,0.15)] mt-3 print:text-gray-300">
              Muscle Mantra • Patna, Bihar, India
            </p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          nav, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
