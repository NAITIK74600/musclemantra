'use client';

import { useEffect } from 'react';
import { startSessionWatch } from '@/lib/auth';

/**
 * Mounts the 6-hour session watcher for the whole app. Renders nothing.
 * Auto signs the user out when the session window elapses or the app has
 * been sitting in a background tab past its expiry.
 */
export default function SessionGuard() {
  useEffect(() => startSessionWatch(), []);
  return null;
}
