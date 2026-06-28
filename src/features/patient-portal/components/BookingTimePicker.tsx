import { Sun, Sunset } from 'lucide-react'
import { formatBookingDate, formatTime12, groupTimeSlots } from '@/utils/patientFlow'
import { cn } from '@/utils/cn'

interface BookingTimePickerProps {
  date: string
  slots: string[]
  value: string
  onChange: (time: string) => void
}

function SlotGrid({
  slots,
  value,
  onChange,
}: {
  slots: string[]
  value: string
  onChange: (time: string) => void
}) {
  if (!slots.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            'px-4 py-2.5 rounded-xl border font-medium text-sm min-w-[5.25rem]',
            value === t
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-navy-200 text-navy-700 hover:border-primary-300 hover:bg-primary-50/50',
          )}
        >
          {formatTime12(t)}
        </button>
      ))}
    </div>
  )
}

export function BookingTimePicker({ date, slots, value, onChange }: BookingTimePickerProps) {
  const { morning, afternoon } = groupTimeSlots(slots)
  const dateLabel = formatBookingDate(date)

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-navy-600">
        Available times for <span className="font-medium text-navy-900">{dateLabel.full}</span>
        <span className="text-navy-400 ml-2">({slots.length} slot{slots.length !== 1 ? 's' : ''})</span>
      </p>

      {morning.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-navy-700">Morning</p>
          </div>
          <SlotGrid slots={morning} value={value} onChange={onChange} />
        </div>
      )}

      {afternoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sunset className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-medium text-navy-700">Afternoon</p>
          </div>
          <SlotGrid slots={afternoon} value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
