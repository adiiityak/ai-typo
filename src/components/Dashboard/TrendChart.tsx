import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../../dashboard/stats'

export function TrendChart({ series }: { series: TrendPoint[] }) {
  return (
    <div className="h-64 w-full rounded-lg bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid stroke="#23262f" />
          <XAxis dataKey="index" stroke="#4b5060" fontSize={12} />
          <YAxis stroke="#4b5060" fontSize={12} width={32} />
          <Tooltip
            contentStyle={{ background: '#16181f', border: 'none', borderRadius: 8, color: '#e6e8ee' }}
            labelFormatter={(i) => `Test ${i}`}
          />
          <Legend />
          <Line type="monotone" dataKey="netWpm" name="WPM" stroke="#6c5cff" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#8b7dff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
