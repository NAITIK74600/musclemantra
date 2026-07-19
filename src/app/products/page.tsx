'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { getProducts, getCategories, onStoreChange, type AdminProduct, type AdminCategory } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'discount', label: 'Best Discount' },
];

function ProductsPageInner() {
  const params = useSearchParams();

  // Seed filter state directly from the URL — avoids setState-in-useEffect
  // and works both on first render (Suspense-guarded) and back/forward nav.
  const urlBrand = params.get('brand') ?? undefined;
  const [search, setSearch] = useState<string>(() => params.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => params.get('category') ?? 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => (urlBrand ? [urlBrand] : []));
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState('popular');
  const [filterOpen, setFilterOpen] = useState(false);

  // Load admin-managed catalogue and stay in sync with edits from /admin.
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  useEffect(() => {
    setProducts(getProducts());
    setCategories(getCategories());
    return onStoreChange(() => {
      setProducts(getProducts());
      setCategories(getCategories());
    });
  }, []);

  // Storefront should never show hidden products; derive brand list from active items
  // so newly-added products introduce their brand into filters automatically.
  const visibleCategories = useMemo(() => categories.filter(c => c.active !== false), [categories]);
  const visibleProducts = useMemo(() => products.filter(p => p.active !== false), [products]);
  const brands = useMemo(
    () => Array.from(new Set(visibleProducts.map(p => p.brand).filter(Boolean))).sort(),
    [visibleProducts],
  );

  const filtered = useMemo(() => {
    let result = [...visibleProducts];
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== 'all') result = result.filter(p => p.category === selectedCategory);
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'discount': result.sort((a, b) => b.discount - a.discount); break;
      default: result.sort((a, b) => b.reviews - a.reviews);
    }
    return result;
  }, [visibleProducts, search, selectedCategory, selectedBrands, priceRange, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-9 sm:py-12">
        <div className="container-max">
          <h1 className="font-[var(--font-montserrat)] font-black text-3xl sm:text-4xl text-white mb-2">
            All <span className="text-gradient">Products</span>
          </h1>
          <p className="text-[rgba(245,245,245,0.5)]">{filtered.length} products available</p>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search supplements, brands..."
              className="w-full bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-[rgba(245,245,245,0.35)] outline-none focus:border-[rgba(255,107,0,0.4)]" />
          </div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[rgba(255,107,0,0.4)] appearance-none cursor-pointer">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[rgba(245,245,245,0.7)] hover:border-[rgba(255,107,0,0.3)] transition-all">
              <SlidersHorizontal size={16} /> Filters
              {(selectedBrands.length > 0 || selectedCategory !== 'all') && (
                <span className="w-5 h-5 bg-[#FF6B00] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {selectedBrands.length + (selectedCategory !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === 'all' ? 'bg-[#FF6B00] text-white' : 'bg-[#111] border border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
            All
          </button>
          {visibleCategories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat.id ? 'bg-[#FF6B00] text-white' : 'bg-[#111] border border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.6)] hover:border-[rgba(255,107,0,0.3)]'}`}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Filter drawer */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 mb-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Brand filter */}
                  <div>
                    <h4 className="text-xs font-bold tracking-widest text-[rgba(245,245,245,0.4)] uppercase mb-3">Brand</h4>
                    <div className="flex flex-col gap-2">
                      {brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                          <div onClick={() => toggleBrand(brand)}
                            className={`w-4 h-4 rounded border transition-all ${selectedBrands.includes(brand) ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-[rgba(255,255,255,0.2)] group-hover:border-[#FF6B00]'} flex items-center justify-center`}>
                            {selectedBrands.includes(brand) && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="text-sm text-[rgba(245,245,245,0.7)]">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Price range */}
                  <div>
                    <h4 className="text-xs font-bold tracking-widest text-[rgba(245,245,245,0.4)] uppercase mb-3">Price Range</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-white">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                      <input type="range" min={0} max={10000} step={100}
                        value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full accent-[#FF6B00]" />
                    </div>
                  </div>
                </div>
                {(selectedBrands.length > 0 || selectedCategory !== 'all') && (
                  <button onClick={() => { setSelectedBrands([]); setSelectedCategory('all'); }}
                    className="mt-4 flex items-center gap-1.5 text-sm text-[rgba(245,245,245,0.5)] hover:text-white transition-colors">
                    <X size={14} /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products grid */}
        {filtered.length > 0 ? (
          <div className="product-grid">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-[rgba(245,245,245,0.5)] mb-6">Try adjusting your filters or search term</p>
            <button onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedBrands([]); }}
              className="px-6 py-3 bg-[#FF6B00] text-white font-semibold rounded-xl">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense wrapper — `useSearchParams` needs a boundary during prerender.
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ProductsPageInner />
    </Suspense>
  );
}
