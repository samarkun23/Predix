import Link from 'next/link'
import type { Position } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import PnlValue from '@/components/portfolio/PnlValue'
import { positionPnlUsd } from '@/lib/portfolio'
import { STATUS_LABEL, STATUS_VARIANT } from '@/components/portfolio/positionBadges'

interface PositionCardMobileProps {
  positions: Position[]
}

export default function PositionCardMobile({ positions }: PositionCardMobileProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {positions.map((position) => (
        <div key={position.id} className="rounded border border-border bg-bg2 p-4">
          <Link
            href={`/markets/${position.marketId}`}
            className="block truncate text-sm font-medium text-text hover:text-cyan"
          >
            {position.marketQuestion}
          </Link>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] ${
                  position.side === 'yes'
                    ? 'border-green/40 bg-green/10 text-green'
                    : 'border-pink/40 bg-pink/10 text-pink'
                }`}
              >
                {position.side.toUpperCase()}
              </span>
              <Badge variant={STATUS_VARIANT[position.status]}>
                {STATUS_LABEL[position.status]}
              </Badge>
            </div>

            {position.status === 'resolved-won' ? (
              <Link
                href={`/markets/${position.marketId}`}
                className="rounded border border-green/50 bg-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green"
              >
                CLAIM
              </Link>
            ) : (
              <Link
                href={`/markets/${position.marketId}`}
                className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan"
              >
                VIEW
              </Link>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] border-t border-border/60 pt-2.5">
            <div className="flex justify-between">
              <span className="text-textFaint">ENTRY</span>
              <span className="text-textDim">{position.entryPrice.toFixed(1)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textFaint">CURRENT</span>
              <span className="text-text font-medium">{position.currentPrice.toFixed(1)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textFaint">SHARES / SIZE</span>
              <span className="text-textDim">
                {position.shares !== undefined ? `${position.shares.toFixed(1)} sh` : `$${position.sizeUsd}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-textFaint">P&amp;L</span>
              <PnlValue value={positionPnlUsd(position)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
