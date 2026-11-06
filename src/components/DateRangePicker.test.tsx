import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { DateRangePicker } from './DateRangePicker'
import { renderAt } from '@/test/renderAt'

describe('DateRangePicker', () => {
  it('shows a placeholder label with no range set', () => {
    renderAt('/', <DateRangePicker />)
    expect(screen.getByRole('button', { name: /range/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear date range' }),
    ).not.toBeInTheDocument()
  })

  it('labels the trigger from the from/to URL params', () => {
    renderAt('/?from=2026-09-01&to=2026-09-10', <DateRangePicker />)
    expect(
      screen.getByRole('button', { name: /Sep 1.*Sep 10/ }),
    ).toBeInTheDocument()
  })

  it('labels an open-ended lower bound', () => {
    renderAt('/?from=2026-09-01', <DateRangePicker />)
    expect(
      screen.getByRole('button', { name: /From Sep 1/ }),
    ).toBeInTheDocument()
  })

  it('clears both params on click', () => {
    renderAt('/?from=2026-09-01&to=2026-09-10&range=week', <DateRangePicker />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear date range' }))
    expect(screen.getByTestId('location').textContent).toBe('?range=week')
  })
})
