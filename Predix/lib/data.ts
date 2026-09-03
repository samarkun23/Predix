import type {
  Market,
  Stat,
  TrustPoint,
  PricePoint,
  Trade,
  OrderBookRow,
  Position,
} from './types'

export const markets: Market[] = [
  {
    id: 'btc-150k-2026',
    category: 'crypto',
    question: 'Will BTC close above $150,000 before Jan 1, 2027?',
    yesProbability: 62,
    pooledUsd: 482_300,
    endsInDays: 118,
  },
  {
    id: 'sol-etf-approval',
    category: 'crypto',
    question: 'Will a spot SOL ETF be approved in the US by Q1 2027?',
    yesProbability: 41,
    pooledUsd: 219_800,
    endsInDays: 203,
  },
  {
    id: 'fed-rate-cut-dec',
    category: 'politics',
    question: 'Will the Fed cut rates at the December meeting?',
    yesProbability: 74,
    pooledUsd: 156_400,
    endsInDays: 22,
  },
  {
    id: 'eu-election-turnout',
    category: 'politics',
    question: 'Will EU parliamentary turnout exceed 50% in 2027?',
    yesProbability: 33,
    pooledUsd: 64_900,
    endsInDays: 310,
  },
  {
    id: 'nba-finals-west',
    category: 'sports',
    question: 'Will a Western Conference team win the 2027 NBA Finals?',
    yesProbability: 55,
    pooledUsd: 98_700,
    endsInDays: 260,
  },
  {
    id: 'world-cup-host-upset',
    category: 'sports',
    question: 'Will a non-seeded team reach the World Cup semifinals?',
    yesProbability: 27,
    pooledUsd: 71_250,
    endsInDays: 640,
  },
  {
    id: 'eth-flip-btc',
    category: 'crypto',
    question: 'Will ETH market cap flip BTC before 2028?',
    yesProbability: 9,
    pooledUsd: 38_600,
    endsInDays: 820,
  },
  {
    id: 'us-shutdown-q1',
    category: 'politics',
    question: 'Will there be a US government shutdown in Q1 2027?',
    yesProbability: 46,
    pooledUsd: 112_050,
    endsInDays: 90,
  },
  {
    id: 'f1-champion-repeat',
    category: 'sports',
    question: 'Will the reigning F1 champion repeat in 2027?',
    yesProbability: 58,
    pooledUsd: 51_400,
    endsInDays: 400,
  },
]

export const stats: Stat[] = [
  { id: 'tvl', label: 'TOTAL_VALUE_LOCKED', value: '$4.28M', accent: 'green' },
  { id: 'markets', label: 'MARKETS_ON_CHAIN', value: '312', accent: 'cyan' },
  { id: 'wallets', label: 'WALLETS_TRADED', value: '18,904', accent: 'pink' },
  { id: 'program', label: 'PROGRAM_ID', value: 'SoLM4rkExGqz9Y2vJp7Rk8W3cVn6Tz1QeAx5uBh2Fd', accent: 'purple' },
]

export const trustPoints: TrustPoint[] = [
  {
    id: 'non-custodial',
    label: 'NON_CUSTODIAL',
    description: 'Funds never leave your wallet until a trade executes on-chain.',
  },
  {
    id: 'verified-program',
    label: 'VERIFIED_PROGRAM',
    description: 'Solana program source is verified and publicly auditable.',
  },
  {
    id: 'open-oracle',
    label: 'OPEN_ORACLE',
    description: 'Resolution sources are public and disputable by any wallet.',
  },
  {
    id: 'permissionless',
    label: 'PERMISSIONLESS',
    description: 'Anyone can create, trade, or provide liquidity to a market.',
  },
]

// Deterministic pseudo-random walk generator (no external deps, stable output)
function seededRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

export function generatePriceHistory(
  basePrice: number,
  points = 60,
  seed = 42
): PricePoint[] {
  const rand = seededRandom(seed)
  const history: PricePoint[] = []
  let price = basePrice
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.5) * 4
    price = Math.min(96, Math.max(4, price + drift))
    history.push({ t: i, price: Math.round(price * 10) / 10 })
  }
  return history
}

export const priceHistory: PricePoint[] = generatePriceHistory(62, 60, 7)

export const recentTrades: Trade[] = [
  { id: 't1', time: '14:02:11', side: 'buy-yes', price: 62.4, size: 480 },
  { id: 't2', time: '14:01:47', side: 'sell-no', price: 37.1, size: 220 },
  { id: 't3', time: '14:00:58', side: 'buy-no', price: 38.0, size: 150 },
  { id: 't4', time: '13:59:32', side: 'buy-yes', price: 61.8, size: 920 },
  { id: 't5', time: '13:58:04', side: 'sell-yes', price: 61.2, size: 340 },
  { id: 't6', time: '13:57:20', side: 'buy-yes', price: 60.9, size: 175 },
  { id: 't7', time: '13:56:11', side: 'buy-no', price: 39.4, size: 610 },
]

export const orderBookAsks: OrderBookRow[] = [
  { price: 65.2, size: 1240 },
  { price: 64.6, size: 860 },
  { price: 64.1, size: 2010 },
  { price: 63.5, size: 430 },
  { price: 62.9, size: 1580 },
]

export const orderBookBids: OrderBookRow[] = [
  { price: 62.1, size: 1720 },
  { price: 61.5, size: 640 },
  { price: 60.8, size: 990 },
  { price: 60.2, size: 2210 },
  { price: 59.6, size: 510 },
]

export const positions: Position[] = [
  {
    id: 'p1',
    marketId: 'btc-150k-2026',
    marketQuestion: 'Will BTC close above $150,000 before Jan 1, 2027?',
    side: 'yes',
    entryPrice: 54.2,
    currentPrice: 62.4,
    sizeUsd: 1200,
    status: 'open',
  },
  {
    id: 'p2',
    marketId: 'sol-etf-approval',
    marketQuestion: 'Will a spot SOL ETF be approved in the US by Q1 2027?',
    side: 'no',
    entryPrice: 63.0,
    currentPrice: 59.0,
    sizeUsd: 480,
    status: 'open',
  },
  {
    id: 'p3',
    marketId: 'fed-rate-cut-dec',
    marketQuestion: 'Will the Fed cut rates at the December meeting?',
    side: 'yes',
    entryPrice: 48.0,
    currentPrice: 74.0,
    sizeUsd: 900,
    status: 'open',
  },
  {
    id: 'p4',
    marketId: 'eth-flip-btc',
    marketQuestion: 'Will ETH market cap flip BTC before 2028?',
    side: 'no',
    entryPrice: 88.0,
    currentPrice: 91.0,
    sizeUsd: 260,
    status: 'resolved-won',
  },
  {
    id: 'p5',
    marketId: 'world-cup-host-upset',
    marketQuestion: 'Will a non-seeded team reach the World Cup semifinals?',
    side: 'yes',
    entryPrice: 35.0,
    currentPrice: 27.0,
    sizeUsd: 340,
    status: 'resolved-lost',
  },
]

export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id)
}
