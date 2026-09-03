export type MarketCategory = 'crypto' | 'politics' | 'sports'

export interface Market {
  id: string
  category: MarketCategory
  question: string
  yesProbability: number // 0-100
  pooledUsd: number
  endsInDays: number
}

export interface Stat {
  id: string
  label: string
  value: string
  accent?: 'pink' | 'cyan' | 'green' | 'purple'
}

export interface TrustPoint {
  id: string
  label: string
  description: string
}

export interface PricePoint {
  t: number
  price: number
}

export type TradeSide = 'buy-yes' | 'buy-no' | 'sell-yes' | 'sell-no'

export interface Trade {
  id: string
  time: string
  side: TradeSide
  price: number
  size: number
}

export interface OrderBookRow {
  price: number
  size: number
}

export type PositionStatus = 'open' | 'resolved-won' | 'resolved-lost'

export interface Position {
  id: string
  marketId: string
  marketQuestion: string
  side: 'yes' | 'no'
  entryPrice: number
  currentPrice: number
  sizeUsd: number
  status: PositionStatus
}
