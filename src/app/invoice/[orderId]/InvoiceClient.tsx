'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, ArrowLeft, Package, Download, Loader2, CheckCircle2 } from 'lucide-react';

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

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}
function threeDigitWords(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigitWords(r) : '');
}
/** Indian-numbering (lakh/crore) amount-in-words, e.g. "One Thousand Two Hundred Twenty One Rupees Only". */
function numberToWordsINR(amount: number): string {
  let num = Math.round(amount);
  if (num <= 0) return 'Zero Rupees Only';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  const parts: string[] = [];
  if (crore) parts.push(threeDigitWords(crore) + ' Crore');
  if (lakh) parts.push(threeDigitWords(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigitWords(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(' ') + ' Rupees Only';
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
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [payQrDataUrl, setPayQrDataUrl] = useState<string | null>(null);

  // Lazy-load the QR code generator from our own bundle (code-split via
  // dynamic import) instead of an external CDN `<script>` tag — CDN scripts
  // can silently fail to load (ad-blockers, regional network/firewall
  // blocking, DNS issues), leaving the QR box blank with no way to recover.
  // Bundling the `qrcode` package keeps it same-origin and reliable while
  // still keeping the initial bundle small (only fetched when needed).
  const loadQRCodeLib = async () => {
    const mod = await import('qrcode');
    return mod.default ?? mod;
  };

  useEffect(() => {
    // Resolve the real order id. Static export serves the "_" placeholder page
    // for every /invoice/<id>, so fall back to reading the id from the URL.
    let orderId = (params?.orderId as string) || '';
    if ((!orderId || orderId === '_') && typeof window !== 'undefined') {
      const m = window.location.pathname.match(/\/invoice\/([^/]+)/);
      if (m) orderId = decodeURIComponent(m[1]);
    }
    if (!orderId || orderId === '_') { setNotFound(true); return; }

    const load = async () => {
      // 1. Fetch the live order from the server FIRST — it's the only source
      // of truth for payment status (PayU's callback updates the status
      // straight in the database, never in this browser's localStorage).
      // A stale localStorage copy saved at checkout time (e.g. "Payment
      // Pending") would otherwise keep showing "Unpaid" on the invoice even
      // after the payment actually succeeded.
      try {
        const res = await fetch(`/api/get-orders?ids=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data: Record<string, unknown>[] = await res.json();
          if (Array.isArray(data) && data.length > 0) { setOrder(normalizeOrder(data[0])); return; }
        }
      } catch { /* ignore — fall back to local copy below */ }

      // 2. Fall back to localStorage only if the server is unreachable
      // (e.g. offline) — this copy may have a stale payment status.
      try {
        const orders: Order[] = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        const found = orders.find(o => o.id === orderId);
        if (found) { setOrder(normalizeOrder(found as unknown as Record<string, unknown>)); return; }
      } catch { /* ignore */ }

      setNotFound(true);
    };

    load();
  }, [params]);

  // Generate a "Scan & Pay via PayU" QR (points at our own /pay page, which
  // fetches a fresh server-signed PayU hash for this exact order — never a
  // raw static UPI code) once the order is known and still unpaid.
  useEffect(() => {
    if (!order || order.status === 'Payment Received' || typeof window === 'undefined') return;
    let cancelled = false;
    const payUrl = `${window.location.origin}/pay?order=${encodeURIComponent(order.id)}`;
    loadQRCodeLib()
      .then((QRCode) => QRCode.toDataURL(payUrl, { margin: 1, width: 200, color: { dark: '#111111', light: '#ffffff' } }))
      .then((url: string) => { if (!cancelled) setPayQrDataUrl(url); })
      .catch(() => { /* QR is a nice-to-have — the Pay Now link still works without it */ });
    return () => { cancelled = true; };
  }, [order]);

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
  // Product prices are GST-inclusive (MRP) — see ProductDetailClient's
  // "Inclusive of all taxes" note — so the 18% GST (9% CGST + 9% SGST) is
  // back-calculated out of the post-discount, pre-shipping amount for the
  // tax breakdown shown on the invoice. taxableValue + CGST + SGST always
  // equals (order.total - shipping), so the totals still reconcile exactly.
  const discountAmt = order.discount ?? 0;
  const discountPercent = subtotal > 0 ? Math.round((discountAmt / subtotal) * 100) : 0;
  const taxableBase = order.total - (order.shipping ?? 0);
  const taxableValue = taxableBase / 1.18;
  const gstAmount = taxableBase - taxableValue;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const dateObj = order.createdAt ? new Date(order.createdAt) : null;
  const date = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const isPaid = order.status === 'Payment Received';
  const payUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay?order=${encodeURIComponent(order.id)}` : '';

  // Lazy-load jsPDF from CDN and build a clean, text-based invoice PDF.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsPDF is loaded from a CDN and has no bundled types here.
  const loadJsPDF = (): Promise<any> => new Promise((resolve, reject) => {
    const w = window as unknown as { jspdf?: { jsPDF: unknown } };
    if (w.jspdf?.jsPDF) { resolve(w.jspdf.jsPDF); return; }
    const existing = document.getElementById('jspdf-cdn') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as unknown as { jspdf: { jsPDF: unknown } }).jspdf.jsPDF));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.id = 'jspdf-cdn';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.async = true;
    s.onload = () => resolve((window as unknown as { jspdf: { jsPDF: unknown } }).jspdf.jsPDF);
    s.onerror = reject;
    document.body.appendChild(s);
  });

  const downloadPDF = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const JsPDF = await loadJsPDF();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new (JsPDF as any)({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const M = 40;
      const rupee = (n: number) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
      let y = 48;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor('#FF6B00');
      doc.text('MUSCLE MANTRA', M, y);
      doc.setFontSize(10); doc.setTextColor('#111');
      doc.text('TAX INVOICE', W - M, y, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#666');
      y += 16;
      doc.text('Authentic Supplements · Patna, Bihar, India', M, y);
      doc.text(`Invoice #${order.id}`, W - M, y, { align: 'right' });
      y += 13;
      doc.text('musclemantra.shop · +91 84096 12737', M, y);
      doc.text(`Date: ${date}`, W - M, y, { align: 'right' });
      y += 13;
      doc.setFont('helvetica', 'bold'); doc.setTextColor('#333');
      doc.text('GSTIN: 10LIYPK4956L1ZC', M, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');

      y += 22;
      doc.setDrawColor('#e5e5e5'); doc.line(M, y, W - M, y); y += 20;

      const a = order.shippingAddress;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor('#111');
      doc.text('Billed / Delivered to', M, y);
      doc.text('Order details', W / 2 + 10, y);
      y += 14;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#333');
      const addrLines = [
        a?.name, a?.phone, a?.email,
        [a?.address, a?.area].filter(Boolean).join(', '),
        [a?.city, a?.state, a?.pincode].filter(Boolean).join(', '),
      ].filter(Boolean) as string[];
      const infoLines = [
        `Status: ${order.status}`,
        `Payment: ${PM_LABELS[order.paymentMethod] ?? order.paymentMethod ?? '—'}`,
      ];
      const rows = Math.max(addrLines.length, infoLines.length);
      for (let i = 0; i < rows; i++) {
        if (addrLines[i]) doc.text(String(addrLines[i]), M, y);
        if (infoLines[i]) doc.text(String(infoLines[i]), W / 2 + 10, y);
        y += 13;
      }

      y += 12;
      // Items table header
      doc.setFillColor('#111'); doc.rect(M, y - 12, W - 2 * M, 20, 'F');
      doc.setTextColor('#fff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Item', M + 8, y + 2);
      doc.text('Qty', W - M - 170, y + 2, { align: 'right' });
      doc.text('Price', W - M - 90, y + 2, { align: 'right' });
      doc.text('Total', W - M - 8, y + 2, { align: 'right' });
      y += 22;

      doc.setFont('helvetica', 'normal'); doc.setTextColor('#222');
      (order.items ?? []).forEach((it) => {
        const line = doc.splitTextToSize(it.name || 'Item', W - 2 * M - 200);
        doc.text(line, M + 8, y);
        doc.text(String(it.quantity), W - M - 170, y, { align: 'right' });
        doc.text(rupee(it.price), W - M - 90, y, { align: 'right' });
        doc.text(rupee(it.price * it.quantity), W - M - 8, y, { align: 'right' });
        y += Math.max(16, line.length * 12);
        doc.setDrawColor('#eee'); doc.line(M, y - 6, W - M, y - 6);
      });

      y += 8;
      const totalsX = W - M - 8;
      const labelX = W - M - 150;
      const totRow = (label: string, val: string, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(bold ? 11 : 9);
        doc.setTextColor(bold ? '#FF6B00' : '#333');
        doc.text(label, labelX, y, { align: 'right' });
        doc.text(val, totalsX, y, { align: 'right' });
        y += bold ? 20 : 15;
      };
      totRow('Subtotal', rupee(subtotal));
      if (discountAmt) totRow(`Discount${discountPercent > 0 ? ` (${discountPercent}%)` : ''}`, '- ' + rupee(discountAmt));
      totRow('Taxable Value', rupee(taxableValue));
      totRow('CGST @ 9%', rupee(cgst));
      totRow('SGST @ 9%', rupee(sgst));
      totRow('Shipping', order.shipping ? rupee(order.shipping) : 'FREE');
      totRow('Grand Total', rupee(order.total), true);

      y += 4;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor('#666');
      const wordsLines = doc.splitTextToSize(`Amount in words: ${numberToWordsINR(order.total)}`, W - 2 * M);
      doc.text(wordsLines, M, y);
      y += wordsLines.length * 11 + 14;

      // Payment status / Scan & Pay via PayU
      if (isPaid) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor('#16a34a');
        doc.text(`Payment Received \u00b7 ${PM_LABELS[order.paymentMethod] ?? order.paymentMethod ?? 'Online'}`, M, y);
        y += 20;
      } else {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor('#111');
        doc.text('Scan & Pay via PayU', M, y);
        y += 6;
        try {
          const QRCode = await loadQRCodeLib();
          const qrDataUrl: string = payQrDataUrl ?? await QRCode.toDataURL(payUrl, { margin: 1, width: 200 });
          doc.addImage(qrDataUrl, 'PNG', M, y, 66, 66);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#666');
          const payLines = doc.splitTextToSize(
            `Scan with any camera / UPI app to pay ${rupee(order.total)} securely via PayU, or open:\n${payUrl}`,
            W - 2 * M - 82
          );
          doc.text(payLines, M + 78, y + 10);
          y += 76;
        } catch {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#666');
          doc.text(`Pay online via PayU: ${payUrl}`, M, y);
          y += 20;
        }
      }

      // Signature
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11); doc.setTextColor('#333');
      doc.text('Muscle Mantra', W - M, y, { align: 'right' });
      y += 4;
      doc.setDrawColor('#ccc'); doc.line(W - M - 110, y, W - M, y);
      y += 11;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#999');
      doc.text('Authorized Signatory', W - M, y, { align: 'right' });

      y += 20;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#999');
      doc.text('Thank you for shopping with Muscle Mantra! For help, reply to your order email.', M, y);

      doc.save(`Invoice-${order.id}.pdf`);
    } catch {
      // Fallback to the browser print dialog (Save as PDF).
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="print:hidden bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-4 sticky top-0 z-20">
        <div className="container-max flex items-center justify-between gap-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[rgba(245,245,245,0.5)] hover:text-white transition-colors">
            <ArrowLeft size={15} /> My Orders
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all"
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-white font-bold rounded-xl text-sm transition-all"
            >
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Invoice */}
      <div className="min-h-screen print:min-h-0 bg-[#050505] py-10 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[700px] print:max-w-none mx-auto bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none print:bg-white">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a0a00] to-[#0d0d0d] px-6 sm:px-9 py-8 print:py-4 border-b-2 border-[#FF6B00] print:from-white print:to-white print:border-orange-500">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Image src="/logo.png" alt="Muscle Mantra" width={52} height={52} className="rounded-xl shrink-0 w-11 h-11 sm:w-[52px] sm:h-[52px]" />
                <div className="min-w-0">
                  <div className="font-[var(--font-montserrat)] font-black text-base sm:text-xl text-[#FF6B00] tracking-tight leading-tight">MUSCLE MANTRA</div>
                  <div className="text-[9px] sm:text-[10px] text-[rgba(245,245,245,0.35)] tracking-[2px] uppercase print:text-gray-400">Fuel Your Strength</div>
                  <div className="text-[10px] sm:text-[11px] text-[rgba(245,245,245,0.5)] mt-1.5 print:text-gray-600">Patna, Bihar, India</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[rgba(245,245,245,0.6)] print:text-gray-700">GSTIN: 10LIYPK4956L1ZC</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] sm:text-sm font-black tracking-[2px] uppercase text-white print:text-black">Tax Invoice</div>
                <div className="inline-block mt-1.5 text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-[rgba(245,245,245,0.4)] border border-[rgba(255,255,255,0.15)] rounded px-1.5 py-0.5 print:text-gray-500 print:border-gray-300">Original for Buyer</div>
              </div>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="px-6 sm:px-9 py-4 print:py-2 grid grid-cols-3 gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] print:bg-gray-50 print:border-gray-200">
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[rgba(245,245,245,0.35)] print:text-gray-400">Invoice No.</div>
              <div className="text-[12px] sm:text-sm font-bold text-white print:text-black break-all">{order.id}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[rgba(245,245,245,0.35)] print:text-gray-400">Invoice Date</div>
              <div className="text-[12px] sm:text-sm font-bold text-white print:text-black">{date}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[rgba(245,245,245,0.35)] print:text-gray-400">Payment Status</div>
              <div className={`text-[12px] sm:text-sm font-black ${isPaid ? 'text-green-400' : 'text-[#FF6B00]'}`}>{isPaid ? 'Paid' : 'Unpaid'}</div>
            </div>
          </div>

          {/* Addresses */}
          <div className="px-6 sm:px-9 py-7 print:py-4 grid grid-cols-2 gap-4 sm:gap-6 border-b border-[rgba(255,255,255,0.06)] print:border-gray-200">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#FF6B00] mb-2">Bill To</div>
              <div className="font-bold text-white text-sm sm:text-base print:text-black break-words">{order.shippingAddress.name}</div>
              <div className="text-sm text-[rgba(245,245,245,0.5)] mt-1 print:text-gray-500">{order.shippingAddress.phone}</div>
              {order.shippingAddress.email && (
                <div className="text-[13px] text-[rgba(245,245,245,0.5)] print:text-gray-500 break-all">{order.shippingAddress.email}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#FF6B00] mb-2">Ship To</div>
              <div className="text-[13px] sm:text-sm text-[rgba(245,245,245,0.6)] leading-relaxed print:text-gray-600 break-words">
                {order.shippingAddress.address},<br />
                {order.shippingAddress.area}, {order.shippingAddress.city},<br />
                {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 sm:px-9 py-6 print:py-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] print:bg-gray-100">
                  <th className="py-2.5 print:py-1.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-left print:text-gray-500">Item</th>
                  <th className="py-2.5 print:py-1.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-center print:text-gray-500">Qty</th>
                  <th className="py-2.5 print:py-1.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-right print:text-gray-500">Rate</th>
                  <th className="py-2.5 print:py-1.5 px-3 text-[10px] font-bold tracking-[1.5px] uppercase text-[rgba(245,245,245,0.4)] text-right print:text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] print:border-gray-100">
                    <td className="py-3 print:py-1.5 px-3 text-[rgba(245,245,245,0.85)] print:text-gray-800">{item.name}</td>
                    <td className="py-3 print:py-1.5 px-3 text-[rgba(245,245,245,0.5)] text-center print:text-gray-500">{item.quantity}</td>
                    <td className="py-3 print:py-1.5 px-3 text-[rgba(245,245,245,0.5)] text-right print:text-gray-500">{formatINR(item.price)}</td>
                    <td className="py-3 print:py-1.5 px-3 font-semibold text-white text-right print:text-black">{formatINR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Payment (Scan & Pay via PayU) + Totals */}
            <div className="mt-5 print:mt-3 grid sm:grid-cols-2 gap-6 print:gap-4 items-start">
              {/* Left: payment status / Scan & Pay QR */}
              <div className="min-w-0">
                {isPaid ? (
                  <div className="inline-flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-green-400 text-[13px] font-bold px-4 py-3 print:py-2 rounded-xl print:bg-green-50 print:border-green-200 print:text-green-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    Payment Received via {PM_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </div>
                ) : (
                  <div className="bg-[#0d0d0d] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 print:p-3 print:bg-gray-50 print:border-gray-200">
                    <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#FF6B00] mb-3 print:mb-2">Scan &amp; Pay via PayU</div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 print:w-[72px] print:h-[72px] bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                        {payQrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={payQrDataUrl} alt="Scan to pay via PayU" className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full rounded bg-gray-200 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[rgba(245,245,245,0.5)] leading-snug print:text-gray-500">
                          Scan with your phone camera to pay {formatINR(order.total)} securely via PayU.
                        </p>
                        <a href={payUrl} target="_blank" rel="noreferrer"
                          className="print:hidden mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B00] hover:underline">
                          Or pay now via PayU →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: totals */}
              <div className="w-full sm:w-64 sm:ml-auto space-y-2">
                <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount{discountPercent > 0 ? ` (${discountPercent}%)` : ''}</span><span>−{formatINR(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                  <span>Taxable Value</span><span>{formatINR(taxableValue)}</span>
                </div>
                <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                  <span>CGST @ 9%</span><span>{formatINR(cgst)}</span>
                </div>
                <div className="flex justify-between text-sm text-[rgba(245,245,245,0.55)] print:text-gray-500">
                  <span>SGST @ 9%</span><span>{formatINR(sgst)}</span>
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
                <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 flex justify-between items-center print:border-gray-200">
                  <span className="font-[var(--font-montserrat)] font-black text-base text-white print:text-black">Total</span>
                  <span className="font-[var(--font-montserrat)] font-black text-xl text-[#FF6B00]">{formatINR(order.total)}</span>
                </div>
                <p className="text-[10px] italic text-[rgba(245,245,245,0.35)] pt-1 print:text-gray-400">
                  {numberToWordsINR(order.total)}
                </p>
                <p className="text-[9px] text-[rgba(245,245,245,0.3)] print:text-gray-400">
                  (Total GST included: {formatINR(gstAmount)})
                </p>
                <div className="pt-8 print:pt-4 text-right">
                  <div className="italic text-[15px] text-[rgba(245,245,245,0.6)] print:text-gray-600" style={{ fontFamily: 'Georgia, serif' }}>Muscle Mantra</div>
                  <div className="text-[9px] text-[rgba(245,245,245,0.3)] mt-1 pt-1.5 border-t border-[rgba(255,255,255,0.12)] print:text-gray-400 print:border-gray-300">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#0a0a0a] px-6 sm:px-9 py-6 print:py-3 border-t border-[rgba(255,255,255,0.06)] text-center print:bg-gray-50 print:border-gray-200">
            <p className="text-xs text-[rgba(245,245,245,0.3)] print:text-gray-400">Thank you for shopping with Muscle Mantra!</p>
            <p className="text-[11px] text-[rgba(245,245,245,0.25)] mt-1 print:text-gray-400">
              +91 84096 12737 &nbsp;•&nbsp; admin@musclemantra.shop &nbsp;•&nbsp; musclemantra.shop
            </p>
            <p className="text-[10px] text-[rgba(245,245,245,0.15)] mt-3 print:mt-1.5 print:text-gray-300">
              Muscle Mantra • Patna, Bihar, India
            </p>
            <p className="text-[10px] text-[rgba(245,245,245,0.15)] mt-1 print:text-gray-300">
              GSTIN: 10LIYPK4956L1ZC &nbsp;•&nbsp; This is a computer-generated invoice and does not require a signature.
            </p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @page {
          size: A4;
          margin: 8mm;
        }
        @media print {
          html, body { background: white !important; height: auto !important; }
          nav, footer, .print\\:hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </>
  );
}
