'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RefreshCw, Check, Zap, PauseCircle, SkipForward } from 'lucide-react';

const plans = [
  {
    name: 'Starter', price: 1499, originalPrice: 1999, icon: '🥛',
    desc: 'Perfect for beginners', color: 'rgba(255,107,0,0.08)',
    includes: ['1x Whey Protein (1kg)', 'Monthly auto-renewal', 'Free delivery', '5% member discount'],
    popular: false,
  },
  {
    name: 'Performance', price: 2999, originalPrice: 4299, icon: '⚡',
    desc: 'Most popular for athletes', color: 'rgba(255,107,0,0.15)',
    includes: ['1x Whey Protein (2kg)', '1x Creatine (500g)', '1x BCAA', 'Weekly creatine delivery', 'Free delivery', '10% member discount', 'Dedicated support'],
    popular: true,
  },
  {
    name: 'Elite', price: 5999, originalPrice: 8499, icon: '🏆',
    desc: 'For serious athletes', color: 'rgba(255,107,0,0.08)',
    includes: ['Full month supply customized', 'AI stack curation', 'Free priority delivery', '15% member discount', 'Nutrition consultation call', 'Pause / Skip anytime'],
    popular: false,
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-14 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.07)_0%,transparent_70%)]" />
        <div className="container-max relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] mb-5">
            <RefreshCw size={14} className="text-[#FF6B00]" />
            <span className="text-sm font-bold text-[#FF6B00]">Never Run Out Again</span>
          </div>
          <h1 className="font-[var(--font-montserrat)] font-black text-4xl sm:text-5xl text-white mb-3">
            Supplement <span className="text-gradient">Subscriptions</span>
          </h1>
          <p className="text-[rgba(245,245,245,0.6)] text-lg max-w-xl mx-auto">
            Auto-deliver your supplements every month. Save up to 30% and never miss a dose.
          </p>
        </div>
      </div>

      <div className="container-max py-14">
        {/* Features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { icon: RefreshCw, label: 'Auto Renewal', desc: 'Set it and forget it' },
            { icon: PauseCircle, label: 'Pause Anytime', desc: 'No commitment' },
            { icon: SkipForward, label: 'Skip Delivery', desc: 'Control your schedule' },
            { icon: Zap, label: 'Always Fresh', desc: 'Direct from warehouse' },
          ].map(f => (
            <div key={f.label} className="p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] text-center">
              <div className="w-10 h-10 bg-[rgba(255,107,0,0.1)] rounded-xl flex items-center justify-center mx-auto mb-3">
                <f.icon size={18} className="text-[#FF6B00]" />
              </div>
              <p className="text-sm font-bold text-white mb-0.5">{f.label}</p>
              <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col rounded-3xl border overflow-hidden ${plan.popular ? 'border-[#FF6B00] shadow-[0_0_60px_rgba(255,107,0,0.2)]' : 'border-[rgba(255,255,255,0.08)]'}`}
              style={{ background: `linear-gradient(135deg, ${plan.color}, #111)` }}>
              {plan.popular && (
                <div className="bg-[#FF6B00] text-white text-[10px] font-black tracking-widest uppercase text-center py-2">
                  ⭐ Most Popular
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-[rgba(245,245,245,0.4)] mb-5">{plan.desc}</p>
                <div className="mb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">₹{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-[rgba(245,245,245,0.4)]">/mo</span>
                  </div>
                  <span className="text-sm text-[rgba(245,245,245,0.3)] line-through">₹{plan.originalPrice.toLocaleString()}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.includes.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[rgba(245,245,245,0.7)]">
                      <Check size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                <Link href="/account"
                  className={`flex items-center justify-center w-full py-3.5 font-bold rounded-xl transition-all ${plan.popular ? 'bg-[#FF6B00] hover:bg-[#E55A00] text-white hover:shadow-[0_0_25px_rgba(255,107,0,0.4)]' : 'bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.25)] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white'}`}>
                  Subscribe Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
