// Server component - required so generateStaticParams can be exported.
// All UI is delegated to the client component which reads the id via useParams().
import ProductDetailClient from './ProductDetailClient';

// A non-empty array is required by Next.js output:'export' for dynamic routes.
// Real product navigation uses the Netlify SPA fallback (_redirects) to serve
// index.html, which mounts the client component and reads the actual id.
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}