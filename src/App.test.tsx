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

  it('shows the daily goal on the test screen', () => {
    render(<App />)
    expect(screen.getByText(/daily goal/i)).toBeInTheDocument()
  })

  it('navigates between the test and dashboard views', async () => {
    render(<App />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /^dashboard$/i }))
    expect(screen.getByText(/take your first test/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^test$/i }))
    expect(screen.getByLabelText('typing input')).toBeInTheDocument()
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
