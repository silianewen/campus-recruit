// DB-first loaders. All functions return Promises; handle the no-supabase case
// by returning [] (not throwing) so callers can use `<AsyncView isEmpty>` to
// distinguish "no supabase" from "loading" from "empty DB".
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme
// See: openspec/changes/post-mvp-cleanup-and-dark-theme/specs/data-loaders/spec.md

import { supabase } from './supabase'
import type { Company, HrGroup, HrUser, SkillQuestion } from './types'

export interface PositionRow {
  id: string
  title: string
  description: string
  category?: string | null
}

export async function fetchCompanies(): Promise<Company[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, description, logo_url')
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as Company[]
}

export async function fetchAllPositions(): Promise<PositionRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category')
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as PositionRow[]
}

/**
 * Positions belonging to a company.
 *
 * Implementation note: position `id` is slugified as `{companyId}-{title-slug}`
 * (e.g. `changlian_metal-electrical-asst-engineer`), so we filter by `id LIKE`
 * instead of maintaining a separate join table. Cheap and good enough for MVP.
 */
export async function fetchPositionsForCompany(companyId: string): Promise<PositionRow[]> {
  if (!supabase) return []
  // Escape LIKE wildcards in the user-controlled id; otherwise `/companies/abc%`
  // would match `abcX-...` (any single char before '-'), letting unauthenticated
  // visitors enumerate positions across companies.
  const escaped = companyId.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category')
    .like('id', `${escaped}-%`)
    .order('title', { ascending: true })
  if (error) throw error
  return (data ?? []) as PositionRow[]
}

/** Positions filtered by category (used by the right-side filter on the student page). */
export async function fetchPositionsByCategory(category: string): Promise<PositionRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category')
    .eq('category', category)
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as PositionRow[]
}

export async function fetchPosition(positionId: string): Promise<PositionRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category')
    .eq('id', positionId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as PositionRow | null
}

export async function fetchCompanyName(companyId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  return (data?.name as string | undefined) ?? null
}

/** Full company record (id, name, description, logo_url). Used by CompanyDetail. */
export async function fetchCompany(companyId: string): Promise<Company | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, description, logo_url')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Company | null
}

/**
 * Phones that appear on 2+ resumes — i.e. students who submitted more than
 * once. Used by HRList (per-row "重复投递" badge + filter) and HRDashboard
 * (重复投递 KPI). Returns the raw list of duplicate phone numbers; the row
 * itself is considered duplicate when its resume phone is in this set.
 */
export async function fetchDuplicatePhones(): Promise<string[]> {
  if (!supabase) return []
  // We can't GROUP BY HAVING directly via PostgREST select, so we fetch all
  // distinct phones with count > 1 via .rpc would be cleaner, but we also want
  // this to work without RPC setup; fall back to fetch+groupBy client-side.
  // For 50–10k rows this is cheap.
  const { data, error } = await supabase
    .from('resumes')
    .select('phone')
  if (error) throw error
  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { phone: string }[]) {
    if (!r.phone) continue
    counts.set(r.phone, (counts.get(r.phone) ?? 0) + 1)
  }
  return Array.from(counts.entries()).filter(([, n]) => n > 1).map(([p]) => p)
}

/**
 * For a duplicated phone, list every (company, position) the phone also
 * submitted to — EXCLUDING the current row's own company. Used by company-
 * scoped HR users to see cross-company context for a flagged duplicate.
 *
 * Returns a list of `{ companyId, companyName, positionId, positionTitle }`.
 * When invoked by an admin (scope.kind === 'admin') the exclusion is None
 * so they see the full picture.
 */
export interface CrossCompanyRow {
  company_id: string
  company_name: string
  position_id: string
  position_title: string
  resume_id: string
}

export async function fetchCrossCompanyContext(
  phone: string,
  excludeCompanyId: string | null,
): Promise<CrossCompanyRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('resumes')
    .select(`
      id, company_id, position_id,
      company:companies ( id, name ),
      position:positions ( id, title )
    `)
    .eq('phone', phone)
  if (error) throw error
  return (data ?? [])
    .map((r: any) => ({
      resume_id: r.id,
      company_id: r.company?.id ?? r.company_id,
      company_name: r.company?.name ?? '',
      position_id: r.position?.id ?? r.position_id,
      position_title: r.position?.title ?? '',
    }))
    .filter((r) => !excludeCompanyId || r.company_id !== excludeCompanyId)
}

// =========================================================================
// HR auth + user/group loaders
// =========================================================================

export async function loginHrUser(username: string, passwordHash: string): Promise<HrUser | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('hr_users')
    .select('id, username, display_name, group_id, created_at')
    .eq('username', username)
    .eq('password_hash', passwordHash)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as HrUser | null
}

export async function fetchHrGroups(): Promise<HrGroup[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('hr_groups')
    .select('id, name, company_id, created_at')
    .order('id')
  if (error) throw error
  return (data ?? []) as HrGroup[]
}

export async function fetchHrUsers(): Promise<HrUser[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('hr_users')
    .select('id, username, display_name, group_id, created_at')
    .order('username')
  if (error) throw error
  return (data ?? []) as HrUser[]
}

export async function createHrUser(input: {
  username: string
  passwordHash: string
  displayName: string | null
  groupId: string
}): Promise<HrUser | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('hr_users')
    .insert({
      username: input.username,
      password_hash: input.passwordHash,
      display_name: input.displayName,
      group_id: input.groupId,
    })
    .select('id, username, display_name, group_id, created_at')
    .single()
  if (error) throw error
  return data as HrUser
}

export async function deleteHrUser(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('hr_users').delete().eq('id', id)
  if (error) throw error
}

export async function fetchQuestionsForPosition(positionId: string): Promise<SkillQuestion[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('questions_skill')
    .select('id, position_id, question, options, answer')
    .eq('position_id', positionId)
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    position_id: r.position_id,
    question: r.question,
    // PostgREST returns JSONB columns as already-parsed values, but guard for
    // string fallback if column type ever changes.
    options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
    answer: r.answer,
  })) as SkillQuestion[]
}