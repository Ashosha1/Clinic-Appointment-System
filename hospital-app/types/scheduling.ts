/** Shared scheduling/availability types for the doctor area. */

export type SlotDuration = 15 | 30 | 45 | 60
export type BufferMinutes = 0 | 5 | 10 | 15

/** day_of_week follows JS Date.getDay(): 0 = Sunday … 6 = Saturday. */
export interface DayScheduleInput {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

/** A generated bookable block for a specific date. */
export interface TimeSlot {
  start_time: string
  end_time: string
  is_booked: boolean
}

export type ScheduleSlotStatus =
  | 'available'
  | 'booked'
  | 'completed'
  | 'cancelled'

export interface AppointmentDetail {
  id: string
  patient_name: string
  patient_phone: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface ScheduleSlot {
  start_time: string
  end_time: string
  status: ScheduleSlotStatus
  appointment: AppointmentDetail | null
}

export interface DaySchedule {
  /** Local YYYY-MM-DD. */
  date: string
  day_of_week: number
  is_blocked: boolean
  block_reason: string | null
  slots: ScheduleSlot[]
}

export const SLOT_DURATIONS: SlotDuration[] = [15, 30, 45, 60]
export const BUFFER_OPTIONS: BufferMinutes[] = [0, 5, 10, 15]

/** Index 0..6 = Sunday..Saturday, to match Date.getDay(). */
export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Display order for the weekly builder: Monday first, Sunday last. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
