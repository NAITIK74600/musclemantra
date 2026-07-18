import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions — Muscle Mantra',
  description: 'Terms and conditions for using the Muscle Mantra website and services.',
};

const sections = [
  {
    id: 'operator',
    title: '1. Website Operator',
    content: (
      <>
        <p>This website is operated by <strong className="text-white">Muscle Mantra</strong>.</p>
        <p className="mt-3">Owner &amp; Proprietor: <strong className="text-white">Amarjeet Kumar</strong></p>
        <p className="mt-1">Registered Address: <strong className="text-white">Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002, Bihar, India</strong></p>
        <p className="mt-1">Email: <a href="mailto:hello@musclemantra.in" className="text-[#FF6B00] hover:underline">hello@musclemantra.in</a></p>
        <p className="mt-1">Phone: <a href="tel:+918409612737" className="text-[#FF6B00] hover:underline">+91 84096 12737</a></p>
      </>
    ),
  },
  {
    id: 'acceptance',
    title: '2. Acceptance of Terms',
    content: (
      <p>By accessing or using musclemantra.in (the &quot;Website&quot;), you agree to be bound by these Terms &amp; Conditions, our <Link href="/privacy-policy" className="text-[#FF6B00] hover:underline">Privacy Policy</Link>, <Link href="/refund-policy" className="text-[#FF6B00] hover:underline">Refund Policy</Link>, and <Link href="/cancellation-policy" className="text-[#FF6B00] hover:underline">Cancellation Policy</Link>. If you do not agree, please discontinue use of the Website.</p>
    ),
  },
  {
    id: 'products',
    title: '3. Products & Services',
    content: (
      <>
        <p>Muscle Mantra sells authentic sports nutrition and wellness supplements including but not limited to whey protein, creatine, pre-workouts, BCAAs, mass gainers, vitamins, fat burners, and accessories.</p>
        <ul className="mt-3 space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>All products are 100% authentic and sourced from authorised distributors.</li>
          <li>Product images are for representation purposes; actual packaging may vary.</li>
          <li>We reserve the right to modify or discontinue any product without notice.</li>
          <li>Stock availability is not guaranteed until the order is confirmed.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'orders',
    title: '4. Orders & Payments',
    content: (
      <>
        <ul className="space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes.</li>
          <li>We accept UPI, credit/debit cards, net banking, and Cash on Delivery (COD).</li>
          <li>For COD orders, payment must be made in full to the delivery personnel upon receipt.</li>
          <li>We reserve the right to cancel any order that appears fraudulent or cannot be fulfilled.</li>
          <li>An order confirmation email/SMS will be sent once payment is verified.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'delivery',
    title: '5. Delivery',
    content: (
      <>
        <ul className="space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>We currently deliver within Patna and select surrounding areas.</li>
          <li>Estimated delivery times (10–30 minutes) are indicative and may vary due to traffic, weather, or other factors.</li>
          <li>Delivery is free on orders above ₹999. A nominal delivery fee applies on smaller orders.</li>
          <li>The risk of loss for products passes to you upon delivery.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'usage',
    title: '6. Acceptable Use',
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="mt-3 space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>Use the Website for any unlawful purpose or in violation of Indian law.</li>
          <li>Transmit harmful, offensive, or fraudulent content.</li>
          <li>Attempt to gain unauthorised access to any part of the Website.</li>
          <li>Use automated tools (bots, scrapers) to extract data without our written consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'health',
    title: '7. Health Disclaimer',
    content: (
      <p>Supplements are intended for use by healthy adults over 18 years of age. Consult a qualified healthcare professional before starting any supplement regimen, especially if you are pregnant, nursing, have a medical condition, or are taking medication. Muscle Mantra is not liable for any adverse health effects resulting from product use.</p>
    ),
  },
  {
    id: 'ip',
    title: '8. Intellectual Property',
    content: (
      <p>All content on this Website — including text, graphics, logos, images, and software — is the property of Muscle Mantra and is protected under applicable intellectual property laws. Reproduction or redistribution without written permission is prohibited.</p>
    ),
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: (
      <p>To the maximum extent permitted by law, Muscle Mantra shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Website or products purchased through it.</p>
    ),
  },
  {
    id: 'governing',
    title: '10. Governing Law & Jurisdiction',
    content: (
      <p>These Terms &amp; Conditions are governed by the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of courts located in Patna, Bihar, India.</p>
    ),
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    content: (
      <p>We reserve the right to update these Terms &amp; Conditions at any time. Continued use of the Website after any changes constitutes your acceptance of the revised terms. The &quot;Last Updated&quot; date at the top of this page reflects the most recent revision.</p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-[rgba(245,245,245,0.4)] hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center shrink-0">
              <Scale size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Legal</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white">Terms &amp; Conditions</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(245,245,245,0.4)]">Last updated: 18 July 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max py-12 md:py-16">
        <div className="max-w-3xl">
          {/* Operator highlight box */}
          <div className="mb-10 p-5 rounded-2xl bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.2)]">
            <p className="text-[13px] text-[rgba(245,245,245,0.7)] leading-relaxed">
              <span className="font-bold text-white">This website is operated by Muscle Mantra.</span> These Terms &amp; Conditions govern your use of musclemantra.in and all transactions made through the platform. Please read them carefully before placing an order.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                  {section.title}
                </h2>
                <div className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed space-y-2">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
            <h3 className="font-[var(--font-montserrat)] font-bold text-white mb-2">Questions?</h3>
            <p className="text-sm text-[rgba(245,245,245,0.55)] mb-3">If you have any questions about these Terms &amp; Conditions, contact us:</p>
            <div className="flex flex-col gap-1.5 text-sm text-[rgba(245,245,245,0.6)]">
              <p>Email: <a href="mailto:hello@musclemantra.in" className="text-[#FF6B00] hover:underline">hello@musclemantra.in</a></p>
              <p>Phone: <a href="tel:+918409612737" className="text-[#FF6B00] hover:underline">+91 84096 12737</a></p>
              <p>Address: Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002, Bihar, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
