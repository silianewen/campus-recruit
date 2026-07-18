// Maps each company to the positions it recruits for.
//
// ⚠️ USER MUST FILL THIS IN.
// For each company listed in src/lib/companies.ts, list the position IDs
// (matching PositionId in src/lib/types.ts) that students can apply to.
//
// Example:
//   export const COMPANY_POSITIONS: Record<string, PositionId[]> = {
//     alibaba: ['frontend', 'backend'],
//     tencent: ['frontend', 'product'],
//   }
//
// Until the user provides the mapping, every company returns an empty
// array — the home page will show "no positions available" until updated.

import type { PositionId } from './types'

export const COMPANY_POSITIONS: Record<string, PositionId[]> = {
  // TODO: fill in once companies are defined in src/lib/companies.ts
}

export function positionsForCompany(companyId: string | undefined | null): PositionId[] {
  if (!companyId) return []
  return COMPANY_POSITIONS[companyId] ?? []
}