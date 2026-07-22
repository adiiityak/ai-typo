import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
  afterEach(() => vi.useRealTimers())

  it('renders the config bar and typing area on load', () => {
    render(<App />)
    expect(screen.getByLabelText('typing input')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /words/i })).toBeInTheDocument()
  })

  it('shows results after the timer expires and persists a session', async () => {
    render(<App />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.keyboard('the')
    await act(async () => { vi.advanceTimersByTime(30_000) })
    expect(await screen.findByTestId('net-wpm')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('typepilot.sessions')!)).toHaveLength(1)
  })

  it('starts a practice exercise from a generated passage', async () => {
    render(<App />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.keyboard('the')
    await act(async () => { vi.advanceTimersByTime(30_000) })
    const startBtn = await screen.findByRole('button', { name: /start recommended exercise/i })
    await user.click(startBtn)
    // Back on the test screen: the typing input is present again.
    await waitFor(() => expect(screen.getByLabelText('typing input')).toBeInTheDocument())
    expect(screen.getByTestId('char-0')).toBeInTheDocument()
  })
})
