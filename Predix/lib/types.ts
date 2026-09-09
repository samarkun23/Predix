export type MarketCategory = 'crypto' | 'politics' | 'sports' | 'other'

export interface Market {
  id: string
  category: MarketCategory
  question: string
  yesProbability: number // 0-100
  pooledUsd: number
  endsInDays: number
  resolutionDate: any,
  account: any
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

export type SwapSide = 'buy_yes' | 'sell_yes' | 'buy_no' | 'sell_no'

export interface Swap {
  id: string
  time: string
  side: SwapSide
  price: number
  amountUsdc: number
}

export interface PoolState {
  yesReserve: number // USDC value on the YES side of the pool
  noReserve: number // USDC value on the NO side of the pool
  feeBps: number // swap fee in basis points, e.g. 30 = 0.30%
  lpProviders: number // number of wallets that have provided liquidity
  totalTVL: number
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
