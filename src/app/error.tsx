'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Route-level error boundary. Catches unexpected runtime errors in any page
 * and shows a friendly, on-brand recovery screen instead of a blank/white page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the console for debugging (no PII shown to the user).
    console.error(error);
  }, [error]);

  return (
    <section className="container-max min-h-[70vh] flex items-center justify-center py-20">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-7 w-20 h-20 rounded-2xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center">
          <AlertTriangle size={34} className="text-[#FF6B00]" />
        </div>

        <h1 className="font-[var(--font-montserrat)] font-black text-2xl md:text-3xl text-white leading-tight mb-4">
          Something went wrong
        </h1>
        <p className="text-[15px] text-[rgba(245,245,245,0.55)] leading-relaxed mb-9 max-w-md mx-auto">
          A temporary error stopped this page from loading. Please try again — your
          cart and account are safe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-colors w-full sm:w-auto"
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white text-sm font-bold rounded-xl transition-colors w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
