import type { MarketCategory } from '@/lib/types'
import type { BadgeVariant } from '@/components/ui/Badge'

export const CATEGORY_BADGE_VARIANT: Record<MarketCategory, BadgeVariant> = {
  crypto: 'crypto',
  politics: 'politics',
  sports: 'sports',
  other: 'other',
}

export const CATEGORY_LABEL: Record<MarketCategory, string> = {
  crypto: 'CRYPTO',
  politics: 'POLITICS',
  sports: 'SPORTS',
  other: 'other'
}
