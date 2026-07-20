'use client';

// Lightweight client-side store backed by localStorage so the admin panel can
// drive homepage content (brand carousel + promotional photo/video banners)
// without a backend. Changes broadcast a custom event so open pages update live.
//
// All URL fields are run through `sanitizeImageUrl` on write so hostile schemes
// (`javascript:` / non-image `data:` etc.) cannot be smuggled into `<img>` /
// `<video>` `src` attributes from the admin form.

import { sanitizeImageUrl } from './security';
import { products as defaultProductsSeed, categories as defaultCategoriesSeed, type Product } from './data';
import { getAdminToken } from './adminAuth';

export type Brand = { id: string; name: string; short: string; logo?: string };
export type Promo = {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string; // image data-URL/URL or video URL
  link: string; // CTA destination
  active: boolean;
};

/**
 * Product record managed by the admin panel. Extends the storefront `Product`
 * shape with a multi-image gallery (`images[0]` is mirrored into `image` for
 * back-compat), inventory fields (`reorderAt`, `sku`) and an `active` flag.
 */
export type AdminProduct = Product & {
  images: string[];
  sku: string;
  reorderAt: number;
  active: boolean;
  updatedAt: number;
};

export type AdminCategory = {
  id: string;
  label: string;
  icon: string;   // emoji or 1–2 chars
  color: string;
  image?: string; // optional tile image (data-URL or https://…) — used on the homepage
  active: boolean;
};

const BRANDS_KEY = 'mb_brands_v1';
const PROMOS_KEY = 'mb_promos_v1';
const PRODUCTS_KEY = 'mb_products_v1';
const CATEGORIES_KEY = 'mb_categories_v1';
const EVENT = 'mb-store-change';

export const defaultBrands: Brand[] = [
  { id: 'b1', name: 'MuscleBlaze', short: 'MB' },
  { id: 'b2', name: 'Optimum Nutrition', short: 'ON' },
  { id: 'b3', name: 'Dymatize', short: 'DYM' },
  { id: 'b4', name: 'MyProtein', short: 'MP' },
  { id: 'b5', name: 'GNC', short: 'GNC' },
  { id: 'b6', name: 'Cellucor', short: 'C4' },
  { id: 'b7', name: 'MuscleTech', short: 'MT' },
  { id: 'b8', name: 'BPI Sports', short: 'BPI' },
  { id: 'b9', name: 'AS-IT-IS', short: 'AS' },
  { id: 'b10', name: 'Scitron', short: 'SC' },
];

export const defaultPromos: Promo[] = [
  {
    id: 'p1',
    title: 'Mega Protein Sale — Up to 40% Off',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=1600&q=80',
    link: '/products',
    active: true,
  },
  {
    id: 'p2',
    title: 'New Arrivals — Premium Whey',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80',
    link: '/products',
    active: true,
  },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export const getBrands = (): Brand[] => read(BRANDS_KEY, defaultBrands);
export const saveBrands = (brands: Brand[]) => {
  // Sanitize each logo URL — reject javascript:/non-image data: payloads.
  const clean = brands.map(b => ({ ...b, logo: sanitizeImageUrl(b.logo) }));
  write(BRANDS_KEY, clean);
};

/** Update a single brand (used by the admin to swap or clear a logo). */
export const updateBrand = (id: string, patch: Partial<Brand>): Brand | null => {
  const list = getBrands();
  let updated: Brand | null = null;
  const next = list.map(b => {
    if (b.id !== id) return b;
    updated = { ...b, ...patch };
    return updated;
  });
  saveBrands(next);
  return updated;
};

export const getPromos = (): Promo[] => read(PROMOS_KEY, defaultPromos);
export const savePromos = (promos: Promo[]) => {
  const clean = promos.map(p => ({
    ...p,
    url: sanitizeImageUrl(p.url) ?? '',
    // `link` is a same-origin path in normal usage — still block javascript:
    link: sanitizeImageUrl(p.link) ?? '/products',
  }));
  write(PROMOS_KEY, clean);
};

/** Subscribe to store changes (same-tab custom event + cross-tab storage event). */
export function onStoreChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/** Convert an uploaded File to a base64 data URL (so it persists in localStorage). */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const uid = () => Math.random().toString(36).slice(2, 9);

// ─────────────────────────────────────────────────────────────────────────────
// Products (admin-managed)
// ─────────────────────────────────────────────────────────────────────────────

const skuFromName = (name: string, id: string) =>
  (name.trim().split(/\s+/).slice(0, 3).map(w => w.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4)).join('-') || id.toUpperCase()) +
  '-' + id.toUpperCase().slice(-3);

/** Convert a storefront `Product` into an `AdminProduct` (for first-run seed). */
function toAdminProduct(p: Product): AdminProduct {
  return {
    ...p,
    images: [p.image].filter(Boolean),
    sku: skuFromName(p.name, p.id),
    reorderAt: Math.max(20, Math.floor((p.stock ?? 0) * 0.3)),
    active: true,
    updatedAt: Date.now(),
  };
}

export const defaultAdminProducts: AdminProduct[] = defaultProductsSeed.map(toAdminProduct);

export const defaultCategories: AdminCategory[] = defaultCategoriesSeed.map(c => ({
  id: c.id,
  label: c.label,
  icon: c.icon,
  color: c.color,
  active: true,
}));

/**
 * Sanitize + normalise an admin product before writing to storage. Runs every
 * image URL through the image-URL allow-list and keeps `image` in sync with
 * `images[0]` so consumer components that read the legacy single-image field
 * keep working.
 */
function sanitizeAdminProduct(p: AdminProduct): AdminProduct {
  const images = (p.images ?? [])
    .map(u => sanitizeImageUrl(u))
    .filter((u): u is string => Boolean(u));
  const primary = images[0] ?? sanitizeImageUrl(p.image) ?? '';
  return {
    ...p,
    images,
    image: primary,
    name: String(p.name ?? '').slice(0, 200),
    brand: String(p.brand ?? '').slice(0, 100),
    category: String(p.category ?? '').slice(0, 60),
    sku: String(p.sku ?? '').slice(0, 60),
    description: String(p.description ?? '').slice(0, 2000),
    price: Math.max(0, Math.floor(Number(p.price) || 0)),
    originalPrice: Math.max(0, Math.floor(Number(p.originalPrice) || 0)),
    discount: Math.max(0, Math.min(99, Math.floor(Number(p.discount) || 0))),
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    reorderAt: Math.max(0, Math.floor(Number(p.reorderAt) || 0)),
    rating: Math.max(0, Math.min(5, Number(p.rating) || 0)),
    reviews: Math.max(0, Math.floor(Number(p.reviews) || 0)),
    tags: (p.tags ?? []).map(t => String(t).slice(0, 40)).slice(0, 20),
    flavors: (p.flavors ?? []).map(f => String(f).slice(0, 40)).slice(0, 20),
    sizes: (p.sizes ?? []).map(s => String(s).slice(0, 20)).slice(0, 12),
    updatedAt: Date.now(),
  };
}

export const getProducts = (): AdminProduct[] => {
  const raw = read<AdminProduct[] | null>(PRODUCTS_KEY, null);
  if (raw && Array.isArray(raw)) return raw;
  // Seed defaults on first read so the admin panel + shop share a source of truth.
  write(PRODUCTS_KEY, defaultAdminProducts);
  return defaultAdminProducts;
};

export const saveProducts = (list: AdminProduct[]) => {
  write(PRODUCTS_KEY, list.map(sanitizeAdminProduct));
};

export const addProduct = (p: Omit<AdminProduct, 'id' | 'updatedAt'> & { id?: string }): AdminProduct => {
  const list = getProducts();
  const next: AdminProduct = sanitizeAdminProduct({ ...p, id: p.id ?? 'p_' + uid(), updatedAt: Date.now() } as AdminProduct);
  saveProducts([next, ...list]);
  return next;
};

export const updateProduct = (id: string, patch: Partial<AdminProduct>): AdminProduct | null => {
  const list = getProducts();
  let updated: AdminProduct | null = null;
  const next = list.map(p => {
    if (p.id !== id) return p;
    updated = sanitizeAdminProduct({ ...p, ...patch, updatedAt: Date.now() });
    return updated;
  });
  saveProducts(next);
  return updated;
};

export const deleteProduct = (id: string) => {
  saveProducts(getProducts().filter(p => p.id !== id));
};

// ─────────────────────────────────────────────────────────────────────────────
// Categories (admin-managed)
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeCategory(c: AdminCategory): AdminCategory {
  return {
    id: String(c.id ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || uid(),
    label: String(c.label ?? '').slice(0, 60),
    icon: String(c.icon ?? '').slice(0, 6),
    color: /^#[0-9A-Fa-f]{3,8}$/.test(String(c.color)) ? c.color : '#FF6B00',
    image: sanitizeImageUrl(c.image),
    active: c.active !== false,
  };
}

export const getCategories = (): AdminCategory[] => {
  const raw = read<AdminCategory[] | null>(CATEGORIES_KEY, null);
  if (raw && Array.isArray(raw)) return raw;
  write(CATEGORIES_KEY, defaultCategories);
  return defaultCategories;
};

export const saveCategories = (list: AdminCategory[]) => {
  write(CATEGORIES_KEY, list.map(sanitizeCategory));
};

export const addCategory = (c: Omit<AdminCategory, 'id'> & { id?: string }): AdminCategory => {
  const list = getCategories();
  const next = sanitizeCategory({ ...c, id: c.id ?? c.label.toLowerCase().replace(/\s+/g, '-') } as AdminCategory);
  // dedupe by id — treat as an update if it collides
  const exists = list.some(x => x.id === next.id);
  saveCategories(exists ? list.map(x => x.id === next.id ? next : x) : [...list, next]);
  return next;
};

export const updateCategory = (id: string, patch: Partial<AdminCategory>): AdminCategory | null => {
  const list = getCategories();
  let updated: AdminCategory | null = null;
  const next = list.map(c => {
    if (c.id !== id) return c;
    updated = sanitizeCategory({ ...c, ...patch });
    return updated;
  });
  saveCategories(next);
  return updated;
};

export const deleteCategory = (id: string) => {
  saveCategories(getCategories().filter(c => c.id !== id));
};

// ─────────────────────────────────────────────────────────────────────────────
// Personal Trainers + Training Plans (admin-managed)
// ─────────────────────────────────────────────────────────────────────────────

export type Trainer = {
  id: string;
  name: string;
  specialty: string;   // e.g. "Strength & Conditioning"
  experience: number;  // years
  bio: string;
  image?: string;
  rating: number;      // 0–5
  active: boolean;
};

export type TrainingPlan = {
  id: string;
  name: string;        // e.g. "1-on-1 Personal Training"
  tagline: string;     // short one-liner
  price: number;       // current price (₹)
  oldPrice: number;    // strike-through price (0 = hide)
  period: string;      // e.g. "per month", "8 sessions", "3 months"
  features: string[];  // bullet list
  popular: boolean;    // highlight as "Most Popular"
  active: boolean;
};

const TRAINERS_KEY = 'mb_trainers_v1';
const PLANS_KEY = 'mb_plans_v1';

export const defaultTrainers: Trainer[] = [
  {
    id: 't1',
    name: 'Rahul Verma',
    specialty: 'Strength & Muscle Building',
    experience: 8,
    bio: 'Certified strength coach specialising in hypertrophy, powerlifting and body recomposition. Helped 500+ clients hit their goals.',
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500&q=80',
    rating: 4.9,
    active: true,
  },
  {
    id: 't2',
    name: 'Anjali Singh',
    specialty: 'Weight Loss & Nutrition',
    experience: 6,
    bio: 'Fat-loss and nutrition expert. Builds sustainable diet + training plans tailored to your lifestyle and food preferences.',
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500&q=80',
    rating: 4.8,
    active: true,
  },
  {
    id: 't3',
    name: 'Vikram Yadav',
    specialty: 'Functional & Athletic Training',
    experience: 10,
    bio: 'Ex-athlete and functional-training specialist focused on mobility, conditioning and injury-free performance.',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80',
    rating: 5.0,
    active: true,
  },
];

export const defaultPlans: TrainingPlan[] = [
  {
    id: 'pl1',
    name: 'Starter Session',
    tagline: 'Try a single 1-on-1 session',
    price: 499,
    oldPrice: 799,
    period: 'per session',
    features: ['1 one-on-one session', 'Fitness assessment', 'Form correction', 'Personalised advice'],
    popular: false,
    active: true,
  },
  {
    id: 'pl2',
    name: 'Personal Training',
    tagline: 'Most popular — dedicated coaching',
    price: 3999,
    oldPrice: 5999,
    period: 'per month',
    features: ['12 sessions / month', 'Custom workout plan', 'Diet & nutrition plan', 'WhatsApp support', 'Weekly progress tracking'],
    popular: true,
    active: true,
  },
  {
    id: 'pl3',
    name: 'Transformation',
    tagline: '3-month body transformation',
    price: 9999,
    oldPrice: 15999,
    period: '3 months',
    features: ['Everything in Personal Training', 'Priority scheduling', 'Supplement guidance', 'Monthly InBody analysis', 'Guaranteed results'],
    popular: false,
    active: true,
  },
];

function sanitizeTrainer(t: Trainer): Trainer {
  return {
    id: String(t.id ?? uid()).slice(0, 40) || uid(),
    name: String(t.name ?? '').slice(0, 80),
    specialty: String(t.specialty ?? '').slice(0, 100),
    experience: Math.max(0, Math.min(60, Math.floor(Number(t.experience) || 0))),
    bio: String(t.bio ?? '').slice(0, 600),
    image: sanitizeImageUrl(t.image),
    rating: Math.max(0, Math.min(5, Number(t.rating) || 0)),
    active: t.active !== false,
  };
}

function sanitizePlan(p: TrainingPlan): TrainingPlan {
  return {
    id: String(p.id ?? uid()).slice(0, 40) || uid(),
    name: String(p.name ?? '').slice(0, 80),
    tagline: String(p.tagline ?? '').slice(0, 140),
    price: Math.max(0, Math.floor(Number(p.price) || 0)),
    oldPrice: Math.max(0, Math.floor(Number(p.oldPrice) || 0)),
    period: String(p.period ?? '').slice(0, 40),
    features: (p.features ?? []).map(f => String(f).slice(0, 120)).slice(0, 12),
    popular: p.popular === true,
    active: p.active !== false,
  };
}

export const getTrainers = (): Trainer[] => {
  const raw = read<Trainer[] | null>(TRAINERS_KEY, null);
  if (raw && Array.isArray(raw)) return raw;
  write(TRAINERS_KEY, defaultTrainers);
  return defaultTrainers;
};

export const saveTrainers = (list: Trainer[]) => {
  write(TRAINERS_KEY, list.map(sanitizeTrainer));
};

export const addTrainer = (t: Omit<Trainer, 'id'> & { id?: string }): Trainer => {
  const next = sanitizeTrainer({ ...t, id: t.id ?? 't_' + uid() } as Trainer);
  saveTrainers([...getTrainers(), next]);
  return next;
};

export const updateTrainer = (id: string, patch: Partial<Trainer>): Trainer | null => {
  let updated: Trainer | null = null;
  const next = getTrainers().map(t => {
    if (t.id !== id) return t;
    updated = sanitizeTrainer({ ...t, ...patch });
    return updated;
  });
  saveTrainers(next);
  return updated;
};

export const deleteTrainer = (id: string) => {
  saveTrainers(getTrainers().filter(t => t.id !== id));
};

export const getPlans = (): TrainingPlan[] => {
  const raw = read<TrainingPlan[] | null>(PLANS_KEY, null);
  if (raw && Array.isArray(raw)) return raw;
  write(PLANS_KEY, defaultPlans);
  return defaultPlans;
};

export const savePlans = (list: TrainingPlan[]) => {
  write(PLANS_KEY, list.map(sanitizePlan));
};

export const addPlan = (p: Omit<TrainingPlan, 'id'> & { id?: string }): TrainingPlan => {
  const next = sanitizePlan({ ...p, id: p.id ?? 'pl_' + uid() } as TrainingPlan);
  savePlans([...getPlans(), next]);
  return next;
};

export const updatePlan = (id: string, patch: Partial<TrainingPlan>): TrainingPlan | null => {
  let updated: TrainingPlan | null = null;
  const next = getPlans().map(p => {
    if (p.id !== id) return p;
    updated = sanitizePlan({ ...p, ...patch });
    return updated;
  });
  savePlans(next);
  return updated;
};

export const deletePlan = (id: string) => {
  savePlans(getPlans().filter(p => p.id !== id));
};

// ─────────────────────────────────────────────────────────────────────────────
// Wishlist (persisted list of product IDs)
// ─────────────────────────────────────────────────────────────────────────────

const WISHLIST_KEY = 'mb_wishlist_v1';

export const getWishlist = (): string[] => {
  const raw = read<string[] | null>(WISHLIST_KEY, null);
  return Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
};

export const isWished = (id: string): boolean => getWishlist().includes(id);

export const toggleWishlist = (id: string): boolean => {
  const list = getWishlist();
  const has = list.includes(id);
  const next = has ? list.filter(x => x !== id) : [...list, id];
  write(WISHLIST_KEY, next);
  return !has; // new wished state
};

export const removeWishlist = (id: string) => {
  write(WISHLIST_KEY, getWishlist().filter(x => x !== id));
};

// ─────────────────────────────────────────────────────────────────────────────
// Server sync — the DB is the single source of truth so every device / customer
// sees the same live catalogue. These helpers fetch from the PHP API and write
// into the local cache (which fires `mb-store-change`, so open pages refresh).
// Admin writes go through the bearer-token endpoints below.
// ─────────────────────────────────────────────────────────────────────────────

/** Auth headers for admin write calls — carries the logged-in admin's bearer
 *  session token. No static admin key is shipped to the browser; the server
 *  verifies the session token instead. */
function adminHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = getAdminToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

function mapServerProduct(r: Record<string, unknown>): AdminProduct {
  const imgs = Array.isArray(r.images) ? (r.images as unknown[]).map(String).filter(Boolean) : [];
  const image = String(r.image ?? r.image_url ?? '') || imgs[0] || '';
  return sanitizeAdminProduct({
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    brand: String(r.brand ?? ''),
    category: String(r.category ?? ''),
    price: Number(r.price) || 0,
    originalPrice: Number(r.originalPrice ?? r.original_price) || 0,
    discount: Number(r.discount) || 0,
    rating: Number(r.rating) || 0,
    reviews: Number(r.reviews ?? r.review_count) || 0,
    image,
    images: imgs.length ? imgs : (image ? [image] : []),
    flavors: Array.isArray(r.flavors) ? (r.flavors as string[]) : [],
    sizes: Array.isArray(r.sizes) ? (r.sizes as string[]) : [],
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    badge: (r.badge as AdminProduct['badge']) || undefined,
    deliveryTime: String(r.deliveryTime ?? r.delivery_time ?? '1-2 days'),
    stock: Number(r.stock) || 0,
    description: String(r.description ?? ''),
    sku: String(r.sku ?? ''),
    reorderAt: Number(r.reorderAt ?? r.reorder_at ?? 20) || 20,
    active: r.active !== undefined ? Boolean(r.active) : (r.is_active !== 0),
    updatedAt: Date.now(),
  } as AdminProduct);
}

/** Storefront sync: pull the live (active-only) catalogue into the local cache. */
export async function syncProductsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/products/list?limit=500');
    if (!res.ok) return;
    const data = await res.json();
    const rows = Array.isArray(data?.products) ? data.products : [];
    // Never wipe a good local catalogue on an empty / misconfigured server.
    if (rows.length === 0) return;
    write(PRODUCTS_KEY, rows.map(mapServerProduct));
  } catch { /* offline — keep local cache */ }
}

/** Admin sync: pull ALL products (incl. hidden) using the admin bearer token. */
export async function syncProductsForAdmin(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/products/list?all=1&limit=500', { headers: adminHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const rows = Array.isArray(data?.products) ? data.products : [];
    if (rows.length === 0) return;
    write(PRODUCTS_KEY, rows.map(mapServerProduct));
  } catch { /* offline — keep local cache */ }
}

function mapServerCategory(r: Record<string, unknown>): AdminCategory {
  return sanitizeCategory({
    id: String(r.id ?? ''),
    label: String(r.label ?? r.name ?? ''),
    icon: String(r.icon ?? ''),
    color: String(r.color ?? '#FF6B00'),
    image: String(r.image ?? r.image_url ?? ''),
    active: r.active !== false && r.is_active !== 0,
  } as AdminCategory);
}

/** Pull the live category list into the local cache (fires store-change). */
export async function syncCategoriesFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/categories/list');
    if (!res.ok) return;
    const data = await res.json();
    const rows = Array.isArray(data?.categories) ? data.categories : [];
    if (rows.length === 0) return;
    write(CATEGORIES_KEY, rows.map(mapServerCategory));
  } catch { /* offline — keep local cache */ }
}

function toServerProductPayload(p: Partial<AdminProduct>): Record<string, unknown> {
  return {
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount,
    description: p.description,
    image: p.image ?? (p.images?.[0] ?? ''),
    images: p.images ?? [],
    flavors: p.flavors ?? [],
    sizes: p.sizes ?? [],
    tags: p.tags ?? [],
    badge: p.badge ?? null,
    deliveryTime: p.deliveryTime ?? '',
    stock: p.stock ?? 0,
  };
}

/** Create a product on the server. Returns the server-generated id, or null. */
export async function createProductServer(p: Partial<AdminProduct>): Promise<string | null> {
  try {
    const res = await fetch('/api/products/create', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify(toServerProductPayload(p)),
    });
    if (!res.ok) return null;
    const d = await res.json().catch(() => null);
    return (d?.id as string) ?? null;
  } catch { return null; }
}

/** Push a product update to the server (only server-known fields are sent). */
export async function updateProductServer(id: string, patch: Partial<AdminProduct>): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = { id };
    const keys: (keyof AdminProduct)[] = [
      'name', 'brand', 'category', 'price', 'originalPrice', 'discount',
      'description', 'image', 'images', 'flavors', 'sizes', 'tags',
      'badge', 'deliveryTime', 'stock', 'rating', 'reviews',
    ];
    for (const k of keys) if (patch[k] !== undefined) payload[k] = patch[k];
    if (patch.active !== undefined) payload.isActive = patch.active;
    if (Object.keys(payload).length === 1) return true; // nothing server-relevant changed
    const res = await fetch('/api/products/update', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify(payload),
    });
    return res.ok;
  } catch { return false; }
}

/** Soft-delete a product on the server (keeps order history intact). */
export async function deleteProductServer(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/products/delete', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch { return false; }
}

/** Upsert a category on the server. */
export async function saveCategoryServer(c: Partial<AdminCategory>): Promise<boolean> {
  try {
    const res = await fetch('/api/categories/save', {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({
        id: c.id, label: c.label, icon: c.icon, color: c.color,
        image: c.image ?? '', active: c.active !== false,
      }),
    });
    return res.ok;
  } catch { return false; }
}

/** Delete a category on the server. */
export async function deleteCategoryServer(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/categories/delete', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Brands (server-backed so CSV-added / admin brands sync across every device)
// ─────────────────────────────────────────────────────────────────────────────

function mapServerBrand(r: Record<string, unknown>): Brand {
  const name = String(r.name ?? '').slice(0, 100);
  const short =
    (name.replace(/[^A-Za-z0-9\s]/g, '').split(/\s+/).map(w => w[0] ?? '').join('') || name)
      .slice(0, 3)
      .toUpperCase();
  return {
    id: String(r.id ?? uid()),
    name,
    short,
    logo: sanitizeImageUrl(String(r.logo ?? r.logo_url ?? '')),
  };
}

/**
 * Pull the live brand directory into the local cache and MERGE it with any
 * local-only brands (deduped by name). Merging — instead of overwriting — means
 * a partial server list can never wipe the local defaults. Fires store-change.
 */
export async function syncBrandsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/brands/list');
    if (!res.ok) return;
    const data = await res.json();
    const rows = Array.isArray(data?.brands) ? data.brands : [];
    if (rows.length === 0) return;
    const byName = new Map<string, Brand>();
    for (const b of getBrands()) byName.set(b.name.toLowerCase(), b);
    for (const b of rows.map(mapServerBrand)) byName.set(b.name.toLowerCase(), b); // server wins
    saveBrands(Array.from(byName.values()));
  } catch { /* offline — keep local cache */ }
}

/** Upsert a brand on the server. */
export async function saveBrandServer(b: Partial<Brand>): Promise<boolean> {
  try {
    const res = await fetch('/api/brands/save', {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ id: b.id, name: b.name, logo: b.logo ?? '' }),
    });
    return res.ok;
  } catch { return false; }
}

/** Delete a brand on the server. */
export async function deleteBrandServer(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/brands/delete', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch { return false; }
}

/* ── Coupons ──────────────────────────────────────────────────────────────
   Coupons live server-side only (single source of truth). Admin CRUD is
   bearer-authenticated; validation is public so the storefront can check a
   code against a cart subtotal before checkout. The order endpoint always
   re-validates + recomputes the discount server-side (never trusts client). */

export type Coupon = {
  id?: number;
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount?: number;
  expiresAt?: string | null;
  active: boolean;
};

/** Admin: list every coupon. */
export async function listCouponsServer(): Promise<Coupon[]> {
  try {
    const res = await fetch('/api/coupons/list', { headers: adminHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.coupons) ? (data.coupons as Coupon[]) : [];
  } catch { return []; }
}

/** Admin: create or update a coupon. */
export async function saveCouponServer(c: Partial<Coupon>): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/coupons/save', {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({
        id: c.id,
        code: c.code,
        description: c.description ?? '',
        discountType: c.discountType ?? 'percent',
        discountValue: c.discountValue ?? 0,
        minAmount: c.minAmount ?? 0,
        maxDiscount: c.maxDiscount ?? '',
        usageLimit: c.usageLimit ?? '',
        expiresAt: c.expiresAt ?? '',
        active: c.active === false ? 0 : 1,
      }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: (data as { error?: string }).error ?? 'Could not save coupon' };
  } catch { return { ok: false, message: 'Network error' }; }
}

/** Admin: delete a coupon. */
export async function deleteCouponServer(id: number): Promise<boolean> {
  try {
    const res = await fetch('/api/coupons/delete', {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch { return false; }
}

export type CouponValidation = {
  ok: boolean;
  code?: string;
  discount?: number;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
  minAmount?: number;
  maxDiscount?: number | null;
  description?: string;
  message?: string;
};

/** Public: validate a code against a cart subtotal and return the discount. */
export async function validateCouponServer(code: string, subtotal: number): Promise<CouponValidation> {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data as { valid?: boolean }).valid) {
      const d = data as CouponValidation & { valid: boolean };
      return {
        ok: true,
        code: d.code,
        discount: d.discount,
        discountType: d.discountType,
        discountValue: d.discountValue,
        minAmount: d.minAmount,
        maxDiscount: d.maxDiscount ?? null,
        description: d.description,
      };
    }
    return { ok: false, message: (data as { error?: string }).error ?? 'Invalid coupon code' };
  } catch { return { ok: false, message: 'Network error' }; }
}

/* ── Site content (CMS) ────────────────────────────────────────────────────
   Editable homepage hero + top announcement bar. Content is stored server-side
   (site_content table) and cached in localStorage for instant, offline-safe
   render. Admin edits go through saveSiteContentServer. */

const CONTENT_KEY = 'mb_site_content_v1';

export type HeroContent = {
  eyebrow: string;
  headingTop: string;    // small orange kicker line ("Muscle Mantra")
  headingMain: string;   // large headline line 1 ("Fuel Your")
  headingAccent: string; // large headline line 2, gradient ("Strength")
  subheading: string;
  images: string[];      // rotating background images
};

export type AnnouncementContent = {
  enabled: boolean;
  text: string;
  link: string;
};

export type SiteContent = {
  hero?: Partial<HeroContent>;
  announcement?: Partial<AnnouncementContent>;
  [key: string]: unknown;
};

export const defaultHero: HeroContent = {
  eyebrow: "100% Authentic · Patna's Supplement Store",
  headingTop: 'Muscle Mantra',
  headingMain: 'Fuel Your',
  headingAccent: 'Strength',
  subheading:
    "Muscle Mantra is Patna's trusted online supplement store. Shop 100% authentic whey protein, creatine, pre-workout, mass gainer & BCAA — sourced directly from official brands, at unbeatable prices with fast, reliable doorstep delivery across Patna.",
  images: ['/hero-1.jpg', '/hero-2.jpg'],
};

export const defaultAnnouncement: AnnouncementContent = {
  enabled: false,
  text: '',
  link: '',
};

/** Read the cached site content synchronously (for instant render). */
export const getSiteContent = (): SiteContent => read<SiteContent>(CONTENT_KEY, {});

/** Merged hero content — saved overrides on top of the built-in defaults. */
export function getHeroContent(): HeroContent {
  const c = getSiteContent().hero ?? {};
  const imgs = Array.isArray(c.images) ? c.images.filter(Boolean) as string[] : [];
  return { ...defaultHero, ...c, images: imgs.length ? imgs : defaultHero.images };
}

/** Merged announcement-bar content. */
export function getAnnouncement(): AnnouncementContent {
  return { ...defaultAnnouncement, ...(getSiteContent().announcement ?? {}) };
}

/** Pull the live site content from the server into the local cache. */
export async function syncSiteContentFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/content/get');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.content && typeof data.content === 'object') {
      write(CONTENT_KEY, data.content as SiteContent);
    }
  } catch { /* ignore */ }
}

/** Admin: save one content section to the server and refresh the local cache. */
export async function saveSiteContentServer(key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch('/api/content/save', {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) write(CONTENT_KEY, { ...getSiteContent(), [key]: value });
    return res.ok;
  } catch { return false; }
}

/**
 * Upload an image file to the server and return its public https URL (or null).
 * Used for product + category images so they persist and sync across devices —
 * base64 data-URLs are never stored server-side.
 */
export async function uploadImageToServer(file: File, type = 'product', entityId?: string): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('type', type);
    if (entityId) fd.append('entity_id', entityId);
    const res = await fetch('/api/images/upload', { method: 'POST', headers: adminHeaders(false), body: fd });
    if (!res.ok) return null;
    const d = await res.json().catch(() => null);
    return (d?.url as string) ?? null;
  } catch { return null; }
}


