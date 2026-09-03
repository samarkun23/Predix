import type { Trade } from '@/lib/types'

interface RecentActivityProps {
  trades: Trade[]
}

const SIDE_LABEL: Record<Trade['side'], { label: string; color: string }> = {
  'buy-yes': { label: 'BUY_YES', color: 'text-green' },
  'sell-yes': { label: 'SELL_YES', color: 'text-green' },
  'buy-no': { label: 'BUY_NO', color: 'text-pink' },
  'sell-no': { label: 'SELL_NO', color: 'text-pink' },
}

export default function RecentActivity({ trades }: RecentActivityProps) {
  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        RECENT_ACTIVITY
      </h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-[11px]">
          <thead>
            <tr className="text-left uppercase tracking-[0.06em] text-textFaint">
              <th className="py-1.5 font-normal">TIME</th>
              <th className="py-1.5 font-normal">SIDE</th>
              <th className="py-1.5 text-right font-normal">PRICE</th>
              <th className="py-1.5 text-right font-normal">SIZE</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-t border-border/60">
                <td className="py-1.5 text-textDim">{trade.time}</td>
                <td className={`py-1.5 font-medium ${SIDE_LABEL[trade.side].color}`}>
                  {SIDE_LABEL[trade.side].label}
                </td>
                <td className="py-1.5 text-right text-text">{trade.price.toFixed(1)}¢</td>
                <td className="py-1.5 text-right text-textDim">${trade.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
