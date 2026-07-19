'use client';

/**
 * Admin authentication — server-backed (PHP + MySQL).
 *
 *  • Owner logs in with a fixed email; the owner password lives in api/.env.
 *  • The owner can appoint / revoke other admins (persisted server-side, so
 *    they work from any device).
 *  • Admins activate + reset their password via an emailed OTP (SMTP).
 *
 * The session token is kept in sessionStorage (auto-clears on browser close);
 * every server call carries it as a Bearer token and the server is the real
 * source of truth (a 401 signs the user out).
 */

const SESSION_KEY = 'mb_admin_sess_v2';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h client-side hint; server enforces real expiry

export interface AdminSession {
  token: string;
  email: string;
  name: string;
  isOwner: boolean;
  expiresAt: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  activated: boolean;
  isOwner: boolean;
  createdAt: number | null;
}

// ─── session storage ─────────────────────────────────────────────────────────

function readSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (!s?.token || !s?.email || !s?.expiresAt) return null;
    return s;
  } catch { return null; }
}

function writeSession(s: AdminSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function signOutAdmin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── public getters ──────────────────────────────────────────────────────────

export function isAdminAuthenticated(): boolean {
  const s = readSession();
  if (!s) return false;
  if (s.expiresAt < Date.now()) { signOutAdmin(); return false; }
  return true;
}

export function getAdminEmail(): string | null {
  return isAdminAuthenticated() ? readSession()!.email : null;
}

export function getAdminName(): string | null {
  return isAdminAuthenticated() ? readSession()!.name : null;
}

export function isAdminOwner(): boolean {
  const s = readSession();
  return !!s && s.isOwner && s.expiresAt >= Date.now();
}

export function getAdminToken(): string | null {
  return isAdminAuthenticated() ? readSession()!.token : null;
}

// ─── fetch helper ────────────────────────────────────────────────────────────

async function api<T = unknown>(
  path: string,
  body?: unknown,
  method: 'GET' | 'POST' = 'POST',
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const token = readSession()?.token;
    const res = await fetch(`/api/admin/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    let data: unknown = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) {
      if (res.status === 401) signOutAdmin();
      const msg = (data as { error?: string })?.error ?? `Request failed (${res.status}).`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}

// ─── auth actions ────────────────────────────────────────────────────────────

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await api<{ token: string; admin: { email: string; name: string; isOwner: boolean } }>(
    'login',
    { email: email.trim().toLowerCase(), password },
  );
  if (!res.ok || !res.data) return { ok: false, error: res.error ?? 'Sign-in failed.' };
  writeSession({
    token: res.data.token,
    email: res.data.admin.email,
    name: res.data.admin.name,
    isOwner: res.data.admin.isOwner,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return { ok: true };
}

/** Request an OTP email. purpose 'reset' (default) or 'create'. */
export async function requestAdminOtp(
  email: string,
  purpose: 'reset' | 'create' = 'reset',
): Promise<{ ok: boolean; error?: string }> {
  const res = await api('request-otp', { email: email.trim().toLowerCase(), purpose });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Verify OTP + set a new password. */
export async function resetAdminPassword(
  email: string,
  otp: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await api('reset-password', { email: email.trim().toLowerCase(), otp: otp.trim(), password });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Change the signed-in admin's own password. */
export async function changeAdminPassword(
  currentPw: string,
  newPw: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await api('change-password', { currentPassword: currentPw, newPassword: newPw });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

// ─── owner-only admin management ─────────────────────────────────────────────

export async function listAdmins(): Promise<{ ok: boolean; admins?: AdminUser[]; error?: string }> {
  const res = await api<{ admins: AdminUser[] }>('list', undefined, 'GET');
  return res.ok ? { ok: true, admins: res.data?.admins ?? [] } : { ok: false, error: res.error };
}

export async function appointAdmin(
  name: string,
  email: string,
): Promise<{ ok: boolean; emailed?: boolean; error?: string }> {
  const res = await api<{ emailed: boolean }>('appoint', { name: name.trim(), email: email.trim().toLowerCase() });
  return res.ok ? { ok: true, emailed: res.data?.emailed } : { ok: false, error: res.error };
}

export async function revokeAdmin(userId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await api('revoke', { userId });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
