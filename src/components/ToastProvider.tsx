'use client';

/**
 * Lightweight toast notification system.
 *
 * Usage:
 *   const { push } = useToast();
 *   push({ title: 'Added to cart', variant: 'success' });
 *
 * Renders a stack in the top-right corner (bottom-right on mobile) with graceful
 * enter/exit animations and auto-dismiss.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';
export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};
type Toast = ToastInput & { id: string };

type ToastContextValue = {
  push: (t: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const variantStyles: Record<ToastVariant, { border: string; icon: React.ComponentType<{ size?: number; className?: string }>; iconColor: string }> = {
  success: { border: 'border-emerald-500/40', icon: CheckCircle2, iconColor: 'text-emerald-400' },
  error:   { border: 'border-red-500/40',     icon: AlertCircle,  iconColor: 'text-red-400'     },
  info:    { border: 'border-[rgba(255,107,0,0.4)]', icon: Info,   iconColor: 'text-[#FF6B00]'   },
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(ts => ts.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback((t: ToastInput) => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    const toast: Toast = { id, variant: 'success', durationMs: 3200, ...t };
    setToasts(ts => [...ts, toast].slice(-4)); // cap to 4 visible
    const timer = setTimeout(() => dismiss(id), toast.durationMs);
    timers.current.set(id, timer);
  }, [dismiss]);

  // Cleanup any pending timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(t => clearTimeout(t)); map.clear(); };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast viewport — pointer-events-none so it never blocks clicks below */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed z-[100] right-3 sm:right-5 top-[110px] flex flex-col gap-2 w-[calc(100vw-24px)] sm:w-[340px] max-w-[340px]"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const cfg = variantStyles[t.variant ?? 'success'];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto relative flex items-start gap-3 px-4 py-3 pr-9 rounded-xl bg-[rgba(20,20,20,0.96)] backdrop-blur-xl border ${cfg.border} shadow-[0_20px_50px_rgba(0,0,0,0.6)]`}
              >
                <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white leading-tight">{t.title}</p>
                  {t.description && (
                    <p className="text-[11.5px] text-[rgba(245,245,245,0.6)] mt-0.5 leading-snug">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="absolute top-2 right-2 p-1 rounded-md text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
