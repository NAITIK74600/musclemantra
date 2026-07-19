import type { Metadata } from 'next';
import InvoiceClient from './InvoiceClient';

export const metadata: Metadata = { title: 'Invoice — Muscle Mantra' };

export function generateStaticParams() {
  return [{ orderId: '_' }];
}

export default function InvoicePage() {
  return <InvoiceClient />;
}
