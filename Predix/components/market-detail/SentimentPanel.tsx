interface SentimentPanelProps {
  yesProbability: number
}

export default function SentimentPanel({ yesProbability }: SentimentPanelProps) {
  const noProbability = 100 - yesProbability

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        SENTIMENT
      </h2>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div className="bg-green" style={{ width: `${yesProbability}%` }} />
        <div className="bg-pink" style={{ width: `${noProbability}%` }} />
      </div>

      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.06em]">
        <span className="text-green">YES {yesProbability}%</span>
        <span className="text-pink">NO {noProbability}%</span>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-textDim">
        <div className="flex justify-between">
          <span>UNIQUE_TRADERS</span>
          <span className="text-text">312</span>
        </div>
        <div className="flex justify-between">
          <span>24H_VOLUME</span>
          <span className="text-text">$48.2K</span>
        </div>
      </div>
    </div>
  )
}
