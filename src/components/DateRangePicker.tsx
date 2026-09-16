import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function parseDateStr(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const LABEL_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
})

export function DateRangePicker() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const selected: DateRange | undefined =
    from || to
      ? {
          from: from ? parseDateStr(from) : undefined,
          to: to ? parseDateStr(to) : undefined,
        }
      : undefined

  function apply(range: DateRange | undefined) {
    const params = new URLSearchParams(searchParams)
    if (range?.from) params.set('from', formatDateStr(range.from))
    else params.delete('from')
    if (range?.to) params.set('to', formatDateStr(range.to))
    else params.delete('to')
    setSearchParams(params)
  }

  const label =
    from && to
      ? `${LABEL_FORMAT.format(parseDateStr(from))} – ${LABEL_FORMAT.format(parseDateStr(to))}`
      : from
        ? `From ${LABEL_FORMAT.format(parseDateStr(from))}`
        : to
          ? `Until ${LABEL_FORMAT.format(parseDateStr(to))}`
          : 'Custom range'

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={
              from || to
                ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300'
                : 'border-blue-500 dark:border-blue-400'
            }
          >
            <CalendarIcon /> {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="range"
            selected={selected}
            defaultMonth={selected?.from}
            onSelect={apply}
          />
        </PopoverContent>
      </Popover>
      {(from || to) && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear date range"
          onClick={() => apply(undefined)}
        >
          <X />
        </Button>
      )}
    </div>
  )
}
