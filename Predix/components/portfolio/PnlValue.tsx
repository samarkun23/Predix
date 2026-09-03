interface PnlValueProps {
  value: number
  className?: string
}

export default function PnlValue({ value, className = '' }: PnlValueProps) {
  const isPositive = value >= 0
  const color = isPositive ? 'text-green' : 'text-pink'
  const sign = isPositive ? '+' : ''

  return (
    <span
      className={`font-semibold ${color} ${className}`}
      style={{ textShadow: '0 0 10px currentColor' }}
    >
      {sign}
      {value.toFixed(2)}
    </span>
  )
}
