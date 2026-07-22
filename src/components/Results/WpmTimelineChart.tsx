import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function WpmTimelineChart({ timeline }: { timeline: number[] }) {
  const data = timeline.map((wpm, i) => ({ second: i + 1, wpm }))
  return (
    <div className="h-56 w-full rounded-lg bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="second" stroke="#4b5060" fontSize={12} />
          <YAxis stroke="#4b5060" fontSize={12} width={32} />
          <Tooltip
            contentStyle={{ background: '#16181f', border: 'none', borderRadius: 8, color: '#e6e8ee' }}
            labelFormatter={(s) => `${s}s`}
          />
          <Line type="monotone" dataKey="wpm" stroke="#6c5cff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
