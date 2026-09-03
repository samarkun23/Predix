import type { PositionStatus } from '@/lib/types'
import type { BadgeVariant } from '@/components/ui/Badge'

export const STATUS_LABEL: Record<PositionStatus, string> = {
  open: 'OPEN',
  'resolved-won': 'WON',
  'resolved-lost': 'LOST',
}

export const STATUS_VARIANT: Record<PositionStatus, BadgeVariant> = {
  open: 'info',
  'resolved-won': 'network',
  'resolved-lost': 'neutral',
}
