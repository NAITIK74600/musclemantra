'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, RotateCcw, ShoppingBag, Phone } from 'lucide-react';

export default function PaymentFailureClient() {
  const [txnid, setTxnid] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTxnid(params.get('txnid') ?? '');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className="w-24 h-24 rounded-full bg-[rgba(239,68,68,0.12)] border-2 border-red-400 flex items-center justify-center mb-6"
      >
        <XCircle size={44} className="text-red-400" />
      </motion.div>

      <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-red-400 mb-2">Payment Failed</p>
      <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white mb-3">
        Oops! Something went wrong
      </h1>
      <p className="text-[rgba(245,245,245,0.55)] text-sm max-w-sm mb-2">
        Your payment could not be processed. No amount was deducted. Please try again or use a different payment method.
      </p>
      {txnid && (
        <p className="text-xs text-[rgba(245,245,245,0.3)] mb-6">Reference: <span className="font-mono text-[rgba(245,245,245,0.5)]">{txnid}</span></p>
      )}

      <div className="flex gap-3 flex-wrap justify-center mb-6">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm"
        >
          <RotateCcw size={16} /> Try Again
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white font-bold rounded-xl transition-all text-sm"
        >
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>

      <a
        href="tel:+918409612737"
        className="inline-flex items-center gap-2 text-sm text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] transition-colors"
      >
        <Phone size={14} /> Need help? Call +91 84096 12737
      </a>
    </motion.div>
  );
}
