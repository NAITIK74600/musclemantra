import Link from 'next/link';
import { XCircle, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Cancellation Policy — Muscle Mantra',
  description: 'Muscle Mantra cancellation policy — orders can only be cancelled before dispatch.',
};

export default function CancellationPolicyPage() {
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
              <XCircle size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Legal</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white">Cancellation Policy</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(245,245,245,0.4)]">Last updated: 18 July 2026 &nbsp;|&nbsp; Operated by <strong className="text-white">Amarjeet Kumar</strong> (Muscle Mantra)</p>
        </div>
      </div>

      <div className="container-max py-12 md:py-16">
        <div className="max-w-3xl">
          {/* Key rule banner */}
          <div className="mb-10 p-5 rounded-2xl bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.2)] flex gap-3">
            <AlertCircle size={18} className="text-[#FF6B00] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-[14px] mb-1">Important: Cancellation Before Dispatch Only</p>
              <p className="text-[13px] text-[rgba(245,245,245,0.65)] leading-relaxed">
                Orders can only be cancelled before they are dispatched for delivery. Once your order has been picked up by our delivery personnel, it cannot be cancelled. If you have already received the order and there is an issue, please refer to our <Link href="/refund-policy" className="text-[#FF6B00] hover:underline">Refund Policy</Link>.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Can cancel */}
            <div id="can-cancel">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-4 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                1. When You Can Cancel
              </h2>
              <div className="space-y-3">
                {[
                  'Your order has been placed but is not yet dispatched',
                  'You placed the order by mistake (act quickly — our delivery is fast!)',
                  'You wish to change your delivery address before dispatch',
                  'You want to modify your order (add/remove items) before dispatch',
                ].map((item) => (
                  <div key={item} className="flex gap-3 p-3.5 rounded-xl bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.12)]">
                    <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[rgba(245,245,245,0.65)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cannot cancel */}
            <div id="cannot-cancel">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-4 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                2. When You Cannot Cancel
              </h2>
              <div className="space-y-3">
                {[
                  'Order has already been dispatched for delivery',
                  'Order has been delivered to you',
                  'The product has been opened or used',
                  'A promotional or special offer order after placement (some restrictions may apply)',
                ].map((item) => (
                  <div key={item} className="flex gap-3 p-3.5 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.12)]">
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[rgba(245,245,245,0.65)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to cancel */}
            <div id="how-to-cancel">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-4 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                3. How to Cancel Your Order
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] mb-5 leading-relaxed">
                Since our delivery is fast (10–30 minutes), please act immediately if you need to cancel. Contact us through any of the following:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'Call Us', value: '+91 84096 12737', sub: 'Fastest method — available 9 AM–8 PM', href: 'tel:+918409612737' },
                  { title: 'Email Us', value: 'hello@musclemantra.in', sub: 'Include your Order ID in the subject', href: 'mailto:hello@musclemantra.in' },
                ].map(({ title, value, sub, href }) => (
                  <a key={title} href={href} className="p-4 rounded-xl bg-[#111] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,107,0,0.25)] transition-colors block">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[rgba(245,245,245,0.35)] mb-1">{title}</p>
                    <p className="font-semibold text-[#FF6B00] text-sm">{value}</p>
                    <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-0.5">{sub}</p>
                  </a>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
                <p className="text-[13px] text-[rgba(245,245,245,0.5)]">
                  <strong className="text-white">Please provide:</strong> Your name, Order ID (found in your order confirmation), and the reason for cancellation.
                </p>
              </div>
            </div>

            {/* Refund on cancellation */}
            <div id="refund-on-cancel">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                4. Refund Upon Successful Cancellation
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed">
                If your cancellation request is approved before dispatch:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>The full order amount will be refunded to your original payment method</li>
                <li>Refund will be processed within 5–7 business days</li>
                <li>COD orders: no payment is collected, so no refund is applicable</li>
              </ul>
              <p className="mt-3 text-[13px] text-[rgba(245,245,245,0.5)]">
                For more details on refund timelines, see our <Link href="/refund-policy" className="text-[#FF6B00] hover:underline">Refund Policy</Link>.
              </p>
            </div>

            {/* Governing */}
            <div id="governing">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                5. Governing Policy
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed">
                This Cancellation Policy is governed by the Consumer Protection Act, 2019 (India). For disputes, jurisdiction shall be courts in Patna, Bihar. Muscle Mantra reserves the right to modify this policy at any time.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)]">
            <h3 className="font-[var(--font-montserrat)] font-bold text-white mb-2">Need to Cancel an Order?</h3>
            <p className="text-sm text-[rgba(245,245,245,0.55)] mb-3">Act fast — call us immediately for the quickest resolution:</p>
            <div className="flex flex-col gap-1.5 text-sm text-[rgba(245,245,245,0.6)]">
              <p>Phone: <a href="tel:+918409612737" className="text-[#FF6B00] hover:underline font-bold">+91 84096 12737</a> (Fastest)</p>
              <p>Email: <a href="mailto:hello@musclemantra.in" className="text-[#FF6B00] hover:underline">hello@musclemantra.in</a></p>
              <p>Address: Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002, Bihar, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
