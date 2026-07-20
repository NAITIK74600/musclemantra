'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

interface PayOrder {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  name: string;
  email: string;
  phone: string;
}

function normalize(o: Record<string, unknown>): PayOrder {
  const shipping = (o.shippingAddress ?? {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    total: Number(o.total ?? 0),
    status: String(o.status ?? ''),
    paymentMethod: String(o.payment_method ?? o.paymentMethod ?? ''),
    name: String(o.customer_name ?? o.name ?? shipping.name ?? 'Customer'),
    email: String(o.customer_email ?? o.email ?? shipping.email ?? ''),
    phone: String(o.customer_phone ?? o.phone ?? shipping.phone ?? ''),
  };
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function PayClient() {
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [autoTried, setAutoTried] = useState(false);

  useEffect(() => {
    const m = window.location.search.match(/[?&]order=([^&]+)/);
    const orderId = m ? decodeURIComponent(m[1]) : '';
    if (!orderId) { setNotFound(true); return; }

    (async () => {
      try {
        const res = await fetch(`/api/get-orders?ids=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data: Record<string, unknown>[] = await res.json();
          if (Array.isArray(data) && data.length > 0) { setOrder(normalize(data[0])); return; }
        }
      } catch { /* ignore */ }

      // Fallback: same-device localStorage (e.g. testing on the same phone that placed the order)
      try {
        const orders: Record<string, unknown>[] = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        const found = orders.find(o => o.id === orderId);
        if (found) { setOrder(normalize(found)); return; }
      } catch { /* ignore */ }

      setNotFound(true);
    })();
  }, []);

  // Auto-redirect straight into PayU's secure checkout as soon as the order
  // loads — scanning the QR should feel like it goes "directly" to PayU with
  // no extra tap. We can't put PayU's real checkout URL *in* the QR itself
  // (PayU requires a fresh, server-signed hash per transaction for security,
  // which a static QR code can't carry), so this page is the unavoidable
  // one-hop bridge — auto-triggering the redirect closes that gap as much as
  // possible. The manual button below still works as a fallback/retry.
  useEffect(() => {
    if (order && order.status !== 'Payment Received' && !autoTried) {
      payNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const payNow = async () => {
    if (!order || paying) return;
    setPaying(true);
    setError('');
    setAutoTried(true);
    try {
      const res = await fetch('/api/payu-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid: order.id,
          productinfo: `Order #${order.id}`,
          firstname: order.name || 'Customer',
          email: order.email,
          udf1: order.phone,
        }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok || !data.hash) {
        setError(data.error ?? 'Payment gateway error. Please try again in a moment.');
        setPaying(false);
        return;
      }

      const siteUrl = window.location.origin;
      const params: Record<string, string> = {
        key: data.key,
        txnid: order.id,
        amount: String(data.amount),
        productinfo: data.productinfo ?? `Order #${order.id}`,
        firstname: data.firstname ?? order.name,
        email: data.email ?? order.email,
        phone: order.phone,
        surl: `${siteUrl}/api/payu-return`,
        furl: `${siteUrl}/api/payu-return`,
        hash: data.hash,
        udf1: data.udf1 ?? order.phone,
        service_provider: 'payu_paisa',
      };

      const form$ = document.createElement('form');
      form$.method = 'POST';
      form$.action = data.payuUrl;
      Object.entries(params).forEach(([k, v]) => {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = v;
        form$.appendChild(inp);
      });
      document.body.appendChild(form$);
      form$.submit();
    } catch {
      setError('Network error. Check your connection and try again.');
      setPaying(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle size={48} className="text-[rgba(255,255,255,0.2)] mb-4" />
        <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-2">Order Not Found</h2>
        <p className="text-[rgba(245,245,245,0.45)] text-sm mb-6">This payment link is invalid or the order doesn&apos;t exist.</p>
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

  const alreadyPaid = order.status === 'Payment Received';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#050505]">
      <div className="w-full max-w-sm bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 text-center">
        {alreadyPaid ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Already Paid</h1>
            <p className="text-sm text-[rgba(245,245,245,0.5)] mb-6">
              Order <span className="text-white font-semibold">#{order.id}</span> is already paid — no action needed.
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-orange-400" />
            </div>
            <h1 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Complete Your Payment</h1>
            <p className="text-[13px] text-[rgba(245,245,245,0.45)] mb-5">Order #{order.id}</p>

            <div className="text-3xl font-black text-[#FF6B00] mb-6">{formatINR(order.total)}</div>

            {error && (
              <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={payNow}
              disabled={paying}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all"
            >
              {paying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {paying ? 'Redirecting to PayU…' : `Pay ${formatINR(order.total)} via PayU`}
            </button>
            <p className="text-[11px] text-[rgba(245,245,245,0.35)] mt-4">
              Secured by PayU — all major UPI apps, cards &amp; net banking supported.
            </p>
          </>
        )}

        <Link href="/orders" className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">
          <ArrowLeft size={13} /> My Orders
        </Link>
      </div>
    </div>
  );
}
