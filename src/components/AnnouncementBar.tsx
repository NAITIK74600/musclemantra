'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAnnouncement, syncSiteContentFromServer, type AnnouncementContent } from '@/lib/store';

const STORE_EVENT = 'mb-store-change';

/**
 * Slim promotional strip pinned above the navbar. Content is managed from the
 * admin CMS section. Its height is published as the CSS variable
 * `--mm-announce-h` so the fixed navbar and page padding shift down when it is
 * shown (and collapse when it is hidden).
 */
export default function AnnouncementBar() {
  const [ann, setAnn] = useState<AnnouncementContent | null>(null);

  useEffect(() => {
    const refresh = () => setAnn(getAnnouncement());
    refresh();
    void syncSiteContentFromServer().then(refresh);
    window.addEventListener(STORE_EVENT, refresh);
    return () => window.removeEventListener(STORE_EVENT, refresh);
  }, []);

  const show = !!ann?.enabled && !!ann.text?.trim();

  useEffect(() => {
    document.documentElement.style.setProperty('--mm-announce-h', show ? '36px' : '0px');
    return () => { document.documentElement.style.setProperty('--mm-announce-h', '0px'); };
  }, [show]);

  if (!show || !ann) return null;

  const link = ann.link?.trim() ?? '';
  const isInternal = link.startsWith('/');
  const isExternal = link.startsWith('https://') || link.startsWith('http://');

  const body = <span className="truncate">{ann.text}</span>;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-9 flex items-center justify-center bg-[#FF6B00] text-white text-[12px] sm:text-[13px] font-semibold px-4 text-center">
      {isInternal ? (
        <Link href={link} className="truncate hover:underline">{ann.text}</Link>
      ) : isExternal ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{ann.text}</a>
      ) : body}
    </div>
  );
}
