'use client'

import { useMemo, useState } from 'react'
import type { PoolState } from '@/lib/types'
import Button from '@/components/ui/Button'
import { quoteSwap } from '@/lib/amm'

interface SwapPanelProps {
  pool: PoolState
}

export default function SwapPanel({ pool }: SwapPanelProps) {
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('100.00')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const amountUsdc = parseFloat(amount) || 0
  const quote = useMemo(() => quoteSwap(pool, side, amountUsdc), [pool, side, amountUsdc])

  return (
    <div className="safe-bottom sticky bottom-0 z-30 rounded border border-border bg-bg2/95 p-4 backdrop-blur-sm sm:p-5 lg:sticky lg:top-20 lg:bottom-auto lg:bg-bg2 lg:backdrop-blur-none">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('yes')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'yes' ? 'border-green bg-green/10 text-green shadow-glow-green' : 'border-border text-textDim'
          }`}
        >
          BUY_YES
        </button>
        <button
          onClick={() => setSide('no')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'no' ? 'border-pink bg-pink/10 text-pink shadow-glow-pink' : 'border-border text-textDim'
          }`}
        >
          BUY_NO
        </button>
      </div>

      <label className="mt-4 block text-[11px] uppercase tracking-[0.06em] text-textDim">
        AMOUNT (USDC)
      </label>
      <input
        type="number"
        min="0"
        step="1"
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
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-textDim">AVG_EXEC_PRICE</span>
            <span className="text-text">{quote.avgExecPrice.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">SHARES_OUT</span>
            <span className="text-text">
              {quote.sharesOut.toFixed(2)} {side.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">PRICE_IMPACT</span>
            <span className={Math.abs(quote.priceImpactPct) > 1 ? 'text-amber' : 'text-textDim'}>
              {quote.priceImpactPct.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">MIN_RECEIVED (0.5% SLIPPAGE)</span>
            <span className="text-text">
              {quote.minReceived.toFixed(2)} {side.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant={side}
        className="mt-4 w-full"
        onClick={() => {
          // TODO: wire up @solana/wallet-adapter swap instruction
        }}
      >
        SWAP · BUY_{side.toUpperCase()}
      </Button>
    </div>
  )
}
