'use client';

// Lightweight client-side auth backed by localStorage. This is a front-end demo
// (no backend), so accounts + sessions live in the browser.
//
// Security posture (v2):
//   • Passwords hashed with PBKDF2-SHA256 + per-user random salt (WebCrypto).
//   • Sessions carry an expiry timestamp (30 days) — expired sessions self-clear.
//   • Sign-in attempts are rate-limited (5 per 15 min per email).
//   • Avatar URLs are sanitized before write to block `javascript:` / non-image
//     `data:` payloads (DOM-XSS via image src).

import {
  hashPassword, verifyPassword, sanitizeImageUrl,
  loginLockoutRemaining, recordFailedLogin, clearLoginAttempts,
} from './security';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: number;
};

type StoredUser = User & { pwHash?: string };
type Session = { userId: string; expiresAt: number };

const USERS_KEY = 'mb_users_v2';
const SESSION_KEY = 'mb_session_v2';
const EVENT = 'mb-auth-change';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function uid(): string {
  // Prefer WebCrypto UUIDs when available for less predictable IDs.
  const c = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  catch { /* quota exceeded — ignore */ }
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.userId || !s?.expiresAt) return null;
    return s;
  } catch { return null; }
}

function setSession(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) {
    const s: Session = { userId, expiresAt: Date.now() + SESSION_TTL_MS };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  broadcast();
}

function broadcast() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

function publicUser(u: StoredUser): User {
  // Strip credential material before returning.
  const { pwHash: _pwHash, ...rest } = u;
  void _pwHash;
  return rest;
}

/** Validates an email loosely (RFC-lite — good enough for a UX check). */
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Validates a password: 8+ chars, at least one letter and one digit. */
function isValidPassword(p: string): { ok: true } | { ok: false; error: string } {
  if (p.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (p.length > 128) return { ok: false, error: 'Password is too long (max 128).' };
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) {
    return { ok: false, error: 'Password must contain at least one letter and one number.' };
  }
  return { ok: true };
}

/** Returns the currently signed-in user, or null. Auto-clears expired sessions. */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const s = readSession();
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const u = readUsers().find(x => x.id === s.userId);
  return u ? publicUser(u) : null;
}

/** Create a new email/password account and sign in. */
export async function signUp(name: string, email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) return { ok: false, error: 'Please enter your name.' };
  if (cleanName.length > 80) return { ok: false, error: 'Name is too long.' };
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email.' };

  const pwCheck = isValidPassword(password);
  if (!pwCheck.ok) return { ok: false, error: pwCheck.error };

  const users = readUsers();
  if (users.some(u => u.email === cleanEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  let pwHash: string;
  try {
    pwHash = await hashPassword(password);
  } catch {
    return { ok: false, error: 'Your browser does not support secure sign-up. Please update your browser.' };
  }

  const user: StoredUser = {
    id: uid(),
    name: cleanName,
    email: cleanEmail,
    provider: 'email',
    pwHash,
    createdAt: Date.now(),
  };
  users.push(user);
  writeUsers(users);
  setSession(user.id);
  clearLoginAttempts(cleanEmail);
  return { ok: true, user: publicUser(user) };
}

/** Sign in with email/password. Rate-limited per email. */
export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email.' };
  if (!password) return { ok: false, error: 'Please enter your password.' };

  const lockMs = loginLockoutRemaining(cleanEmail);
  if (lockMs > 0) {
    const mins = Math.ceil(lockMs / 60_000);
    return { ok: false, error: `Too many attempts. Try again in ~${mins} minute${mins === 1 ? '' : 's'}.` };
  }

  const users = readUsers();
  const u = users.find(x => x.email === cleanEmail);

  // Uniform error message avoids leaking which emails are registered.
  const genericError = 'Incorrect email or password.';

  if (!u) {
    recordFailedLogin(cleanEmail);
    return { ok: false, error: genericError };
  }
  if (u.provider === 'google' && !u.pwHash) {
    return { ok: false, error: 'This account uses Google sign-in. Continue with Google instead.' };
  }
  if (!u.pwHash) {
    recordFailedLogin(cleanEmail);
    return { ok: false, error: genericError };
  }

  let ok = false;
  try { ok = await verifyPassword(password, u.pwHash); }
  catch { ok = false; }

  if (!ok) {
    const remaining = recordFailedLogin(cleanEmail);
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60_000);
      return { ok: false, error: `Too many attempts. Try again in ~${mins} minute${mins === 1 ? '' : 's'}.` };
    }
    return { ok: false, error: genericError };
  }

  clearLoginAttempts(cleanEmail);
  setSession(u.id);
  return { ok: true, user: publicUser(u) };
}

/**
 * Demo "Continue with Google". Without a backend we can't run the real OAuth
 * flow, so we simulate a returning Google account (or create one on first use).
 */
export function signInWithGoogle(): { ok: boolean; user?: User } {
  const email = 'rohit.google@gmail.com';
  const users = readUsers();
  let u = users.find(x => x.email === email);
  if (!u) {
    u = {
      id: uid(),
      name: 'Rohit Kumar',
      email,
      provider: 'google',
      avatar: sanitizeImageUrl('https://lh3.googleusercontent.com/a/default-user=s96-c'),
      createdAt: Date.now(),
    };
    users.push(u);
    writeUsers(users);
  }
  setSession(u.id);
  return { ok: true, user: publicUser(u) };
}

/** Sign the current user out. */
export function signOut() {
  setSession(null);
}

/** Update the signed-in user's profile fields. Sanitizes avatar URL. */
export function updateProfile(patch: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>): User | null {
  const current = getCurrentUser();
  if (!current) return null;
  const users = readUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) return null;

  const clean: Partial<Pick<User, 'name' | 'phone' | 'avatar'>> = {};
  if (patch.name !== undefined) clean.name = patch.name.trim().slice(0, 80);
  if (patch.phone !== undefined) clean.phone = patch.phone.trim().slice(0, 20);
  if (patch.avatar !== undefined) clean.avatar = sanitizeImageUrl(patch.avatar);

  users[idx] = { ...users[idx], ...clean };
  writeUsers(users);
  broadcast();
  return publicUser(users[idx]);
}

/** Subscribe to auth changes (sign in/out, profile updates). Returns an unsubscribe fn. */
export function onAuthChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/** Initials for avatar fallback. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Sanitize an avatar URL for safe `<img src>` usage. */
export function safeAvatar(url: string | undefined): string | undefined {
  return sanitizeImageUrl(url);
}
