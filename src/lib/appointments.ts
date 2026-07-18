'use client';

/**
 * Appointments store — localStorage-backed, client-only.
 * Dispatches a custom event so open tabs can reactively refresh.
 */

const KEY = 'mb_appointments_v1';
const EVENT = 'mb-appt-change';
const MAX_PER_SLOT = 2; // max concurrent bookings per time slot

export type AppointmentType = 'consultation' | 'pickup' | 'nutrition' | 'sampling';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  type: AppointmentType;
  date: string;       // YYYY-MM-DD
  timeSlot: string;   // e.g. "10:00 AM"
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;  // ISO
}

function read(): Appointment[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function write(list: Appointment[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

function rndId(): string {
  return 'APT' + Date.now().toString(36).toUpperCase().slice(-5) +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getAppointments(): Appointment[] { return read(); }

export function getAppointmentsByDate(date: string): Appointment[] {
  return read().filter(a => a.date === date && a.status !== 'cancelled');
}

export function getBookedSlots(date: string): Record<string, number> {
  const appts = getAppointmentsByDate(date);
  const counts: Record<string, number> = {};
  for (const a of appts) counts[a.timeSlot] = (counts[a.timeSlot] ?? 0) + 1;
  return counts;
}

export function isSlotAvailable(date: string, timeSlot: string): boolean {
  const counts = getBookedSlots(date);
  return (counts[timeSlot] ?? 0) < MAX_PER_SLOT;
}

export function createAppointment(
  data: Omit<Appointment, 'id' | 'status' | 'createdAt'>
): { ok: true; appt: Appointment } | { ok: false; error: string } {
  if (!isSlotAvailable(data.date, data.timeSlot)) {
    return { ok: false, error: 'This slot is fully booked. Please choose another time.' };
  }
  const appt: Appointment = {
    ...data,
    id: rndId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.unshift(appt);
  write(list);
  return { ok: true, appt };
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): boolean {
  const list = read();
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return false;
  list[idx].status = status;
  write(list);
  return true;
}

export function deleteAppointment(id: string): boolean {
  const list = read();
  const filtered = list.filter(a => a.id !== id);
  if (filtered.length === list.length) return false;
  write(filtered);
  return true;
}

export function onAppointmentChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

// ── Static configuration ─────────────────────────────────────────────────────

export const APPOINTMENT_TYPES: Record<AppointmentType, {
  label: string; icon: string; desc: string; duration: string; color: string;
}> = {
  consultation: {
    label: 'Supplement Consultation',
    icon: '💊',
    desc: 'Get personalised supplement advice from our expert',
    duration: '30 min',
    color: '#FF6B00',
  },
  pickup:  {
    label: 'In-Store Pickup',
    icon: '📦',
    desc: 'Collect your online order at our store',
    duration: '10 min',
    color: '#60a5fa',
  },
  nutrition: {
    label: 'Nutrition Planning',
    icon: '🥗',
    desc: 'Custom diet & macro planning session',
    duration: '45 min',
    color: '#34d399',
  },
  sampling: {
    label: 'Product Sampling',
    icon: '🧪',
    desc: 'Try supplements before you buy',
    duration: '20 min',
    color: '#a78bfa',
  },
};

export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  'no-show': { label: 'No Show',   color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

export const TIME_SLOTS = [
  '9:00 AM',  '9:30 AM',  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM',  '1:30 PM',  '2:00 PM',  '2:30 PM',
  '3:00 PM',  '3:30 PM',  '4:00 PM',  '4:30 PM',  '5:00 PM',  '5:30 PM',
  '6:00 PM',  '6:30 PM',  '7:00 PM',  '7:30 PM',
];

export const MAX_ADVANCE_DAYS = 14; // how many days ahead customers can book

export { MAX_PER_SLOT };
