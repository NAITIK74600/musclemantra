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
