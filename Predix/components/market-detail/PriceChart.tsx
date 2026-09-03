import type { PricePoint } from '@/lib/types'

interface PriceChartProps {
  data: PricePoint[]
}

// Structured so a future PriceChart could swap this SVG body for a recharts
// <LineChart> without changing the props this component accepts.
export default function PriceChart({ data }: PriceChartProps) {
  const width = 600
  const height = 300
  const max = Math.max(...data.map((d) => d.price), 100)
  const min = Math.min(...data.map((d) => d.price), 0)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.price - min) / range) * height
    return `${x},${y}`
  })

  const trendUp = data[data.length - 1].price >= data[0].price
  const lineColor = trendUp ? '#39FF9E' : '#FF2E9A'

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
          YES_PRICE_HISTORY
        </h2>
        <span
          className="text-xs font-semibold uppercase tracking-[0.04em]"
          style={{ color: lineColor }}
        >
          {trendUp ? '▲ UPTREND' : '▼ DOWNTREND'}
        </span>
      </div>
      <div className="mt-4 h-[220px] sm:h-[280px] lg:h-[360px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 6px ${lineColor}80)` }}
          />
        </svg>
      </div>
    </div>
  )
}
