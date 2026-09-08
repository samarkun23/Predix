import type { PoolState } from './types'

const SLIPPAGE_TOLERANCE = 0.005 // 0.5%

export interface SwapQuote {
  spotPriceBefore: number // 0-1, price of the side being bought before this trade
  avgExecPrice: number // 0-1
  sharesOut: number
  priceImpactPct: number // e.g. 0.62 = 0.62%
  minReceived: number
}

// Constant-product (CPMM) quote: buying the YES side pushes USDC into the NO
// reserve and pulls YES tokens out to keep yesReserve * noReserve constant.
// Buying NO does the symmetric swap. Every output is derived from
// pool.yesReserve / pool.noReserve, so it moves whenever the pool does.
export function quoteSwap(pool: PoolState, side: 'yes' | 'no', amountUsdc: number): SwapQuote {
  const total = pool.yesReserve + pool.noReserve
  const spotPriceBefore =
    side === 'yes' ? pool.yesReserve / total : pool.noReserve / total

  if (!amountUsdc || amountUsdc <= 0 || total <= 0) {
    return { spotPriceBefore, avgExecPrice: spotPriceBefore, sharesOut: 0, priceImpactPct: 0, minReceived: 0 }
  }

  const k = pool.yesReserve * pool.noReserve
  const boughtReserve = side === 'yes' ? pool.yesReserve : pool.noReserve
  const otherReserve = side === 'yes' ? pool.noReserve : pool.yesReserve

  const newOtherReserve = otherReserve + amountUsdc
  const newBoughtReserve = k / newOtherReserve
  const sharesOut = boughtReserve - newBoughtReserve

  const avgExecPrice = sharesOut > 0 ? amountUsdc / sharesOut : spotPriceBefore
  const priceImpactPct = ((avgExecPrice - spotPriceBefore) / spotPriceBefore) * 100
  const minReceived = sharesOut * (1 - SLIPPAGE_TOLERANCE)

  return { spotPriceBefore, avgExecPrice, sharesOut, priceImpactPct, minReceived }
}
