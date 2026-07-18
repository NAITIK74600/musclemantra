import ComingSoon from '@/components/ComingSoon';

export const metadata = { title: 'Add Product — Admin' };

export default function AdminNewProductPage() {
  return (
    <ComingSoon
      eyebrow="Admin · New Product"
      title="Add a New Product"
      description="The product creation form \u2014 with image upload, pricing, and inventory fields \u2014 is being built and will be available shortly."
    />
  );
}
