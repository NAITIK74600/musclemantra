import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Muscle Mantra',
  description: 'How Muscle Mantra collects, uses, and protects your personal information.',
};

const sections = [
  {
    id: 'intro',
    title: '1. Introduction',
    content: (
      <p>Muscle Mantra (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by <strong className="text-white">Amarjeet Kumar</strong>, is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit musclemantra.shop and make purchases from us.</p>
    ),
  },
  {
    id: 'collection',
    title: '2. Information We Collect',
    content: (
      <>
        <p className="mb-3">We collect the following categories of information:</p>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-white text-[13px]">Personal Information</p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-[rgba(245,245,245,0.6)]">
              <li>Full name, email address, mobile number</li>
              <li>Delivery address (street, area, city, pincode)</li>
              <li>Account credentials (email and hashed password)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white text-[13px]">Transaction Information</p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-[rgba(245,245,245,0.6)]">
              <li>Order history, items purchased, order value</li>
              <li>Payment method used (we do not store full card details)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white text-[13px]">Technical Information</p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-[rgba(245,245,245,0.6)]">
              <li>IP address, browser type, device information</li>
              <li>Pages visited, time spent, referring URLs</li>
              <li>Cookies and local storage data</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'use',
    title: '3. How We Use Your Information',
    content: (
      <>
        <p className="mb-3">We use the information we collect to:</p>
        <ul className="space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>Process and fulfil your orders and payments</li>
          <li>Send order confirmations, invoices, and delivery updates via SMS/email</li>
          <li>Provide customer support and respond to your inquiries</li>
          <li>Send promotional offers and newsletters (you may opt out at any time)</li>
          <li>Improve our website, products, and services</li>
          <li>Detect and prevent fraudulent transactions</li>
          <li>Comply with legal obligations under Indian law</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    title: '4. Sharing of Information',
    content: (
      <>
        <p className="mb-3">We do not sell your personal information. We may share it with:</p>
        <ul className="space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li><strong className="text-white">Payment Processors:</strong> To securely process your payments (e.g., Razorpay, PhonePe). These parties are bound by their own privacy policies.</li>
          <li><strong className="text-white">Delivery Partners:</strong> Your name, address, and phone number are shared with our delivery personnel for order fulfilment.</li>
          <li><strong className="text-white">Legal Authorities:</strong> When required by law, court order, or government regulation.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '5. Cookies & Local Storage',
    content: (
      <>
        <p>We use cookies and browser local storage to:</p>
        <ul className="mt-3 space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>Maintain your session and keep you logged in</li>
          <li>Remember your cart contents between sessions</li>
          <li>Save your preferred delivery area</li>
          <li>Analyse website traffic and user behaviour (analytics)</li>
        </ul>
        <p className="mt-3">You can disable cookies through your browser settings; however, some features of the Website may not function correctly without them.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: (
      <p>We retain your personal information for as long as your account is active or as needed to provide services. Order records are retained for a minimum of 3 years to comply with Indian tax and accounting regulations. You may request deletion of your account at any time.</p>
    ),
  },
  {
    id: 'security',
    title: '7. Data Security',
    content: (
      <p>We implement industry-standard security measures including HTTPS encryption, secure authentication, and access controls to protect your personal information. However, no method of data transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
    ),
  },
  {
    id: 'rights',
    title: '8. Your Rights',
    content: (
      <>
        <p className="mb-3">You have the right to:</p>
        <ul className="space-y-1.5 list-disc list-inside text-[rgba(245,245,245,0.6)]">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate or incomplete data</li>
          <li>Request deletion of your personal data (subject to legal obligations)</li>
          <li>Opt out of marketing communications at any time</li>
          <li>Lodge a complaint with the relevant data protection authority</li>
        </ul>
        <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:admin@musclemantra.shop" className="text-[#FF6B00] hover:underline">admin@musclemantra.shop</a>.</p>
      </>
    ),
  },
  {
    id: 'children',
    title: '9. Children\'s Privacy',
    content: (
      <p>Our Website and products are not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with their information, please contact us and we will delete it promptly.</p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: (
      <p>We may update this Privacy Policy periodically. The &quot;Last Updated&quot; date at the top of this page indicates the most recent revision. Continued use of the Website after any changes constitutes your acceptance of the revised policy.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
              <Shield size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Legal</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white">Privacy Policy</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(245,245,245,0.4)]">Last updated: 18 July 2026 &nbsp;|&nbsp; Operated by <strong className="text-white">Amarjeet Kumar</strong> (Muscle Mantra)</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="mb-10 p-5 rounded-2xl bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.2)]">
            <p className="text-[13px] text-[rgba(245,245,245,0.7)] leading-relaxed">
              Your privacy is important to us. This policy explains clearly how Muscle Mantra handles your personal data. We do not sell your data to third parties.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                  {section.title}
                </h2>
                <div className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
            <h3 className="font-[var(--font-montserrat)] font-bold text-white mb-2">Privacy Queries</h3>
            <p className="text-sm text-[rgba(245,245,245,0.55)] mb-3">For privacy-related requests or concerns, reach out to:</p>
            <div className="flex flex-col gap-1.5 text-sm text-[rgba(245,245,245,0.6)]">
              <p>Amarjeet Kumar — Muscle Mantra</p>
              <p>Email: <a href="mailto:admin@musclemantra.shop" className="text-[#FF6B00] hover:underline">admin@musclemantra.shop</a></p>
              <p>Address: Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002, Bihar, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
