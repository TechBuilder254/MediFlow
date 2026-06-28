import type { AppointmentUrgency, DoctorSchedule } from '@/types'

export const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

export const BOOKING_MAX_DAYS_AHEAD = 90
export const BOOKING_SLOT_INTERVAL_MINUTES = 30

const DEFAULT_WORK_RANGES = [
  { startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
  { startHour: 14, startMinute: 0, endHour: 17, endMinute: 0 },
] as const

function slotsAreDefault(slots: string[]): boolean {
  if (!slots.length) return true
  return slots.length === TIME_SLOTS.length && slots.every((s, i) => s === TIME_SLOTS[i])
}

export function generateFlexibleTimeSlots(intervalMinutes = BOOKING_SLOT_INTERVAL_MINUTES): string[] {
  const slots: string[] = []
  for (const range of DEFAULT_WORK_RANGES) {
    let cursor = range.startHour * 60 + range.startMinute
    const end = range.endHour * 60 + range.endMinute
    while (cursor < end) {
      const h = Math.floor(cursor / 60)
      const m = cursor % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      cursor += intervalMinutes
    }
  }
  return slots
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseBookingDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getBookingWindow(): { minDate: Date; maxDate: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 1)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + BOOKING_MAX_DAYS_AHEAD)
  return { minDate, maxDate }
}

export function formatBookingDate(dateStr: string): { dayName: string; label: string; full: string } {
  const d = parseBookingDate(dateStr)
  return {
    dayName: d.toLocaleDateString('en', { weekday: 'long' }),
    label: d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
    full: d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

export function groupTimeSlots(slots: string[]): { morning: string[]; afternoon: string[] } {
  const morning: string[] = []
  const afternoon: string[] = []
  for (const slot of slots) {
    const hour = Number(slot.split(':')[0])
    if (hour < 12) morning.push(slot)
    else afternoon.push(slot)
  }
  return { morning, afternoon }
}

export function getDoctorName(doc: {
  display_name?: string | null
  specialization?: string | null
  profile?: { full_name: string } | { full_name: string }[] | null
}): string {
  if (doc.display_name) return doc.display_name
  const profile = doc.profile
  if (Array.isArray(profile)) return profile[0]?.full_name || doc.specialization || 'Doctor'
  return profile?.full_name || doc.specialization || 'Doctor'
}

export function parseDoctorSchedule(schedule: unknown): DoctorSchedule {
  if (!schedule || typeof schedule !== 'object') {
    return { working_days: [1, 2, 3, 4, 5], slots: generateFlexibleTimeSlots() }
  }
  const s = schedule as DoctorSchedule
  const slots = s.slots?.length && !slotsAreDefault(s.slots) ? s.slots : generateFlexibleTimeSlots()
  return {
    working_days: s.working_days?.length ? s.working_days : [1, 2, 3, 4, 5],
    slots,
  }
}

export function getDoctorAvailableDates(schedule: unknown, count = 14): { date: string; label: string; dayName: string }[] {
  const { working_days = [1, 2, 3, 4, 5] } = parseDoctorSchedule(schedule)
  const { minDate, maxDate } = getBookingWindow()
  const days: { date: string; label: string; dayName: string }[] = []
  const d = new Date(minDate)
  while (days.length < count && d <= maxDate) {
    if (working_days.includes(d.getDay())) {
      const dateStr = toLocalDateString(d)
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en', { weekday: 'long' }),
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function getSlotEndTime(startTime: string, durationMinutes = BOOKING_SLOT_INTERVAL_MINUTES): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + durationMinutes
  const endH = Math.floor(total / 60)
  const endM = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export function getDoctorSlotsForDate(schedule: unknown, bookedTimes: string[] = []): string[] {
  const { slots = generateFlexibleTimeSlots() } = parseDoctorSchedule(schedule)
  const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)))
  return slots.filter((s) => !booked.has(s))
}

export function getNextAvailableLabel(schedule: unknown): string {
  const dates = getDoctorAvailableDates(schedule, 1)
  if (!dates.length) return 'No slots soon'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const first = dates[0]
  if (first.date === toLocalDateString(tomorrow)) return 'Tomorrow'
  return first.dayName
}

export function formatWorkingDays(schedule: unknown): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const { working_days = [1, 2, 3, 4, 5] } = parseDoctorSchedule(schedule)
  return working_days.map((d) => names[d]).join(', ')
}

export function isDoctorAvailableOnDate(schedule: unknown, dateStr: string): boolean {
  const { working_days = [1, 2, 3, 4, 5] } = parseDoctorSchedule(schedule)
  const { minDate, maxDate } = getBookingWindow()
  const date = parseBookingDate(dateStr)
  date.setHours(0, 0, 0, 0)
  if (date < minDate || date > maxDate) return false
  return working_days.includes(date.getDay())
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function calcProfileCompletion(patient: {
  blood_group?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  next_of_kin_name?: string | null
  address?: string | null
  allergies?: string[] | null
  phone?: string | null
} | null | undefined): { percent: number; missing: string[] } {
  if (!patient) return { percent: 0, missing: ['All fields'] }

  const fields: { key: keyof typeof patient; label: string; optional?: boolean }[] = [
    { key: 'phone', label: 'Phone Number' },
    { key: 'blood_group', label: 'Blood Group' },
    { key: 'emergency_contact_name', label: 'Emergency Contact' },
    { key: 'emergency_contact_phone', label: 'Emergency Phone' },
    { key: 'next_of_kin_name', label: 'Next of Kin' },
    { key: 'address', label: 'Address' },
    { key: 'allergies', label: 'Allergies', optional: true },
  ]

  const required = fields.filter((f) => !f.optional)
  const missing: string[] = []

  for (const f of fields) {
    const val = patient[f.key]
    const empty = val == null || val === '' || (Array.isArray(val) && val.length === 0)
    if (empty && !f.optional) missing.push(f.label)
  }

  const filled = required.filter((f) => {
    const val = patient[f.key]
    return val != null && val !== '' && !(Array.isArray(val) && val.length === 0)
  }).length

  const percent = Math.round((filled / required.length) * 100)
  return { percent, missing }
}

export function phoneToAuthEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `p${digits}@patients.mediflow.ke`
}

export function isPhoneInput(value: string): boolean {
  return /^[\d+\s()-]{9,}$/.test(value) && !value.includes('@')
}

export const FEATURED_BOOKING_DEPARTMENTS = [
  'General Medicine',
  'Dental',
  'Cardiology',
  'Eye Clinic',
  'Orthopedics',
  'Pediatrics',
] as const

export const TRIAGE_DEPARTMENT_NAME = 'General Medicine'

export const URGENCY_OPTIONS: { value: AppointmentUrgency; label: string; emoji: string; desc: string }[] = [
  { value: 'routine', label: 'Routine Check-up', emoji: '🟢', desc: 'Non-urgent, schedule at convenience' },
  { value: 'moderate', label: 'Moderate', emoji: '🟡', desc: 'Should be seen within a few days' },
  { value: 'urgent', label: 'Urgent', emoji: '🔴', desc: 'Same day if possible' },
]

export function getNextWeekdays(count = 7): { date: string; label: string; dayName: string }[] {
  const days = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (days.length < count) {
    if (d.getDay() !== 0) {
      days.push({
        date: toLocalDateString(d),
        dayName: d.toLocaleDateString('en', { weekday: 'long' }),
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}
