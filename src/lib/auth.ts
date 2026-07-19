'use client';

/**
 * Muscle Mantra — Auth module
 * Backed by PHP/MySQL API. Token stored in localStorage, user cached for instant reads.
 */

const TOKEN_KEY = 'mb_token_v3';
const USER_KEY  = 'mb_user_v3';
const EVENT     = 'mb-auth-change';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google';
  isAdmin?: boolean;
  createdAt: number;
};

// ── Token / cache helpers ──────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  broadcast();
}

function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  broadcast();
}

function broadcast(): void {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent(EVENT));
}

/** Synchronous — reads from localStorage cache. Fast, no API call. */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  if (!getToken()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

/** Subscribe to login/logout events. Returns unsubscribe fn. */
export function onAuthChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// ── API helpers ────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function apiPost<T>(
  path: string,
  payload: unknown,
  withAuth = false,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: withAuth ? authHeaders() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Request failed.' };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

// ── Auth operations ────────────────────────────────────────────────────────

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: User }> {
  const res = await apiPost<{ token: string; user: User }>(
    '/api/auth/register', { name, email, password },
  );
  if (!res.ok || !res.data) return { ok: false, error: res.error };
  saveSession(res.data.token, res.data.user);
  return { ok: true, user: res.data.user };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; user?: User }> {
  const res = await apiPost<{ token: string; user: User }>(
    '/api/auth/login', { email, password },
  );
  if (!res.ok || !res.data) return { ok: false, error: res.error };
  saveSession(res.data.token, res.data.user);
  return { ok: true, user: res.data.user };
}

export async function signInWithGoogleProfile(profile: {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}): Promise<{ ok: boolean; error?: string; user?: User }> {
  const res = await apiPost<{ token: string; user: User }>(
    '/api/auth/google', profile,
  );
  if (!res.ok || !res.data) return { ok: false, error: res.error };
  saveSession(res.data.token, res.data.user);
  return { ok: true, user: res.data.user };
}

/** Sign out immediately (clears cache), notifies server in background. */
export function signOut(): void {
  const token = getToken();
  clearSession();
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
}

/** Validate session with server and refresh cached user. Call on app mount. */
export async function refreshUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearSession(); return null; }
    const { user } = (await res.json()) as { user: User };
    if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return getCurrentUser();
  }
}

export async function updateProfile(
  patch: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>,
): Promise<User | null> {
  const res = await apiPost<{ user: User }>('/api/auth/profile', patch, true);
  if (!res.ok || !res.data) return null;
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    broadcast();
  }
  return res.data.user;
}

// ── Utility functions ──────────────────────────────────────────────────────

export function initials(userOrName: User | string): string {
  const name = typeof userOrName === 'string' ? userOrName : (userOrName.name || userOrName.email);
  return name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function safeAvatar(userOrUrl: User | string | null | undefined): string | null {
  const url = typeof userOrUrl === 'string' ? userOrUrl
    : (userOrUrl != null ? userOrUrl.avatar : null);
  if (!url) return null;
  if (url.startsWith('https://') || /^data:image\/(png|jpeg|webp|gif);base64,/.test(url)) return url;
  return null;
}
