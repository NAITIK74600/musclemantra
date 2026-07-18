import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, ShieldCheck, Truck, Star, Users, Award, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About Us — Muscle Mantra',
  description: 'Learn about Muscle Mantra — Patna\'s most trusted authentic supplement store, founded by Amarjeet Kumar.',
};

const stats = [
  { value: '500+', label: 'Products Available' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '100%', label: 'Authentic Products' },
  { value: '10–30', label: 'Min Delivery' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Authenticity Guaranteed',
    desc: 'Every product on our platform is sourced directly from authorised brand distributors. We perform quality checks before dispatch.',
  },
  {
    icon: Truck,
    title: 'Express Local Delivery',
    desc: 'Based in Patna, we deliver to all major areas within 10–30 minutes — the fastest supplement delivery in the city.',
  },
  {
    icon: Star,
    title: 'Customer First',
    desc: 'From easy returns to 24/7 support, we prioritise your satisfaction at every step of your purchase journey.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'We are fitness enthusiasts ourselves. Our team helps you find the right stack for your specific goals and budget.',
  },
];

const services = [
  { title: 'Authentic Supplement Retail', desc: 'Shop from 500+ genuine products across 10+ categories including protein, creatine, pre-workouts, BCAAs, and more.' },
  { title: 'Express Delivery in Patna', desc: 'Order anytime and receive your supplements within 10–30 minutes across all major Patna localities.' },
  { title: 'Personalised Stack Builder', desc: 'Our AI-powered Stack Builder helps you create the perfect supplement combination based on your fitness goals.' },
  { title: 'Subscription Plans', desc: 'Never run out of your essentials. Subscribe to your favourite products and save up to 15% on every order.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-16 md:py-20">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-3">About Us</p>
          <h1 className="font-[var(--font-montserrat)] font-black text-4xl md:text-5xl text-white leading-tight mb-5 max-w-2xl">
            Patna&apos;s Most Trusted<br />
            <span className="text-[#FF6B00]">Supplement Store</span>
          </h1>
          <p className="text-[15px] text-[rgba(245,245,245,0.55)] leading-relaxed max-w-xl mb-8">
            Founded and operated by <strong className="text-white">Amarjeet Kumar</strong>, Muscle Mantra was built with one mission: to make 100% authentic, high-quality sports nutrition accessible to every fitness enthusiast in Patna and beyond.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-xl transition-colors">
              Shop Products <ArrowRight size={15} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.3)] text-white text-sm font-bold rounded-xl transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-[#FF6B00] mb-1">{value}</p>
                <p className="text-[12px] font-bold tracking-widest uppercase text-[rgba(245,245,245,0.4)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container-max py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-3">Our Story</p>
            <h2 className="font-[var(--font-montserrat)] font-black text-3xl text-white mb-5 leading-tight">
              Built by a Fitness Enthusiast, for Fitness Enthusiasts
            </h2>
            <div className="space-y-4 text-[14px] text-[rgba(245,245,245,0.6)] leading-relaxed">
              <p>
                Muscle Mantra was founded by <strong className="text-white">Amarjeet Kumar</strong> after years of frustration with counterfeit supplements flooding the market. As an avid gym-goer himself, Amarjeet knew first-hand the difference authentic nutrition made in achieving real fitness goals.
              </p>
              <p>
                What started as a small local operation has grown into Patna&apos;s go-to destination for genuine sports nutrition. We stock over 500 products from 30+ globally trusted brands including Optimum Nutrition, MuscleBlaze, Dymatize, MyProtein, and more.
              </p>
              <p>
                Our express delivery model — 10 to 30 minutes across Patna — means you never have to plan days ahead. Run out of protein? Order now, and it&apos;ll be at your door before your next workout.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-[#111]">
              <Image
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80"
                alt="Muscle Mantra Store"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 p-4 rounded-2xl bg-[#0a0a0a] border border-[rgba(255,107,0,0.25)]">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#FF6B00]" />
                <div>
                  <p className="text-[11px] font-black text-white">FSSAI Licensed</p>
                  <p className="text-[10px] text-[rgba(245,245,245,0.4)]">Quality Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#0a0a0a] border-y border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-14 md:py-20">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-3">Why Choose Us</p>
            <h2 className="font-[var(--font-montserrat)] font-black text-3xl text-white">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,107,0,0.2)] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#FF6B00]" />
                </div>
                <h3 className="font-[var(--font-montserrat)] font-bold text-white text-[14px] mb-2">{title}</h3>
                <p className="text-[13px] text-[rgba(245,245,245,0.5)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services overview */}
      <section className="container-max py-14 md:py-20">
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-3">What We Offer</p>
          <h2 className="font-[var(--font-montserrat)] font-black text-3xl text-white mb-2">Our Services</h2>
          <p className="text-[14px] text-[rgba(245,245,245,0.5)]">
            <Link href="/services" className="text-[#FF6B00] hover:underline">View all services with pricing →</Link>
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {services.map(({ title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
              <div className="w-2 h-2 rounded-full bg-[#FF6B00] mt-2 shrink-0" />
              <div>
                <p className="font-semibold text-white text-[14px] mb-1">{title}</p>
                <p className="text-[13px] text-[rgba(245,245,245,0.5)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Owner & Address */}
      <section className="bg-[#0a0a0a] border-t border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-14 md:py-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Owner */}
            <div className="p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-4">Proprietor</p>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#FF6B00] flex items-center justify-center text-white font-black text-lg shrink-0">AK</div>
                <div>
                  <p className="font-[var(--font-montserrat)] font-black text-white text-xl">Amarjeet Kumar</p>
                  <p className="text-[13px] text-[rgba(245,245,245,0.5)] mt-1">Founder &amp; Proprietor, Muscle Mantra</p>
                  <div className="mt-3 space-y-1.5 text-[13px] text-[rgba(245,245,245,0.55)]">
                    <p className="flex items-center gap-2"><Phone size={13} className="text-[#FF6B00]" /> <a href="tel:+918409612737" className="hover:text-[#FF6B00] transition-colors">+91 84096 12737</a></p>
                    <p className="flex items-center gap-2"><Mail size={13} className="text-[#FF6B00]" /> <a href="mailto:hello@musclemantra.in" className="hover:text-[#FF6B00] transition-colors">hello@musclemantra.in</a></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-4">Registered Address</p>
              <div className="flex gap-3">
                <MapPin size={18} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="text-[14px] text-[rgba(245,245,245,0.7)] leading-relaxed">
                  <p className="font-semibold text-white">Muscle Mantra</p>
                  <p>Tejpartap Nagar, Vrindavan Colony</p>
                  <p>Anisabad, Patna – 800002</p>
                  <p>Bihar, India</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-[rgba(255,107,0,0.1)] text-[#FF6B00] text-[11px] font-bold">FSSAI Licensed</span>
                <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(245,245,245,0.5)] text-[11px] font-bold">100% Authentic</span>
                <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(245,245,245,0.5)] text-[11px] font-bold">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
