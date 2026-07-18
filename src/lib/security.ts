/**
 * Shared client-side security helpers.
 *
 * This is a front-end-only demo (no backend), so anything we sign / hash lives
 * in the browser. These helpers still enforce two important properties:
 *   1. URLs rendered as `src` / `href` never carry a `javascript:` / `vbscript:`
 *      or non-image `data:` payload (mitigates DOM-XSS from admin/user input).
 *   2. Passwords are hashed with PBKDF2-SHA256 + per-user salt using WebCrypto
 *      instead of a trivial 32-bit digest.
 */

/* ─────────────────────────────  URL SANITIZATION  ───────────────────────── */

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Return the URL if safe to render, or `undefined` if it's a hostile scheme
 * (`javascript:`, `vbscript:`, `file:`, non-image `data:` etc.). Relative URLs
 * (starting with `/`, `./`, `../`, `#`, `?`) are allowed as-is.
 */
export function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;

  // Reject control characters that can smuggle scheme confusion.
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return undefined;

  // Same-origin relatives are always safe.
  if (/^[\/#?]/.test(trimmed) || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  // Only allow image/video data URLs (used for admin uploads that persist in
  // localStorage as base64). Everything else in the `data:` family is unsafe.
  if (lower.startsWith('data:')) {
    return /^data:(image|video)\/[a-z0-9.+-]+;/.test(lower) ? trimmed : undefined;
  }

  // Blob URLs are same-origin object handles — safe when we create them, but
  // we don't accept them from persisted state to avoid injection.
  if (lower.startsWith('blob:')) return undefined;

  try {
    // If it parses as an absolute URL, ensure the scheme is on the allowlist.
    const parsed = new URL(trimmed);
    return SAFE_URL_SCHEMES.has(parsed.protocol) ? trimmed : undefined;
  } catch {
    // Not a valid absolute URL — treat as unsafe.
    return undefined;
  }
}

/** Sanitize an image URL specifically (rejects `mailto:` / `tel:`). */
export function sanitizeImageUrl(url: string | undefined | null): string | undefined {
  const safe = sanitizeUrl(url);
  if (!safe) return undefined;
  const lower = safe.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return undefined;
  return safe;
}

/* ─────────────────────────────  TEXT ESCAPING  ──────────────────────────── */

/** Basic HTML escape for any string interpolated into markup outside React. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────  PASSWORD HASHING (PBKDF2)  ──────────────────── */

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_HASH_BYTES = 32;
const PBKDF2_ALGO = 'SHA-256';

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hasSubtle(): boolean {
  return typeof globalThis.crypto !== 'undefined'
    && typeof globalThis.crypto.subtle !== 'undefined'
    && typeof globalThis.crypto.getRandomValues === 'function';
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_ALGO },
    key,
    PBKDF2_HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/**
 * Hash a password with PBKDF2-SHA256 + a fresh 128-bit salt.
 * Result is a self-describing `pbkdf2$<iter>$<saltB64>$<hashB64>` string.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!hasSubtle()) {
    throw new Error('WebCrypto is unavailable in this environment.');
  }
  const salt = new Uint8Array(PBKDF2_SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

/**
 * Verify a plaintext password against a stored PBKDF2 record produced by
 * `hashPassword`. Constant-time byte compare.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored || !hasSubtle()) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iter = Number(parts[1]);
  if (!Number.isFinite(iter) || iter < 10_000) return false;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = fromB64(parts[2]);
    expected = fromB64(parts[3]);
  } catch {
    return false;
  }
  const enc = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: iter, hash: PBKDF2_ALGO },
    key,
    expected.length * 8,
  );
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  // Constant-time compare
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

/* ─────────────────────────  PASSWORD STRENGTH  ──────────────────────────── */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hint?: string;
};

/** Cheap client-side password strength meter (0-4). Not a replacement for
 *  server-side policy — just guides the user to a decent secret. */
export function scorePassword(pw: string): PasswordStrength {
  const len = pw.length;
  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;

  // Common weak patterns knock a point off.
  if (/^(?:password|qwerty|abc123|12345678|letmein)/i.test(pw)) score = Math.max(0, score - 2);

  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
  const map: PasswordStrength[] = [
    { score: 0, label: 'Too weak', color: '#dc2626', hint: 'Use at least 8 characters.' },
    { score: 1, label: 'Weak',     color: '#f97316', hint: 'Add uppercase, numbers, or symbols.' },
    { score: 2, label: 'Fair',     color: '#eab308', hint: 'Mix letters, numbers and symbols.' },
    { score: 3, label: 'Good',     color: '#84cc16' },
    { score: 4, label: 'Strong',   color: '#22c55e' },
  ];
  return map[clamped];
}

/* ─────────────────────────  RATE LIMITING (LOGIN)  ──────────────────────── */

const RL_KEY = 'mb_login_rl_v1';
const RL_MAX_ATTEMPTS = 5;
const RL_WINDOW_MS = 15 * 60 * 1000; // 15 min

type RateEntry = { attempts: number; firstAt: number; lockedUntil?: number };

function readRateMap(): Record<string, RateEntry> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(RL_KEY) || '{}') as Record<string, RateEntry>; }
  catch { return {}; }
}
function writeRateMap(m: Record<string, RateEntry>) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(RL_KEY, JSON.stringify(m)); } catch { /* ignore quota */ }
}

/** Returns milliseconds remaining on a lockout, or 0 if unlocked. */
export function loginLockoutRemaining(emailKey: string): number {
  const map = readRateMap();
  const entry = map[emailKey.toLowerCase()];
  if (!entry?.lockedUntil) return 0;
  return Math.max(0, entry.lockedUntil - Date.now());
}

/** Record a failed login attempt. Returns the updated lockout ms (0 if none). */
export function recordFailedLogin(emailKey: string): number {
  const map = readRateMap();
  const key = emailKey.toLowerCase();
  const now = Date.now();
  const cur = map[key];
  const inWindow = cur && now - cur.firstAt < RL_WINDOW_MS;
  const next: RateEntry = inWindow
    ? { attempts: cur.attempts + 1, firstAt: cur.firstAt, lockedUntil: cur.lockedUntil }
    : { attempts: 1, firstAt: now };
  if (next.attempts >= RL_MAX_ATTEMPTS) next.lockedUntil = now + RL_WINDOW_MS;
  map[key] = next;
  writeRateMap(map);
  return next.lockedUntil ? next.lockedUntil - now : 0;
}

/** Clear the counter on a successful login. */
export function clearLoginAttempts(emailKey: string): void {
  const map = readRateMap();
  delete map[emailKey.toLowerCase()];
  writeRateMap(map);
}
