interface QuestionFieldProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export default function QuestionField({ value, onChange, maxLength = 140 }: QuestionFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">
          MARKET_QUESTION
        </label>
        <span className="text-[11px] text-textFaint">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Will ___ happen by ___?"
        className="mt-1.5 w-full resize-none rounded border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-cyan"
      />
    </div>
  )
}
