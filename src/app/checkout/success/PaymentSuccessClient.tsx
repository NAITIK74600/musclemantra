'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ShoppingBag, Download } from 'lucide-react';

export default function PaymentSuccessClient() {
  const [txnid, setTxnid] = useState('');
  const [amount, setAmount] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // 1. Read from URL params set by payu-return PHP/Netlify handler (verified path)
    const params = new URLSearchParams(window.location.search);
    const urlTxnid  = params.get('txnid')  ?? '';
    const urlAmount = params.get('amount') ?? '';
    const urlVerified = params.get('verified') === '1';

    if (urlTxnid) {
      setTxnid(urlTxnid);
      setAmount(urlAmount);
      setVerified(urlVerified);
      return;
    }

    // 2. Fallback: sessionStorage (set before PayU redirect)
    const saved = sessionStorage.getItem('mm_payu_order');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setTxnid(d.txnid ?? '');
        setAmount(d.amount ?? '');
      } catch { /* ignore */ }
      sessionStorage.removeItem('mm_payu_order');
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center py-20"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className="w-24 h-24 rounded-full bg-[rgba(34,197,94,0.12)] border-2 border-green-400 flex items-center justify-center mb-6"
      >
        <CheckCircle size={44} className="text-green-400" />
      </motion.div>

      <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-green-400 mb-2">Payment Successful</p>
      <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white mb-3">
        Order Confirmed!
      </h1>
      <p className="text-[rgba(245,245,245,0.55)] text-sm max-w-sm mb-1">
        Your payment was processed successfully via PayU.
      </p>
      {verified && (
        <p className="text-[11px] font-bold text-green-400 bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] px-3 py-1 rounded-full mb-2">
          ✓ Payment verified by PayU
        </p>
      )}
      {txnid && (
        <p className="text-[13px] text-[rgba(245,245,245,0.4)] mb-1">
          Transaction ID: <span className="font-bold text-white">{txnid}</span>
        </p>
      )}
      {amount && (
        <p className="text-[13px] text-[rgba(245,245,245,0.4)] mb-6">
          Amount Paid: <span className="font-bold text-[#FF6B00]">₹{amount}</span>
        </p>
      )}

      {/* Trust note */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(34,197,94,0.07)] border border-[rgba(34,197,94,0.15)] mb-8 text-sm text-green-400 font-medium">
        <CheckCircle size={14} />
        Payment secured by PayU — India's trusted payment gateway
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm"
        >
          <Package size={16} /> Track Order
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white font-bold rounded-xl transition-all text-sm"
        >
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}
