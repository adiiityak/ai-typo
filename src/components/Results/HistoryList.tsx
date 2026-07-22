import type { TypingSession } from '../../storage/history'

export function HistoryList({ sessions }: { sessions: TypingSession[] }) {
  const recent = [...sessions].reverse().slice(0, 5)
  if (recent.length === 0) return null
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-sm text-muted">recent tests</h3>
      <table className="w-full text-left font-mono text-sm">
        <thead className="text-muted">
          <tr><th>date</th><th>mode</th><th>wpm</th><th>acc</th><th>dur</th></tr>
        </thead>
        <tbody>
          {recent.map((s) => (
            <tr key={s.id} className="border-t border-muted/20">
              <td>{new Date(s.completedAt).toLocaleDateString()}</td>
              <td>{s.mode}</td>
              <td className="tabular-nums">{s.netWpm}</td>
              <td className="tabular-nums">{s.accuracy}%</td>
              <td>{s.durationSeconds}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
