import Link from 'next/link'
import type { Position } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import PnlValue from '@/components/portfolio/PnlValue'
import { positionPnlUsd } from '@/lib/portfolio'
import { STATUS_LABEL, STATUS_VARIANT } from '@/components/portfolio/positionBadges'

interface PositionsTableProps {
  positions: Position[]
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  return (
    <div className="hidden overflow-x-auto rounded border border-border bg-bg2 md:block">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left uppercase tracking-[0.06em] text-textFaint">
            <th className="px-4 py-3 font-normal">MARKET</th>
            <th className="px-4 py-3 font-normal">SIDE</th>
            <th className="px-4 py-3 text-right font-normal">ENTRY</th>
            <th className="px-4 py-3 text-right font-normal">CURRENT</th>
            <th className="px-4 py-3 text-right font-normal">SIZE</th>
            <th className="px-4 py-3 text-right font-normal">P&amp;L</th>
            <th className="px-4 py-3 text-right font-normal">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.id} className="border-b border-border/60 last:border-0 hover:bg-panelStrong">
              <td className="max-w-[220px] truncate px-4 py-3">
                <Link href={`/markets/${position.marketId}`} className="hover:text-cyan">
                  {position.marketQuestion}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-sm border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] ${
                    position.side === 'yes'
                      ? 'border-green/40 bg-green/10 text-green'
                      : 'border-pink/40 bg-pink/10 text-pink'
                  }`}
                >
                  {position.side.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-textDim">{position.entryPrice.toFixed(1)}¢</td>
              <td className="px-4 py-3 text-right text-text">{position.currentPrice.toFixed(1)}¢</td>
              <td className="px-4 py-3 text-right text-textDim">${position.sizeUsd}</td>
              <td className="px-4 py-3 text-right">
                <PnlValue value={positionPnlUsd(position)} />
              </td>
              <td className="px-4 py-3 text-right">
                <Badge variant={STATUS_VARIANT[position.status]}>
                  {STATUS_LABEL[position.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
