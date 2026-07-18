'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Clock, Shield, ChevronRight, Minus, Plus, Check, Truck, RotateCcw } from 'lucide-react';
import { getProducts, onStoreChange, type AdminProduct } from '@/lib/store';
import { useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [catalogue, setCatalogue] = useState<AdminProduct[] | null>(null);
  useEffect(() => {
    setCatalogue(getProducts());
    return onStoreChange(() => setCatalogue(getProducts()));
  }, []);

  const product = useMemo(
    () => catalogue?.find(p => p.id === id && p.active !== false) ?? null,
    [catalogue, id],
  );

  // First render — store hasn't loaded yet. Show a lightweight skeleton so we
  // don't flash a "not found" for products that legitimately exist.
  if (catalogue === null) {
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
  const [selectedFlavor, setSelectedFlavor] = useState(product.flavors[0] ?? '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? '');
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();

  // Admin can upload multiple images; fall back to the single legacy field.
  const gallery = useMemo(() => {
    const list = product.images?.length ? product.images : (product.image ? [product.image] : []);
    return list.filter(Boolean);
  }, [product.images, product.image]);
  const primaryImage = gallery[activeImage] ?? gallery[0] ?? product.image;

  const related = catalogue
    .filter(p => p.active !== false && p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id + '-' + selectedFlavor + '-' + selectedSize,
        name: `${product.name}${selectedFlavor ? ` – ${selectedFlavor}` : ''}${selectedSize ? ` / ${selectedSize}` : ''}`,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        image: primaryImage,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const savings = product.originalPrice - product.price;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Breadcrumb */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-3">
        <div className="container-max">
          <div className="flex items-center gap-2 text-sm text-[rgba(245,245,245,0.4)]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <ChevronRight size={14} />
            <span className="text-[rgba(245,245,245,0.7)] line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container-max py-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111] border border-[rgba(255,255,255,0.08)]">
              {primaryImage && (
                <Image src={primaryImage} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" unoptimized={primaryImage.startsWith('data:')} />
              )}
              {product.badge && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-[#FF6B00] text-white">
                  {product.badge}
                </div>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-sm font-bold text-[#FF6B00]">
                  -{product.discount}%
                </div>
              )}
            </div>
            {/* Thumbnails row — real gallery from admin-managed images */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} type="button"
                    className={`aspect-square rounded-xl overflow-hidden bg-[#111] border cursor-pointer transition-all ${i === activeImage ? 'border-[#FF6B00]' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                    <Image src={img} alt="" width={100} height={100} className="object-cover w-full h-full" unoptimized={img.startsWith('data:')} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-[#FF6B00] uppercase mb-2">{product.brand}</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-2xl sm:text-3xl text-white leading-tight mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.2)]'} />
                  ))}
                </div>
                <span className="text-sm text-white font-semibold">{product.rating}</span>
                <span className="text-sm text-[rgba(245,245,245,0.4)]">({product.reviews.toLocaleString()} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-4 border-y border-[rgba(255,255,255,0.08)]">
              <span className="text-4xl font-black text-white">₹{product.price.toLocaleString()}</span>
              <span className="text-xl text-[rgba(245,245,245,0.3)] line-through">₹{product.originalPrice.toLocaleString()}</span>
              <span className="px-2.5 py-1 bg-[rgba(255,107,0,0.1)] text-[#FF6B00] text-sm font-bold rounded-lg">Save ₹{savings.toLocaleString()}</span>
            </div>

            {/* Delivery */}
            <div className="flex items-center gap-2 py-2 px-4 bg-[rgba(255,107,0,0.08)] rounded-xl border border-[rgba(255,107,0,0.15)]">
              <Clock size={16} className="text-[#FF6B00]" />
              <span className="text-sm text-white font-medium">Express Delivery in <span className="text-[#FF6B00] font-bold">{product.deliveryTime}</span></span>
            </div>

            {/* Flavor selection */}
            {product.flavors.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-[rgba(245,245,245,0.6)] mb-2">Flavor: <span className="text-white">{selectedFlavor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.flavors.map(f => (
                    <button key={f} onClick={() => setSelectedFlavor(f)}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${selectedFlavor === f ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            <div>
              <p className="text-sm font-semibold text-[rgba(245,245,245,0.6)] mb-2">Size: <span className="text-white">{selectedSize}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedSize === s ? 'bg-[#FF6B00] text-white border border-[#FF6B00]' : 'bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Add to cart */}
            <div className="flex gap-3">
              <div className="flex items-center gap-3 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl px-4">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-white py-3 hover:text-[#FF6B00] transition-colors"><Minus size={16} /></button>
                <span className="text-white font-bold min-w-[24px] text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-white py-3 hover:text-[#FF6B00] transition-colors"><Plus size={16} /></button>
              </div>
              <button onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl transition-all duration-300 text-base ${added ? 'bg-emerald-500 text-white' : 'bg-[#FF6B00] hover:bg-[#E55A00] text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.4)]'}`}>
                {added ? <><Check size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
              <button onClick={() => setWishlist(!wishlist)} className={`p-3.5 rounded-xl border transition-all ${wishlist ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#111] border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.5)] hover:border-[rgba(255,107,0,0.3)]'}`}>
                <Heart size={18} className={wishlist ? 'fill-red-400' : ''} />
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
        <div className="mb-10">
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)] mb-6">
            {['description', 'ingredients', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-[#FF6B00] text-white' : 'border-transparent text-[rgba(245,245,245,0.4)] hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="text-[rgba(245,245,245,0.7)] leading-relaxed max-w-2xl">
            {activeTab === 'description' && <p>{product.description} Premium grade, third-party tested for banned substances. Manufactured in GMP certified facilities.</p>}
            {activeTab === 'ingredients' && <p>Key ingredients: Whey Protein Concentrate, Cocoa Powder, Lecithin, Artificial Flavors. Allergen warning: Contains Milk and Soy.</p>}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {[{ name: 'Rohit K.', rating: 5, text: 'Best whey protein I have ever used. Mixes perfectly and tastes amazing!' }, { name: 'Ankit S.', rating: 4, text: 'Great product, good quality. Delivery was super fast.' }].map(r => (
                  <div key={r.name} className="p-4 bg-[#111] rounded-xl border border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{[...Array(r.rating)].map((_, i) => <Star key={i} size={13} className="text-[#FF6B00] fill-[#FF6B00]" />)}</div>
                      <span className="text-sm font-semibold text-white">{r.name}</span>
                    </div>
                    <p className="text-sm text-[rgba(245,245,245,0.6)]">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    </div>
  );
}
