// Tiny helpers for company id handling. The list of companies lives in Supabase
// (fetched via loaders.fetchCompanies); this file only carries the URL-param
// validator and the deterministic per-id color used in the UI.

/**
 * Lenient check: any non-empty id accepted. The actual loader will return
 * `null` for unknown ids, and the UI surfaces that as an empty state.
 */
export const isCompanyId = (s: string | undefined | null): s is string =>
  !!s && s.length > 0

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
]

/**
 * Deterministic color per company id — same id always gets same color across
 * the app, so badges stay consistent between pages.
 */
export function companyColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

// Short display names — used in headers/sidebars where space is limited.
// Falls back to the full company id for unknown ids.
const SHORT_NAMES: Record<string, string> = {
  changlian_metal:    '昶联',
  zhongnan_jicheng:   '中南机诚',
  zhongnan_zhicheng:  '中南智诚',
  yingshuo_laser:     '英硕激光',
  zhongnan_yayuan:    '中南雅园',
}
export function companyShortName(id: string): string {
  return SHORT_NAMES[id] ?? id
}