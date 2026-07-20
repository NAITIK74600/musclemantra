import Link from 'next/link';
import { Truck, ArrowLeft, MapPin, Clock, ShieldCheck, IndianRupee, AlertCircle, PackageCheck } from 'lucide-react';

export const metadata = {
  title: 'Delivery Policy — Muscle Mantra',
  description: 'Muscle Mantra delivery policy — fast, safe doorstep delivery across Patna. Delivery timelines, charges, and rider safety.',
};

export default function DeliveryPolicyPage() {
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
              <Truck size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-1">Legal</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-3xl md:text-4xl text-white">Delivery Policy</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgba(245,245,245,0.4)]">Last updated: 20 July 2026 &nbsp;|&nbsp; Operated by <strong className="text-white">Amarjeet Kumar</strong> (Muscle Mantra)</p>
        </div>
      </div>

      <div className="container-max py-12 md:py-16">
        <div className="max-w-3xl">
          {/* Key highlights */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: MapPin, label: 'Delivery Area', value: 'Patna Only', sub: 'across the city' },
              { icon: Clock, label: 'Delivery Time', value: 'Same / Next Day', sub: 'subject to availability' },
              { icon: IndianRupee, label: 'Delivery Charge', value: 'As Shown', sub: 'at checkout' },
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
            {/* Delivery area */}
            <div className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                1. Where We Deliver
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed mb-3">
                Muscle Mantra currently delivers <strong className="text-white">only within Patna, Bihar</strong>. We do not ship outside Patna city limits at this time. Please make sure your delivery pincode falls within our serviceable area at checkout.
              </p>
            </div>

            {/* Delivery timelines */}
            <div className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                2. Delivery Timelines
              </h2>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>Orders are usually delivered the <strong className="text-white">same day or the next day</strong>, depending on your location and product availability.</li>
                <li>Orders placed late at night or on holidays may be dispatched on the next working day.</li>
                <li>Delivery times are estimates and may vary due to traffic, weather, or other conditions beyond our control.</li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)] flex gap-3">
                <AlertCircle size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                  <strong className="text-white">We do not offer any fixed &ldquo;30-minute&rdquo; or express delivery guarantee.</strong> Delivery timing is always an estimate, never a promise.
                </p>
              </div>
            </div>

            {/* Rider safety */}
            <div className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                3. Rider Safety Comes First
              </h2>
              <p className="text-[14px] text-[rgba(245,245,245,0.65)] leading-relaxed mb-3">
                The safety of our delivery riders matters more than speed. We never pressure our riders to rush or take risks to meet a deadline.
              </p>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>Riders follow all traffic rules and drive safely — we do not enforce unrealistic delivery deadlines.</li>
                <li>In case of rain, unsafe roads, or emergencies, delivery may be slightly delayed for everyone&apos;s safety.</li>
                <li>We would rather your order arrive a little late than put a rider at risk.</li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-[rgba(37,211,102,0.06)] border border-[rgba(37,211,102,0.15)] flex gap-3">
                <ShieldCheck size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                  Thank you for your patience — safe delivery is a shared responsibility.
                </p>
              </div>
            </div>

            {/* Delivery charges */}
            <div className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                4. Delivery Charges
              </h2>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>Delivery charges (if any) are shown clearly at checkout before you pay.</li>
                <li>Charges may vary based on order value and your delivery location within Patna.</li>
                <li>Any free-delivery offers will be applied automatically when eligible.</li>
              </ul>
            </div>

            {/* Order handover */}
            <div className="scroll-mt-24">
              <h2 className="font-[var(--font-montserrat)] font-bold text-lg text-white mb-3 pb-2 border-b border-[rgba(255,255,255,0.07)]">
                5. Order Handover
              </h2>
              <ul className="space-y-2 list-disc list-inside text-[14px] text-[rgba(245,245,245,0.6)]">
                <li>Please share an accurate address and a reachable phone number for a smooth delivery.</li>
                <li>Our rider may verify your order with an OTP at the time of delivery.</li>
                <li>If you are unavailable, our rider will attempt to contact you before returning the order.</li>
              </ul>
              <div className="mt-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] flex gap-3">
                <PackageCheck size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                  For any delivery-related help, contact us at <a href="tel:+918409612737" className="text-white hover:text-[#FF6B00]">+91 84096 12737</a> or <a href="mailto:ordersupport@musclemantra.shop" className="text-white hover:text-[#FF6B00]">ordersupport@musclemantra.shop</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
