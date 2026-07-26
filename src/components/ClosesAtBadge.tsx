// ClosesAtBadge — small pill that shows a position's optional close
// deadline. Past = "已截止", within 14 days = "X 天后截止", else null.
//
// P2 of post-mvp-feature-gaps.

interface Props {
  closesAt: string | null | undefined
}

export function ClosesAtBadge({ closesAt }: Props) {
  if (!closesAt) return null
  const d = new Date(closesAt)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.getTime() - Date.now()
  const days = Math.ceil(ms / 86_400_000)
  if (ms < 0) {
    return (
      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
        已截止
      </span>
    )
  }
  if (days <= 14) {
    return (
      <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
        {days} 天后截止
      </span>
    )
  }
  return null
}
