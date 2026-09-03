interface ProbabilityBarProps {
  yesProbability: number
}

export default function ProbabilityBar({ yesProbability }: ProbabilityBarProps) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink/15">
      <div
        className="h-full rounded-full bg-green"
        style={{ width: `${yesProbability}%`, boxShadow: '0 0 8px rgba(57,255,158,0.6)' }}
      />
    </div>
  )
}
