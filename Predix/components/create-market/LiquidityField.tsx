interface LiquidityFieldProps {
  value: string
  onChange: (value: string) => void
}

export default function LiquidityField({ value, onChange }: LiquidityFieldProps) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">
        INITIAL_LIQUIDITY_USDC
      </label>
      <input
        type="number"
        min="0"
        step="100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1000"
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
      />
    </div>
  )
}
