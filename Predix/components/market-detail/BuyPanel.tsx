'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'

interface BuyPanelProps {
  yesProbability: number
}

export default function BuyPanel({ yesProbability }: BuyPanelProps) {
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('1.0')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const price = side === 'yes' ? yesProbability : 100 - yesProbability
  const solAmount = parseFloat(amount) || 0
  const estPayout = useMemo(() => {
    if (price <= 0) return 0
    return (solAmount / (price / 100)).toFixed(2)
  }, [solAmount, price])

  return (
    <div className="safe-bottom sticky bottom-0 z-30 rounded border border-border bg-bg2/95 p-4 backdrop-blur-sm sm:p-5 lg:sticky lg:top-20 lg:bottom-auto lg:bg-bg2 lg:backdrop-blur-none">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        BUY_POSITION
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('yes')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'yes'
              ? 'border-green bg-green/10 text-green shadow-glow-green'
              : 'border-border text-textDim'
          }`}
        >
          YES · {yesProbability}¢
        </button>
        <button
          onClick={() => setSide('no')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'no'
              ? 'border-pink bg-pink/10 text-pink shadow-glow-pink'
              : 'border-border text-textDim'
          }`}
        >
          NO · {100 - yesProbability}¢
        </button>
      </div>

      <label className="mt-4 block text-[11px] uppercase tracking-[0.06em] text-textDim">
        AMOUNT_SOL
      </label>
      <input
        type="number"
        min="0"
        step="0.1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
      />

      <button
        onClick={() => setDetailsOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between text-[11px] uppercase tracking-[0.06em] text-textDim lg:hidden"
      >
        DETAILS
        <span>{detailsOpen ? '−' : '+'}</span>
      </button>

      <div className={`${detailsOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="mt-3 space-y-1.5 text-xs text-textDim">
          <div className="flex justify-between">
            <span>AVG_PRICE</span>
            <span className="text-text">{price}¢</span>
          </div>
          <div className="flex justify-between">
            <span>EST_PAYOUT</span>
            <span className="text-green">{estPayout} SOL</span>
          </div>
        </div>
      </div>

      <Button variant={side} className="mt-4 w-full">
        EXECUTE_BUY
      </Button>
    </div>
  )
}
