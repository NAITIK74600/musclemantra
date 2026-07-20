'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { syncProductsFromServer, syncCategoriesFromServer } from '@/lib/store';

/**
 * Pulls the live catalogue (products + categories) from the server into the
 * local cache on every storefront page load, so customers on any device always
 * see the current, admin-managed catalogue — not stale defaults.
 *
 * Skipped on /admin and /delivery: those panels manage their own (full,
 * incl. hidden) sync and must not be overwritten by the active-only feed.
 */
export default function StoreSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/delivery')) return;
    const sync = () => { void syncProductsFromServer(); void syncCategoriesFromServer(); };
    sync();
    const onFocus = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [pathname]);

  return null;
}
