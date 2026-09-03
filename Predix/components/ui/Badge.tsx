import { ReactNode } from 'react'

export type BadgeVariant = 'crypto' | 'politics' | 'sports' | 'network' | 'neutral' | 'info'

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  crypto: 'text-purple border-purple/40 bg-purple/10',
  politics: 'text-amber border-amber/40 bg-amber/10',
  sports: 'text-cyan border-cyan/40 bg-cyan/10',
  network: 'text-green border-green/40 bg-green/10',
  neutral: 'text-textDim border-border bg-panel',
  info: 'text-cyan border-cyan/40 bg-cyan/10',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
