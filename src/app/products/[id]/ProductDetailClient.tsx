'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Star, ShoppingCart, Heart, Clock, Shield, ChevronRight, ChevronLeft, Minus, Plus, Check, Truck,
  RotateCcw, ArrowLeft, Share2, Zap, X, Info, FlaskConical, MessageSquare,
} from 'lucide-react';
import { getProducts, onStoreChange, syncProductsFromServer, isWished, toggleWishlist, type AdminProduct } from '@/lib/store';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/ToastProvider';
import ProductCard from '@/components/ProductCard';

const badgeColor: Record<string, string> = {
  bestseller: 'bg-emerald-500',
  new: 'bg-blue-500',
  trending: 'bg-[#FF6B00]',
  sale: 'bg-red-500',
};

export default function ProductDetailClient() {
  // On the static-export SPA fallback this page is prerendered for id="_", so
  // useParams()/route params resolve to "_" on a hard load — never the real id.
  // Read the actual product id straight from the browser URL instead.
  const [id, setId] = useState<string>('');
  const [catalogue, setCatalogue] = useState<AdminProduct[] | null>(null);
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    const seg = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');
    setId(seg === '_' ? '' : seg);
    setCatalogue(getProducts());
    const unsub = onStoreChange(() => setCatalogue(getProducts()));
    // Always pull the live catalogue so direct visits, fresh browsers and
    // CSV-imported products (which aren't in the local seed defaults) resolve.
    void syncProductsFromServer().finally(() => setSynced(true));
    return unsub;
  }, []);

  const product = useMemo(
    () => catalogue?.find(p => p.id === id && p.active !== false) ?? null,
    [catalogue, id],
  );

  // Show a lightweight skeleton until the store has loaded AND the live sync
  // has finished. This avoids flashing "not found" for products that exist on
  // the server but aren't yet in the local cache (e.g. CSV-imported items).
  if (catalogue === null || (!product && !synced)) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <div className="container-max py-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
            <div className="aspect-square rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.06)]" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-[#111] rounded" />
              <div className="h-8 w-3/4 bg-[#111] rounded" />
              <div className="h-6 w-1/2 bg-[#111] rounded" />
              <div className="h-12 w-full bg-[#111] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) notFound();

  return <ProductDetailInner product={product} catalogue={catalogue} />;
}

function ProductDetailInner({ product, catalogue }: { product: AdminProduct; catalogue: AdminProduct[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { push } = useToast();
  const reviewsRef = useRef<HTMLDivElement>(null);

  const [selectedFlavor, setSelectedFlavor] = useState(product.flavors[0] ?? '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'reviews'>('description');
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setWished(isWished(product.id));
    return onStoreChange(() => setWished(isWished(product.id)));
  }, [product.id]);

  // Reset the variant/gallery selection whenever the visitor lands on a
  // different product (e.g. clicking a related-product card).
  useEffect(() => {
    setSelectedFlavor(product.flavors[0] ?? '');
    setSelectedSize(product.sizes[0] ?? '');
    setQty(1);
    setActiveImage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Admin can upload multiple images; fall back to the single legacy field.
  const gallery = useMemo(() => {
    const list = product.images?.length ? product.images : (product.image ? [product.image] : []);
    return list.filter(Boolean);
  }, [product.images, product.image]);
  const primaryImage = gallery[activeImage] ?? gallery[0] ?? product.image;

  const related = catalogue
    .filter(p => p.active !== false && p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const highlights = useMemo(
    () => (product.tags || []).slice(0, 4).map(t => t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
    [product.tags],
  );

  const outOfStock = product.stock <= 0;
  const stockInfo = outOfStock
    ? { label: 'Out of Stock', dot: 'bg-red-400', text: 'text-red-400' }
    : product.stock <= 15
    ? { label: `Only ${product.stock} left`, dot: 'bg-amber-400', text: 'text-amber-400' }
    : { label: 'In Stock', dot: 'bg-emerald-400', text: 'text-emerald-400' };
  const maxQty = product.stock > 0 ? Math.min(product.stock, 10) : 10;
  const savings = product.originalPrice - product.price;

  const cartPayload = () => ({
    id: product.id + '-' + selectedFlavor + '-' + selectedSize,
    name: `${product.name}${selectedFlavor ? ` – ${selectedFlavor}` : ''}${selectedSize ? ` / ${selectedSize}` : ''}`,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice,
    image: primaryImage,
  });

  const handleAddToCart = () => {
    if (outOfStock) return;
    for (let i = 0; i < qty; i++) addItem(cartPayload());
    setAdded(true);
    push({ title: 'Added to cart', description: product.name, variant: 'success' });
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    setBuying(true);
    for (let i = 0; i < qty; i++) addItem(cartPayload());
    router.push('/checkout');
  };

  const handleWish = () => {
    const next = toggleWishlist(product.id);
    setWished(next);
    push({ title: next ? 'Saved to wishlist' : 'Removed from wishlist', description: product.name, variant: next ? 'success' : 'info', durationMs: 2000 });
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      push({ title: 'Link copied', description: 'Share it with your friends', variant: 'info', durationMs: 2000 });
    } catch { /* clipboard unavailable */ }
  };

  const goToReviews = () => {
    setActiveTab('reviews');
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Breadcrumb */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-3">
        <div className="container-max flex items-center gap-2">
          <Link href="/products" className="lg:hidden flex items-center gap-1 text-sm text-[rgba(245,245,245,0.6)] hover:text-white transition-colors shrink-0">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="hidden lg:flex items-center gap-2 text-sm text-[rgba(245,245,245,0.4)] min-w-0">
            <Link href="/" className="hover:text-white transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="shrink-0" />
            <Link href="/products" className="hover:text-white transition-colors shrink-0">Products</Link>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-[rgba(245,245,245,0.7)] truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container-max py-6 lg:py-10">
        <div className="grid sm:grid-cols-[280px_1fr] md:grid-cols-[340px_1fr] lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-6 sm:gap-8 lg:gap-12 mb-12 lg:mb-20">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-3 mx-auto sm:mx-0 max-w-[420px] sm:max-w-none w-full"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111] border border-[rgba(255,255,255,0.08)] group">
              <AnimatePresence mode="wait">
                {primaryImage && (
                  <motion.button
                    key={activeImage}
                    type="button"
                    onClick={() => setLightbox(true)}
                    aria-label="View full image"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 w-full h-full cursor-zoom-in"
                  >
                    <Image src={primaryImage} alt={product.name} fill priority
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 90vw, 440px" unoptimized={primaryImage.startsWith('data:')} />
                  </motion.button>
                )}
              </AnimatePresence>

              {outOfStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <span className="px-4 py-2 rounded-full bg-black/70 border border-white/15 text-white text-sm font-bold uppercase tracking-wide">Out of Stock</span>
                </div>
              )}
              {product.badge && (
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase text-white ${badgeColor[product.badge] || 'bg-[#FF6B00]'}`}>
                  {product.badge}
                </div>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-sm font-bold text-[#FF6B00]">
                  -{product.discount}%
                </div>
              )}

              {gallery.length > 1 && (
                <div className="absolute bottom-4 left-4 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white z-10">
                  {activeImage + 1}/{gallery.length}
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} type="button" aria-label={`View image ${i + 1}`}
                    className={`relative shrink-0 w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-xl overflow-hidden bg-[#111] border cursor-pointer transition-all snap-start ${i === activeImage ? 'border-[#FF6B00] ring-2 ring-[rgba(255,107,0,0.3)]' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,107,0,0.4)]'}`}>
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" unoptimized={img.startsWith('data:')} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-5"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-bold tracking-[0.15em] text-[#FF6B00] uppercase">{product.brand}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${stockInfo.dot}`} />
                  <span className={`text-xs font-semibold ${stockInfo.text}`}>{stockInfo.label}</span>
                </div>
              </div>
              <h1 className="font-[var(--font-montserrat)] font-black text-2xl sm:text-3xl text-white leading-tight mb-3">{product.name}</h1>
              <button onClick={goToReviews} type="button" className="flex items-center gap-3 group">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.2)]'} />
                  ))}
                </div>
                <span className="text-sm text-white font-semibold">{product.rating}</span>
                <span className="text-sm text-[rgba(245,245,245,0.4)] group-hover:text-white transition-colors">
                  {product.reviews.toLocaleString()} reviews
                </span>
              </button>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-4 border-y border-[rgba(255,255,255,0.08)]">
              <span className="text-4xl font-black text-white">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <span className="text-xl text-[rgba(245,245,245,0.3)] line-through">₹{product.originalPrice.toLocaleString()}</span>
              )}
              {savings > 0 && (
                <span className="px-2.5 py-1 bg-[rgba(255,107,0,0.1)] text-[#FF6B00] text-sm font-bold rounded-lg">
                  Save ₹{savings.toLocaleString()}{product.discount > 0 ? ` (${product.discount}%)` : ''}
                </span>
              )}
              <span className="w-full text-xs text-[rgba(245,245,245,0.35)]">Inclusive of all taxes</span>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {highlights.map(h => (
                  <div key={h} className="flex items-center gap-2 text-[13px] text-[rgba(245,245,245,0.65)] min-w-0">
                    <Check size={14} className="text-[#FF6B00] shrink-0" />
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery */}
            <div className="flex items-center gap-2 py-2 px-4 bg-[rgba(255,107,0,0.08)] rounded-xl border border-[rgba(255,107,0,0.15)]">
              <Clock size={16} className="text-[#FF6B00] shrink-0" />
              <span className="text-sm text-white font-medium">Express Delivery in <span className="text-[#FF6B00] font-bold">{product.deliveryTime}</span></span>
            </div>

            {/* Flavor selection */}
            {product.flavors.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-[rgba(245,245,245,0.6)] mb-2">Flavor: <span className="text-white">{selectedFlavor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.flavors.map(f => (
                    <button key={f} onClick={() => setSelectedFlavor(f)} type="button"
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${selectedFlavor === f ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                      {selectedFlavor === f && <Check size={13} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[rgba(245,245,245,0.6)] mb-2">Size: <span className="text-white">{selectedSize}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} type="button"
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedSize === s ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                      {selectedSize === s && <Check size={13} />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[rgba(245,245,245,0.6)]">Quantity:</span>
              <div className="flex items-center gap-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl px-4">
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} type="button" aria-label="Decrease quantity"
                  className="text-white py-2.5 hover:text-[#FF6B00] disabled:opacity-30 disabled:hover:text-white transition-colors"><Minus size={16} /></button>
                <span className="text-white font-bold min-w-[24px] text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} type="button" aria-label="Increase quantity"
                  className="text-white py-2.5 hover:text-[#FF6B00] disabled:opacity-30 disabled:hover:text-white transition-colors"><Plus size={16} /></button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart} disabled={outOfStock} type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl transition-all duration-300 text-base disabled:opacity-40 disabled:cursor-not-allowed ${added ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-[#111] border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)]'}`}>
                {added ? <><Check size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow} disabled={outOfStock || buying} type="button"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl transition-all duration-300 text-base bg-[#FF6B00] hover:bg-[#E55A00] text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Zap size={18} /> Buy Now
              </motion.button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleWish} type="button" aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${wished ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#111] border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                <Heart size={16} className={wished ? 'fill-red-400' : ''} /> {wished ? 'Saved' : 'Wishlist'}
              </button>
              <button onClick={handleShare} type="button" aria-label="Share product"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111] text-sm font-semibold text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)] hover:text-white transition-all">
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[{ icon: Shield, label: '100% Authentic' }, { icon: Truck, label: 'Free Delivery ₹999+' }, { icon: RotateCcw, label: '7-Day Returns' }].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 bg-[#111] rounded-xl border border-[rgba(255,255,255,0.06)] text-center">
                  <b.icon size={18} className="text-[#FF6B00]" />
                  <span className="text-[11px] text-[rgba(245,245,245,0.55)] font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div ref={reviewsRef} className="mb-14 lg:mb-20 scroll-mt-28">
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)] mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([
              { key: 'description', label: 'Description', icon: Info },
              { key: 'ingredients', label: 'Ingredients', icon: FlaskConical },
              { key: 'reviews', label: 'Reviews', icon: MessageSquare },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} type="button"
                className={`flex items-center gap-1.5 shrink-0 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === tab.key ? 'border-[#FF6B00] text-white' : 'border-transparent text-[rgba(245,245,245,0.4)] hover:text-white'}`}>
                <tab.icon size={15} /> {tab.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="text-[rgba(245,245,245,0.7)] leading-relaxed max-w-2xl">
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <p>{product.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { label: 'Brand', value: product.brand },
                      { label: 'Category', value: product.category.replace(/-/g, ' ') },
                      { label: 'SKU', value: product.sku || product.id },
                      { label: 'Availability', value: stockInfo.label },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 bg-[#111] rounded-lg border border-[rgba(255,255,255,0.06)] text-sm">
                        <span className="text-[rgba(245,245,245,0.45)]">{row.label}</span>
                        <span className="text-white font-medium capitalize">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'ingredients' && <p>Please refer to the product label for the full ingredient list, nutritional information and allergen warnings. Always read the label before use.</p>}
              {activeTab === 'reviews' && (
                <div className="p-6 bg-[#111] rounded-xl border border-[rgba(255,255,255,0.06)] text-center">
                  <Star size={26} className="text-[rgba(255,107,0,0.4)] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">No reviews yet</p>
                  <p className="text-[13px] text-[rgba(245,245,245,0.45)]">Be the first to review this product after your purchase.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-6">
              You May Also <span className="text-gradient">Like</span>
            </h2>
            <div className="product-grid">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && primaryImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
          >
            <button onClick={() => setLightbox(false)} type="button" aria-label="Close"
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X size={20} />
            </button>
            {gallery.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setActiveImage(i => (i - 1 + gallery.length) % gallery.length); }}
                  type="button" aria-label="Previous image"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setActiveImage(i => (i + 1) % gallery.length); }}
                  type="button" aria-label="Next image"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl aspect-square"
            >
              <Image src={primaryImage} alt={product.name} fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" unoptimized={primaryImage.startsWith('data:')} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
