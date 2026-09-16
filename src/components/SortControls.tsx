import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Range, Sort } from '@/api/hn'
import {
  getStoredRange,
  getStoredSort,
  setStoredRange,
  setStoredSort,
} from '@/lib/preferences'
import { ACTIVE_FILTER_CLASSES } from '@/lib/utils'
import { DateRangePicker } from './DateRangePicker'

const RANGES: { value: Range; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'hot', label: 'Hot' },
]

export function SortControls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') ?? getStoredRange()
  const sort = searchParams.get('sort') ?? getStoredSort()
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
          className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground sm:hidden dark:border-transparent dark:bg-primary dark:text-primary-foreground dark:[color-scheme:light]"
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
      <div
        role="group"
        aria-label="Sort by score"
        className="flex gap-1 min-[384px]:ml-auto"
      >
        {SORTS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            className={
              value === sort
                ? ACTIVE_FILTER_CLASSES
                : 'border-blue-500 dark:border-blue-400'
            }
            aria-pressed={value === sort}
            onClick={() => {
              setStoredSort(value)
              const next = new URLSearchParams(searchParams)
              next.set('sort', value)
              setSearchParams(next)
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
