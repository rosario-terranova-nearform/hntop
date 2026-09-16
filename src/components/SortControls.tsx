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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Sort by time range"
        className="flex flex-wrap gap-1"
      >
        {RANGES.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant={value === range && !isCustomRange ? 'default' : 'outline'}
            aria-pressed={value === range && !isCustomRange}
            onClick={() => {
              setStoredRange(value)
              const next = new URLSearchParams(searchParams)
              next.set('range', value)
              next.delete('from')
              next.delete('to')
              setSearchParams(next)
            }}
          >
            {label}
          </Button>
        ))}
        <DateRangePicker />
      </div>
      <div
        className="hidden h-6 w-px bg-border sm:block"
        aria-hidden="true"
      />
      <div role="group" aria-label="Sort by score" className="flex gap-1">
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
