'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2, UserPlus, KeyRound } from 'lucide-react';
import {
  hasAdminSetup, isAdminAuthenticated, signInAdmin, setupAdmin,
  adminLockoutRemaining, verifySetupKey,
} from '@/lib/adminAuth';

interface Props {
  children: React.ReactNode;
  /** Called when admin signs out (triggered from the parent via exposed ref pattern or prop). */
  onReady?: (signOutFn: () => void) => void;
}

export default function AdminGate({ children, onReady }: Props) {
  const [status, setStatus] = useState<'loading' | 'login' | 'setup' | 'authed'>('loading');
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [pw2, setPw2]         = useState('');  // confirm pw for setup
  const [setupKey, setSetupKey] = useState(''); // secret setup key
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [lockSecs, setLockSecs] = useState(0);

  // ── Countdown for rate-limit lockout ────────────────────────────────────
  useEffect(() => {
    if (lockSecs <= 0) return;
    const t = setInterval(() => setLockSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockSecs]);

  // ── Initial auth check ───────────────────────────────────────────────────
  useEffect(() => {
    if (isAdminAuthenticated()) {
      setStatus('authed');
      return;
    }
    setStatus(hasAdminSetup() ? 'login' : 'setup');

    // Restore any live lockout countdown
    const rem = adminLockoutRemaining();
    if (rem > 0) setLockSecs(Math.ceil(rem / 1000));
  }, []);

  const handleSignIn = useCallback(async () => {
    if (busy || lockSecs > 0) return;
    setError('');
    setBusy(true);
    const res = await signInAdmin(email, pw);
    setBusy(false);
    if (res.ok) {
      setStatus('authed');
    } else {
      setError(res.error ?? 'Sign-in failed.');
      const rem = adminLockoutRemaining();
      if (rem > 0) setLockSecs(Math.ceil(rem / 1000));
    }
  }, [busy, lockSecs, email, pw]);

  const handleSetup = useCallback(async () => {
    if (busy) return;
    setError('');
    if (!verifySetupKey(setupKey)) {
      setError('Invalid setup key. Contact the store owner.');
      return;
    }
    if (pw !== pw2) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const res = await setupAdmin(email, pw);
    setBusy(false);
    if (res.ok) {
      // Auto sign in after setup
      const login = await signInAdmin(email, pw);
      if (login.ok) setStatus('authed');
    } else {
      setError(res.error ?? 'Setup failed.');
    }
  }, [busy, email, pw, pw2, setupKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (status === 'login') handleSignIn();
      else if (status === 'setup') handleSetup();
    }
  };

  // Loading — avoid flash of login screen when session already valid
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 size={32} className="text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  if (status === 'authed') return <>{children}</>;

  // ── Login / Setup overlay ────────────────────────────────────────────────
  const isSetup = status === 'setup';

  return (
    <AnimatePresence>
      <motion.div
        key="admin-gate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#030303] flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.07)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.04)_0%,transparent_65%)]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,107,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Top brand mark */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.3)] flex items-center justify-center">
              <ShieldCheck size={18} className="text-[#FF6B00]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-black text-white leading-none">MUSCLE MANTRA</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[rgba(255,107,0,0.7)] uppercase leading-none mt-0.5">Admin Portal</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#0d0d0d] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)]">

            {/* Accent top bar */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent" />

            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center shrink-0">
                  {isSetup ? <UserPlus size={18} className="text-[#FF6B00]" /> : <Lock size={18} className="text-[#FF6B00]" />}
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF6B00]">
                    {isSetup ? 'First-time Setup' : 'Secure Sign In'}
                  </div>
                  <div className="font-[var(--font-montserrat)] font-black text-white text-[20px] leading-tight mt-0.5">
                    {isSetup ? 'Create Admin Account' : 'Welcome Back'}
                  </div>
                </div>
              </div>

              {isSetup ? (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[rgba(255,107,0,0.07)] border border-[rgba(255,107,0,0.2)]">
                  <AlertTriangle size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[rgba(245,245,245,0.7)] leading-relaxed">
                    Enter the <strong className="text-[#FF6B00]">Setup Key</strong> (from .env) + your email + a password to create the one-time admin account.
                  </p>
                </div>
              ) : (
                <p className="text-[13px] text-[rgba(245,245,245,0.4)]">
                  Sign in to manage products, orders, appointments, and more.
                </p>
              )}
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-4" onKeyDown={handleKeyDown}>
              {/* Setup Key (only shown during first-time setup) */}
              {isSetup && (
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-[rgba(245,245,245,0.45)] mb-1.5">
                    Setup Key
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={setupKey}
                    onChange={e => { setSetupKey(e.target.value); setError(''); }}
                    placeholder="Enter secret setup key"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[rgba(255,107,0,0.25)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.2)] focus:border-[#FF6B00] focus:outline-none transition-colors"
                  />
                  <p className="mt-1.5 text-[10px] text-[rgba(245,245,245,0.25)]">Required to create the admin account — contact the site owner.</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-[rgba(245,245,245,0.45)] mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@musclemantra.shop"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.2)] focus:border-[#FF6B00] focus:outline-none transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-[rgba(245,245,245,0.45)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isSetup ? 'new-password' : 'current-password'}
                    value={pw}
                    onChange={e => { setPw(e.target.value); setError(''); }}
                    placeholder={isSetup ? 'Min 8 chars · include a number' : '••••••••'}
                    className="w-full px-4 py-3 pr-12 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.2)] focus:border-[#FF6B00] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.3)] hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password (setup only) */}
              {isSetup && (
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.15em] uppercase text-[rgba(245,245,245,0.45)] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pw2}
                    onChange={e => { setPw2(e.target.value); setError(''); }}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.2)] focus:border-[#FF6B00] focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[12.5px] text-red-400 leading-snug">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lockout */}
              {lockSecs > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Lock size={13} className="text-orange-400 shrink-0" />
                  <p className="text-[12px] text-orange-400">
                    Too many attempts — retry in {Math.floor(lockSecs / 60)}:{String(lockSecs % 60).padStart(2, '0')}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={isSetup ? handleSetup : handleSignIn}
                disabled={busy || lockSecs > 0 || !email || !pw || (isSetup && !setupKey)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:bg-[rgba(255,107,0,0.3)] disabled:cursor-not-allowed text-white font-black rounded-xl text-[14px] transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)]"
              >
                {busy
                  ? <Loader2 size={16} className="animate-spin" />
                  : isSetup
                    ? <UserPlus size={16} />
                    : <KeyRound size={16} />
                }
                {busy ? 'Please wait…' : isSetup ? 'Create & Sign In' : 'Sign In to Admin Panel'}
              </button>
            </div>

            {/* Footer */}
            <div className="px-8 pb-7 text-center space-y-2">
              {/* Security badges */}
              <div className="flex items-center justify-center gap-3 text-[10px] text-[rgba(245,245,245,0.2)] font-bold uppercase tracking-wider">
                <span>PBKDF2-SHA256</span>
                <span>·</span>
                <span>8hr Session</span>
                <span>·</span>
                <span>Rate Limited</span>
              </div>
              <p className="text-[10px] text-[rgba(245,245,245,0.15)]">
                Stored locally · not transmitted to any server
              </p>
            </div>
          </div>

          {/* Appointment quick link */}
          <p className="mt-5 text-center text-[11px] text-[rgba(245,245,245,0.2)]">
            Customer booking?{' '}
            <a href="/book" className="text-[rgba(255,107,0,0.5)] hover:text-[#FF6B00] font-semibold transition-colors">
              Book an Appointment →
            </a>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
