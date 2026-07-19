'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingActions from './FloatingActions';

/**
 * Hides Navbar + Footer + FloatingActions on admin routes.
 * Admin panel gets a clean, full-screen dashboard experience.
 */
export default function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-[76px] sm:pt-[92px] lg:pt-[104px]">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  );
}
