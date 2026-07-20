// Tiny helpers for position id handling. The list of positions lives in Supabase
// (fetched via loaders.fetchAllPositions / fetchPositionsForCompany); this file
// only carries the URL-param validator.

/**
 * Lenient check: any non-empty id accepted. The actual loader will return
 * `null` for unknown ids, and the UI surfaces that as an empty state.
 */
export const isPositionId = (s: string | undefined | null): s is string =>
  !!s && s.length > 0