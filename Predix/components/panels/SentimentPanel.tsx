interface Signal {
  label: string
  tag: 'BULL' | 'BEAR' | 'NEUT'
}

interface SentimentPanelProps {
  fearGreedScore: number // 0-100
  signals: Signal[]
  buyYesFlowPct: number // 0-100
}

const TAG_STYLE: Record<Signal['tag'], string> = {
  BULL: 'bg-green/15 text-green',
  BEAR: 'bg-pink/15 text-pink',
  NEUT: 'bg-textFaint/20 text-textDim',
}

function fearGreedLabel(score: number): string {
  if (score >= 75) return 'GREED'
  if (score >= 55) return 'NEUTRAL'
  if (score >= 30) return 'FEAR'
  return 'EXTREME_FEAR'
}

export default function SentimentPanel({ fearGreedScore, signals, buyYesFlowPct }: SentimentPanelProps) {
  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        SENTIMENT_OVERLAY
      </h2>

      <p className="mt-3 text-[11px] uppercase tracking-[0.06em] text-textDim">FEAR / GREED_INDEX</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gradient-to-r from-pink via-amber to-green" />
      <p className="mt-2 inline-block rounded-sm bg-pink/15 px-2 py-1 text-lg font-bold text-pink">
        {fearGreedScore}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-textDim">
        {fearGreedLabel(fearGreedScore)}
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-[11px] uppercase tracking-[0.06em] text-textDim">// SIGNAL_MATRIX</h3>
        <div className="mt-2 space-y-1.5">
          {signals.map((signal) => (
            <div key={signal.label} className="flex items-center justify-between text-[11px]">
              <span className="rounded-sm bg-panelStrong px-2 py-1 uppercase tracking-[0.04em] text-textDim">
                {signal.label}
              </span>
              <span className={`rounded-sm px-2 py-1 font-semibold uppercase tracking-[0.04em] ${TAG_STYLE[signal.tag]}`}>
                {signal.tag === 'NEUT' ? 'NEUT' : signal.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-[11px] uppercase tracking-[0.06em] text-textDim">// SWAP_FLOW_24H</h3>
        <div className="mt-2 flex justify-between text-[11px]">
          <span className="text-green">▲ BUY_YES {buyYesFlowPct}%</span>
          <span className="text-pink">BUY_NO {100 - buyYesFlowPct}% ▼</span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full">
          <div className="bg-green" style={{ width: `${buyYesFlowPct}%` }} />
          <div className="bg-pink" style={{ width: `${100 - buyYesFlowPct}%` }} />
        </div>
      </div>
    </div>
  )
}
