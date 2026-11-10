'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import type { PricePoint } from '@/lib/types'
import { getPriceHistory, ChartRange } from '@/lib/data'

interface PriceChartProps {
  data?: PricePoint[]
  currentPrice?: number
  marketId?: string
}

const RANGES: ChartRange[] = ['1H', '1D', '1W', 'ALL']

export default function PriceChart({ data, currentPrice, marketId }: PriceChartProps) {
  const [range, setRange] = useState<ChartRange>('1D')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Derive active dataset based on range + marketId + currentPrice
  const activeData: PricePoint[] = useMemo(() => {
    if (marketId) {
      return getPriceHistory(marketId, currentPrice, range)
    }
    if (data && data.length > 0) {
      return data
    }
    return getPriceHistory('default', currentPrice, range)
  }, [marketId, currentPrice, range, data])

  const width = 640
  const height = 280
  const padding = { top: 20, right: 20, bottom: 35, left: 45 }

  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  // Min and max with headroom
  const rawMax = Math.max(...activeData.map((d) => d.price), 5)
  const rawMin = Math.min(...activeData.map((d) => d.price), 95)
  const pad = Math.max((rawMax - rawMin) * 0.15, 3)
  const max = Math.min(100, Math.ceil(rawMax + pad))
  const min = Math.max(0, Math.floor(rawMin - pad))
  const range_ = max - min || 1

  // Point coordinates
  const points = useMemo(() => {
    if (activeData.length === 0) return []
    return activeData.map((d, i) => {
      const x = padding.left + (i / Math.max(activeData.length - 1, 1)) * innerWidth
      const y = padding.top + innerHeight - ((d.price - min) / range_) * innerHeight
      return { x, y, price: d.price, time: d.time || `t-${i}`, timestamp: d.timestamp }
    })
  }, [activeData, min, range_, innerWidth, innerHeight, padding.left, padding.top])

  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const firstX = points[0].x.toFixed(1)
    const lastX = points[points.length - 1].x.toFixed(1)
    const bottomY = (padding.top + innerHeight).toFixed(1)
    return `M${firstX},${bottomY} L${linePath} L${lastX},${bottomY} Z`
  }, [points, linePath, padding.top, innerHeight])

  // Trend detection
  const firstPoint = activeData[0]?.price ?? 50
  const lastPoint = activeData[activeData.length - 1]?.price ?? 50
  const overallTrendUp = lastPoint >= firstPoint
  const lineColor = overallTrendUp ? '#39FF9E' : '#FF2E9A'
  const gradientId = overallTrendUp ? 'chart-fill-up-dyn' : 'chart-fill-down-dyn'

  // Hover item calculations
  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null
  const displayPrice = hoveredPoint ? hoveredPoint.price : lastPoint
  const displayTime = hoveredPoint ? hoveredPoint.time : 'Current Spot'
  const isHovered = hoveredPoint !== null

  const change = lastPoint - firstPoint
  const changePct = firstPoint > 0 ? (change / firstPoint) * 100 : 0
  const isUp = change >= 0

  // High & Low in selected range
  const periodHigh = Math.max(...activeData.map((d) => d.price))
  const periodLow = Math.min(...activeData.map((d) => d.price))

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return
      const rect = svgRef.current.getBoundingClientRect()
      const clientX = e.clientX - rect.left
      const scaleX = width / rect.width
      const svgX = clientX * scaleX

      // Find closest point by X coordinate
      let closestIdx = 0
      let closestDist = Infinity
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - svgX)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      }
      setHoverIndex(closestIdx)
    },
    [points, width]
  )

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null)
  }, [])

  // Y-axis grid levels (4 horizontal levels)
  const yLevels = [
    { value: max, y: padding.top },
    { value: Math.round(min + range_ * 0.66), y: padding.top + innerHeight * 0.33 },
    { value: Math.round(min + range_ * 0.33), y: padding.top + innerHeight * 0.66 },
    { value: min, y: padding.top + innerHeight },
  ]

  // X-axis time marks (4 marks across the range)
  const xLabels = useMemo(() => {
    if (activeData.length < 2) return []
    const indices = [
      0,
      Math.floor(activeData.length * 0.33),
      Math.floor(activeData.length * 0.66),
      activeData.length - 1,
    ]
    return indices.map((idx) => ({
      label: activeData[idx]?.time ?? '',
      x: padding.left + (idx / (activeData.length - 1)) * innerWidth,
    }))
  }, [activeData, padding.left, innerWidth])

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5 flex flex-col justify-between">
      {/* Header with live and hovered stats */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full animate-pulse-dot"
              style={{ backgroundColor: lineColor }}
            />
            <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
              YES_PRICE_PROBABILITY
            </h2>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-1.5 bg-bg/60 p-1 rounded border border-border/80">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r)
                  setHoverIndex(null)
                }}
                className={`min-h-[26px] px-2.5 rounded text-[10px] font-semibold uppercase tracking-[0.06em] transition-all ${
                  range === r
                    ? 'border border-cyan/60 bg-cyan/15 text-cyan shadow-glow-cyan'
                    : 'text-textDim hover:text-text hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Live / Hovered Price Display */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-baseline gap-3">
            <span
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{
                color: lineColor,
                textShadow: `0 0 16px ${lineColor}40`,
              }}
            >
              {displayPrice.toFixed(1)}¢
            </span>
            <span className="text-xs text-textDim font-medium">
              (${ (displayPrice / 100).toFixed(3) } USD)
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                isUp
                  ? 'border-green/40 bg-green/10 text-green'
                  : 'border-pink/40 bg-pink/10 text-pink'
              }`}
            >
              {isUp ? '+' : ''}
              {change.toFixed(1)}¢ ({changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%)
            </span>
          </div>

          {/* Right indicator: shows hover time or current period */}
          <div className="text-right text-[11px] text-textDim">
            <span className="uppercase tracking-[0.06em] text-textFaint">TIME: </span>
            <span className="font-mono text-text">{displayTime}</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Area */}
      <div className="relative mt-3 h-[240px] sm:h-[300px] w-full select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
              <stop offset="70%" stopColor={lineColor} stopOpacity="0.04" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y-axis price labels */}
          {yLevels.map((lvl, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={lvl.y}
                x2={padding.left + innerWidth}
                y2={lvl.y}
                stroke="rgba(139, 92, 246, 0.14)"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={lvl.y + 4}
                textAnchor="end"
                className="fill-textFaint text-[10px] font-mono"
              >
                {lvl.value}¢
              </text>
            </g>
          ))}

          {/* Shaded Area */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}

          {/* Main Price Curve */}
          {linePath && (
            <polyline
              points={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${lineColor}80)` }}
            />
          )}

          {/* X-axis time tick marks */}
          {xLabels.map((xl, i) => (
            <text
              key={i}
              x={xl.x}
              y={height - 8}
              textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
              className="fill-textFaint text-[10px] font-mono"
            >
              {xl.label}
            </text>
          ))}

          {/* Hover Crosshair and Dot Indicator */}
          {hoveredPoint && (
            <g>
              {/* Vertical crosshair line */}
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + innerHeight}
                stroke="rgba(45, 244, 230, 0.6)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />

              {/* Pulsing outer ring */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r={6}
                fill={lineColor}
                opacity={0.35}
                className="animate-ping"
              />

              {/* Center point */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r={4}
                fill="#07050E"
                stroke={lineColor}
                strokeWidth={2.5}
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Pill (HTML positioned over SVG) */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute -top-1 z-20 -translate-x-1/2 transform rounded border border-cyan/40 bg-bg2/95 px-2.5 py-1 text-center shadow-glow-cyan backdrop-blur"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
            }}
          >
            <div className="font-mono text-xs font-bold text-text">
              {hoveredPoint.price.toFixed(1)}¢
            </div>
            <div className="text-[9px] uppercase tracking-wider text-textDim">
              {hoveredPoint.time}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics Strip */}
      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border/60 pt-3 text-[11px]">
        <div>
          <span className="block text-textFaint uppercase tracking-[0.06em]">PERIOD_HIGH</span>
          <span className="font-mono font-semibold text-text">{periodHigh.toFixed(1)}¢</span>
        </div>
        <div>
          <span className="block text-textFaint uppercase tracking-[0.06em]">PERIOD_LOW</span>
          <span className="font-mono font-semibold text-text">{periodLow.toFixed(1)}¢</span>
        </div>
        <div>
          <span className="block text-textFaint uppercase tracking-[0.06em]">VOLATILITY</span>
          <span className="font-mono font-semibold text-cyan">
            {((periodHigh - periodLow) / (periodLow || 1) * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="block text-textFaint uppercase tracking-[0.06em]">INTERVAL</span>
          <span className="font-mono font-semibold text-textDim">{range}</span>
        </div>
      </div>
    </div>
  )
}
