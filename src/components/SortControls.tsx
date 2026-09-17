import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Range } from '@/api/hn'
import { getStoredRange, setStoredRange } from '@/lib/preferences'
import { DateRangePicker } from './DateRangePicker'

const RANGES: { value: Range; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
]

export function SortControls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') ?? getStoredRange()
  const isCustomRange = searchParams.has('from') || searchParams.has('to')

  const changeRange = (value: Range) => {
    setStoredRange(value)
    const next = new URLSearchParams(searchParams)
    next.set('range', value)
    next.delete('from')
    next.delete('to')
    setSearchParams(next)
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <select
          aria-label="Sort by time range"
          className={`rounded-md border px-2 py-1 text-sm sm:hidden dark:[color-scheme:light] ${
            isCustomRange
              ? 'border-input bg-background text-foreground'
              : 'border-transparent bg-primary text-primary-foreground'
          }`}
          value={isCustomRange ? '' : range}
          onChange={(e) => changeRange(e.target.value as Range)}
        >
          {isCustomRange && <option value="">Custom</option>}
          {RANGES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div
          role="group"
          aria-label="Sort by time range"
          className="hidden flex-wrap gap-1 sm:flex"
        >
          {RANGES.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={value === range && !isCustomRange ? 'default' : 'outline'}
              aria-pressed={value === range && !isCustomRange}
              onClick={() => changeRange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <DateRangePicker />
      </div>
    </div>
  )
}
