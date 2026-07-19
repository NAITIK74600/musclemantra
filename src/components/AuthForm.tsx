'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { signIn, signUp, signInWithGoogleProfile } from '@/lib/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { scorePassword } from '@/lib/security';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const isLogin = mode === 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live password strength (only used on the signup form)
  const strength = useMemo(() => scorePassword(password), [password]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch Google profile');
        const profile = await res.json() as {
          sub: string; email: string; name: string;
          picture?: string; email_verified?: boolean;
        };
        const result = await signInWithGoogleProfile(profile);
        if (!result.ok) { setError(result.error || 'Google sign-in failed.'); return; }
        router.push('/account');
      } catch {
        setError('Google sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed. Please try again.'),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = isLogin
        ? await signIn(email, password)
        : await signUp(name, email, password);
      if (!res.ok) {
        setError(res.error || 'Something went wrong.');
        return;
      }
      router.push('/account');
    } finally {
      setLoading(false);
    }
  };

  const google = () => {
    setError('');
    googleLogin();
  };

  return (
    <div className="container-max min-h-[80vh] flex items-center justify-center py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl p-7 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.3)] mb-4">
              <ShieldCheck size={22} className="text-[#FF6B00]" />
            </div>
            <h1 className="font-[var(--font-montserrat)] font-black text-2xl text-white">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-[rgba(245,245,245,0.45)] text-sm mt-1.5">
              {isLogin ? 'Sign in to continue to Muscle Mantra' : 'Join Muscle Mantra in seconds'}
            </p>
          </div>

          {/* Google */}
          <button onClick={google} type="button"
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] text-sm font-bold rounded-xl transition-all">
            <GoogleIcon /> Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-[11px] font-semibold text-[rgba(245,245,245,0.35)] uppercase tracking-wide">or {isLogin ? 'sign in' : 'sign up'} with email</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[13px] font-medium">
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Rohit Kumar" autoComplete="name"
                    className="w-full pl-10 pr-3.5 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Your password' : 'At least 8 characters'} autoComplete={isLogin ? 'current-password' : 'new-password'}
                  maxLength={128}
                  className="w-full pl-10 pr-10 py-3 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)] hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicator — signup only */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
                        <motion.div
                          initial={false}
                          animate={{ width: i < strength.score ? '100%' : '0%' }}
                          transition={{ duration: 0.25 }}
                          style={{ background: strength.color }}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                    {strength.hint && (
                      <span className="text-[10px] text-[rgba(245,245,245,0.45)]">{strength.hint}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> {isLogin ? 'Signing in…' : 'Creating account…'}</>
                : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center text-[13px] text-[rgba(245,245,245,0.45)] mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link href={isLogin ? '/signup' : '/login'} className="text-[#FF6B00] font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-[rgba(245,245,245,0.3)] mt-5">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
