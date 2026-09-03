import type { OrderBookRow } from '@/lib/types'

interface OrderBookProps {
  asks: OrderBookRow[]
  bids: OrderBookRow[]
}

function Row({
  row,
  maxSize,
  color,
}: {
  row: OrderBookRow
  maxSize: number
  color: 'pink' | 'green'
}) {
  const barWidth = Math.max(8, (row.size / maxSize) * 100)
  const textColor = color === 'pink' ? 'text-pink' : 'text-green'
  const barColor = color === 'pink' ? 'rgba(255,46,154,0.12)' : 'rgba(57,255,158,0.12)'
  const total = (row.price * row.size).toFixed(0)

  return (
    <div className="relative grid grid-cols-2 gap-2 px-2 py-1.5 text-[11px] sm:grid-cols-3">
      <div
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{ width: `${barWidth}%`, background: barColor }}
      />
      <span className={`relative font-medium ${textColor}`}>{row.price.toFixed(1)}</span>
      <span className="relative text-right text-textDim">{row.size.toLocaleString()}</span>
      <span className="relative hidden text-right text-textFaint sm:block">{total}</span>
    </div>
  )
}

export default function OrderBook({ asks, bids }: OrderBookProps) {
  const maxSize = Math.max(...asks.map((r) => r.size), ...bids.map((r) => r.size))
  const spread = (bids[0]?.price ?? 0) - (asks[asks.length - 1]?.price ?? 0)

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        ORDER_BOOK
      </h2>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[220px]">
          <div className="grid grid-cols-2 gap-2 px-2 pb-1 text-[10px] uppercase tracking-[0.06em] text-textFaint sm:grid-cols-3">
            <span>PRICE</span>
            <span className="text-right">SIZE</span>
            <span className="hidden text-right sm:block">TOTAL</span>
          </div>

          <div className="flex flex-col-reverse">
            {asks.map((row) => (
              <Row key={`ask-${row.price}`} row={row} maxSize={maxSize} color="pink" />
            ))}
          </div>

          <div className="my-1 border-y border-borderStrong px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-cyan">
            SPREAD: {spread.toFixed(3)}
          </div>

          <div>
            {bids.map((row) => (
              <Row key={`bid-${row.price}`} row={row} maxSize={maxSize} color="green" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
