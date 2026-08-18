// ── SkeletonTopicCard ────────────────────────────────────────
// Placeholder shown in the topic grid while predictions are
// loading — mirrors TopicCard's layout so the grid doesn't jump
// when real content swaps in.
export default function SkeletonTopicCard() {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-100 shadow-sm p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse-soft" />
        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse-soft" />
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse-soft" />
          <div className="h-3 w-8 bg-slate-100 rounded animate-pulse-soft" />
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 animate-pulse-soft" />
      </div>

      {/* Sparkline */}
      <div>
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse-soft mb-1.5" />
        <div className="w-full h-10 bg-slate-50 rounded animate-pulse-soft" />
      </div>

      {/* Meta row */}
      <div className="h-3 w-40 bg-slate-100 rounded animate-pulse-soft" />

      {/* CTA */}
      <div className="mt-auto h-9 w-full bg-slate-100 rounded-lg animate-pulse-soft" />
    </div>
  )
}
