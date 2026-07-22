import type { ReactNode } from 'react'
import type { Mode, Duration } from '../engine/types'

type Props = {
  mode: Mode
  duration: Duration
  onChange: (c: { mode: Mode; duration: Duration }) => void
  disabled?: boolean
}

const MODES: Mode[] = ['words', 'quotes']
const DURATIONS: Duration[] = [30, 60]

function Pill({ active, disabled, onClick, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-40
        ${active ? 'bg-accent text-white' : 'text-muted hover:text-fg'}`}
    >
      {children}
    </button>
  )
}

export function ConfigBar({ mode, duration, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-6 rounded-lg bg-surface px-4 py-2">
      <div className="flex gap-1">
        {MODES.map((m) => (
          <Pill key={m} active={m === mode} disabled={disabled} onClick={() => onChange({ mode: m, duration })}>
            {m}
          </Pill>
        ))}
      </div>
      <div className="h-4 w-px bg-muted/40" />
      <div className="flex gap-1">
        {DURATIONS.map((d) => (
          <Pill key={d} active={d === duration} disabled={disabled} onClick={() => onChange({ mode, duration: d })}>
            {d}s
          </Pill>
        ))}
      </div>
    </div>
  )
}
