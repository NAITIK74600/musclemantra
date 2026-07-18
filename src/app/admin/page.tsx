'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users, Store,
  BarChart2, Tag, Star, HeadphonesIcon, FileText, Settings, LogOut,
  TrendingUp, ArrowUpRight, DollarSign, ShoppingBag, UserCheck, Box,
  ChevronRight, Eye, Edit2, Trash2, PlusCircle, Filter,
  Search, Mail, Check, X, Truck, AlertTriangle, Percent,
  MessageSquare, Save, Plus, Image as ImageIcon,
  Megaphone, Film, Upload, Award, Play, LayoutGrid, Minus,
  Loader2, KeyRound, Calendar, Clock, CalendarCheck, CalendarX,
  PhoneCall, CheckCircle,
} from 'lucide-react';
import {
  getBrands, saveBrands, getPromos, savePromos, fileToDataURL, uid,
  onStoreChange, type Brand, type Promo,
  updateBrand,
  getProducts, saveProducts, addProduct, updateProduct, deleteProduct, type AdminProduct,
  getCategories, saveCategories, addCategory, updateCategory, deleteCategory, type AdminCategory,
} from '@/lib/store';
import {
  getAppointments, updateAppointmentStatus, deleteAppointment,
  onAppointmentChange, APPOINTMENT_TYPES, STATUS_CONFIG,
  type Appointment, type AppointmentStatus,
} from '@/lib/appointments';
import { useToast } from '@/components/ToastProvider';
import AdminGate from '@/components/AdminGate';
import { signOutAdmin, getAdminEmail, changeAdminPassword } from '@/lib/adminAuth';

const sidebarItems = [
  { id: 'dashboard',     icon: LayoutDashboard,  label: 'Dashboard' },
  { id: 'appointments',  icon: Calendar,          label: 'Appointments' },
  { id: 'orders',        icon: ShoppingCart,      label: 'Orders',          badge: '12' },
  { id: 'products',      icon: Box,               label: 'Products' },
  { id: 'categories',    icon: LayoutGrid,        label: 'Categories' },
  { id: 'promotions',    icon: Megaphone,         label: 'Promotions' },
  { id: 'brands',        icon: Award,             label: 'Brands' },
  { id: 'inventory',     icon: Warehouse,         label: 'Inventory' },
  { id: 'customers',     icon: Users,             label: 'Customers' },
  { id: 'vendors',       icon: Store,             label: 'Vendors' },
  { id: 'reports',       icon: BarChart2,         label: 'Sales & Reports' },
  { id: 'coupons',       icon: Tag,               label: 'Coupons' },
  { id: 'reviews',       icon: Star,              label: 'Reviews' },
  { id: 'support',       icon: HeadphonesIcon,    label: 'Support Tickets', badge: '5' },
  { id: 'cms',           icon: FileText,          label: 'CMS' },
  { id: 'settings',      icon: Settings,          label: 'Settings' },
];

// Stats are derived at runtime from the store inside AdminDashboard.
// (Removed the hardcoded fake const here.)

const recentOrders = [
  { id: '#MM12345', customer: 'Rohit Sharma', product: 'ON Whey Protein 2kg', amount: '₹2,999', status: 'delivered', date: '15 May' },
  { id: '#MM12344', customer: 'Priya Mehta', product: 'MM Creatine 300g', amount: '₹1,299', status: 'shipped', date: '15 May' },
  { id: '#MM12343', customer: 'Arjun Singh', product: 'C4 Pre-Workout', amount: '₹2,199', status: 'processing', date: '14 May' },
  { id: '#MM12342', customer: 'Kavya R.', product: 'Mass Gainer 6kg', amount: '₹4,299', status: 'delivered', date: '14 May' },
  { id: '#MM12341', customer: 'Amit Kumar', product: 'BCAA Pro 450g', amount: '₹1,299', status: 'cancelled', date: '13 May' },
];

const topProducts = [
  { name: 'ON Whey Protein 2kg', sku: 'ON-WHEY-2KG', sales: 842, revenue: '₹25,23,558' },
  { name: 'MM Creatine 300g', sku: 'MM-CRT-300', sales: 623, revenue: '₹8,10,277' },
  { name: 'MM Mass Gainer 2kg', sku: 'MM-MASS-2KG', sales: 512, revenue: '₹22,00,688' },
  { name: 'MM Pre Workout 300g', sku: 'MM-PRE-300', sales: 421, revenue: '₹7,48,879' },
];

const statusColors: Record<string, string> = {
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

// Simple bar chart using divs
const chartData = [
  { day: 'Mon', val: 65 }, { day: 'Tue', val: 82 }, { day: 'Wed', val: 54 },
  { day: 'Thu', val: 91 }, { day: 'Fri', val: 78 }, { day: 'Sat', val: 100 },
  { day: 'Sun', val: 69 },
];

// ── Inventory ──────────────────────────────────────────────
const inventory = [
  { name: 'ON Whey Protein 2kg', sku: 'ON-WHEY-2KG', stock: 120, reorder: 40, value: '₹3,59,880', status: 'healthy' },
  { name: 'MB Creatine 300g', sku: 'MB-CRT-300', stock: 200, reorder: 60, value: '₹2,59,800', status: 'healthy' },
  { name: 'MB Mass Gainer 2kg', sku: 'MB-MASS-2KG', stock: 85, reorder: 50, value: '₹2,71,915', status: 'healthy' },
  { name: 'Dymatize ISO 100 2kg', sku: 'DYM-ISO-2KG', stock: 45, reorder: 50, value: '₹2,02,455', status: 'low' },
  { name: 'C4 Pre-Workout 390g', sku: 'C4-PRE-390', stock: 18, reorder: 40, value: '₹39,582', status: 'low' },
  { name: 'ON Serious Mass 6kg', sku: 'ON-MASS-6KG', stock: 0, reorder: 30, value: '₹0', status: 'out' },
];

// ── Customers ──────────────────────────────────────────────
const customers = [
  { name: 'Rohit Sharma', email: 'rohit.sharma@gmail.com', orders: 24, spent: '₹48,230', status: 'vip', joined: 'Jan 2024' },
  { name: 'Priya Mehta', email: 'priya.m@gmail.com', orders: 12, spent: '₹21,540', status: 'active', joined: 'Feb 2024' },
  { name: 'Arjun Singh', email: 'arjun.s@outlook.com', orders: 8, spent: '₹14,990', status: 'active', joined: 'Mar 2024' },
  { name: 'Kavya R.', email: 'kavya.r@gmail.com', orders: 31, spent: '₹62,110', status: 'vip', joined: 'Dec 2023' },
  { name: 'Amit Kumar', email: 'amit.k@yahoo.com', orders: 3, spent: '₹4,870', status: 'new', joined: 'May 2024' },
  { name: 'Sneha Patel', email: 'sneha.p@gmail.com', orders: 17, spent: '₹33,200', status: 'active', joined: 'Jan 2024' },
];

// ── Vendors ────────────────────────────────────────────────
const vendors = [
  { name: 'Optimum Nutrition India', contact: 'supply@on-india.com', products: 42, status: 'active' },
  { name: 'MuscleBlaze Distribution', contact: 'orders@mb-dist.in', products: 78, status: 'active' },
  { name: 'Dymatize Wholesale', contact: 'b2b@dymatize.in', products: 23, status: 'active' },
  { name: 'Cellucor Imports', contact: 'india@cellucor.com', products: 16, status: 'pending' },
];

// ── Coupons ────────────────────────────────────────────────
const coupons = [
  { code: 'WELCOME15', desc: '15% off first order', value: '15%', used: 342, limit: 1000, status: 'active' },
  { code: 'BULK500', desc: '₹500 off above ₹3000', value: '₹500', used: 128, limit: 500, status: 'active' },
  { code: 'PROTEIN10', desc: '10% off all protein', value: '10%', used: 891, limit: 1000, status: 'active' },
  { code: 'FLAT20', desc: '20% off sitewide', value: '20%', used: 500, limit: 500, status: 'expired' },
];

// ── Reviews ────────────────────────────────────────────────
const reviews = [
  { product: 'ON Whey Protein 2kg', customer: 'Rohit Sharma', rating: 5, comment: 'Authentic product, mixes well. Fast delivery!', status: 'approved' },
  { product: 'MB Creatine 300g', customer: 'Priya Mehta', rating: 4, comment: 'Good quality, no taste. Works as expected.', status: 'pending' },
  { product: 'C4 Pre-Workout', customer: 'Arjun Singh', rating: 5, comment: 'Great pump and energy. Will reorder.', status: 'pending' },
  { product: 'Mass Gainer 6kg', customer: 'Kavya R.', rating: 3, comment: 'Decent but too sweet for me.', status: 'approved' },
];

// ── Support tickets ────────────────────────────────────────
const tickets = [
  { id: '#TK-1042', customer: 'Amit Kumar', subject: 'Order not delivered yet', priority: 'high', status: 'open', date: '15 May' },
  { id: '#TK-1041', customer: 'Sneha Patel', subject: 'Wrong flavour received', priority: 'medium', status: 'open', date: '15 May' },
  { id: '#TK-1040', customer: 'Rohit Sharma', subject: 'Request invoice copy', priority: 'low', status: 'resolved', date: '14 May' },
  { id: '#TK-1039', customer: 'Priya Mehta', subject: 'Refund status query', priority: 'medium', status: 'open', date: '13 May' },
  { id: '#TK-1038', customer: 'Kavya R.', subject: 'Damaged packaging', priority: 'high', status: 'resolved', date: '12 May' },
];

// ── CMS pages ──────────────────────────────────────────────
const cmsPages = [
  { title: 'Homepage Hero Banner', type: 'Banner', updated: '14 May 2024', status: 'published' },
  { title: 'About Us', type: 'Page', updated: '02 May 2024', status: 'published' },
  { title: 'Terms & Conditions', type: 'Page', updated: '28 Apr 2024', status: 'published' },
  { title: 'Summer Sale Promo', type: 'Banner', updated: '10 May 2024', status: 'draft' },
  { title: 'Shipping Policy', type: 'Page', updated: '15 Apr 2024', status: 'published' },
];

/* ── Change Admin Password (embedded in Settings section) ──────────────── */
function AdminPasswordChange({ adminEmail }: { adminEmail: string }) {
  const toast = useToast();
  const [curPw, setCurPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');
  const [busy, setBusy]     = useState(false);

  const submit = async () => {
    if (!curPw || !newPw || !confPw) { toast.push({ variant: 'error', title: 'Fill all fields' }); return; }
    if (newPw !== confPw) { toast.push({ variant: 'error', title: 'Passwords do not match' }); return; }
    setBusy(true);
    const res = await changeAdminPassword(curPw, newPw);
    setBusy(false);
    if (res.ok) {
      toast.push({ variant: 'success', title: 'Password changed', description: 'You will be signed out in 3 seconds.' });
      setTimeout(() => { signOutAdmin(); window.location.reload(); }, 3000);
    } else {
      toast.push({ variant: 'error', title: 'Error', description: res.error });
    }
  };

  return (
    <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
        <KeyRound size={16} className="text-[#FF6B00]" /> Admin Security
      </h3>
      <p className="text-[11px] text-[rgba(245,245,245,0.4)] mb-4">
        Signed in as <span className="text-[rgba(245,245,245,0.7)]">{adminEmail}</span>. Change your admin password below.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { label: 'Current password', value: curPw, set: setCurPw },
          { label: 'New password',     value: newPw, set: setNewPw },
          { label: 'Confirm new',      value: confPw, set: setConfPw },
        ] as const).map(f => (
          <div key={f.label}>
            <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">{f.label}</label>
            <input type="password" value={f.value} onChange={e => f.set(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const adminEmail = getAdminEmail() ?? 'admin';
  const [toggles, setToggles] = useState({
    cod: true, onlinePay: true, sameDay: true, lowStockAlerts: true, reviews: false, maintenance: false,
  });
  const flip = (k: keyof typeof toggles) => setToggles(t => ({ ...t, [k]: !t[k] }));

  // ── Brands & Promotions (persisted via shared store) ──
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [promoList, setPromoList] = useState<Promo[]>([]);
  const [productList, setProductList] = useState<AdminProduct[]>([]);
  const [categoryList, setCategoryList] = useState<AdminCategory[]>([]);
  useEffect(() => {
    setBrandList(getBrands());
    setPromoList(getPromos());
    setProductList(getProducts());
    setCategoryList(getCategories());
    return onStoreChange(() => {
      setBrandList(getBrands());
      setPromoList(getPromos());
      setProductList(getProducts());
      setCategoryList(getCategories());
    });
  }, []);

  // Brand form
  const [brandForm, setBrandForm] = useState({ name: '', short: '', logo: '' });
  const brandFileRef = useRef<HTMLInputElement>(null);
  const onBrandLogo = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataURL(file);
    setBrandForm(f => ({ ...f, logo: url }));
  };
  const addBrand = () => {
    if (!brandForm.name.trim()) return;
    const short = (brandForm.short.trim() || brandForm.name.trim().slice(0, 3)).toUpperCase();
    const next = [...brandList, { id: uid(), name: brandForm.name.trim(), short, logo: brandForm.logo || undefined }];
    setBrandList(next); saveBrands(next);
    setBrandForm({ name: '', short: '', logo: '' });
    if (brandFileRef.current) brandFileRef.current.value = '';
  };
  const removeBrand = (id: string) => { const next = brandList.filter(b => b.id !== id); setBrandList(next); saveBrands(next); };

  // Promo form
  const [promoForm, setPromoForm] = useState<{ title: string; type: 'photo' | 'video'; url: string; link: string }>({ title: '', type: 'photo', url: '', link: '/products' });
  const promoFileRef = useRef<HTMLInputElement>(null);
  const onPromoFile = async (file?: File) => {
    if (!file) return;
    if (promoForm.type === 'photo') {
      const url = await fileToDataURL(file);
      setPromoForm(f => ({ ...f, url }));
    } else {
      // videos are too large for localStorage — use a session object URL for preview
      setPromoForm(f => ({ ...f, url: URL.createObjectURL(file) }));
    }
  };
  const addPromo = () => {
    if (!promoForm.title.trim() || !promoForm.url.trim()) return;
    const next = [{ id: uid(), title: promoForm.title.trim(), type: promoForm.type, url: promoForm.url.trim(), link: promoForm.link.trim() || '/products', active: true }, ...promoList];
    setPromoList(next); savePromos(next);
    setPromoForm({ title: '', type: 'photo', url: '', link: '/products' });
    if (promoFileRef.current) promoFileRef.current.value = '';
  };
  const removePromo = (id: string) => { const next = promoList.filter(p => p.id !== id); setPromoList(next); savePromos(next); };
  const togglePromo = (id: string) => { const next = promoList.map(p => p.id === id ? { ...p, active: !p.active } : p); setPromoList(next); savePromos(next); };

  // ── Products (persisted, admin-managed CRUD) ─────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productDraft, setProductDraft] = useState<AdminProduct | null>(null); // null = modal closed
  const productImgRef = useRef<HTMLInputElement>(null);

  const emptyProduct = (): AdminProduct => ({
    id: 'p_' + uid(),
    name: '', brand: '', category: categoryList[0]?.id ?? 'protein', sku: '',
    price: 0, originalPrice: 0, discount: 0,
    rating: 0, reviews: 0,
    image: '', images: [],
    flavors: [], sizes: [],
    deliveryTime: '15 min',
    stock: 0, reorderAt: 20,
    description: '',
    tags: [],
    active: true,
    updatedAt: Date.now(),
  });

  const openNewProduct = () => setProductDraft(emptyProduct());
  const openEditProduct = (p: AdminProduct) => setProductDraft({ ...p, images: p.images?.length ? p.images : (p.image ? [p.image] : []) });
  const closeProductModal = () => setProductDraft(null);

  const onProductImagesPick = async (files: FileList | null) => {
    if (!productDraft || !files || !files.length) return;
    const arr = Array.from(files).slice(0, 6);
    const dataUrls = await Promise.all(arr.map(f => fileToDataURL(f)));
    setProductDraft(d => d ? { ...d, images: [...d.images, ...dataUrls].slice(0, 6) } : d);
    if (productImgRef.current) productImgRef.current.value = '';
  };
  const removeProductImage = (idx: number) => {
    setProductDraft(d => d ? { ...d, images: d.images.filter((_, i) => i !== idx) } : d);
  };
  const setPrimaryImage = (idx: number) => {
    setProductDraft(d => {
      if (!d) return d;
      const list = [...d.images];
      const [pick] = list.splice(idx, 1);
      return { ...d, images: [pick, ...list] };
    });
  };

  const saveProductDraft = () => {
    if (!productDraft) return;
    if (!productDraft.name.trim()) { toast.push({ variant: 'error', title: 'Name is required' }); return; }
    if (!productDraft.images.length) { toast.push({ variant: 'error', title: 'At least one product image is required' }); return; }
    const existing = productList.find(p => p.id === productDraft.id);
    const discount = productDraft.originalPrice > 0 && productDraft.price > 0 && productDraft.originalPrice > productDraft.price
      ? Math.round(((productDraft.originalPrice - productDraft.price) / productDraft.originalPrice) * 100)
      : productDraft.discount;
    const payload: AdminProduct = { ...productDraft, discount, image: productDraft.images[0] };
    if (existing) {
      const updated = updateProduct(payload.id, payload);
      if (updated) toast.push({ variant: 'success', title: 'Product updated', description: updated.name });
    } else {
      const added = addProduct(payload);
      toast.push({ variant: 'success', title: 'Product added', description: added.name });
    }
    setProductList(getProducts());
    closeProductModal();
  };

  const removeProduct = (id: string) => {
    const p = productList.find(x => x.id === id);
    deleteProduct(id);
    setProductList(getProducts());
    if (p) toast.push({ variant: 'info', title: 'Product removed', description: p.name });
  };

  const toggleProductActive = (id: string) => {
    const p = productList.find(x => x.id === id);
    if (!p) return;
    updateProduct(id, { active: !p.active });
    setProductList(getProducts());
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return productList.filter(p => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [productList, productSearch, productCategoryFilter]);

  // ── Categories (persisted, admin-managed) ────────────────────────────────
  const [categoryForm, setCategoryForm] = useState<Omit<AdminCategory, 'active'>>({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const categoryImgRef = useRef<HTMLInputElement>(null);

  const onCategoryImage = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataURL(file);
    setCategoryForm(f => ({ ...f, image: url }));
  };

  const submitCategory = () => {
    if (!categoryForm.label.trim()) { toast.push({ variant: 'error', title: 'Category label required' }); return; }
    if (editingCategoryId) {
      updateCategory(editingCategoryId, { label: categoryForm.label, icon: categoryForm.icon, color: categoryForm.color, image: categoryForm.image });
      toast.push({ variant: 'success', title: 'Category updated' });
    } else {
      addCategory({ ...categoryForm, active: true });
      toast.push({ variant: 'success', title: 'Category added' });
    }
    setCategoryList(getCategories());
    setCategoryForm({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
    setEditingCategoryId(null);
    if (categoryImgRef.current) categoryImgRef.current.value = '';
  };
  const editCategory = (c: AdminCategory) => {
    setEditingCategoryId(c.id);
    setCategoryForm({ id: c.id, label: c.label, icon: c.icon, color: c.color, image: c.image ?? '' });
  };
  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ id: '', label: '', icon: '💪', color: '#FF6B00', image: '' });
    if (categoryImgRef.current) categoryImgRef.current.value = '';
  };
  const removeCategoryLocal = (id: string) => {
    const inUse = productList.some(p => p.category === id);
    if (inUse) { toast.push({ variant: 'error', title: 'Category in use', description: 'Reassign products before deleting.' }); return; }
    deleteCategory(id);
    setCategoryList(getCategories());
    toast.push({ variant: 'info', title: 'Category removed' });
  };
  const toggleCategoryActive = (id: string) => {
    const c = categoryList.find(x => x.id === id);
    if (!c) return;
    updateCategory(id, { active: !c.active });
    setCategoryList(getCategories());
  };

  // ── Brand per-card logo edit ─────────────────────────────────────────────
  // A single hidden file input is targeted at whichever brand card the admin
  // clicked. Keeping only one input in the DOM avoids remount issues.
  const brandEditFileRef = useRef<HTMLInputElement>(null);
  const [brandLogoTargetId, setBrandLogoTargetId] = useState<string | null>(null);
  const startBrandLogoEdit = (id: string) => {
    setBrandLogoTargetId(id);
    // trigger picker on next tick so state has committed
    setTimeout(() => brandEditFileRef.current?.click(), 0);
  };
  const onBrandLogoEditFile = async (file?: File) => {
    if (!file || !brandLogoTargetId) return;
    const url = await fileToDataURL(file);
    const updated = updateBrand(brandLogoTargetId, { logo: url });
    setBrandList(getBrands());
    if (updated) toast.push({ variant: 'success', title: 'Logo updated', description: updated.name });
    if (brandEditFileRef.current) brandEditFileRef.current.value = '';
    setBrandLogoTargetId(null);
  };
  const clearBrandLogo = (id: string) => {
    const updated = updateBrand(id, { logo: undefined });
    setBrandList(getBrands());
    if (updated) toast.push({ variant: 'info', title: 'Logo removed', description: updated.name });
  };

  // ── Appointments ─────────────────────────────────────────────────────────
  const [apptList, setApptList] = useState<Appointment[]>([]);
  const [apptFilterDate, setApptFilterDate] = useState('');
  const [apptFilterStatus, setApptFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [apptFilterType, setApptFilterType] = useState<string>('all');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    setApptList(getAppointments());
    return onAppointmentChange(() => setApptList(getAppointments()));
  }, []);

  const filteredAppts = useMemo(() => {
    return apptList.filter(a => {
      if (apptFilterStatus !== 'all' && a.status !== apptFilterStatus) return false;
      if (apptFilterType !== 'all' && a.type !== apptFilterType) return false;
      if (apptFilterDate && a.date !== apptFilterDate) return false;
      return true;
    });
  }, [apptList, apptFilterStatus, apptFilterType, apptFilterDate]);

  const apptStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: apptList.length,
      todayCount: apptList.filter(a => a.date === today).length,
      pending: apptList.filter(a => a.status === 'pending').length,
      confirmed: apptList.filter(a => a.status === 'confirmed').length,
    };
  }, [apptList]);

  const changeApptStatus = (id: string, status: AppointmentStatus) => {
    updateAppointmentStatus(id, status);
    setApptList(getAppointments());
    if (selectedAppt?.id === id) setSelectedAppt(a => a ? { ...a, status } : null);
    toast.push({ variant: 'success', title: `Appointment ${status}` });
  };

  const removeAppt = (id: string) => {
    deleteAppointment(id);
    setApptList(getAppointments());
    if (selectedAppt?.id === id) setSelectedAppt(null);
    toast.push({ variant: 'info', title: 'Appointment deleted' });
  };

  // ── Inventory (uses product list — inline stock/reorder edit) ────────────
  const [invSearch, setInvSearch] = useState('');
  const setStock = (id: string, stock: number) => {
    updateProduct(id, { stock: Math.max(0, Math.floor(stock)) });
    setProductList(getProducts());
  };
  const setReorder = (id: string, reorderAt: number) => {
    updateProduct(id, { reorderAt: Math.max(0, Math.floor(reorderAt)) });
    setProductList(getProducts());
  };
  const bumpStock = (id: string, delta: number) => {
    const p = productList.find(x => x.id === id);
    if (!p) return;
    setStock(id, p.stock + delta);
  };
  const inventorySummary = useMemo(() => {
    const total = productList.length;
    const value = productList.reduce((sum, p) => sum + p.price * p.stock, 0);
    const low = productList.filter(p => p.stock > 0 && p.stock < (p.reorderAt || 0)).length;
    const out = productList.filter(p => p.stock === 0).length;
    return { total, value, low, out };
  }, [productList]);
  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    if (!q) return productList;
    return productList.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [productList, invSearch]);

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className={`shrink-0 ${sidebarCollapsed ? 'w-14' : 'w-56'} bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.06)] flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Muscle Mantra" className="w-8 h-8 object-contain" />
              <div className="leading-none">
                <div className="text-[11px] font-black text-white">ADMIN PANEL</div>
                <div className="text-[9px] text-[rgba(245,245,245,0.4)]">MUSCLE MANTRA</div>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 mx-auto">
              <img src="/logo.png" alt="MM" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[12px] transition-all relative ${activeSection === item.id ? 'bg-[rgba(255,107,0,0.1)] text-white border-l-2 border-[#FF6B00]' : 'text-[rgba(245,245,245,0.5)] hover:text-white hover:bg-white/5'}`}>
              <item.icon size={15} className={activeSection === item.id ? 'text-[#FF6B00]' : ''} />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { signOutAdmin(); window.location.reload(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-[rgba(245,245,245,0.4)] hover:text-red-400 transition-all rounded-lg hover:bg-red-500/5">
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">
              <LayoutDashboard size={16} />
            </button>
            <h1 className="font-[var(--font-montserrat)] font-black text-base text-white">
              {sidebarItems.find(s => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[rgba(245,245,245,0.4)]">15 May, 2024</span>
            <div className="flex items-center gap-2 pl-3 border-l border-[rgba(255,255,255,0.08)]">
              <div className="w-7 h-7 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-black">
                {adminEmail[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <div className="text-[11px] text-white font-semibold leading-none">Admin</div>
                <div className="text-[9px] text-[rgba(245,245,245,0.4)] max-w-[120px] truncate">{adminEmail}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* Live stats from store */}
              {(() => {
                const activeProds = productList.filter(p => p.active !== false);
                const activeCategories = categoryList.filter(c => c.active !== false);
                const invValue = productList.reduce((s, p) => s + p.price * p.stock, 0);
                const liveStats = [
                  { label: 'Total Products', value: String(activeProds.length), sub: `${productList.length} in catalogue`, icon: Box, color: '#60a5fa' },
                  { label: 'Categories', value: String(activeCategories.length), sub: `${categoryList.length} total`, icon: LayoutGrid, color: '#34d399' },
                  { label: 'Inventory Value', value: `₹${invValue.toLocaleString('en-IN')}`, sub: 'live from store', icon: DollarSign, color: '#FF6B00' },
                  { label: 'Brands', value: String(brandList.length), sub: 'active brands', icon: Award, color: '#a78bfa' },
                  { label: "Today's Appts", value: String(apptStats.todayCount), sub: `${apptStats.pending} pending`, icon: Calendar, color: '#34d399', clickSection: 'appointments' as string },
                ];
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {liveStats.map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        onClick={() => s.clickSection && setActiveSection(s.clickSection)}
                        className={`bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 ${s.clickSection ? 'cursor-pointer hover:border-[rgba(255,107,0,0.2)] transition-colors' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                            <s.icon size={17} style={{ color: s.color }} />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Live</span>
                        </div>
                        <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                        <p className="text-[10px] text-[rgba(245,245,245,0.25)] mt-0.5">{s.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}

              <div className="grid lg:grid-cols-3 gap-5">
                {/* Sales chart */}
                <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-white">Sales Overview</h3>
                    <div className="flex gap-1">
                      {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(t => (
                        <button key={t} className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${t === 'Daily' ? 'bg-[#FF6B00] text-white' : 'text-[rgba(245,245,245,0.4)] hover:text-white'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div className="flex items-end gap-3 h-32">
                    {chartData.map(d => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg bg-[rgba(255,107,0,0.15)] hover:bg-[rgba(255,107,0,0.4)] transition-all cursor-pointer relative group"
                          style={{ height: `${d.val}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ₹{(d.val * 1250).toLocaleString()}
                          </div>
                        </div>
                        <span className="text-[9px] text-[rgba(245,245,245,0.4)]">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top products */}
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Top Selling</h3>
                    <Link href="/admin/products" className="text-xs text-[#FF6B00] font-bold">View All</Link>
                  </div>
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[rgba(255,107,0,0.1)] flex items-center justify-center text-[10px] font-black text-[#FF6B00]">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-[rgba(245,245,245,0.4)]">{p.sales} sold</p>
                        </div>
                        <span className="text-[11px] font-bold text-white shrink-0">{p.revenue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h3 className="font-bold text-white">Recent Orders</h3>
                  <button onClick={() => setActiveSection('orders')} className="text-xs text-[#FF6B00] font-bold flex items-center gap-1">View All <ChevronRight size={12} /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.05)]">
                        {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-[#FF6B00] text-[12px] font-bold">{o.id}</td>
                          <td className="px-5 py-3 text-white text-[12px]">{o.customer}</td>
                          <td className="px-5 py-3 text-[rgba(245,245,245,0.6)] text-[12px] max-w-[160px]"><span className="line-clamp-1">{o.product}</span></td>
                          <td className="px-5 py-3 text-white text-[12px] font-bold">{o.amount}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${statusColors[o.status]}`}>{o.status}</span>
                          </td>
                          <td className="px-5 py-3 text-[rgba(245,245,245,0.4)] text-[12px]">{o.date}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/5 rounded-lg transition-all"><Eye size={13} /></button>
                              <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS — image upload, add / edit / remove */}
          {activeSection === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Product Management</h2>
                  <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">
                    {productList.length} product{productList.length === 1 ? '' : 's'} total
                    {' · '}<span className="text-emerald-400">{productList.filter(p => p.active).length} active</span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search name / SKU / brand"
                      className="pl-9 pr-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-64" />
                  </div>
                  <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                    <option value="all">All categories</option>
                    {categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <button onClick={openNewProduct}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                    <PlusCircle size={15} /> Add Product
                  </button>
                </div>
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                {filteredProducts.length === 0 ? (
                  <div className="p-10 text-center text-[rgba(245,245,245,0.4)] text-sm">
                    No products match your filter. <button onClick={openNewProduct} className="text-[#FF6B00] font-bold ml-1">Add one →</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                          {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Action'].map(h => (
                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(p => {
                          const cat = categoryList.find(c => c.id === p.category);
                          const status = p.stock === 0 ? 'out' : p.stock < (p.reorderAt || 0) ? 'low' : 'active';
                          return (
                            <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
                                    {p.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Box size={14} className="text-[rgba(245,245,245,0.3)]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-white text-[13px] font-semibold line-clamp-1">{p.name || 'Untitled'}</div>
                                    <div className="text-[11px] text-[rgba(245,245,245,0.4)] line-clamp-1">{p.brand}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px] font-mono">{p.sku}</td>
                              <td className="px-5 py-3.5">
                                <span className="px-2.5 py-1 bg-[rgba(255,107,0,0.1)] text-[#FF6B00] text-[11px] font-semibold rounded-full">{cat?.label ?? p.category}</span>
                              </td>
                              <td className="px-5 py-3.5 text-white font-bold text-[13px]">₹{p.price.toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: p.stock === 0 ? '#f87171' : p.stock < (p.reorderAt || 0) ? '#fbbf24' : '#34d399' }}>
                                {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                              </td>
                              <td className="px-5 py-3.5">
                                <button onClick={() => toggleProductActive(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${!p.active ? 'bg-white/5 text-[rgba(245,245,245,0.5)] border-white/10' : status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : status === 'low' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                                  {!p.active ? 'Hidden' : status === 'active' ? 'Active' : status === 'low' ? 'Low' : 'Out'}
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex gap-1.5">
                                  <button onClick={() => openEditProduct(p)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all" aria-label="Edit"><Edit2 size={13} /></button>
                                  <button onClick={() => removeProduct(p.id)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="Delete"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CATEGORIES — add / edit / remove */}
          {activeSection === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Category Management</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Organise your catalogue. Categories are used across the storefront filters.</p>
              </div>

              {/* Form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  {editingCategoryId ? <Edit2 size={16} className="text-[#FF6B00]" /> : <Plus size={16} className="text-[#FF6B00]" />}
                  {editingCategoryId ? 'Edit category' : 'New category'}
                </h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Label</label>
                    <input value={categoryForm.label}
                      onChange={e => setCategoryForm(f => ({ ...f, label: e.target.value, id: editingCategoryId ? f.id : e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="e.g. Peanut Butter" maxLength={60}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Icon</label>
                    <input value={categoryForm.icon} onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value }))}
                      placeholder="💪" maxLength={6}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white text-center focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Colour</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                        className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] cursor-pointer" />
                      <input value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                        className="flex-1 px-3 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white font-mono focus:border-[#FF6B00] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Category tile image */}
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Tile image (shown on homepage)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0">
                      {categoryForm.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={categoryForm.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xl" style={{ color: categoryForm.color }}>{categoryForm.icon || '?'}</span>
                      )}
                    </div>
                    <button type="button" onClick={() => categoryImgRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.7)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      <Upload size={14} /> {categoryForm.image ? 'Replace image' : 'Upload image'}
                    </button>
                    {categoryForm.image && (
                      <button type="button" onClick={() => setCategoryForm(f => ({ ...f, image: '' }))}
                        className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.6)] hover:text-red-400 rounded-xl text-sm font-semibold transition-all">
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                    <input type="text" value={categoryForm.image?.startsWith('data:') ? '' : (categoryForm.image ?? '')}
                      onChange={e => setCategoryForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="…or paste an image URL"
                      className="flex-1 min-w-[180px] px-3 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <input ref={categoryImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => onCategoryImage(e.target.files?.[0])} />
                  </div>
                  <p className="text-[10px] text-[rgba(245,245,245,0.35)] mt-1.5">Optional — uploaded images stay on this browser (localStorage). Icon/colour are used as fallback.</p>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  {editingCategoryId && (
                    <button onClick={cancelEditCategory}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.6)] hover:text-white text-sm font-semibold rounded-xl transition-all">
                      Cancel
                    </button>
                  )}
                  <button onClick={submitCategory}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                    <Save size={14} /> {editingCategoryId ? 'Save changes' : 'Add category'}
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryList.length === 0 && (
                  <div className="col-span-full bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-10 text-center text-[rgba(245,245,245,0.4)] text-sm">
                    No categories yet — add your first one above.
                  </div>
                )}
                {categoryList.map(c => {
                  const count = productList.filter(p => p.category === c.id).length;
                  return (
                    <div key={c.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl overflow-hidden shrink-0" style={{ background: c.image ? '#0a0a0a' : `${c.color}22`, color: c.color }}>
                          {c.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : c.icon}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => toggleCategoryActive(c.id)}
                            title={c.active ? 'Hide' : 'Show'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${c.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[rgba(245,245,245,0.4)] hover:bg-white/5'}`}>
                            {c.active ? <Eye size={13} /> : <X size={13} />}
                          </button>
                          <button onClick={() => editCategory(c)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                          <button onClick={() => removeCategoryLocal(c.id)} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="text-white font-bold text-[15px]">{c.label}</div>
                      <div className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5 font-mono">{c.id}</div>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(245,245,245,0.5)]">{count} product{count === 1 ? '' : 's'}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${c.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-[rgba(245,245,245,0.5)]'}`}>
                          {c.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PROMOTIONS (photo / video) */}
          {activeSection === 'promotions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Promotions</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Add photo &amp; video banners shown on the homepage.</p>
              </div>

              {/* Add promo form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-[#FF6B00]" /> New Promotion</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Title</label>
                    <input value={promoForm.title} onChange={e => setPromoForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mega Protein Sale"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Type</label>
                    <div className="flex gap-2">
                      {(['photo', 'video'] as const).map(t => (
                        <button key={t} onClick={() => setPromoForm(f => ({ ...f, type: t, url: '' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${promoForm.type === t ? 'bg-[#FF6B00] text-white' : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.5)] hover:text-white'}`}>
                          {t === 'photo' ? <ImageIcon size={14} /> : <Film size={14} />} {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">
                      {promoForm.type === 'photo' ? 'Upload Image' : 'Upload Video'}
                    </label>
                    <button onClick={() => promoFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.6)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      <Upload size={15} /> Choose {promoForm.type === 'photo' ? 'image' : 'video'}
                    </button>
                    <input ref={promoFileRef} type="file" accept={promoForm.type === 'photo' ? 'image/*' : 'video/*'} className="hidden"
                      onChange={e => onPromoFile(e.target.files?.[0])} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">…or paste a URL</label>
                    <input value={promoForm.url.startsWith('data:') || promoForm.url.startsWith('blob:') ? '' : promoForm.url}
                      onChange={e => setPromoForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Click-through Link</label>
                    <input value={promoForm.link} onChange={e => setPromoForm(f => ({ ...f, link: e.target.value }))} placeholder="/products"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  {/* Preview */}
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Preview</label>
                    <div className="w-full h-[44px] rounded-xl overflow-hidden bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                      {promoForm.url ? (
                        promoForm.type === 'photo'
                          ? <img src={promoForm.url} alt="preview" className="w-full h-full object-cover" />
                          : <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold"><Play size={12} /> Video ready</span>
                      ) : <span className="text-[11px] text-[rgba(245,245,245,0.3)]">No media yet</span>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={addPromo} disabled={!promoForm.title.trim() || !promoForm.url.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all">
                    <Plus size={15} /> Add Promotion
                  </button>
                </div>
              </div>

              {/* Promo list */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {promoList.map(p => (
                  <div key={p.id} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div className="relative aspect-video bg-[#0a0a0a]">
                      {p.type === 'photo'
                        ? <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                        : <video src={p.url} className="w-full h-full object-cover" muted />}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white bg-black/60 backdrop-blur-sm flex items-center gap-1">
                        {p.type === 'photo' ? <ImageIcon size={10} /> : <Film size={10} />} {p.type}
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${p.active ? 'bg-emerald-500/90 text-white' : 'bg-[rgba(0,0,0,0.6)] text-[rgba(245,245,245,0.6)]'}`}>
                        {p.active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-semibold text-white line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-[rgba(245,245,245,0.4)] truncate">→ {p.link}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => togglePromo(p.id)} className="flex-1 py-2 text-[11px] font-bold text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-all">
                          {p.active ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => removePromo(p.id)} className="px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {promoList.length === 0 && (
                  <div className="sm:col-span-2 lg:col-span-3 py-16 text-center text-[rgba(245,245,245,0.4)] text-sm">No promotions yet. Add one above.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* BRANDS (carousel logos) */}
          {activeSection === 'brands' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Brands</h2>
                <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Manage the brand logos shown in the homepage carousel.</p>
              </div>

              {/* Add brand form */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-[#FF6B00]" /> Add Brand</h3>
                <div className="grid sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Brand Name</label>
                    <input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Optimum Nutrition"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Short (fallback)</label>
                    <input value={brandForm.short} onChange={e => setBrandForm(f => ({ ...f, short: e.target.value }))} placeholder="ON" maxLength={4}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none uppercase" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">Logo</label>
                    <button onClick={() => brandFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0a0a0a] border border-dashed border-[rgba(255,107,0,0.4)] text-[rgba(245,245,245,0.6)] hover:text-white rounded-xl text-sm font-semibold transition-all">
                      {brandForm.logo ? <><Check size={14} className="text-emerald-400" /> Selected</> : <><Upload size={14} /> Upload</>}
                    </button>
                    <input ref={brandFileRef} type="file" accept="image/*" className="hidden" onChange={e => onBrandLogo(e.target.files?.[0])} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {brandForm.logo && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a]">
                      <img src={brandForm.logo} alt="logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button onClick={addBrand} disabled={!brandForm.name.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all ml-auto">
                    <Plus size={15} /> Add Brand
                  </button>
                </div>
              </div>

              {/* Brand grid */}
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-1">Current Brands ({brandList.length})</h3>
                <p className="text-[11px] text-[rgba(245,245,245,0.4)] mb-4">Click a brand card to upload or replace its logo — e.g. add the MyProtein logo.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {brandList.map(b => (
                    <div key={b.id} className="group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,107,0,0.3)] transition-all">
                      <button type="button" onClick={() => startBrandLogoEdit(b.id)}
                        title="Upload / replace logo"
                        className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#141414] border border-[rgba(255,255,255,0.08)] hover:border-[#FF6B00] transition-colors">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo} alt={b.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-[var(--font-montserrat)] font-black text-[#FF6B00]">{b.short}</span>
                        )}
                        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload size={16} className="text-white" />
                        </span>
                      </button>
                      <span className="text-[12px] font-semibold text-white text-center leading-tight line-clamp-1">{b.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {b.logo && (
                          <button onClick={() => clearBrandLogo(b.id)} aria-label={`Remove ${b.name} logo`} title="Remove logo"
                            className="p-1 text-[rgba(245,245,245,0.5)] hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-all">
                            <ImageIcon size={12} />
                          </button>
                        )}
                        <button onClick={() => removeBrand(b.id)} aria-label={`Remove ${b.name}`} title="Delete brand"
                          className="p-1 text-[rgba(245,245,245,0.5)] hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Single hidden input reused by every brand card */}
                <input ref={brandEditFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => onBrandLogoEditFile(e.target.files?.[0])} />
              </div>
            </motion.div>
          )}

          {/* ORDERS */}
          {activeSection === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Order Management</h2>
                <div className="flex gap-2 flex-wrap">
                  {['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'].map(s => (
                    <button key={s} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${s === 'All' ? 'bg-[#FF6B00] text-white' : 'bg-[#111] border border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.5)] hover:text-white'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                      {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-[#FF6B00] text-[12px] font-bold">{o.id}</td>
                        <td className="px-5 py-3 text-white text-[12px]">{o.customer}</td>
                        <td className="px-5 py-3 text-[rgba(245,245,245,0.6)] text-[12px]">{o.product}</td>
                        <td className="px-5 py-3 text-white text-[12px] font-bold">{o.amount}</td>
                        <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${statusColors[o.status]}`}>{o.status}</span></td>
                        <td className="px-5 py-3 text-[rgba(245,245,245,0.4)] text-[12px]">{o.date}</td>
                        <td className="px-5 py-3 flex gap-2">
                          <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/5 rounded-lg transition-all"><Eye size={13} /></button>
                          <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* INVENTORY — live stock levels, inline edit + quick restock */}
          {activeSection === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Stock Value', value: `₹${inventorySummary.value.toLocaleString('en-IN')}`, icon: DollarSign, color: '#FF6B00' },
                  { label: 'Total SKUs', value: inventorySummary.total.toString(), icon: Box, color: '#60a5fa' },
                  { label: 'Low Stock Items', value: inventorySummary.low.toString(), icon: AlertTriangle, color: '#fbbf24' },
                  { label: 'Out of Stock', value: inventorySummary.out.toString(), icon: X, color: '#f87171' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
                      <s.icon size={17} style={{ color: s.color }} />
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] gap-3 flex-wrap">
                  <h3 className="font-bold text-white">Stock Levels</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                      <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search product / SKU"
                        className="pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-56" />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.05)]">
                        {['Product', 'SKU', 'In Stock', 'Reorder At', 'Stock Value', 'Status', 'Quick Restock'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 && (
                        <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[rgba(245,245,245,0.4)]">No matching products.</td></tr>
                      )}
                      {filteredInventory.map(p => {
                        const status = p.stock === 0 ? 'out' : p.stock < (p.reorderAt || 0) ? 'low' : 'healthy';
                        return (
                          <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center shrink-0">
                                  {p.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : <Box size={13} className="text-[rgba(245,245,245,0.3)]" />}
                                </div>
                                <span className="text-white text-[13px] font-semibold line-clamp-1">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px] font-mono">{p.sku}</td>
                            <td className="px-5 py-3.5">
                              <input type="number" min={0} value={p.stock}
                                onChange={e => setStock(p.id, Number(e.target.value))}
                                className="w-20 px-2.5 py-1.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[13px] font-bold text-white text-center focus:border-[#FF6B00] focus:outline-none"
                                style={{ color: status === 'out' ? '#f87171' : status === 'low' ? '#fbbf24' : '#34d399' }} />
                              <span className="ml-1 text-[11px] text-[rgba(245,245,245,0.4)]">units</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <input type="number" min={0} value={p.reorderAt}
                                onChange={e => setReorder(p.id, Number(e.target.value))}
                                className="w-20 px-2.5 py-1.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[12px] text-white text-center focus:border-[#FF6B00] focus:outline-none" />
                            </td>
                            <td className="px-5 py-3.5 text-white text-[12px] font-bold">₹{(p.price * p.stock).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status === 'healthy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : status === 'low' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                                {status === 'healthy' ? 'Healthy' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => bumpStock(p.id, -1)} disabled={p.stock === 0}
                                  className="p-1.5 text-[rgba(245,245,245,0.5)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"><Minus size={12} /></button>
                                <button onClick={() => bumpStock(p.id, 1)}
                                  className="p-1.5 text-[rgba(245,245,245,0.5)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Plus size={12} /></button>
                                <button onClick={() => bumpStock(p.id, 10)}
                                  className="ml-1 px-2 py-1 text-[10px] font-bold text-[#FF6B00] bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.2)] rounded-lg transition-all">+10</button>
                                <button onClick={() => bumpStock(p.id, 50)}
                                  className="px-2 py-1 text-[10px] font-bold text-[#FF6B00] bg-[rgba(255,107,0,0.1)] hover:bg-[rgba(255,107,0,0.2)] rounded-lg transition-all">+50</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* CUSTOMERS */}
          {activeSection === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Customers</h2>
                  <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">3,456 total customers</p>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
                  <input placeholder="Search customers..." className="pl-9 pr-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none w-64" />
                </div>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                        {['Customer', 'Email', 'Orders', 'Total Spent', 'Joined', 'Tier', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c.email} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[rgba(255,107,0,0.15)] flex items-center justify-center text-[#FF6B00] text-[12px] font-black">{c.name.charAt(0)}</div>
                              <span className="text-white text-[13px] font-semibold">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.5)] text-[12px]">{c.email}</td>
                          <td className="px-5 py-3.5 text-white text-[12px] font-semibold">{c.orders}</td>
                          <td className="px-5 py-3.5 text-white text-[12px] font-bold">{c.spent}</td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{c.joined}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'vip' ? 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]' : c.status === 'new' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>{c.status}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white hover:bg-white/5 rounded-lg transition-all"><Eye size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* VENDORS */}
          {activeSection === 'vendors' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Vendors & Suppliers</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> Add Vendor</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {vendors.map(v => (
                  <div key={v.name} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><Store size={18} className="text-[#FF6B00]" /></div>
                        <div>
                          <p className="text-white font-bold text-[14px]">{v.name}</p>
                          <p className="text-[rgba(245,245,245,0.4)] text-[11px] flex items-center gap-1"><Mail size={10} /> {v.contact}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{v.status}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="text-[12px] text-[rgba(245,245,245,0.5)]"><span className="text-white font-bold">{v.products}</span> products supplied</span>
                      <button className="text-[12px] text-[#FF6B00] font-bold flex items-center gap-1">Manage <ChevronRight size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REPORTS */}
          {activeSection === 'reports' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Revenue (30d)', value: '₹8,45,230', change: '+53.5%', icon: DollarSign, color: '#FF6B00' },
                  { label: 'Avg Order Value', value: '₹2,184', change: '+6.1%', icon: ShoppingBag, color: '#a78bfa' },
                  { label: 'Conversion Rate', value: '3.8%', change: '+0.4%', icon: TrendingUp, color: '#34d399' },
                  { label: 'Refund Rate', value: '1.2%', change: '-0.3%', icon: ArrowUpRight, color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}><s.icon size={17} style={{ color: s.color }} /></div>
                      <span className="text-[11px] font-bold text-emerald-400">{s.change}</span>
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="font-bold text-white mb-5">Revenue by Day</h3>
                  <div className="flex items-end gap-3 h-40">
                    {chartData.map(d => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-[#FF6B00] to-[rgba(255,107,0,0.3)] hover:opacity-80 transition-all cursor-pointer" style={{ height: `${d.val}%` }} />
                        <span className="text-[9px] text-[rgba(245,245,245,0.4)]">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                  <h3 className="font-bold text-white mb-4">Sales by Category</h3>
                  <div className="space-y-3.5">
                    {[
                      { cat: 'Protein', pct: 42, color: '#FF6B00' },
                      { cat: 'Mass Gainer', pct: 24, color: '#a78bfa' },
                      { cat: 'Pre-Workout', pct: 18, color: '#34d399' },
                      { cat: 'Creatine', pct: 11, color: '#60a5fa' },
                      { cat: 'Others', pct: 5, color: '#fbbf24' },
                    ].map(c => (
                      <div key={c.cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-[rgba(245,245,245,0.6)]">{c.cat}</span>
                          <span className="text-[12px] text-white font-bold">{c.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COUPONS */}
          {activeSection === 'coupons' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Coupons & Discounts</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> Create Coupon</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {coupons.map(c => (
                  <div key={c.code} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] flex items-center justify-center"><Percent size={18} className="text-[#FF6B00]" /></div>
                        <div>
                          <p className="text-white font-black text-[15px] tracking-wide font-mono">{c.code}</p>
                          <p className="text-[rgba(245,245,245,0.4)] text-[12px]">{c.desc}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>{c.status}</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[rgba(245,245,245,0.4)]">{c.used} / {c.limit} used</span>
                        <span className="text-[11px] text-white font-bold">{Math.round((c.used / c.limit) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${Math.min((c.used / c.limit) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <button className="flex-1 py-2 text-[12px] text-[rgba(245,245,245,0.6)] hover:text-white border border-[rgba(255,255,255,0.1)] rounded-lg transition-all flex items-center justify-center gap-1.5"><Edit2 size={12} /> Edit</button>
                      <button className="py-2 px-3 text-[12px] text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REVIEWS */}
          {activeSection === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Product Reviews</h2>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} size={13} className={j < r.rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-[rgba(245,245,245,0.18)]'} />
                            ))}
                          </div>
                          <span className="text-[12px] text-white font-bold">{r.product}</span>
                        </div>
                        <p className="text-[13px] text-[rgba(245,245,245,0.7)] mb-1.5">&ldquo;{r.comment}&rdquo;</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">by {r.customer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${r.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{r.status}</span>
                        {r.status === 'pending' && (
                          <button className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={15} /></button>
                        )}
                        <button className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SUPPORT TICKETS */}
          {activeSection === 'support' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Support Tickets</h2>
                <span className="px-3 py-1.5 bg-[rgba(255,107,0,0.15)] text-[#FF6B00] text-[11px] font-bold rounded-lg">3 open</span>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                        {['Ticket', 'Customer', 'Subject', 'Priority', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-[#FF6B00] text-[12px] font-bold">{t.id}</td>
                          <td className="px-5 py-3.5 text-white text-[12px]">{t.customer}</td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.6)] text-[12px]">{t.subject}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${t.priority === 'high' ? 'bg-red-500/15 text-red-400 border-red-500/20' : t.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/15 text-blue-400 border-blue-500/20'}`}>{t.priority}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]'}`}>{t.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{t.date}</td>
                          <td className="px-5 py-3.5">
                            <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><MessageSquare size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* CMS */}
          {activeSection === 'cms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Content Management</h2>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Plus size={15} /> New Content</button>
              </div>
              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                      {['Title', 'Type', 'Last Updated', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cmsPages.map(c => (
                      <tr key={c.title} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                              {c.type === 'Banner' ? <ImageIcon size={14} className="text-[rgba(245,245,245,0.35)]" /> : <FileText size={14} className="text-[rgba(245,245,245,0.35)]" />}
                            </div>
                            <span className="text-white text-[13px] font-semibold">{c.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[rgba(245,245,245,0.5)] text-[12px]">{c.type}</td>
                        <td className="px-5 py-3.5 text-[rgba(245,245,245,0.4)] text-[12px]">{c.updated}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${c.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'}`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)] rounded-lg transition-all"><Edit2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* APPOINTMENTS */}
          {activeSection === 'appointments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Appointments</h2>
                  <p className="text-[rgba(245,245,245,0.4)] text-sm mt-0.5">Manage customer bookings and consultation slots</p>
                </div>
                <a href="/book" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.25)] text-[#FF6B00] text-sm font-bold rounded-xl hover:bg-[#FF6B00] hover:text-white transition-all">
                  <Calendar size={14} /> Booking Page ↗
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: apptStats.total, icon: Calendar, color: '#a78bfa' },
                  { label: "Today's", value: apptStats.todayCount, icon: CalendarCheck, color: '#34d399' },
                  { label: 'Pending', value: apptStats.pending, icon: Clock, color: '#fbbf24' },
                  { label: 'Confirmed', value: apptStats.confirmed, icon: CheckCircle, color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                        <s.icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{s.label} Appointments</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <Calendar size={13} className="text-[rgba(245,245,245,0.35)] shrink-0" />
                  <input type="date" value={apptFilterDate} onChange={e => setApptFilterDate(e.target.value)}
                    className="bg-transparent text-sm text-white outline-none flex-1 [color-scheme:dark]" />
                  {apptFilterDate && (
                    <button onClick={() => setApptFilterDate('')} className="text-[rgba(245,245,245,0.35)] hover:text-white">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <select value={apptFilterStatus} onChange={e => setApptFilterStatus(e.target.value as AppointmentStatus | 'all')}
                  className="px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white outline-none focus:border-[#FF6B00]">
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
                <select value={apptFilterType} onChange={e => setApptFilterType(e.target.value)}
                  className="px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white outline-none focus:border-[#FF6B00]">
                  <option value="all">All Types</option>
                  {(Object.entries(APPOINTMENT_TYPES) as [string, { label: string }][]).map(([id, info]) => (
                    <option key={id} value={id}>{info.label}</option>
                  ))}
                </select>
              </div>

              {/* Table + Detail panel */}
              <div className="flex gap-5">
                {/* Table */}
                <div className={`bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden flex-1 min-w-0 transition-all ${selectedAppt ? 'lg:w-[60%]' : 'w-full'}`}>
                  {filteredAppts.length === 0 ? (
                    <div className="p-10 text-center">
                      <Calendar size={32} className="text-[rgba(245,245,245,0.1)] mx-auto mb-3" />
                      <p className="text-[rgba(245,245,245,0.4)] text-sm">No appointments found.</p>
                      <a href="/book" target="_blank" rel="noreferrer" className="mt-3 inline-block text-[#FF6B00] text-sm font-bold hover:underline">
                        Share booking link →
                      </a>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                            {['ID', 'Customer', 'Type', 'Date & Time', 'Status', 'Actions'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold tracking-widest text-[rgba(245,245,245,0.35)] uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAppts.map(a => {
                            const typeInfo = APPOINTMENT_TYPES[a.type];
                            const statusInfo = STATUS_CONFIG[a.status];
                            return (
                              <tr key={a.id}
                                onClick={() => setSelectedAppt(sel => sel?.id === a.id ? null : a)}
                                className={`border-b border-[rgba(255,255,255,0.04)] transition-colors cursor-pointer ${selectedAppt?.id === a.id ? 'bg-[rgba(255,107,0,0.06)]' : 'hover:bg-white/[0.02]'}`}>
                                <td className="px-4 py-3 text-[11px] font-mono text-[#FF6B00] font-bold">{a.id}</td>
                                <td className="px-4 py-3">
                                  <p className="text-[13px] text-white font-semibold">{a.customerName}</p>
                                  <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{a.customerPhone}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[13px]">{typeInfo.icon}</span>{' '}
                                  <span className="text-[12px] text-[rgba(245,245,245,0.65)]">{typeInfo.label}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-[12px] text-white">{new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                  <p className="text-[11px] text-[rgba(245,245,245,0.4)] flex items-center gap-1"><Clock size={10} /> {a.timeSlot}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>{statusInfo.label}</span>
                                </td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                  <div className="flex gap-1">
                                    {a.status === 'pending' && (
                                      <button onClick={() => changeApptStatus(a.id, 'confirmed')} title="Confirm"
                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><CalendarCheck size={13} /></button>
                                    )}
                                    {(a.status === 'pending' || a.status === 'confirmed') && (
                                      <button onClick={() => changeApptStatus(a.id, 'completed')} title="Mark Complete"
                                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={13} /></button>
                                    )}
                                    {a.status !== 'cancelled' && a.status !== 'completed' && (
                                      <button onClick={() => changeApptStatus(a.id, 'cancelled')} title="Cancel"
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><CalendarX size={13} /></button>
                                    )}
                                    <button onClick={() => removeAppt(a.id)} title="Delete"
                                      className="p-1.5 text-[rgba(245,245,245,0.3)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {selectedAppt && (
                    <motion.div
                      key={selectedAppt.id}
                      initial={{ opacity: 0, x: 16, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 280 }}
                      exit={{ opacity: 0, x: 16, width: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                      className="shrink-0 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 overflow-hidden hidden lg:block"
                      style={{ minWidth: 280, maxWidth: 280 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-[#FF6B00]">Appointment Detail</p>
                        <button onClick={() => setSelectedAppt(null)} className="text-[rgba(245,245,245,0.4)] hover:text-white"><X size={14} /></button>
                      </div>

                      <div className="space-y-3 text-[13px]">
                        <div className="p-3 rounded-xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)]">
                          <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1">ID</p>
                          <p className="font-mono font-bold text-white text-[11px]">{selectedAppt.id}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase mb-1">Customer</p>
                          <p className="font-semibold text-white">{selectedAppt.customerName}</p>
                          <a href={`tel:${selectedAppt.customerPhone}`} className="flex items-center gap-1.5 text-[#FF6B00] mt-1 hover:underline text-[12px]">
                            <PhoneCall size={11} /> {selectedAppt.customerPhone}
                          </a>
                          {selectedAppt.customerEmail && (
                            <p className="text-[11px] text-[rgba(245,245,245,0.45)] mt-0.5">{selectedAppt.customerEmail}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase mb-1">Service</p>
                          <p className="text-white">{APPOINTMENT_TYPES[selectedAppt.type].icon} {APPOINTMENT_TYPES[selectedAppt.type].label}</p>
                          <p className="text-[11px] text-[rgba(245,245,245,0.4)]">Duration: {APPOINTMENT_TYPES[selectedAppt.type].duration}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase mb-1">When</p>
                          <p className="text-white">{new Date(selectedAppt.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p className="text-[rgba(245,245,245,0.5)] flex items-center gap-1 mt-0.5"><Clock size={11} /> {selectedAppt.timeSlot}</p>
                        </div>

                        {selectedAppt.notes && (
                          <div>
                            <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase mb-1">Notes</p>
                            <p className="text-[rgba(245,245,245,0.6)] text-[12px] leading-relaxed">{selectedAppt.notes}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase mb-1">Status</p>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_CONFIG[selectedAppt.status].color}`}>
                            {STATUS_CONFIG[selectedAppt.status].label}
                          </span>
                        </div>

                        {/* Quick actions */}
                        <div className="pt-2 border-t border-[rgba(255,255,255,0.07)] space-y-1.5">
                          {selectedAppt.status === 'pending' && (
                            <button onClick={() => changeApptStatus(selectedAppt.id, 'confirmed')}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-[12px] rounded-xl transition-all border border-blue-500/20">
                              <CalendarCheck size={13} /> Confirm
                            </button>
                          )}
                          {(selectedAppt.status === 'pending' || selectedAppt.status === 'confirmed') && (
                            <button onClick={() => changeApptStatus(selectedAppt.id, 'completed')}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[12px] rounded-xl transition-all border border-emerald-500/20">
                              <Check size={13} /> Mark Completed
                            </button>
                          )}
                          {selectedAppt.status !== 'cancelled' && selectedAppt.status !== 'completed' && (
                            <button onClick={() => changeApptStatus(selectedAppt.id, 'cancelled')}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[12px] rounded-xl transition-all border border-red-500/20">
                              <CalendarX size={13} /> Cancel
                            </button>
                          )}
                          {selectedAppt.status !== 'no-show' && (
                            <button onClick={() => changeApptStatus(selectedAppt.id, 'no-show')}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)] text-[rgba(245,245,245,0.4)] font-bold text-[12px] rounded-xl transition-all border border-[rgba(255,255,255,0.06)]">
                              <X size={13} /> No Show
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-3xl">
              <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white">Store Settings</h2>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Store size={16} className="text-[#FF6B00]" /> Store Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Store Name', value: 'Muscle Mantra' },
                    { label: 'Support Email', value: 'hello@musclemantra.in' },
                    { label: 'Phone', value: '+91 84096 12737' },
                    { label: 'City', value: 'Patna, Bihar' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.45)] uppercase tracking-wide mb-1.5">{f.label}</label>
                      <input defaultValue={f.value} className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Admin security / change password ──────────────────── */}
              <AdminPasswordChange adminEmail={adminEmail} />

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Settings size={16} className="text-[#FF6B00]" /> Preferences</h3>
                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {([
                    { key: 'cod', label: 'Cash on Delivery', desc: 'Allow customers to pay on delivery' },
                    { key: 'onlinePay', label: 'Online Payments', desc: 'Accept UPI, cards & netbanking' },
                    { key: 'sameDay', label: 'Same-Day Delivery', desc: 'Offer 30-minute delivery in Patna' },
                    { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Email me when stock runs low' },
                    { key: 'reviews', label: 'Auto-Approve Reviews', desc: 'Publish reviews without moderation' },
                    { key: 'maintenance', label: 'Maintenance Mode', desc: 'Temporarily take the store offline' },
                  ] as const).map(opt => (
                    <div key={opt.key} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{opt.desc}</p>
                      </div>
                      <button onClick={() => flip(opt.key)} aria-label={`Toggle ${opt.label}`}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${toggles[opt.key] ? 'bg-[#FF6B00]' : 'bg-[rgba(255,255,255,0.12)]'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${toggles[opt.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all"><Save size={15} /> Save Changes</button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Product editor modal — image upload/remove + full CRUD */}
      <AnimatePresence>
        {productDraft && (
          <motion.div
            key="product-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-4xl my-8 bg-[#0d0d0d] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d0d]">
                <div>
                  <h3 className="font-[var(--font-montserrat)] font-black text-lg text-white">
                    {productList.some(p => p.id === productDraft.id) ? 'Edit product' : 'Add product'}
                  </h3>
                  <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">All fields are saved locally to this browser.</p>
                </div>
                <button onClick={closeProductModal} className="p-2 text-[rgba(245,245,245,0.5)] hover:text-white hover:bg-white/5 rounded-lg transition-all" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Images */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide">Product Images</label>
                    <span className="text-[10px] text-[rgba(245,245,245,0.4)]">{productDraft.images.length} / 6 · First image is used as the primary</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {productDraft.images.map((src, i) => (
                      <div key={i} className={`relative group aspect-square rounded-xl overflow-hidden border ${i === 0 ? 'border-[#FF6B00]' : 'border-[rgba(255,255,255,0.08)]'} bg-[#0a0a0a]`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`image-${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-[#FF6B00] text-white text-[9px] font-black px-1.5 py-0.5 rounded">PRIMARY</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {i !== 0 && (
                            <button onClick={() => setPrimaryImage(i)} title="Make primary"
                              className="p-1.5 bg-[#FF6B00]/90 hover:bg-[#FF6B00] text-white rounded-lg"><Star size={12} /></button>
                          )}
                          <button onClick={() => removeProductImage(i)} title="Remove"
                            className="p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                    {productDraft.images.length < 6 && (
                      <button onClick={() => productImgRef.current?.click()} type="button"
                        className="aspect-square rounded-xl border border-dashed border-[rgba(255,107,0,0.5)] bg-[#0a0a0a] hover:bg-[rgba(255,107,0,0.05)] flex flex-col items-center justify-center gap-1.5 text-[rgba(245,245,245,0.6)] hover:text-white transition-all">
                        <Upload size={16} />
                        <span className="text-[10px] font-bold">Upload</span>
                      </button>
                    )}
                  </div>
                  <input ref={productImgRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => onProductImagesPick(e.target.files)} />

                  {/* URL fallback */}
                  <div className="mt-3 flex gap-2">
                    <input placeholder="…or paste an image URL (https://…)"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setProductDraft(d => d ? { ...d, images: [...d.images, val].slice(0, 6) } : d);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg text-[13px] text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <span className="text-[10px] text-[rgba(245,245,245,0.4)] self-center">press Enter to add</span>
                  </div>
                </section>

                {/* Basic info */}
                <section className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Product name *</label>
                    <input value={productDraft.name} onChange={e => setProductDraft(d => d ? { ...d, name: e.target.value } : d)}
                      maxLength={200} placeholder="e.g. Gold Standard Whey 2kg"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Brand</label>
                    <input value={productDraft.brand} onChange={e => setProductDraft(d => d ? { ...d, brand: e.target.value } : d)}
                      list="admin-brand-list" placeholder="e.g. Optimum Nutrition" maxLength={100}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                    <datalist id="admin-brand-list">
                      {brandList.map(b => <option key={b.id} value={b.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Category</label>
                    <select value={productDraft.category} onChange={e => setProductDraft(d => d ? { ...d, category: e.target.value } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                      {categoryList.length === 0 && <option value="">— add a category first —</option>}
                      {categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">SKU</label>
                    <input value={productDraft.sku} onChange={e => setProductDraft(d => d ? { ...d, sku: e.target.value } : d)}
                      placeholder="Auto-generated on save" maxLength={60}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white font-mono placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                {/* Pricing & inventory */}
                <section className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Selling Price (₹)</label>
                    <input type="number" min={0} value={productDraft.price}
                      onChange={e => setProductDraft(d => d ? { ...d, price: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">MRP (₹)</label>
                    <input type="number" min={0} value={productDraft.originalPrice}
                      onChange={e => setProductDraft(d => d ? { ...d, originalPrice: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Stock (units)</label>
                    <input type="number" min={0} value={productDraft.stock}
                      onChange={e => setProductDraft(d => d ? { ...d, stock: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Reorder at</label>
                    <input type="number" min={0} value={productDraft.reorderAt}
                      onChange={e => setProductDraft(d => d ? { ...d, reorderAt: Math.max(0, Number(e.target.value)) } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                {/* Options */}
                <section className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Flavors (comma-separated)</label>
                    <input value={productDraft.flavors.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, flavors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="Chocolate, Vanilla"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Sizes (comma-separated)</label>
                    <input value={productDraft.sizes.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="1kg, 2kg, 5lb"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Tags (comma-separated)</label>
                    <input value={productDraft.tags.join(', ')}
                      onChange={e => setProductDraft(d => d ? { ...d, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                      placeholder="whey, protein, muscle gain"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                </section>

                <section className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Delivery time</label>
                    <input value={productDraft.deliveryTime}
                      onChange={e => setProductDraft(d => d ? { ...d, deliveryTime: e.target.value } : d)}
                      placeholder="e.g. 15 min"
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Badge</label>
                    <select value={productDraft.badge ?? ''}
                      onChange={e => setProductDraft(d => d ? { ...d, badge: (e.target.value || undefined) as AdminProduct['badge'] } : d)}
                      className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none">
                      <option value="">— none —</option>
                      <option value="bestseller">Bestseller</option>
                      <option value="new">New</option>
                      <option value="sale">Sale</option>
                      <option value="trending">Trending</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productDraft.active}
                        onChange={e => setProductDraft(d => d ? { ...d, active: e.target.checked } : d)}
                        className="w-4 h-4 accent-[#FF6B00]" />
                      <span className="text-sm text-white font-semibold">Visible on storefront</span>
                    </label>
                  </div>
                </section>

                <div>
                  <label className="block text-[11px] font-bold text-[rgba(245,245,245,0.6)] uppercase tracking-wide mb-1.5">Description</label>
                  <textarea value={productDraft.description}
                    onChange={e => setProductDraft(d => d ? { ...d, description: e.target.value } : d)}
                    rows={3} maxLength={2000} placeholder="Short product description shown on the detail page."
                    className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus:border-[#FF6B00] focus:outline-none resize-none" />
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0d0d0d]">
                <button onClick={closeProductModal}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-[rgba(245,245,245,0.7)] hover:text-white text-sm font-semibold rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={saveProductDraft}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-all">
                  <Save size={14} /> Save product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
