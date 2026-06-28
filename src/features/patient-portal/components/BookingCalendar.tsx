import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  formatWorkingDays,
  getBookingWindow,
  isDoctorAvailableOnDate,
  toLocalDateString,
} from '@/utils/patientFlow'
import { cn } from '@/utils/cn'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface BookingCalendarProps {
  schedule: unknown
  value: string
  onChange: (date: string) => void
}

export function BookingCalendar({ schedule, value, onChange }: BookingCalendarProps) {
  const { minDate, maxDate } = getBookingWindow()
  const selectedDate = value ? new Date(value + 'T12:00:00') : null

  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return startOfMonth(selectedDate)
    return startOfMonth(minDate)
  })

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart.getTime(), gridEnd.getTime()],
  )

  const canGoPrev = startOfMonth(viewMonth) > startOfMonth(minDate)
  const canGoNext = startOfMonth(viewMonth) < startOfMonth(maxDate)

  const isSelectable = (day: Date) => isDoctorAvailableOnDate(schedule, toLocalDateString(day))

  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-navy-900">{format(viewMonth, 'MMMM yyyy')}</p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-navy-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = toLocalDateString(day)
          const inMonth = isSameMonth(day, viewMonth)
          const selectable = inMonth && isSelectable(day)
          const selected = value === dateStr
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onChange(dateStr)}
              className={cn(
                'aspect-square rounded-xl text-sm font-medium transition-colors',
                !inMonth && 'invisible',
                inMonth && !selectable && 'text-navy-300 cursor-not-allowed',
                selectable && !selected && 'text-navy-800 hover:bg-primary-50 hover:text-primary-700',
                selected && 'bg-primary-600 text-white shadow-sm',
                isToday && !selected && selectable && 'ring-1 ring-primary-300',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-navy-500 mt-4">
        Available on {formatWorkingDays(schedule)} · Book up to {format(maxDate, 'MMM d, yyyy')}
      </p>
      {value && (
        <p className="text-sm font-medium text-primary-700 mt-2">
          Selected: {format(new Date(value + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
        </p>
      )}
    </div>
  )
}
