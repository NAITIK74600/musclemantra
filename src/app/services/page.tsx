import Link from 'next/link';
import { Zap, Package, Wrench, RefreshCw, Headphones, Gift, ArrowRight, Check } from 'lucide-react';

export const metadata = {
  title: 'Our Services — Muscle Mantra',
  description: 'Discover all services offered by Muscle Mantra — supplement retail, express delivery, stack builder, subscriptions, and more.',
};

const services = [
  {
    icon: Package,
    title: 'Authentic Supplement Retail',
    badge: 'Core Service',
    badgeColor: 'bg-[rgba(255,107,0,0.12)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
    desc: 'Shop from 500+ 100% authentic products across 10+ categories. Every product is sourced from authorised brand distributors and verified before dispatch.',
    features: [
      'Whey Protein, Mass Gainers, Casein',
      'Creatine, Pre-Workout, BCAAs / EAAs',
      'Fat Burners, Vitamins & Supplements',
      'Gym Accessories & Equipment',
      '30+ globally trusted brands',
    ],
    pricing: 'Products from ₹499 – ₹8,999',
    cta: { label: 'Browse Products', href: '/products' },
  },
  {
    icon: Zap,
    title: 'Express Delivery — Patna',
    badge: 'Exclusive',
    badgeColor: 'bg-[rgba(34,197,94,0.1)] text-green-400 border-[rgba(34,197,94,0.2)]',
    desc: 'Lightning-fast supplement delivery across all major Patna localities. Order before your workout starts and receive your supplement before you\'re done warming up.',
    features: [
      '10–30 minute delivery in Patna',
      'Covers 16+ major Patna localities',
      'Free delivery on orders above ₹999',
      'Real-time order tracking',
      'Live delivery agent support',
    ],
    pricing: 'Delivery fee ₹29 – ₹99 | FREE on orders ₹999+',
    cta: { label: 'Start Shopping', href: '/products' },
  },
  {
    icon: Wrench,
    title: 'Stack Builder Tool',
    badge: 'Free Tool',
    badgeColor: 'bg-[rgba(99,102,241,0.1)] text-indigo-400 border-[rgba(99,102,241,0.2)]',
    desc: 'Not sure which supplements to combine? Our Stack Builder uses your fitness goals, body type, and budget to recommend the ideal supplement combination.',
    features: [
      'Goal-based recommendations (muscle gain, fat loss, endurance)',
      'Budget-friendly stacking options',
      'Prevents supplement overlap/conflicts',
      'One-click add all to cart',
      'Save and share your custom stack',
    ],
    pricing: 'Completely FREE',
    cta: { label: 'Build Your Stack', href: '/stack-builder' },
  },
  {
    icon: RefreshCw,
    title: 'Subscription Plans',
    badge: 'Save 15%',
    badgeColor: 'bg-[rgba(234,179,8,0.1)] text-yellow-400 border-[rgba(234,179,8,0.2)]',
    desc: 'Subscribe to your essential supplements and have them delivered automatically at your chosen frequency. Never run out of protein again — and save on every order.',
    features: [
      'Choose delivery frequency: weekly, bi-weekly, monthly',
      'Up to 15% off on subscribed products',
      'Pause, skip, or cancel anytime',
      'Priority dispatch for subscribers',
      'Exclusive subscriber-only offers',
    ],
    pricing: 'Starting at ₹799/month | Save up to 15%',
    cta: { label: 'View Subscriptions', href: '/subscriptions' },
  },
  {
    icon: Headphones,
    title: 'Expert Support & Consultation',
    badge: 'Free',
    badgeColor: 'bg-[rgba(255,107,0,0.12)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
    desc: 'Have questions about dosage, stacking, or choosing the right product? Our team of fitness-knowledgeable support staff is here to help you make the right choice.',
    features: [
      'Chat, call, or email support',
      'Supplement dosage guidance',
      'Product authenticity verification',
      'Order issue resolution',
      'Available Mon–Sat, 9 AM–8 PM',
    ],
    pricing: 'Completely FREE with any order',
    cta: { label: 'Contact Us', href: '/contact' },
  },
  {
    icon: Gift,
    title: 'Loyalty & Referral Program',
    badge: 'Earn Rewards',
    badgeColor: 'bg-[rgba(236,72,153,0.1)] text-pink-400 border-[rgba(236,72,153,0.2)]',
    desc: 'Earn reward points on every purchase and refer friends to unlock bonus credits. Redeem your points for discounts on future orders.',
    features: [
      'Earn 1 point per ₹10 spent',
      'Referral bonus: ₹100 for you + ₹100 for your friend',
      'Birthday bonus credits',
      'Tier upgrades (Silver → Gold → Platinum)',
      'Exclusive early-access to new products',
    ],
    pricing: 'Automatic — no signup needed',
    cta: { label: 'Learn More', href: '/account' },
  },
];

const pricingHighlights = [
  { label: 'Whey Protein', range: '₹1,299 – ₹4,999', sub: '1kg – 5lb bags' },
  { label: 'Creatine', range: '₹499 – ₹1,499', sub: '250g – 1kg' },
  { label: 'Pre-Workout', range: '₹899 – ₹3,499', sub: '30–60 servings' },
  { label: 'Mass Gainer', range: '₹1,999 – ₹8,999', sub: '3kg – 12lb' },
  { label: 'BCAA / EAA', range: '₹699 – ₹2,499', sub: '250g – 450g' },
  { label: 'Vitamins', range: '₹299 – ₹1,299', sub: '90–180 caps' },
  { label: 'Fat Burners', range: '₹699 – ₹2,999', sub: '60–120 caps' },
  { label: 'Accessories', range: '₹299 – ₹2,999', sub: 'Shakers, bands, belts' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <section className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-14 md:py-18">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-3">What We Offer</p>
          <h1 className="font-[var(--font-montserrat)] font-black text-4xl md:text-5xl text-white leading-tight mb-4 max-w-2xl">
            Services & <span className="text-[#FF6B00]">Pricing</span>
          </h1>
          <p className="text-[15px] text-[rgba(245,245,245,0.55)] leading-relaxed max-w-xl">
            From authentic supplement retail to express delivery, stack building, and subscription plans — Muscle Mantra has everything your fitness journey needs.
          </p>
        </div>
      </section>

      {/* Services list */}
      <section className="container-max py-12 md:py-16">
        <div className="space-y-6">
          {services.map(({ icon: Icon, title, badge, badgeColor, desc, features, pricing, cta }) => (
            <div key={title} className="p-6 md:p-8 rounded-2xl bg-[#0d0d0d] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,107,0,0.15)] transition-colors">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Icon + title */}
                <div className="flex items-center gap-4 md:w-[280px] shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-[#FF6B00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-[var(--font-montserrat)] font-bold text-white text-[15px] leading-tight">{title}</h2>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>{badge}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-[13px] text-[rgba(245,245,245,0.6)] leading-relaxed mb-4">{desc}</p>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-5">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[12px] text-[rgba(245,245,245,0.55)]">
                        <Check size={13} className="text-[#FF6B00] shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                    <span className="text-[13px] font-bold text-white flex-1">{pricing}</span>
                    <Link href={cta.href} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[rgba(255,107,0,0.1)] hover:bg-[#FF6B00] border border-[rgba(255,107,0,0.25)] text-[#FF6B00] hover:text-white text-[12px] font-bold rounded-lg transition-all">
                      {cta.label} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing table */}
      <section className="bg-[#0a0a0a] border-t border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-12 md:py-16">
          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-2">Pricing Overview</p>
            <h2 className="font-[var(--font-montserrat)] font-black text-3xl text-white">Product Price Ranges</h2>
            <p className="mt-2 text-[13px] text-[rgba(245,245,245,0.45)]">Prices are indicative. See actual product pages for exact pricing &amp; discounts.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {pricingHighlights.map(({ label, range, sub }) => (
              <div key={label} className="p-4 rounded-xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[rgba(245,245,245,0.35)] mb-1.5">{label}</p>
                <p className="font-[var(--font-montserrat)] font-black text-white text-[15px]">{range}</p>
                <p className="text-[11px] text-[rgba(245,245,245,0.35)] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-colors">
              Browse All Products &amp; Prices <ArrowRight size={16} />
            </Link>
            <Link href="/checkout" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white text-sm font-bold rounded-xl transition-colors">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
