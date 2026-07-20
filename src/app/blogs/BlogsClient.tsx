'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, X, ArrowRight, Tag } from 'lucide-react';

type Article = {
  id: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  image: string;
  body: string[];
};

const ARTICLES: Article[] = [
  {
    id: 'protein-timing',
    title: 'Protein Timing: Does the “Anabolic Window” Really Matter?',
    category: 'Nutrition',
    readTime: '5 min read',
    excerpt: 'The 30-minute post-workout rush might be overrated. Here’s what the science actually says about when to take your protein.',
    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80',
    body: [
      'For years lifters chased the “anabolic window” — the belief that you must slam a protein shake within 30 minutes of training or lose your gains. Newer research paints a calmer picture.',
      'What matters most is your total daily protein intake, spread across the day. Aim for roughly 1.6–2.2 g of protein per kg of bodyweight, split into 3–5 meals of 25–40 g each.',
      'Post-workout protein still helps — it kick-starts muscle repair — but the “window” is more like several hours than 30 minutes. If you trained fasted, a shake soon after is a smart idea.',
      'Bottom line: hit your daily target consistently, keep meals evenly spaced, and don’t stress the stopwatch. A quality whey isolate right after training is convenient, not mandatory.',
    ],
  },
  {
    id: 'creatine-guide',
    title: 'Creatine Monohydrate: The Most Proven Supplement in the Game',
    category: 'Supplements',
    readTime: '4 min read',
    excerpt: 'Cheap, safe and backed by hundreds of studies. Here’s how to use creatine for strength, size and even brain health.',
    image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80',
    body: [
      'Creatine monohydrate is the most researched sports supplement in existence — and one of the few that consistently works.',
      'It helps your muscles regenerate ATP (energy) faster during intense effort, letting you push out extra reps and recover between sets. Over time that means more strength and lean mass.',
      'Dosing is simple: 3–5 g every day, timing doesn’t matter. You can “load” with 20 g/day for 5–7 days to saturate faster, but it’s optional.',
      'Skip the fancy versions — plain monohydrate is the gold standard. Stay hydrated, take it daily (even rest days), and be patient; results build over weeks.',
    ],
  },
  {
    id: 'beginner-plan',
    title: 'Your First 12 Weeks: A No-Nonsense Beginner Training Plan',
    category: 'Training',
    readTime: '6 min read',
    excerpt: 'New to the gym? Forget the noise. This simple full-body approach builds strength, confidence and habit.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    body: [
      'The best beginner program is the one you can stick to. Train the whole body 3 days a week with a day of rest between sessions.',
      'Focus on compound lifts: squats, hinges (deadlift/RDL), presses (bench/overhead) and pulls (rows/pull-ups). These give the most bang for your buck.',
      'Start light, nail your form, and add a small amount of weight each week — this is called progressive overload and it’s the engine of all progress.',
      'Pair training with enough protein, sleep and a slight calorie surplus if your goal is muscle. Consistency over 12 weeks beats any “perfect” program done for two.',
    ],
  },
  {
    id: 'preworkout-truth',
    title: 'Pre-Workout: What’s Actually Worth Paying For',
    category: 'Supplements',
    readTime: '4 min read',
    excerpt: 'Caffeine, citrulline, beta-alanine… which ingredients earn their place and which are just fairy dust?',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    body: [
      'A good pre-workout can sharpen focus and boost output — but many are stuffed with under-dosed “proprietary blends”.',
      'The proven performers: caffeine (150–300 mg) for energy and focus, L-citrulline (6–8 g) for blood flow and pumps, and beta-alanine (3–5 g) for muscular endurance (the tingles are harmless).',
      'Creatine sometimes appears too, but the doses are usually too low — take it separately and daily instead.',
      'Read the label for actual amounts, not just a blend name. If your pre-workout hides its doses, that’s a red flag.',
    ],
  },
  {
    id: 'fat-loss-basics',
    title: 'Fat Loss Without the Fads: Calories, Protein, Patience',
    category: 'Nutrition',
    readTime: '5 min read',
    excerpt: 'No detox teas, no starvation. Sustainable fat loss comes down to a few simple, boring principles.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    body: [
      'Fat loss requires a calorie deficit — eating slightly less than you burn. Everything else is a detail.',
      'Keep protein high (around 2 g/kg) to preserve muscle and stay full. Fill your plate with vegetables, whole grains and lean proteins so you eat fewer calories without feeling starved.',
      'Aim for a modest deficit of 300–500 kcal/day — this protects muscle and energy far better than crash dieting.',
      'Add some resistance training to keep the muscle you have, walk daily for easy activity, and give it time. Slow, steady fat loss is the kind that stays off.',
    ],
  },
  {
    id: 'recovery-sleep',
    title: 'Recovery 101: Why Sleep Is Your Best Supplement',
    category: 'Recovery',
    readTime: '4 min read',
    excerpt: 'You don’t grow in the gym — you grow when you recover. Here’s how to actually recover better.',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80',
    body: [
      'Training breaks your muscles down; recovery builds them back stronger. Skimp on recovery and you stall — or worse, get injured.',
      'Sleep is king. Aim for 7–9 hours; it’s when growth hormone peaks and your nervous system resets. Poor sleep tanks strength and appetite control.',
      'Support it with enough protein and carbs, hydration, and rest days built into your week. Light activity like walking or stretching on off days helps blood flow.',
      'Manage stress too — chronic stress raises cortisol and blunts recovery. Train hard, but respect the rest that makes it count.',
    ],
  },
];

const catColor: Record<string, string> = {
  Nutrition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Supplements: 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/25',
  Training: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  Recovery: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

export default function BlogsClient() {
  const [active, setActive] = useState<Article | null>(null);

  return (
    <div className="bg-[#050505]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,107,0,0.15),transparent_55%)]" />
        <div className="container-max relative py-12 sm:py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#FF6B00]">
            <BookOpen size={14} /> THE MANTRA BLOG
          </span>
          <h1 className="mt-4 font-[var(--font-montserrat)] text-3xl font-black text-white sm:text-4xl">
            Fitness &amp; Nutrition <span className="text-[#FF6B00]">Insights</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base">
            Science-backed guides on training, supplementation and nutrition — written to help you train smarter and reach your goals.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="container-max py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a, i) => (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setActive(a)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111] transition hover:border-[#FF6B00]/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${catColor[a.category] || catColor.Supplements}`}>
                  <Tag size={10} /> {a.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-[var(--font-montserrat)] text-base font-bold leading-snug text-white group-hover:text-[#FF6B00]">
                  {a.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-white/55">{a.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                    <Clock size={12} /> {a.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00]">
                    Read <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Article reader */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-8"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0d0d0d]"
            >
              <div className="relative aspect-[16/9] bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.image} alt={active.title} className="h-full w-full object-cover" />
                <button
                  onClick={() => setActive(null)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 sm:p-8">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${catColor[active.category] || catColor.Supplements}`}>
                  <Tag size={10} /> {active.category}
                </span>
                <h2 className="mt-3 font-[var(--font-montserrat)] text-2xl font-black text-white">{active.title}</h2>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/40"><Clock size={12} /> {active.readTime}</p>
                <div className="mt-5 space-y-4">
                  {active.body.map((para, j) => (
                    <p key={j} className="text-[15px] leading-relaxed text-white/70">{para}</p>
                  ))}
                </div>
                <p className="mt-6 border-t border-white/10 pt-5 text-xs text-white/40">
                  Educational content only — not medical advice. Consult a professional before starting any supplement or training program.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
