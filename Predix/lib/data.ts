import type {
  Market,
  Stat,
  TrustPoint,
  PricePoint,
  Swap,
  SwapSide,
  PoolState,
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
  { id: 'program', label: 'PROGRAM_ID', value: 'j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA', accent: 'purple' },
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

function hashSeed(id: string): number {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h + 1
}

export type ChartRange = '1H' | '1D' | '1W' | 'ALL'

export function generatePriceHistory(
  basePrice: number,
  points = 60,
  seed = 42,
  range: ChartRange = '1D'
): PricePoint[] {
  const rand = seededRandom(seed)
  const history: PricePoint[] = []

  // Compute time intervals based on range
  const now = Date.now()
  let intervalMs = 60 * 1000 // default 1 min for 1H
  let formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (range === '1H') {
    points = 60
    intervalMs = 60 * 1000 // 1 minute
  } else if (range === '1D') {
    points = 48
    intervalMs = 30 * 60 * 1000 // 30 mins
  } else if (range === '1W') {
    points = 56
    intervalMs = 3 * 3600 * 1000 // 3 hours
    formatTime = (ts: number) => {
      const d = new Date(ts)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[d.getMonth()]} ${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`
    }
  } else if (range === 'ALL') {
    points = 60
    intervalMs = 12 * 3600 * 1000 // 12 hours
    formatTime = (ts: number) => {
      const d = new Date(ts)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[d.getMonth()]} ${d.getDate()}`
    }
  }

  // Work backwards from basePrice so the latest point matches current live price
  const prices: number[] = [basePrice]
  let current = basePrice
  const maxDrift = range === '1H' ? 1.5 : range === '1D' ? 3.0 : 5.0

  for (let i = 1; i < points; i++) {
    const drift = (rand() - 0.49) * maxDrift
    current = Math.min(97, Math.max(3, current - drift))
    prices.unshift(Math.round(current * 10) / 10)
  }

  const startTime = now - (points - 1) * intervalMs

  for (let i = 0; i < points; i++) {
    const timestamp = startTime + i * intervalMs
    history.push({
      t: i,
      price: prices[i],
      time: formatTime(timestamp),
      timestamp,
    })
  }

  return history
}

// Per-market price history, keyed by market id + range + basePrice.
const priceHistoryCache = new Map<string, PricePoint[]>()
export function getPriceHistory(
  marketId: string,
  currentPrice?: number,
  range: ChartRange = '1D'
): PricePoint[] {
  const market = getMarketById(marketId)
  const base = currentPrice !== undefined && !isNaN(currentPrice) && currentPrice > 0
    ? currentPrice
    : (market?.yesProbability ?? 50)

  const cacheKey = `${marketId}-${range}-${Math.round(base * 10)}`
  if (!priceHistoryCache.has(cacheKey)) {
    const seed = hashSeed(marketId) + (range === '1H' ? 101 : range === '1D' ? 202 : range === '1W' ? 303 : 404)
    priceHistoryCache.set(cacheKey, generatePriceHistory(base, 60, seed, range))
  }
  return priceHistoryCache.get(cacheKey)!
}

// Per-market AMM pool state, derived from the market's mock pooledUsd / yesProbability
// so PoolPanel and SwapPanel always agree with what's shown on the card/header.
export function getPoolState(marketId: string): PoolState {
  const market = getMarketById(marketId)
  const total = market?.pooledUsd ?? 100_000
  const yesFraction = (market?.yesProbability ?? 50) / 100
  const rand = seededRandom(hashSeed(marketId))
  return {
    yesReserve: Math.round(total * yesFraction),
    noReserve: Math.round(total * (1 - yesFraction)),
    feeBps: 30,
    lpProviders: Math.round(20 + rand() * 120),
  }
}

// Per-market recent swaps (mock activity feed), keyed by market id.
const SWAP_SIDES: SwapSide[] = ['buy_yes', 'sell_yes', 'buy_no', 'sell_no']
export function getRecentSwaps(marketId: string, currentPrice?: number): Swap[] {
  const market = getMarketById(marketId)
  const basePrice = currentPrice !== undefined && !isNaN(currentPrice) && currentPrice > 0
    ? currentPrice / 100
    : (market?.yesProbability ?? 50) / 100

  const rand = seededRandom(hashSeed(marketId) + 17)
  const swaps: Swap[] = []
  let hour = 14
  let minute = 12
  let second = 1
  for (let i = 0; i < 8; i++) {
    const side = SWAP_SIDES[Math.floor(rand() * SWAP_SIDES.length)]
    const isYes = side === 'buy_yes' || side === 'sell_yes'
    const jitter = (rand() - 0.5) * 0.02
    const price = Math.max(0.02, Math.min(0.98, (isYes ? basePrice : 1 - basePrice) + jitter))
    const amountUsdc = Math.round((0.5 + rand() * 4) * 100) / 100
    second -= Math.floor(rand() * 15) + 1
    if (second < 0) {
      second += 60
      minute -= 1
      if (minute < 0) {
        minute += 60
        hour -= 1
      }
    }
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    swaps.push({ id: `${marketId}-swap-${i}`, time, side, price, amountUsdc })
  }
  return swaps
}

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

export interface SentimentData {
  fearGreedScore: number
  signals: { label: string; tag: 'BULL' | 'BEAR' | 'NEUT' }[]
  buyYesFlowPct: number
}

const SIGNAL_LABELS = ['PRICE_MOM', 'POOL_DEPTH', 'VOL_DELTA', 'LP_FLOW', 'WHALE_ACT']

export function getSentiment(marketId: string): SentimentData {
  const market = getMarketById(marketId)
  const rand = seededRandom(hashSeed(marketId) + 31)
  const yesProbability = market?.yesProbability ?? 50
  const fearGreedScore = Math.round(Math.min(95, Math.max(5, yesProbability + (rand() - 0.5) * 30)))
  const tags: SentimentData['signals'][number]['tag'][] = ['BULL', 'BEAR', 'NEUT']
  const signals = SIGNAL_LABELS.map((label) => ({
    label,
    tag: tags[Math.floor(rand() * tags.length)],
  }))
  const buyYesFlowPct = Math.round(Math.min(90, Math.max(10, yesProbability + (rand() - 0.5) * 20)))
  return { fearGreedScore, signals, buyYesFlowPct }
}

export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id)
}
