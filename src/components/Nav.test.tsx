import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Nav } from './Nav'

describe('Nav', () => {
  it('renders both tabs and marks the active one', () => {
    render(<Nav active="dashboard" onNavigate={() => {}} />)
    expect(screen.getByRole('button', { name: /^test$/i })).toBeInTheDocument()
    const dash = screen.getByRole('button', { name: /^dashboard$/i })
    expect(dash).toHaveAttribute('aria-current', 'page')
  })

  it('calls onNavigate with the clicked view', async () => {
    const onNavigate = vi.fn()
    render(<Nav active="test" onNavigate={onNavigate} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /^dashboard$/i }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })
})
