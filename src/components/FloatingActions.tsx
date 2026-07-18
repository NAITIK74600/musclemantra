'use client';

/**
 * Floating action buttons rendered on every page:
 *   • WhatsApp support — quick contact with a pre-filled message.
 *   • Back-to-top     — appears once the user scrolls past ~400px, glides them
 *                       back to the hero.
 *
 * Both buttons animate in/out with Framer Motion and stay on top of everything
 * (z-[90]) without obstructing content on small screens.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

// Change these to your real business channel if desired.
const WHATSAPP_NUMBER = '918409612737'; // country code + number, no `+`
const WHATSAPP_PREFILL = 'Hi! I have a question about a supplement on Muscle Mantra.';

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <path d="M19.11 17.55c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.66.15-.19.29-.75.94-.92 1.14-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.45-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.49.1-.19.05-.36-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.51-.17-.01-.36-.01-.56-.01s-.51.07-.78.36c-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.2 3.02.15.19 2.07 3.16 5.02 4.43.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.12.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34zM16.04 6.5c-5.24 0-9.5 4.26-9.5 9.5 0 1.87.54 3.62 1.48 5.09L6.5 25.5l4.55-1.49a9.46 9.46 0 0 0 4.99 1.42h.01c5.24 0 9.5-4.26 9.5-9.5s-4.27-9.43-9.51-9.43zm5.55 15c-.7.98-1.62 1.74-2.67 2.19a7.86 7.86 0 0 1-3.11.63c-1.4 0-2.76-.37-3.96-1.07l-.28-.17-2.94.77.79-2.86-.18-.29a7.86 7.86 0 0 1-1.21-4.2 7.9 7.9 0 0 1 7.9-7.9c2.11 0 4.09.83 5.58 2.32a7.83 7.83 0 0 1 2.31 5.6c0 1.5-.44 2.93-1.23 4.15z" />
    </svg>
  );
}

export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  const whatsAppHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

  return (
    <div className="fixed right-4 sm:right-5 bottom-5 sm:bottom-6 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="top"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="w-11 h-11 rounded-full bg-[rgba(20,20,20,0.9)] backdrop-blur-md border border-[rgba(255,107,0,0.35)] text-[#FF6B00] hover:text-white hover:bg-[#FF6B00] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-colors"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.a
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 320, damping: 22 }}
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_12px_40px_rgba(37,211,102,0.45)] hover:scale-[1.06] active:scale-95 transition-transform"
        style={{ width: 56, height: 56 }}
      >
        {/* pulsing ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 0 0 rgba(37,211,102,0.7)', animation: 'pulse-ring 2s ease-out infinite' }}
        />
        <WhatsAppIcon size={26} />

        {/* local keyframes (scoped via a <style> tag so we don't touch globals.css) */}
        <style>{`
          @keyframes pulse-ring {
            0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
            70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
            100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
          }
        `}</style>
      </motion.a>
    </div>
  );
}
