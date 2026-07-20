import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us — Muscle Mantra',
  description:
    'Get in touch with Muscle Mantra. Questions about products, orders or bulk pricing? Call +91 84096 12737, email admin@musclemantra.shop, or send us a message.',
  alternates: { canonical: 'https://musclemantra.shop/contact' },
};

export default function ContactPage() {
  return <ContactClient />;
}
