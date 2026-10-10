import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buildSeries } from './trendSeries'
import type { Point } from './trendSeries'
import type { Bucket, WeeklyRow } from './useAnalytics'

interface TrendChartProps {
  rows: WeeklyRow[]
  bucket: Bucket
  /** Inizio del periodo, per riempire i buchi con zeri (null = dal primo dato) */
  from: Date | null
}

/** Area chart dei prodotti acquistati per settimana o mese */
export function TrendChart({ rows, bucket, from }: TrendChartProps) {
  const series = buildSeries(rows, bucket, from)
  if (series.length === 0 || series.every((p) => p.count === 0)) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nel periodo.</p>
  }
  const tickStep = Math.max(1, Math.ceil(series.length / 6))

  return (
    <div className="-ml-2">
      <div
        className="h-48"
        role="img"
        aria-label={`Prodotti acquistati per ${bucket === 'month' ? 'mese' : bucket === 'day' ? 'giorno' : 'settimana'}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 12, right: 28, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--c-burnt)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--c-burnt)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              interval={tickStep - 1}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-body)' }}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-body)' }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--c-ink-soft)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as Point | undefined
                if (!active || !point) return null
                return (
                  <div className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-cream shadow-sheet">
                    {point.label}: {point.count} {point.count === 1 ? 'prodotto' : 'prodotti'}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--c-burnt)"
              strokeWidth={2}
              fill="url(#trend-fill)"
              dot={false}
              activeDot={{ r: 5, stroke: 'var(--bg-app)', strokeWidth: 2, fill: 'var(--c-burnt)' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
