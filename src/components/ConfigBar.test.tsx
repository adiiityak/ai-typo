import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigBar } from './ConfigBar'

describe('ConfigBar', () => {
  it('renders all four mode pills', () => {
    render(<ConfigBar mode="words" duration={30} onChange={() => {}} />)
    for (const m of ['words', 'quotes', 'numbers', 'punctuation']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${m}$`, 'i') })).toBeInTheDocument()
    }
  })

  it('fires onChange with the selected mode', async () => {
    const onChange = vi.fn()
    render(<ConfigBar mode="words" duration={30} onChange={onChange} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /^numbers$/i }))
    expect(onChange).toHaveBeenCalledWith({ mode: 'numbers', duration: 30 })
  })
})
