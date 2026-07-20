import type { Metadata } from 'next';
import PayClient from './PayClient';

export const metadata: Metadata = { title: 'Pay Now — Muscle Mantra' };

export default function PayPage() {
  return <PayClient />;
}
