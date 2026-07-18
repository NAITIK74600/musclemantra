'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Phone, Mail, ArrowLeft, ArrowRight,
  CheckCircle, MapPin, MessageSquare, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  APPOINTMENT_TYPES, TIME_SLOTS, MAX_ADVANCE_DAYS, MAX_PER_SLOT,
  createAppointment, getBookedSlots, isSlotAvailable,
  type AppointmentType,
} from '@/lib/appointments';

type Step = 1 | 2 | 3 | 4; // 4 = success

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(ymd: string) {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  return cells;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BookPage() {
  const [step, setStep] = useState<Step>(1);
  const [apptType, setApptType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<Record<string, number>>({});
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookedId, setBookedId] = useState('');

  const today = useMemo(() => toYMD(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_ADVANCE_DAYS);
    return toYMD(d);
  }, []);

  // Load booked slots when date changes
  useEffect(() => {
    if (selectedDate) setBookedSlots(getBookedSlots(selectedDate));
  }, [selectedDate]);

  const calDays = buildCalendar(calYear, calMonth);

  const isDaySelectable = (day: number) => {
    const ymd = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ymd >= today && ymd <= maxDate;
  };

  const selectDay = (day: number) => {
    const ymd = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!isDaySelectable(day)) return;
    setSelectedDate(ymd);
    setSelectedSlot('');
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validateStep3() || !apptType || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setTimeout(() => {
      const result = createAppointment({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || undefined,
        type: apptType,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: form.notes.trim() || undefined,
      });
      setSubmitting(false);
      if (result.ok) {
        setBookedId(result.appt.id);
        setStep(4);
      } else {
        setErrors({ slot: result.error });
      }
    }, 900);
  };

  // ─── Step 1: Type + Date ───────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Type */}
      <div>
        <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Select Appointment Type</h2>
        <p className="text-sm text-[rgba(245,245,245,0.45)] mb-5">Choose the service you need</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.entries(APPOINTMENT_TYPES) as [AppointmentType, typeof APPOINTMENT_TYPES[AppointmentType]][]).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setApptType(id)}
              className={`text-left p-4 rounded-2xl border transition-all ${apptType === id ? 'bg-[rgba(255,107,0,0.1)] border-[rgba(255,107,0,0.4)]' : 'bg-[#111] border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className={`font-semibold text-[14px] ${apptType === id ? 'text-white' : 'text-[rgba(245,245,245,0.8)]'}`}>{info.label}</p>
                  <p className="text-[11px] text-[rgba(245,245,245,0.4)]">Duration: {info.duration}</p>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${apptType === id ? 'border-[#FF6B00]' : 'border-[rgba(255,255,255,0.2)]'}`}>
                  {apptType === id && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                </div>
              </div>
              <p className="text-[12px] text-[rgba(245,245,245,0.45)]">{info.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div>
        <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Select Date</h2>
        <p className="text-sm text-[rgba(245,245,245,0.45)] mb-5">Bookings available for the next {MAX_ADVANCE_DAYS} days</p>
        <div className="bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.07)] p-5 max-w-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white rounded-lg hover:bg-white/5 transition-all">
              <ChevronLeft size={18} />
            </button>
            <p className="font-bold text-white text-[14px]">{MONTHS[calMonth]} {calYear}</p>
            <button onClick={nextMonth} className="p-1.5 text-[rgba(245,245,245,0.4)] hover:text-white rounded-lg hover:bg-white/5 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-[rgba(245,245,245,0.3)] py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const ymd = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const selectable = isDaySelectable(day);
              const isSelected = ymd === selectedDate;
              const isToday = ymd === today;
              return (
                <button
                  key={ymd}
                  onClick={() => selectDay(day)}
                  disabled={!selectable}
                  className={`aspect-square rounded-lg text-[12px] font-semibold transition-all ${
                    isSelected ? 'bg-[#FF6B00] text-white' :
                    isToday ? 'border border-[rgba(255,107,0,0.4)] text-[#FF6B00] hover:bg-[rgba(255,107,0,0.1)]' :
                    selectable ? 'text-[rgba(245,245,245,0.7)] hover:bg-white/5' :
                    'text-[rgba(245,245,245,0.18)] cursor-not-allowed'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        {selectedDate && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[13px] text-[#FF6B00] font-semibold flex items-center gap-1.5">
            <Calendar size={13} /> {formatDateDisplay(selectedDate)}
          </motion.p>
        )}
      </div>
    </div>
  );

  // ─── Step 2: Time Slot ─────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div>
      <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Select Time Slot</h2>
      <p className="text-sm text-[rgba(245,245,245,0.45)] mb-6">
        {formatDateDisplay(selectedDate)} · Showing available slots
      </p>
      {errors.slot && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{errors.slot}</div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {TIME_SLOTS.map(slot => {
          const count = bookedSlots[slot] ?? 0;
          const available = count < MAX_PER_SLOT;
          const isSelected = slot === selectedSlot;
          return (
            <button
              key={slot}
              onClick={() => { if (available) { setSelectedSlot(slot); setErrors({}); } }}
              disabled={!available}
              className={`py-3 rounded-xl text-[12px] font-bold border transition-all flex flex-col items-center gap-0.5 ${
                isSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' :
                available ? 'bg-[#111] border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.7)] hover:border-[rgba(255,107,0,0.3)] hover:text-white' :
                'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] text-[rgba(245,245,245,0.2)] cursor-not-allowed line-through'
              }`}
            >
              <Clock size={11} className={isSelected ? 'text-white' : available ? 'text-[#FF6B00]' : 'text-[rgba(245,245,245,0.2)]'} />
              {slot}
              {!available && <span className="text-[9px] font-normal">Full</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-[rgba(245,245,245,0.35)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#111] border border-[rgba(255,255,255,0.08)]" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]" /> Full</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FF6B00]" /> Selected</span>
      </div>
    </div>
  );

  // ─── Step 3: Your Details ──────────────────────────────────────────────────
  const renderStep3 = () => (
    <div>
      <h2 className="font-[var(--font-montserrat)] font-black text-xl text-white mb-1">Your Details</h2>
      <p className="text-sm text-[rgba(245,245,245,0.45)] mb-6">We need your contact info to confirm the appointment</p>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">Full Name <span className="text-[#FF6B00]">*</span></label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
            <input value={form.name} onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(ev => ({...ev, name: ''})); }}
              placeholder="Amarjeet Kumar"
              className={`w-full pl-10 pr-4 py-3 bg-[#111] border rounded-xl text-sm text-white placeholder-[rgba(245,245,245,0.25)] outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,107,0,0.4)]'}`} />
          </div>
          {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">Mobile Number <span className="text-[#FF6B00]">*</span></label>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
            <input value={form.phone} onChange={e => { setForm(f => ({...f, phone: e.target.value})); setErrors(ev => ({...ev, phone: ''})); }}
              placeholder="98765 43210" type="tel"
              className={`w-full pl-10 pr-4 py-3 bg-[#111] border rounded-xl text-sm text-white placeholder-[rgba(245,245,245,0.25)] outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,107,0,0.4)]'}`} />
          </div>
          {errors.phone && <p className="mt-1 text-[11px] text-red-400">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">Email <span className="text-[rgba(245,245,245,0.3)]">(optional)</span></label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]" />
            <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="you@example.com" type="email"
              className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-[rgba(245,245,245,0.25)] outline-none focus:border-[rgba(255,107,0,0.4)] transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold tracking-wide uppercase text-[rgba(245,245,245,0.4)] mb-1.5">Notes <span className="text-[rgba(245,245,245,0.3)]">(optional)</span></label>
          <div className="relative">
            <MessageSquare size={14} className="absolute left-3.5 top-3.5 text-[rgba(245,245,245,0.35)]" />
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              placeholder="Any specific concerns, goals or questions you'd like to discuss..."
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-[rgba(245,245,245,0.25)] outline-none focus:border-[rgba(255,107,0,0.4)] transition-colors resize-none" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 rounded-2xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)]">
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#FF6B00] mb-3">Booking Summary</p>
        <div className="space-y-1.5 text-[13px] text-[rgba(245,245,245,0.65)]">
          <p><span className="text-white font-semibold">Type:</span> {apptType ? APPOINTMENT_TYPES[apptType].label : ''}</p>
          <p><span className="text-white font-semibold">Date:</span> {formatDateDisplay(selectedDate)}</p>
          <p><span className="text-white font-semibold">Time:</span> {selectedSlot}</p>
          <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#FF6B00]" /> Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna – 800002</p>
        </div>
      </div>
    </div>
  );

  // ─── Step 4: Success ───────────────────────────────────────────────────────
  const renderSuccess = () => (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-[rgba(34,197,94,0.12)] border-2 border-green-400 flex items-center justify-center mb-6">
        <CheckCircle size={38} className="text-green-400" />
      </div>
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-green-400 mb-2">Appointment Confirmed</p>
      <h1 className="font-[var(--font-montserrat)] font-black text-3xl text-white mb-3">You&apos;re Booked!</h1>
      <p className="text-[rgba(245,245,245,0.55)] text-sm mb-2 max-w-sm mx-auto">
        Your appointment ID is <span className="font-bold text-white">{bookedId}</span>
      </p>
      <div className="my-6 p-4 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.07)] text-left max-w-xs mx-auto space-y-1.5 text-[13px] text-[rgba(245,245,245,0.6)]">
        <p><span className="font-semibold text-white">{apptType ? APPOINTMENT_TYPES[apptType].label : ''}</span></p>
        <p>{formatDateDisplay(selectedDate)}</p>
        <p className="flex items-center gap-1"><Clock size={12} className="text-[#FF6B00]" /> {selectedSlot}</p>
        <p className="flex items-start gap-1"><MapPin size={12} className="text-[#FF6B00] mt-0.5 shrink-0" /> Tejpartap Nagar, Vrindavan Colony, Anisabad, Patna</p>
        <p className="text-[11px] text-[rgba(245,245,245,0.35)] pt-1">We&apos;ll confirm via call at the number you provided.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold rounded-xl transition-all text-sm">
          Back to Home
        </Link>
        <button onClick={() => { setStep(1); setApptType(null); setSelectedDate(''); setSelectedSlot(''); setForm({ name: '', phone: '', email: '', notes: '' }); }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[rgba(255,255,255,0.14)] hover:border-white/30 text-white font-bold rounded-xl transition-all text-sm">
          Book Another
        </button>
      </div>
    </motion.div>
  );

  const canNext1 = !!apptType && !!selectedDate;
  const canNext2 = !!selectedSlot;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[rgba(245,245,245,0.4)] hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.25)] flex items-center justify-center">
              <Calendar size={20} className="text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF6B00] mb-0.5">Muscle Mantra</p>
              <h1 className="font-[var(--font-montserrat)] font-black text-2xl text-white">Book an Appointment</h1>
            </div>
          </div>

          {/* Step indicators */}
          {step < 4 && (
            <div className="flex items-center gap-3 mt-6">
              {(['Select Type & Date', 'Choose Time', 'Your Details'] as const).map((label, idx) => {
                const s = (idx + 1) as 1 | 2 | 3;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-[#FF6B00] text-white' : 'bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.3)]'}`}>
                      {step > s ? '✓' : s}
                    </div>
                    <span className={`text-[11px] font-semibold hidden sm:inline ${step === s ? 'text-white' : 'text-[rgba(245,245,245,0.3)]'}`}>{label}</span>
                    {idx < 2 && <div className="w-8 h-px bg-[rgba(255,255,255,0.1)] hidden sm:block" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-max py-10">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderSuccess()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(255,255,255,0.07)]">
              <button
                onClick={() => { if (step > 1) setStep(s => (s - 1) as Step); }}
                className={`flex items-center gap-2 px-5 py-3 border border-[rgba(255,255,255,0.12)] rounded-xl text-sm font-bold text-[rgba(245,245,245,0.6)] hover:text-white hover:border-white/25 transition-all ${step === 1 ? 'invisible' : ''}`}
              >
                <ArrowLeft size={15} /> Back
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep(s => (s + 1) as Step)}
                  disabled={step === 1 ? !canNext1 : !canNext2}
                  className="flex items-center gap-2 px-7 py-3 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-7 py-3 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
                >
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : <CheckCircle size={15} />}
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
