import type { Position } from './types'

/** Current value of a single position in USD */
export function positionPnlUsd(position: Position): number {
  if (position.status !== 'open') return 0
  const priceDiff = position.currentPrice - position.entryPrice
  return (priceDiff / position.entryPrice) * position.sizeUsd
}

/** Total portfolio value across all positions */
export function totalPortfolioValue(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.sizeUsd, 0)
}

/** Total unrealized P&L across all open positions */
export function totalUnrealizedPnl(positions: Position[]): number {
  return positions
    .filter((p) => p.status === 'open')
    .reduce((sum, p) => sum + positionPnlUsd(p), 0)
}

/** Win rate as a percentage (resolved-won / total resolved) */
export function winRate(positions: Position[]): number {
  const resolved = positions.filter(
    (p) => p.status === 'resolved-won' || p.status === 'resolved-lost'
  )
  if (resolved.length === 0) return 0
  const won = resolved.filter((p) => p.status === 'resolved-won').length
  return Math.round((won / resolved.length) * 100)
}
