'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingActions from './FloatingActions';
import AnnouncementBar from './AnnouncementBar';

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
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1 pt-[calc(60px+var(--mm-announce-h,0px))] sm:pt-[calc(64px+var(--mm-announce-h,0px))] lg:pt-[calc(104px+var(--mm-announce-h,0px))]">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  );
}
