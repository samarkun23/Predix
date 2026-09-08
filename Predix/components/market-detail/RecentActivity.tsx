import type { Swap } from '@/lib/types'

interface RecentActivityProps {
  swaps: Swap[]
}

const SIDE_LABEL: Record<Swap['side'], { label: string; color: string }> = {
  buy_yes: { label: 'BUY_YES', color: 'text-green' },
  sell_yes: { label: 'SELL_YES', color: 'text-pink' },
  buy_no: { label: 'BUY_NO', color: 'text-pink' },
  sell_no: { label: 'SELL_NO', color: 'text-green' },
}

export default function RecentActivity({ swaps }: RecentActivityProps) {
  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        RECENT_SWAPS
      </h2>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[380px]">
          {swaps.map((swap) => (
            <div
              key={swap.id}
              className="grid grid-cols-4 gap-2 border-t border-border/60 py-2 text-[11px] first:border-0"
            >
              <span className="text-textDim">{swap.time}</span>
              <span className={`font-medium ${SIDE_LABEL[swap.side].color}`}>
                [{SIDE_LABEL[swap.side].label}]
              </span>
              <span className="text-right text-text">{swap.price.toFixed(3)}</span>
              <span className="text-right text-textDim">{swap.amountUsdc.toFixed(2)} USDC</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
