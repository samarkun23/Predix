import type { Position } from './types'

// Shared P&L calculation so every component (table, cards, summary) agrees.
export function positionPnlUsd(position: Position): number {
  const direction = position.side === 'yes' ? 1 : -1
  const pctChange = (position.currentPrice - position.entryPrice) / position.entryPrice
  return pctChange * position.sizeUsd * direction
}

export function totalPortfolioValue(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.sizeUsd + positionPnlUsd(p), 0)
}

export function totalUnrealizedPnl(positions: Position[]): number {
  return positions.filter((p) => p.status === 'open').reduce((sum, p) => sum + positionPnlUsd(p), 0)
}

export function winRate(positions: Position[]): number {
  const resolved = positions.filter((p) => p.status !== 'open')
  if (resolved.length === 0) return 0
  const wins = resolved.filter((p) => p.status === 'resolved-won').length
  return Math.round((wins / resolved.length) * 100)
}
