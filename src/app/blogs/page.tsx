import type { Metadata } from 'next';
import BlogsClient from './BlogsClient';

export const metadata: Metadata = {
  title: 'Blogs — Fitness & Nutrition Insights | Muscle Mantra',
  description:
    'Science-backed guides on training, supplementation and nutrition. Learn about protein timing, creatine, pre-workouts, fat loss and recovery from Muscle Mantra.',
  alternates: { canonical: 'https://musclemantra.shop/blogs' },
};

export default function BlogsPage() {
  return <BlogsClient />;
}
