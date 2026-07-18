import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="container-max min-h-[70vh] flex items-center justify-center py-20">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-7 w-20 h-20 rounded-2xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center">
          <Compass size={34} className="text-[#FF6B00]" />
        </div>

        <p className="font-[var(--font-montserrat)] font-black text-6xl md:text-7xl text-gradient leading-none mb-3">
          404
        </p>
        <h1 className="font-[var(--font-montserrat)] font-black text-2xl md:text-3xl text-white leading-tight mb-4">
          Page Not Found
        </h1>
        <p className="text-[15px] text-[rgba(245,245,245,0.55)] leading-relaxed mb-9 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-colors w-full sm:w-auto"
          >
            <ShoppingBag size={16} /> Shop Products
          </Link>
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
