// Tiny helpers for company id handling. The list of companies lives in Supabase
// (fetched via loaders.fetchCompanies); this file only carries the URL-param
// validator, the deterministic per-id color used in the UI, and the
// SHORT_NAMES fallback table.
//
// Short-name resolution order (see lookupCompanyShort):
//   1. company.short_name from the database (set via migration 0013 or
//      updated any time with a one-line SQL UPDATE)
//   2. SHORT_NAMES below (legacy hard-coded fallback for when DB is empty)
//   3. the company id itself (e.g. "changlian_metal") so the UI never blanks
//
// To rename a company or its short display:
//   -- Pure SQL, no code change needed:
//   UPDATE companies
//      SET name = 'AA金属（广州）有限公司',
//          short_name = 'AA',
//          description = NULL
//    WHERE id = 'changlian_metal';

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

// Legacy hard-coded short names — used as a fallback when the DB row has no
// short_name. Safe to remove once every company row has a DB value.
const SHORT_NAMES: Record<string, string> = {
  changlian_metal:    '昶联',
  zhongnan_jicheng:   '中南机诚',
  zhongnan_zhicheng:  '中南智诚',
  yingshuo_laser:     '英硕激光',
  zhongnan_yayuan:    '中南雅园',
}

/**
 * Legacy: short-name lookup that ignores the DB value. Kept for callers
 * that don't have a Company object on hand (e.g. URL param parsing).
 * Prefer `lookupCompanyShort(c)` when a Company is available.
 *
 * Now backed by a runtime cache that `fetchCompanies` populates, so DB-side
 * renames flow through here too once any loader fetch has completed. Falls
 * back to the legacy SHORT_NAMES table when the cache is empty.
 */
const DB_SHORT_NAMES: Record<string, string> = {}

/**
 * Internal: called by `fetchCompanies` / `fetchCompany` to seed the runtime
 * cache from DB-loaded rows. Keys are trimmed, non-empty short_names only.
 */
export function registerCompanyShortNames(rows: Array<{ id: string; short_name?: string | null }>): void {
  for (const r of rows) {
    if (r.short_name && r.short_name.trim()) {
      DB_SHORT_NAMES[r.id] = r.short_name.trim()
    } else {
      delete DB_SHORT_NAMES[r.id]
    }
  }
}

export function companyShortName(id: string): string {
  return DB_SHORT_NAMES[id] ?? SHORT_NAMES[id] ?? id
}

/**
 * Resolve a company's short display name with three-tier fallback:
 *   1. company.short_name from the database
 *   2. SHORT_NAMES legacy map (handles pre-migration deploys)
 *   3. the company id itself (last resort)
 *
 * @param company  A `Company` from fetchCompanies/fetchCompany, or `null`
 *                 when only an id is known. Pass `null` to use the legacy
 *                 lookup table only.
 */
export function lookupCompanyShort(
  company: { id: string; short_name?: string | null } | null | undefined,
): string {
  if (company?.short_name && company.short_name.trim()) {
    return company.short_name
  }
  if (company) {
    const legacy = SHORT_NAMES[company.id]
    if (legacy) return legacy
    return company.id
  }
  return ''
}