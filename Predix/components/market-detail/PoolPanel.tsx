"use client"
import type { PoolState } from '@/lib/types'
import Button from '@/components/ui/Button'

interface PoolPanelProps {
  pool: PoolState
}

// Static, illustrative price-impact curve (not derived from live depth) —
// just meant to communicate "impact grows with trade size" visually.
const CURVE_POINTS = [0, 2, 5, 9, 15, 23, 33, 45, 58, 72, 85, 96]

export default function PoolPanel({ pool }: PoolPanelProps) {
  const total = pool.yesReserve + pool.noReserve
  const yesPct = total > 0 ? (pool.yesReserve / total) * 100 : 50
  const yesPrice = yesPct / 100

  const curveW = 240
  const curveH = 60
  const maxCurve = Math.max(...CURVE_POINTS)
  const curvePath = CURVE_POINTS.map((v, i) => {
    const x = (i / (CURVE_POINTS.length - 1)) * curveW
    const y = curveH - (v / maxCurve) * curveH
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        LIQUIDITY_POOL
      </h2>

      <p className="mt-3 text-3xl font-bold text-green" style={{ textShadow: '0 0 14px currentColor' }}>
        {yesPrice.toFixed(2)}
      </p>
      <p className="mt-1 text-[11px] text-textFaint">
        Price derived from pool reserves — no order book, no matching engine
      </p>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full border border-border">
        <div className="bg-green" style={{ width: `${yesPct}%` }} />
        <div className="bg-pink" style={{ width: `${100 - yesPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px]">
        <span className="text-green">
          YES_RESERVE · ${(pool.yesReserve / 1000).toFixed(1)}K ({yesPct.toFixed(0)}%)
        </span>
        <span className="text-pink">
          NO_RESERVE · ${(pool.noReserve / 1000).toFixed(1)}K ({(100 - yesPct).toFixed(0)}%)
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-textDim">
        <div className="flex justify-between">
          <span>POOL_TVL</span>
          <span className="text-text">${total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>SWAP_FEE</span>
          <span className="text-text">{(pool.feeBps / 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span>LP_PROVIDERS</span>
          <span className="text-text">{pool.lpProviders} wallets</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-[11px] uppercase tracking-[0.06em] text-textDim">
          // PRICE_IMPACT_CURVE
        </h3>
        <svg viewBox={`0 0 ${curveW} ${curveH}`} className="mt-2 h-14 w-full" preserveAspectRatio="none">
          <polyline
            points={curvePath}
            fill="none"
            stroke="#2DF4E6"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 4px rgba(45,244,230,0.6))' }}
          />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="w-full border-purple text-purple hover:bg-purple/10"
          onClick={() => {
            // TODO: wire up add-liquidity instruction
          }}
        >
          ADD_LIQUIDITY
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            // TODO: wire up remove-liquidity instruction
          }}
        >
          REMOVE_LIQUIDITY
        </Button>
      </div>
    </div>
  )
}
