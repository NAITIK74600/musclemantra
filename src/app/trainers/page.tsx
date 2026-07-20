import type { Metadata } from 'next';
import TrainersClient from './TrainersClient';

export const metadata: Metadata = {
  title: 'Personal Trainers — Book a Slot | Muscle Mantra',
  description:
    'Book certified personal trainers in Patna. 1-on-1 coaching, custom workout & diet plans, weight loss, muscle building and body transformation programs. Book your slot online.',
  alternates: { canonical: 'https://musclemantra.shop/trainers' },
  openGraph: {
    title: 'Personal Trainers — Book a Slot | Muscle Mantra',
    description:
      'Book certified personal trainers in Patna. 1-on-1 coaching, custom workout & diet plans. Book your slot online.',
    url: 'https://musclemantra.shop/trainers',
    type: 'website',
  },
};

export default function TrainersPage() {
  return <TrainersClient />;
}
