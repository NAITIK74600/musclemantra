import Link from 'next/link';
import Image from 'next/image';
import { Share2, Globe, Send, MapPin, Phone, Mail } from 'lucide-react';

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Products: [
    { label: 'Whey Protein', href: '/products?cat=protein' },
    { label: 'Creatine', href: '/products?cat=creatine' },
    { label: 'Pre-Workout', href: '/products?cat=pre-workout' },
    { label: 'BCAA / EAA', href: '/products?cat=bcaa' },
    { label: 'Fat Burner', href: '/products?cat=fat-burner' },
    { label: 'Mass Gainer', href: '/products?cat=mass-gainer' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Blogs', href: '/blogs' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Partner Stores', href: '/contact' },
  ],
  Support: [
    { label: 'Track Order', href: '/orders' },
    { label: 'Refund & Returns', href: '/refund-policy' },
    { label: 'Cancellation', href: '/cancellation-policy' },
    { label: 'FAQ', href: '/contact' },
    { label: 'Franchise', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Cancellation Policy', href: '/cancellation-policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] overflow-hidden">

      {/* ── Newsletter + Social ── */}
      <div className="border-t border-b border-[rgba(255,255,255,0.06)] py-5">
        <div className="container-max flex flex-col sm:flex-row items-center justify-between gap-5">

          {/* Newsletter */}
          <div className="w-full sm:w-auto flex flex-col gap-3">
            <div className="text-center sm:text-left">
              <p className="text-sm font-black text-white">JOIN THE MUSCLE ARMY</p>
              <p className="text-[11px] text-[rgba(245,245,245,0.4)]">Get exclusive offers &amp; discounts</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                placeholder="Enter your email"
                className="flex-1 min-w-0 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[rgba(245,245,245,0.3)] outline-none focus:border-[rgba(255,107,0,0.4)] transition-colors"
              />
              <button className="shrink-0 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white text-sm font-bold rounded-lg transition-all">
                GO
              </button>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase tracking-widest">Follow</p>
            {[Share2, Globe, Send].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:bg-[#FF6B00] hover:text-white transition-all">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div className="container-max py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center mb-4">
              <Image src="/logo.png" alt="Muscle Mantra" width={56} height={56} className="w-14 h-14 object-contain" />
            </Link>
            <p className="text-sm text-[rgba(245,245,245,0.5)] leading-relaxed mb-5 max-w-[280px]">
              Patna's most trusted supplement store. 100% authentic products, delivered to your door.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-[rgba(245,245,245,0.45)]">
              <a href="tel:+918409612737" className="flex items-center gap-2.5 hover:text-[#FF6B00] transition-colors">
                <Phone size={13} className="shrink-0" /> +91 84096 12737
              </a>
              <a href="mailto:hello@musclemantra.in" className="flex items-center gap-2.5 hover:text-[#FF6B00] transition-colors">
                <Mail size={13} className="shrink-0" /> hello@musclemantra.in
              </a>
              <span className="flex items-start gap-2.5">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>Tejpartap Nagar, Vrindavan Colony,<br />Anisabad, Patna – 800002, Bihar</span>
              </span>
            </div>
          </div>

          {/* Links — 2-col grid on mobile, 4-col on lg */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[10px] font-bold tracking-[0.15em] uppercase text-[rgba(245,245,245,0.35)] mb-3.5 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                  {category}
                </h4>
                <ul className="flex flex-col gap-2">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[12px] text-[rgba(245,245,245,0.45)] hover:text-[#FF6B00] hover:translate-x-0.5 inline-block transition-all leading-snug"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-[rgba(255,255,255,0.05)]">
          {/* Trust badges — mobile scrollable row */}
          <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
            {['FSSAI Licensed', '100% Authentic', 'Secure Payments', 'GMP Certified'].map(badge => (
              <span key={badge} className="px-3 py-1 rounded-full border border-[rgba(255,255,255,0.08)] text-[10px] font-bold text-[rgba(245,245,245,0.35)] uppercase tracking-wide">
                {badge}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[rgba(245,245,245,0.25)] text-center">
            <div>
              <p>© 2026 Muscle Mantra. All rights reserved.</p>
              <p className="mt-0.5">Operated by <span className="text-[rgba(245,245,245,0.4)]">Amarjeet Kumar</span> &nbsp;·&nbsp; Anisabad, Patna – 800002</p>
            </div>
            <Link href="/admin" className="hover:text-[#FF6B00] transition-colors shrink-0">
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


