'use client'

import { useState } from 'react'
import type { PricePoint } from '@/lib/types'

interface PriceChartProps {
  data: PricePoint[]
}

const RANGES = ['1H', '1D', '1W', 'ALL'] as const
type Range = (typeof RANGES)[number]

// Structured so a future PriceChart could swap this SVG body for a recharts
// <AreaChart> without changing the props this component accepts.
export default function PriceChart({ data }: PriceChartProps) {
  const [range, setRange] = useState<Range>('1W')
  const width = 600
  const height = 300
  const max = Math.max(...data.map((d) => d.price), 100)
  const min = Math.min(...data.map((d) => d.price), 0)
  const range_ = max - min || 1

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.price - min) / range_) * height
    return { x, y }
  })
  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `M0,${height} L${linePath} L${width},${height} Z`

  const trendUp = data[data.length - 1].price >= data[0].price
  const lineColor = trendUp ? '#39FF9E' : '#FF2E9A'
  const gradientId = trendUp ? 'chart-fill-up' : 'chart-fill-down'

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
          YES_PRICE_HISTORY
        </h2>
      </div>

      <div className="mt-4 h-[220px] sm:h-[280px] lg:h-[360px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <polyline
            points={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 6px ${lineColor}80)` }}
          />
        </svg>
      </div>

      <div className="mt-3 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`min-h-[36px] rounded-sm border px-3 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
              range === r ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-textDim hover:text-text'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
