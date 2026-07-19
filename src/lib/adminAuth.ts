'use client';

/**
 * Admin-specific authentication layer (client-only demo).
 *
 * Security properties:
 *  • Admin credentials (email + PBKDF2-SHA256 hash) stored in localStorage.
 *  • Session token stored in sessionStorage — auto-clears on browser close.
 *  • Session TTL: 8 hours.
 *  • Rate-limit: 3 failed attempts → 15-minute lockout.
 *  • Setup is protected by NEXT_PUBLIC_ADMIN_SETUP_KEY env var —
 *    anyone who doesn't know the key cannot create the admin account.
 */

import { hashPassword, verifyPassword } from './security';

// The setup key is baked in at build time from the env var.
// Set NEXT_PUBLIC_ADMIN_SETUP_KEY in your .env.local / Netlify env.
const SETUP_KEY: string = process.env.NEXT_PUBLIC_ADMIN_SETUP_KEY ?? '';

/** Validates the setup key entered by the user. */
export function verifySetupKey(input: string): boolean {
  if (!SETUP_KEY) return false; // no key configured → block all setup
  return input.trim() === SETUP_KEY.trim();
}

const ADMIN_CREDS_KEY = 'mb_admin_creds_v1';
const ADMIN_SESSION_KEY = 'mb_admin_sess_v1';
const ADMIN_RL_KEY = 'mb_admin_rl_v1';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

type AdminCreds = { email: string; pwHash: string };
type AdminSession = { email: string; expiresAt: number; token: string };
type RateLimit = { attempts: number; lockedUntil: number };

// ─── helpers ────────────────────────────────────────────────────────────────

function rnd(): string {
  const c = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}

function readCreds(): AdminCreds | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    return raw ? (JSON.parse(raw) as AdminCreds) : null;
  } catch { return null; }
}

function writeCreds(c: AdminCreds) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(c));
}

function readSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (!s?.email || !s?.expiresAt || !s?.token) return null;
    return s;
  } catch { return null; }
}

function readRL(): RateLimit {
  if (typeof window === 'undefined') return { attempts: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(ADMIN_RL_KEY);
    return raw ? (JSON.parse(raw) as RateLimit) : { attempts: 0, lockedUntil: 0 };
  } catch { return { attempts: 0, lockedUntil: 0 }; }
}

function writeRL(rl: RateLimit) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_RL_KEY, JSON.stringify(rl));
}

function recordFail(): boolean {
  const rl = readRL();
  const attempts = rl.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    writeRL({ attempts, lockedUntil: Date.now() + LOCKOUT_MS });
    return true; // now locked
  }
  writeRL({ attempts, lockedUntil: 0 });
  return false;
}

// ─── public API ─────────────────────────────────────────────────────────────

/** True if admin credentials have ever been set up on this browser. */
export function hasAdminSetup(): boolean {
  return readCreds() !== null;
}

/** True if the current session is valid (not expired). */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const s = readSession();
  if (!s) return false;
  if (s.expiresAt < Date.now()) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }
  return true;
}

/** Returns the signed-in admin email, or null. */
export function getAdminEmail(): string | null {
  if (!isAdminAuthenticated()) return null;
  return readSession()?.email ?? null;
}

/** Returns remaining lockout ms (0 if not locked). */
export function adminLockoutRemaining(): number {
  const rl = readRL();
  if (rl.lockedUntil > Date.now()) return rl.lockedUntil - Date.now();
  // Auto-reset counter if lockout expired
  if (rl.lockedUntil > 0 && rl.lockedUntil <= Date.now()) {
    writeRL({ attempts: 0, lockedUntil: 0 });
  }
  return 0;
}

/**
 * First-run setup — create the admin account.
 * Fails if credentials already exist (must use changeAdminPassword to update).
 */
export async function setupAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (readCreds()) return { ok: false, error: 'Admin account already exists.' };

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@'))
    return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 8)
    return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return { ok: false, error: 'Password must contain at least one letter and one number.' };

  const pwHash = await hashPassword(password);
  writeCreds({ email: cleanEmail, pwHash });
  return { ok: true };
}

/** Sign in to the admin panel. Rate-limited. */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'Not available server-side.' };

  const lockMs = adminLockoutRemaining();
  if (lockMs > 0) {
    const mins = Math.ceil(lockMs / 60_000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ~${mins} minute${mins === 1 ? '' : 's'}.`,
    };
  }

  const creds = readCreds();
  if (!creds)
    return { ok: false, error: 'Admin account not set up. Please create one first.' };

  const cleanEmail = email.trim().toLowerCase();
  const GENERIC_ERR = 'Incorrect email or password.';

  if (cleanEmail !== creds.email) {
    const locked = recordFail();
    if (locked) {
      const mins = Math.ceil(LOCKOUT_MS / 60_000);
      return { ok: false, error: `Too many failed attempts. Locked for ${mins} minutes.` };
    }
    const remaining = MAX_ATTEMPTS - readRL().attempts;
    return { ok: false, error: `${GENERIC_ERR} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
  }

  let ok = false;
  try { ok = await verifyPassword(password, creds.pwHash); } catch { ok = false; }

  if (!ok) {
    const locked = recordFail();
    if (locked) {
      const mins = Math.ceil(LOCKOUT_MS / 60_000);
      return { ok: false, error: `Too many failed attempts. Locked for ${mins} minutes.` };
    }
    const remaining = MAX_ATTEMPTS - readRL().attempts;
    return { ok: false, error: `${GENERIC_ERR} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
  }

  // Success — clear rate-limit, write session
  writeRL({ attempts: 0, lockedUntil: 0 });
  const token = rnd() + rnd();
  const session: AdminSession = { email: creds.email, expiresAt: Date.now() + SESSION_TTL_MS, token };
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

/** Sign out — removes session from sessionStorage. */
export function signOutAdmin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/** Change admin password after verifying the current one. */
export async function changeAdminPassword(
  currentPw: string,
  newPw: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAdminAuthenticated()) return { ok: false, error: 'Not authenticated.' };

  const creds = readCreds();
  if (!creds) return { ok: false, error: 'No admin credentials found.' };

  let verified = false;
  try { verified = await verifyPassword(currentPw, creds.pwHash); } catch { verified = false; }
  if (!verified) return { ok: false, error: 'Current password is incorrect.' };

  if (newPw.length < 8)
    return { ok: false, error: 'New password must be at least 8 characters.' };
  if (!/[A-Za-z]/.test(newPw) || !/\d/.test(newPw))
    return { ok: false, error: 'Password must contain at least one letter and one number.' };
  if (newPw === currentPw)
    return { ok: false, error: 'New password must differ from the current one.' };

  const pwHash = await hashPassword(newPw);
  writeCreds({ ...creds, pwHash });
  return { ok: true };
}

/** Reset admin creds (e.g. factory reset — wipes everything). */
export function resetAdminCreds() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_CREDS_KEY);
  localStorage.removeItem(ADMIN_RL_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
