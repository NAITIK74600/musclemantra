'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronRight, ShoppingCart, Sparkles, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

const goals = [
  { id: 'lean-bulk', label: 'Lean Bulk', icon: '💪', desc: 'Gain muscle with minimal fat' },
  { id: 'fat-loss', label: 'Fat Loss', icon: '🔥', desc: 'Lose weight & get shredded' },
  { id: 'weight-gain', label: 'Weight Gain', icon: '🏋️', desc: 'Build mass & size fast' },
  { id: 'powerlifting', label: 'Powerlifting', icon: '⚡', desc: 'Maximize strength gains' },
  { id: 'bodybuilding', label: 'Bodybuilding', icon: '🏆', desc: 'Competition-ready physique' },
  { id: 'crossfit', label: 'CrossFit', icon: '🎯', desc: 'Endurance & functional fitness' },
];

const budgets = [
  { id: 'budget', label: 'Under ₹2,000', desc: 'Starter stack' },
  { id: 'mid', label: '₹2,000 – ₹5,000', desc: 'Balanced stack' },
  { id: 'premium', label: '₹5,000+', desc: 'Pro-level stack' },
];

const stacks: Record<string, { name: string; brand: string; dose: string; price: number; reason: string; id: string }[]> = {
  'lean-bulk': [
    { id: 'p1', name: 'Gold Standard 100% Whey', brand: 'Optimum Nutrition', dose: '2 scoops post-workout', price: 3299, reason: 'High quality protein for lean muscle growth' },
    { id: 'p2', name: 'Creatine Monohydrate', brand: 'MuscleBlaze', dose: '5g daily', price: 799, reason: 'Proven to increase strength and lean mass' },
    { id: 'p3', name: 'C4 Original Pre-Workout', brand: 'Cellucor', dose: '1 scoop pre-workout', price: 2199, reason: 'Energy and focus for intense training sessions' },
    { id: 'p7', name: 'Omega-3 Fish Oil', brand: 'MuscleTech', dose: '3 caps daily', price: 699, reason: 'Anti-inflammatory for optimal recovery' },
  ],
  'fat-loss': [
    { id: 'p1', name: 'Gold Standard 100% Whey', brand: 'Optimum Nutrition', dose: '1 scoop post-workout', price: 3299, reason: 'Preserve muscle during caloric deficit' },
    { id: 'p6', name: 'Thermo Cuts Fat Burner', brand: 'BPI Sports', dose: '2 caps morning', price: 1899, reason: 'Accelerates fat metabolism' },
    { id: 'p5', name: 'BCAA Pro 8500', brand: 'MuscleBlaze', dose: '1 scoop intra-workout', price: 1299, reason: 'Prevent muscle breakdown while cutting' },
    { id: 'p7', name: 'Omega-3 Fish Oil', brand: 'MuscleTech', dose: '3 caps daily', price: 699, reason: 'Supports healthy fat loss' },
  ],
  'weight-gain': [
    { id: 'p4', name: 'Serious Mass Gainer', brand: 'Optimum Nutrition', dose: '2 scoops post-workout', price: 4299, reason: '1250 calories per serving for maximum mass' },
    { id: 'p2', name: 'Creatine Monohydrate', brand: 'MuscleBlaze', dose: '5g daily', price: 799, reason: 'Boosts strength and power output' },
    { id: 'p3', name: 'C4 Original Pre-Workout', brand: 'Cellucor', dose: '1 scoop pre-workout', price: 2199, reason: 'Fuel harder training sessions' },
  ],
};

export default function StackBuilderPage() {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [experience, setExperience] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const { addItem } = useCart();

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2200));
    setGenerating(false);
    setShowStack(true);
    setStep(3);
  };

  const stack = stacks[selectedGoal] || stacks['lean-bulk'];
  const totalStackPrice = stack.reduce((s, p) => s + p.price, 0);

  const addAllToCart = () => {
    stack.forEach(item => addItem({ id: item.id, name: item.name, brand: item.brand, price: item.price, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80' }));
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="relative bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)] py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.08)_0%,transparent_70%)]" />
        <div className="container-max relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] mb-5">
            <Bot size={16} className="text-[#FF6B00]" />
            <span className="text-sm font-bold text-[#FF6B00]">AI-Powered Stack Builder</span>
          </div>
          <h1 className="font-[var(--font-montserrat)] font-black text-4xl sm:text-5xl text-white mb-3">
            Build Your Perfect <span className="text-gradient">Stack</span>
          </h1>
          <p className="text-[rgba(245,245,245,0.6)] text-lg max-w-xl mx-auto">
            Answer 3 simple questions and our AI will recommend the exact supplements for your goals.
          </p>
        </div>
      </div>

      <div className="container-max py-12 max-w-3xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {['Goal', 'Experience', 'Budget', 'Your Stack'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-white' : 'text-[rgba(245,245,245,0.3)]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i < step ? 'bg-[#FF6B00] text-white' : i === step ? 'bg-[#FF6B00] text-white pulse-glow' : 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)]'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:block">{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-px ${i < step ? 'bg-[#FF6B00]' : 'bg-[rgba(255,255,255,0.08)]'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Goal */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-6">What is your primary goal?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {goals.map(g => (
                  <button key={g.id} onClick={() => setSelectedGoal(g.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedGoal === g.id ? 'border-[#FF6B00] bg-[rgba(255,107,0,0.1)]' : 'border-[rgba(255,255,255,0.08)] bg-[#111] hover:border-[rgba(255,107,0,0.3)]'}`}>
                    <span className="text-3xl block mb-2">{g.icon}</span>
                    <p className={`text-sm font-bold mb-0.5 ${selectedGoal === g.id ? 'text-white' : 'text-[rgba(245,245,245,0.7)]'}`}>{g.label}</p>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)]">{g.desc}</p>
                  </button>
                ))}
              </div>
              <button disabled={!selectedGoal} onClick={() => setStep(1)}
                className="flex items-center gap-2 px-8 py-4 bg-[#FF6B00] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-[#E55A00] transition-all">
                Continue <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-6">Your training experience?</h2>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'Less than 1 year of training', icon: '🌱' },
                  { id: 'intermediate', label: 'Intermediate', desc: '1–3 years of consistent training', icon: '🏅' },
                  { id: 'advanced', label: 'Advanced', desc: '3+ years, serious about performance', icon: '🏆' },
                ].map(e => (
                  <button key={e.id} onClick={() => setExperience(e.id)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${experience === e.id ? 'border-[#FF6B00] bg-[rgba(255,107,0,0.1)]' : 'border-[rgba(255,255,255,0.08)] bg-[#111] hover:border-[rgba(255,107,0,0.3)]'}`}>
                    <span className="text-3xl">{e.icon}</span>
                    <div>
                      <p className="font-bold text-white">{e.label}</p>
                      <p className="text-sm text-[rgba(245,245,245,0.5)]">{e.desc}</p>
                    </div>
                    {experience === e.id && <Check size={18} className="ml-auto text-[#FF6B00]" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-6 py-4 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] font-semibold rounded-xl hover:text-white transition-all">Back</button>
                <button disabled={!experience} onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-4 bg-[#FF6B00] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-[#E55A00] transition-all">
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white mb-6">Monthly supplement budget?</h2>
              <div className="flex flex-col gap-3 mb-8">
                {budgets.map(b => (
                  <button key={b.id} onClick={() => setSelectedBudget(b.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border text-left transition-all ${selectedBudget === b.id ? 'border-[#FF6B00] bg-[rgba(255,107,0,0.1)]' : 'border-[rgba(255,255,255,0.08)] bg-[#111] hover:border-[rgba(255,107,0,0.3)]'}`}>
                    <div>
                      <p className="font-bold text-white">{b.label}</p>
                      <p className="text-sm text-[rgba(245,245,245,0.5)]">{b.desc}</p>
                    </div>
                    {selectedBudget === b.id && <Check size={18} className="text-[#FF6B00]" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 bg-[#111] border border-[rgba(255,255,255,0.1)] text-[rgba(245,245,245,0.6)] font-semibold rounded-xl hover:text-white transition-all">Back</button>
                <button disabled={!selectedBudget} onClick={handleGenerate}
                  className="flex items-center gap-2 px-8 py-4 bg-[#FF6B00] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-[#E55A00] transition-all">
                  {generating ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate My Stack</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Stack result */}
          {step === 3 && showStack && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-[#FF6B00]" />
                <h2 className="font-[var(--font-montserrat)] font-black text-2xl text-white">
                  Your Recommended Stack
                </h2>
              </div>
              <p className="text-[rgba(245,245,245,0.5)] mb-6">Optimized for <span className="text-[#FF6B00] font-semibold capitalize">{selectedGoal.replace('-', ' ')}</span> based on your profile</p>

              <div className="space-y-3 mb-6">
                {stack.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,107,0,0.2)] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(255,107,0,0.1)] flex items-center justify-center shrink-0">
                      <span className="text-lg">{['💪', '⚡', '🔥', '🧬'][i % 4]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[#FF6B00] uppercase">{item.brand}</p>
                          <p className="text-sm font-bold text-white">{item.name}</p>
                        </div>
                        <span className="text-sm font-black text-white shrink-0">₹{item.price.toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-[rgba(245,245,245,0.4)] mb-1">📅 {item.dose}</p>
                      <p className="text-[11px] text-[rgba(245,245,245,0.55)]">✓ {item.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-[#111] rounded-2xl border border-[rgba(255,107,0,0.15)] p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[rgba(245,245,245,0.5)]">Total Stack Price</p>
                    <p className="text-3xl font-black text-white">₹{totalStackPrice.toLocaleString()}<span className="text-sm font-normal text-[rgba(245,245,245,0.4)]">/month</span></p>
                  </div>
                  <button onClick={addAllToCart}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all hover:shadow-[0_0_25px_rgba(255,107,0,0.4)]">
                    <ShoppingCart size={18} /> Add All to Cart
                  </button>
                </div>
              </div>

              <button onClick={() => { setStep(0); setSelectedGoal(''); setSelectedBudget(''); setExperience(''); setShowStack(false); }}
                className="text-sm text-[rgba(245,245,245,0.4)] hover:text-white transition-colors">
                ← Start over with different goals
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
