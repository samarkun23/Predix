import type { TrustPoint } from '@/lib/types'

interface TrustStripProps {
  points: TrustPoint[]
}

export default function TrustStrip({ points }: TrustStripProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {points.map((point) => (
          <div
            key={point.id}
            className="rounded border border-border bg-panel p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-cyan">
              {point.label}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-textDim">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
