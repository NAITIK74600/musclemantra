'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dumbbell, Star, CheckCircle2, Calendar, Clock, User, Phone, Mail,
  Target, Award, ShieldCheck, ChevronRight, Sparkles,
} from 'lucide-react';
import {
  getTrainers, getPlans, onStoreChange, type Trainer, type TrainingPlan,
} from '@/lib/store';
import { useToast } from '@/components/ToastProvider';

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
];

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function TrainersClient() {
  const { push } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', trainerId: '', planId: '', date: '', time: '', goal: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setTrainers(getTrainers().filter(t => t.active));
      setPlans(getPlans().filter(p => p.active));
    };
    load();
    return onStoreChange(load);
  }, []);

  const selectedTrainer = useMemo(
    () => trainers.find(t => t.id === form.trainerId),
    [trainers, form.trainerId]
  );
  const selectedPlan = useMemo(
    () => plans.find(p => p.id === form.planId),
    [plans, form.planId]
  );

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const scrollToForm = (patch?: Partial<typeof form>) => {
    if (patch) setForm(f => ({ ...f, ...patch }));
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return push({ title: 'Please enter your name', variant: 'error' });
    if (!/^[0-9+\-\s]{7,20}$/.test(form.phone)) return push({ title: 'Please enter a valid phone number', variant: 'error' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return push({ title: 'Please enter a valid email', variant: 'error' });
    if (!form.date) return push({ title: 'Please pick a preferred date', variant: 'error' });
    if (!form.time) return push({ title: 'Please pick a time slot', variant: 'error' });

    setSubmitting(true);
    try {
      const res = await fetch('/api/book-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          trainerId: form.trainerId,
          trainerName: selectedTrainer?.name || '',
          planId: form.planId,
          planName: selectedPlan?.name || '',
          planPrice: selectedPlan?.price || 0,
          date: form.date,
          time: form.time,
          goal: form.goal,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Booking failed');
      setDone(data.id);
      push({ title: 'Booking received! 🎉', description: 'Our team will call you to confirm your slot.', variant: 'success' });
      setForm({ name: '', phone: '', email: '', trainerId: '', planId: '', date: '', time: '', goal: '' });
    } catch (err) {
      push({ title: 'Could not submit booking', description: err instanceof Error ? err.message : 'Please try again or call us.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,0,0.18),transparent_55%)]" />
        <div className="container-max relative py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#FF6B00]">
              <Sparkles size={14} /> PERSONAL TRAINING
            </span>
            <h1 className="mt-4 font-montserrat text-3xl font-extrabold leading-tight sm:text-5xl">
              Train with <span className="text-[#FF6B00]">certified experts</span>.<br />
              Book your slot in minutes.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/60 sm:text-base">
              1-on-1 coaching, custom workout &amp; diet plans, weight loss and body transformation —
              guided by professional trainers. Pick a trainer, choose a plan, and book a slot online.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToForm()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B00] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#ff7d1a]"
              >
                <Calendar size={18} /> Book a Slot
              </button>
              <a
                href="#trainers"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Meet the Trainers <ChevronRight size={16} />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5"><Award size={14} className="text-[#FF6B00]" /> Certified coaches</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#FF6B00]" /> Personalised plans</span>
              <span className="inline-flex items-center gap-1.5"><Target size={14} className="text-[#FF6B00]" /> Goal-based training</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trainers ─────────────────────────────────────────────────── */}
      <section id="trainers" className="container-max py-14 sm:py-20">
        <div className="mb-8 text-center">
          <h2 className="font-montserrat text-2xl font-extrabold sm:text-3xl">Meet Our Trainers</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/55">
            Hand-picked professionals to guide every step of your fitness journey.
          </p>
        </div>

        {trainers.length === 0 ? (
          <p className="text-center text-sm text-white/40">Trainer profiles coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#FF6B00]/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt={t.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20"><User size={48} /></div>
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-[#FFB020] backdrop-blur">
                    <Star size={12} className="fill-[#FFB020] text-[#FFB020]" /> {t.rating.toFixed(1)}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-montserrat text-lg font-bold">{t.name}</h3>
                  <p className="text-sm font-semibold text-[#FF6B00]">{t.specialty}</p>
                  <p className="mt-1 text-xs text-white/45">{t.experience}+ years experience</p>
                  <p className="mt-3 line-clamp-3 text-sm text-white/60">{t.bio}</p>
                  <button
                    onClick={() => scrollToForm({ trainerId: t.id })}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#FF6B00]/50 px-4 py-2.5 text-sm font-semibold text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-black"
                  >
                    <Calendar size={16} /> Book {t.name.split(' ')[0]}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Plans / Pricing ──────────────────────────────────────────── */}
      <section id="plans" className="border-y border-white/10 bg-white/[0.02] py-14 sm:py-20">
        <div className="container-max">
          <div className="mb-8 text-center">
            <h2 className="font-montserrat text-2xl font-extrabold sm:text-3xl">Membership &amp; Training Plans</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/55">
              Transparent pricing. Pick the plan that fits your goals — cancel anytime.
            </p>
          </div>

          {plans.length === 0 ? (
            <p className="text-center text-sm text-white/40">Plans coming soon.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    p.popular
                      ? 'border-[#FF6B00] bg-[#FF6B00]/[0.06] shadow-[0_0_40px_-12px_rgba(255,107,0,0.5)]'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-bold text-black">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="font-montserrat text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-white/55">{p.tagline}</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-montserrat text-3xl font-extrabold">{inr(p.price)}</span>
                    {p.oldPrice > 0 && p.oldPrice > p.price && (
                      <span className="mb-1 text-sm text-white/40 line-through">{inr(p.oldPrice)}</span>
                    )}
                  </div>
                  <span className="text-xs text-white/45">{p.period}</span>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF6B00]" /> {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => scrollToForm({ planId: p.id })}
                    className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-bold transition ${
                      p.popular
                        ? 'bg-[#FF6B00] text-black hover:bg-[#ff7d1a]'
                        : 'border border-white/20 text-white hover:border-[#FF6B00] hover:text-[#FF6B00]'
                    }`}
                  >
                    Choose {p.name}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Booking form ─────────────────────────────────────────────── */}
      <section ref={formRef} id="book" className="container-max py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <h2 className="font-montserrat text-2xl font-extrabold sm:text-3xl">Book Your Slot</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
              Fill in your details and we&apos;ll call you to confirm your personal-training slot.
            </p>
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#FF6B00]/40 bg-[#FF6B00]/[0.06] p-8 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00]/15">
                <CheckCircle2 size={30} className="text-[#FF6B00]" />
              </div>
              <h3 className="mt-4 font-montserrat text-xl font-bold">Booking confirmed!</h3>
              <p className="mt-2 text-sm text-white/60">
                Your booking ID is <span className="font-mono font-semibold text-[#FF6B00]">{done}</span>.
                Our team will call you shortly to lock your slot.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setDone(null)}
                  className="rounded-lg bg-[#FF6B00] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#ff7d1a]"
                >
                  Book another slot
                </button>
                <Link href="/products" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-white/40">
                  Shop Supplements
                </Link>
              </div>
            </motion.div>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" icon={<User size={16} />}>
                  <input
                    value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Your name" className={inputCls} required
                  />
                </Field>
                <Field label="Phone" icon={<Phone size={16} />}>
                  <input
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+91 …" className={inputCls} required inputMode="tel"
                  />
                </Field>
              </div>

              <Field label="Email" icon={<Mail size={16} />}>
                <input
                  value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com" className={inputCls} required type="email"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Preferred trainer" icon={<Dumbbell size={16} />}>
                  <select value={form.trainerId} onChange={e => set('trainerId', e.target.value)} className={inputCls}>
                    <option value="">Any available trainer</option>
                    {trainers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.specialty}</option>)}
                  </select>
                </Field>
                <Field label="Plan" icon={<Target size={16} />}>
                  <select value={form.planId} onChange={e => set('planId', e.target.value)} className={inputCls}>
                    <option value="">Not sure yet</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {inr(p.price)}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Preferred date" icon={<Calendar size={16} />}>
                  <input
                    type="date" min={todayStr} value={form.date} onChange={e => set('date', e.target.value)}
                    className={inputCls} required
                  />
                </Field>
                <Field label="Time slot" icon={<Clock size={16} />}>
                  <select value={form.time} onChange={e => set('time', e.target.value)} className={inputCls} required>
                    <option value="">Select a slot</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Your goal (optional)" icon={<Sparkles size={16} />}>
                <textarea
                  value={form.goal} onChange={e => set('goal', e.target.value)}
                  placeholder="e.g. Lose 5 kg, build muscle, prep for an event…"
                  rows={3} className={inputCls + ' resize-none'}
                />
              </Field>

              {(selectedTrainer || selectedPlan) && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                  {selectedTrainer && <p>Trainer: <span className="font-semibold text-white">{selectedTrainer.name}</span></p>}
                  {selectedPlan && <p>Plan: <span className="font-semibold text-white">{selectedPlan.name}</span> · <span className="text-[#FF6B00]">{inr(selectedPlan.price)}</span> {selectedPlan.period}</p>}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full rounded-lg bg-[#FF6B00] px-6 py-3.5 text-sm font-bold text-black transition hover:bg-[#ff7d1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Confirm Booking'}
              </button>
              <p className="text-center text-xs text-white/40">
                No payment now — our team confirms your slot over a call.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#FF6B00] placeholder:text-white/30';

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/60">
        <span className="text-[#FF6B00]">{icon}</span> {label}
      </span>
      {children}
    </label>
  );
}
