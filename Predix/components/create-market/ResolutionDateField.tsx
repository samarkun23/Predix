interface ResolutionDateFieldProps {
  value: string
  onChange: (value: string) => void
}

export default function ResolutionDateField({ value, onChange }: ResolutionDateFieldProps) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">
        RESOLUTION_DATE
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan [color-scheme:dark]"
      />
    </div>
  )
}
