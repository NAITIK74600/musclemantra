import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'Brands', href: '/brands' },
    { label: 'Offers', href: '/offers' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Track Order', href: '/orders' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[rgba(255,255,255,0.06)]">
      <div className="container-max py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand + contact */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Muscle Mantra" width={44} height={44} className="w-11 h-11 object-contain" />
              <span className="font-black text-lg text-white tracking-tight">MUSCLE MANTRA</span>
            </Link>
            <p className="text-sm text-[rgba(245,245,245,0.5)] leading-relaxed mb-4 max-w-[300px]">
              Patna&apos;s trusted supplement store. 100% authentic products, fast delivery across India.
            </p>
            <div className="flex flex-col gap-2 text-sm text-[rgba(245,245,245,0.5)]">
              <a href="tel:+918409612737" className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors">
                <Phone size={13} /> +91 84096 12737
              </a>
              <a href="mailto:hello@musclemantra.in" className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors">
                <Mail size={13} /> hello@musclemantra.in
              </a>
              <span className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>Anisabad, Patna – 800002, Bihar</span>
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-white mb-4">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[rgba(245,245,245,0.5)] hover:text-[#FF6B00] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[rgba(245,245,245,0.35)] text-center sm:text-left">
            © 2026 Muscle Mantra. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/musclemantra"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:bg-[#FF6B00] hover:text-white transition-all"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.2 8.8 2.2 12 2.2M12 0C8.74 0 8.33 0 7.05.07 5.78.13 4.9.33 4.14.63c-.8.31-1.47.72-2.15 1.4C1.31 2.7.9 3.37.59 4.17.29 4.93.09 5.81.03 7.08.03 8.36 0 8.77 0 12s0 3.64.07 4.92c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.4 2.15.68.68 1.35 1.09 2.15 1.4.76.3 1.64.5 2.91.56C8.36 24 8.77 24 12 24s3.64 0 4.92-.07c1.27-.06 2.15-.26 2.91-.56.8-.31 1.47-.72 2.15-1.4.68-.68 1.09-1.35 1.4-2.15.3-.76.5-1.64.56-2.91C24 15.64 24 15.23 24 12s0-3.64-.07-4.92c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.4-2.15A5.9 5.9 0 0 0 19.83.63c-.76-.3-1.64-.5-2.91-.56C15.64 0 15.23 0 12 0m0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84m0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/musclemantra"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:bg-[#FF6B00] hover:text-white transition-all"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M24 12A12 12 0 1 0 10.13 23.85V15.47H7.08V12h3.05V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
