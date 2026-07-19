'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, CheckCircle2,
} from 'lucide-react';
import {
  isAdminAuthenticated,
  signInAdmin,
  requestAdminOtp,
  resetAdminPassword,
} from '@/lib/adminAuth';

type Mode = 'login' | 'forgot';
type ForgotStep = 'email' | 'otp' | 'done';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [mode, setMode] = useState<Mode>('login');

  useEffect(() => {
    setAuthed(isAdminAuthenticated());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-orange-400" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Panel</h1>
              <p className="text-sm text-neutral-400 mt-1">
                {mode === 'login'
                  ? 'Sign in to manage products, orders, and more.'
                  : 'Reset or set your admin password via email OTP.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <LoginForm
                  key="login"
                  onSuccess={() => setAuthed(true)}
                  onForgot={() => setMode('forgot')}
                />
              ) : (
                <ForgotForm key="forgot" onBack={() => setMode('login')} />
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Muscle Mantra • Authorized personnel only
        </p>
      </motion.div>
    </div>
  );
}

/* ─── Login ──────────────────────────────────────────────────────────────── */

function LoginForm({ onSuccess, onForgot }: { onSuccess: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setBusy(true);
    const res = await signInAdmin(email, password);
    setBusy(false);
    if (res.ok) onSuccess();
    else setError(res.error ?? 'Sign-in failed.');
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={submit}
      className="space-y-4"
    >
      <Field icon={Mail} label="Email">
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@musclemantra.shop"
          className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm"
        />
      </Field>

      <Field icon={Lock} label="Password">
        <input
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="text-neutral-500 hover:text-neutral-300 transition"
          aria-label={showPw ? 'Hide password' : 'Show password'}
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </Field>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button
        type="submit"
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-neutral-950 font-bold py-3 text-sm transition"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {busy ? 'Signing in…' : 'Sign In'}
      </button>

      <button
        type="button"
        onClick={onForgot}
        className="w-full text-center text-xs text-neutral-400 hover:text-orange-400 transition"
      >
        Forgot / set password?
      </button>
    </motion.form>
  );
}

/* ─── Forgot / OTP ───────────────────────────────────────────────────────── */

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!email.trim()) { setError('Please enter your admin email.'); return; }
    setBusy(true);
    const res = await requestAdminOtp(email, 'reset');
    setBusy(false);
    if (res.ok) setStep('otp');
    else setError(res.error ?? 'Could not send the code. Try again.');
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit code from your email.'); return; }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be 8+ characters with a letter and a number.');
      return;
    }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const res = await resetAdminPassword(email, otp, password);
    setBusy(false);
    if (res.ok) setStep('done');
    else setError(res.error ?? 'Reset failed. Check the code and try again.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
    >
      {step === 'email' && (
        <form onSubmit={sendOtp} className="space-y-4">
          <Field icon={Mail} label="Admin email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@musclemantra.shop"
              className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm"
            />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <p className="text-xs text-neutral-500">
            We&apos;ll email a 6-digit code if this address belongs to an admin account.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-neutral-950 font-bold py-3 text-sm transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitReset} className="space-y-4">
          <Field icon={KeyRound} label="6-digit code">
            <input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm tracking-[0.3em]"
            />
          </Field>
          <Field icon={Lock} label="New password">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-neutral-500 hover:text-neutral-300 transition"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>
          <Field icon={Lock} label="Confirm password">
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-white placeholder:text-neutral-600 outline-none text-sm"
            />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-neutral-950 font-bold py-3 text-sm transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {busy ? 'Saving…' : 'Set password'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setError(''); }}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition"
          >
            Use a different email
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-400" />
          </div>
          <p className="text-white font-semibold">Password updated</p>
          <p className="text-sm text-neutral-400 mt-1">You can now sign in with your new password.</p>
          <button
            onClick={onBack}
            className="mt-6 w-full rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold py-3 text-sm transition"
          >
            Back to sign in
          </button>
        </div>
      )}

      {step !== 'done' && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-orange-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </button>
      )}
    </motion.div>
  );
}

/* ─── shared bits ────────────────────────────────────────────────────────── */

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-400 mb-1.5 block">{label}</span>
      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-neutral-950/60 px-3.5 py-3 focus-within:border-orange-500/60 transition">
        <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
        {children}
      </div>
    </label>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
    >
      {children}
    </motion.p>
  );
}
