interface OracleSourceFieldProps {
  value: string
  onChange: (value: string) => void
}

export default function OracleSourceField({ value, onChange }: OracleSourceFieldProps) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">
        ORACLE_SOURCE_URL
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-textFaint">
        The public source this market will resolve against. Any wallet can dispute
        resolution against this source.
      </p>
    </div>
  )
}
