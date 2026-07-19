import Link from 'next/link';
import { RotateCcw, ArrowLeft, Clock, CreditCard, Package, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy — Muscle Mantra',
  description: 'Muscle Mantra refund policy — 7 days from delivery, refund to original payment method.',
};

export default function RefundPolicyPage() {
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
              <RotateCcw size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Legal</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white">Refund Policy</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(245,245,245,0.4)]">Last updated: 18 July 2026 &nbsp;|&nbsp; Operated by <strong className="text-white">Amarjeet Kumar</strong> (Muscle Mantra)</p>
        </div>
      </div>

      <div className="container-max py-12 md:py-16">
        <div className="max-w-3xl">
          {/* Key highlights */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Clock, label: 'Refund Window', value: '7 Days', sub: 'from date of delivery' },
              { icon: CreditCard, label: 'Refund Mode', value: 'Original Method', sub: 'back to source' },
              { icon: Package, label: 'Processing Time', value: '5–7 Business Days', sub: 'after approval' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="p-4 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)] text-center">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,107,0,0.1)] flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-[#FF6B00]" />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[rgba(245,245,245,0.35)] mb-1">{label}</p>
                <p className="font-[var(--font-montserrat)] font-black text-white text-sm">{value}</p>
                <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="space-y-10">
            {/* Eligibility */}
            <div id="eligibility" className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                1. Refund Eligibility
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed mb-3">
                We offer refunds in the following situations:
              </p>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>You received a damaged, defective, or broken product</li>
                <li>You received the wrong product (different from what was ordered)</li>
                <li>The product is expired or the seal was tampered with at delivery</li>
                <li>The product is missing from your order</li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)] flex gap-3">
                <AlertCircle size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                  Refund requests must be raised within <strong className="text-white">7 days from the date of delivery</strong>. Requests raised after this window will not be eligible.
                </p>
              </div>
            </div>

            {/* Non-refundable */}
            <div id="non-refundable" className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                2. Non-Refundable Items
              </h2>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>Products that have been opened, used, or consumed (unless defective)</li>
                <li>Items returned without original packaging or seal intact</li>
                <li>Products purchased during a special clearance or final sale</li>
                <li>Digital products, subscriptions, or gift cards once activated</li>
                <li>Orders where the refund window of 7 days has passed</li>
              </ul>
            </div>

            {/* Process */}
            <div id="process" className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                3. How to Request a Refund
              </h2>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'Contact Us Within 7 Days', desc: 'Email admin@musclemantra.shop or call +91 84096 12737 within 7 days of delivery.' },
                  { step: '02', title: 'Provide Order Details', desc: 'Share your Order ID, the item(s) to be refunded, and clear photographs showing the issue.' },
                  { step: '03', title: 'Refund Approved', desc: 'Our team will review your request within 24–48 hours and notify you of the decision.' },
                  { step: '04', title: 'Receive Your Refund', desc: 'Once approved, the refund is processed to your original payment method within 5–7 business days.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] flex items-center justify-center shrink-0 text-[#FF6B00] text-xs font-black">
                      {step}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white mb-0.5">{title}</p>
                      <p className="text-[13px] text-[rgba(245,245,245,0.55)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund mode */}
            <div id="refund-mode" className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                4. Refund Mode & Timelines
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#111] border-b border-[rgba(255,255,255,0.07)]">
                      <th className="text-left px-4 py-3 font-bold text-[rgba(245,245,245,0.5)] uppercase tracking-wide text-[11px]">Payment Method</th>
                      <th className="text-left px-4 py-3 font-bold text-[rgba(245,245,245,0.5)] uppercase tracking-wide text-[11px]">Refund To</th>
                      <th className="text-left px-4 py-3 font-bold text-[rgba(245,245,245,0.5)] uppercase tracking-wide text-[11px]">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {[
                      ['UPI / Net Banking', 'Original UPI / Bank Account', '3–5 Business Days'],
                      ['Credit / Debit Card', 'Original Card', '5–7 Business Days'],
                      ['Cash on Delivery (COD)', 'Bank Transfer (NEFT)', '5–7 Business Days'],
                      ['Wallet / Prepaid', 'Original Wallet', '2–3 Business Days'],
                    ].map(([method, to, time]) => (
                      <tr key={method} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3 text-white">{method}</td>
                        <td className="px-4 py-3 text-[rgba(245,245,245,0.6)]">{to}</td>
                        <td className="px-4 py-3 text-[rgba(245,245,245,0.6)]">{time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[13px] text-[rgba(245,245,245,0.4)]">* Timelines are from the date of refund approval, subject to bank processing times.</p>
            </div>

            {/* Governing */}
            <div id="governing" className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                5. Governing Policy
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed">
                This Refund Policy is governed by the Consumer Protection Act, 2019 (India). For disputes, the jurisdiction shall be courts in Patna, Bihar, India. This policy is subject to change; the latest version is always available on this page.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
            <h3 className="font-[var(--font-montserrat)] font-bold text-white mb-2">Need Help With a Refund?</h3>
            <p className="text-sm text-[rgba(245,245,245,0.55)] mb-3">We&apos;re here to help — reach out to us directly:</p>
            <div className="flex flex-col gap-1.5 text-sm text-[rgba(245,245,245,0.6)]">
              <p>Email: <a href="mailto:admin@musclemantra.shop" className="text-[#FF6B00] hover:underline">admin@musclemantra.shop</a></p>
              <p>Phone: <a href="tel:+918409612737" className="text-[#FF6B00] hover:underline">+91 84096 12737</a> (Mon–Sat, 9 AM–8 PM)</p>
              <p>Address: Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002, Bihar, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
