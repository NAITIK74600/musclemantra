import type { Metadata } from 'next';
import WishlistClient from './WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist — Muscle Mantra',
  description: 'Your saved supplements. Keep track of your favourite protein, creatine, pre-workout and more at Muscle Mantra.',
};

export default function WishlistPage() {
  return <WishlistClient />;
}
