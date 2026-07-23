import type { DashboardStats } from '../../dashboard/stats'

export function WeakAreas({ weakLetters }: { weakLetters: DashboardStats['weakLetters'] }) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-sm text-muted">weak areas (most mistyped)</h3>
      {weakLetters.length === 0 ? (
        <p className="text-muted">No mistakes recorded yet.</p>
      ) : (
        <ul className="space-y-1 font-mono">
          {weakLetters.map((w) => (
            <li key={w.letter} className="flex justify-between">
              <span className="text-error">{w.letter === ' ' ? '␣' : w.letter}</span>
              <span className="text-muted">{w.count} errors</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
