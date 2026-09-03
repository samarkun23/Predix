import { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'yes' | 'no' | 'ghost' | 'sell'

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan/10 border-cyan text-cyan hover:bg-cyan/20 shadow-glow-cyan',
  secondary:
    'bg-panel border-borderStrong text-text hover:bg-panelStrong',
  yes: 'bg-green/10 border-green text-green hover:bg-green/20 shadow-glow-green',
  no: 'bg-pink/10 border-pink text-pink hover:bg-pink/20 shadow-glow-pink',
  sell: 'bg-red/10 border-red text-red hover:bg-red/20',
  ghost: 'bg-transparent border-border text-textDim hover:text-text hover:border-borderStrong',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
