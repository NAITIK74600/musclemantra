'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MapPin, Clock, Send, MessageSquare, Loader2, CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const SUBJECTS = ['General enquiry', 'Order support', 'Product question', 'Bulk / wholesale', 'Feedback', 'Other'];

const inputCls =
  'w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-white focus:border-[#FF6B00] focus:outline-none placeholder:text-white/30';

export default function ContactClient() {
  const { push } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return push({ title: 'Please enter your name', variant: 'error' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return push({ title: 'Please enter a valid email', variant: 'error' });
    if (form.message.trim().length < 5) return push({ title: 'Please enter your message', variant: 'error' });

    setBusy(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to send');
      setDone(true);
      push({ title: 'Message sent! 🎉', description: 'We usually reply within a few hours.', variant: 'success' });
      setForm({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
    } catch (err) {
      push({
        title: 'Could not send message',
        description: err instanceof Error ? err.message : 'Please email admin@musclemantra.shop directly.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { icon: Phone, label: 'Call / WhatsApp', value: '+91 84096 12737', href: 'tel:+918409612737' },
    { icon: Mail, label: 'Email us', value: 'admin@musclemantra.shop', href: 'mailto:admin@musclemantra.shop' },
    { icon: MapPin, label: 'Visit us', value: 'Anisabad, Patna – 800002, Bihar', href: 'https://maps.google.com/?q=Anisabad+Patna+800002' },
    { icon: Clock, label: 'Support hours', value: 'Open 24/7 — every day', href: undefined },
  ];

  return (
    <div className="bg-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,107,0,0.15),transparent_55%)]" />
        <div className="container-max relative py-12 sm:py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#FF6B00]">
              <MessageSquare size={14} /> CONTACT US
            </span>
            <h1 className="mt-4 font-[var(--font-montserrat)] text-3xl font-black text-white sm:text-4xl">
              We&apos;d love to <span className="text-[#FF6B00]">hear from you</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base">
              Questions about products, orders, or bulk pricing? Send us a message and our team will get back to you fast.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container-max py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Info cards */}
          <div className="space-y-4">
            {cards.map((c, i) => {
              const Inner = (
                <motion.div
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex items-start gap-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111] p-5 transition hover:border-[#FF6B00]/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,107,0,0.12)] text-[#FF6B00]">
                    <c.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">{c.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{c.value}</p>
                  </div>
                </motion.div>
              );
              return c.href
                ? <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{Inner}</a>
                : <div key={c.label}>{Inner}</div>;
            })}
          </div>

          {/* Form */}
          <div>
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center rounded-2xl border border-[#FF6B00]/40 bg-[#FF6B00]/[0.06] p-10 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00]/15">
                  <CheckCircle2 size={30} className="text-[#FF6B00]" />
                </div>
                <h3 className="mt-4 font-[var(--font-montserrat)] text-xl font-bold text-white">Message sent!</h3>
                <p className="mt-2 max-w-sm text-sm text-white/60">
                  Thanks for reaching out. Our team will get back to you shortly — usually within a few hours.
                </p>
                <button onClick={() => setDone(false)} className="mt-6 rounded-xl bg-[#FF6B00] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#E55A00]">
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111] p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">Name</label>
                    <input className={inputCls} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">Phone (optional)</label>
                    <input className={inputCls} placeholder="+91 …" value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">Email</label>
                  <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">Subject</label>
                  <select className={inputCls} value={form.subject} onChange={e => set('subject', e.target.value)}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">Message</label>
                  <textarea className={inputCls + ' resize-none'} rows={5} placeholder="How can we help?" value={form.message} onChange={e => set('message', e.target.value)} required />
                </div>
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#E55A00] disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send message</>}
                </button>
                <p className="text-center text-xs text-white/40">
                  Prefer email? Write to <a href="mailto:admin@musclemantra.shop" className="text-[#FF6B00] hover:underline">admin@musclemantra.shop</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
