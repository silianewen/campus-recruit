// DB-first loaders. All functions return Promises; handle the no-supabase case
// by returning [] (not throwing) so callers can use `<AsyncView isEmpty>` to
// distinguish "no supabase" from "loading" from "empty DB".
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme
// See: openspec/changes/post-mvp-cleanup-and-dark-theme/specs/data-loaders/spec.md

import { supabase } from './supabase'
import { registerCompanyShortNames } from './companies'
import type { Company, HrGroup, HrUser, SkillQuestion } from './types'

export interface PositionRow {
  id: string
  title: string
  description: string
  category?: string | null
  closes_at?: string | null
}

export async function fetchCompanies(): Promise<Company[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, description, logo_url, short_name')
    .order('id', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as Company[]
  registerCompanyShortNames(rows)
  return rows
}

export async function fetchAllPositions(): Promise<PositionRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category, closes_at')
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
    .select('id, title, description, category, closes_at')
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
    .select('id, title, description, category, closes_at')
    .eq('category', category)
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as PositionRow[]
}

export async function fetchPosition(positionId: string): Promise<PositionRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description, category, closes_at')
    .eq('id', positionId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as PositionRow | null
}

/**
 * Site-wide marketing copy (currently: 集团简介). Backed by the
 * `site_content` table (singleton row, see migration 0015). Returns
 * `null` if the row is missing or `group_intro` is empty — callers should
 * fall back to the in-code placeholder text.
 */
export async function fetchGroupIntro(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('site_content')
    .select('group_intro')
    .eq('id', 'singleton')
    .maybeSingle()
  if (error) throw error
  const raw = (data?.group_intro as string | null | undefined) ?? null
  if (!raw || !raw.trim()) return null
  return raw
}

/**
 * Group logo URL (DB-driven, migration 0016). Returns null when the URL
 * is empty/missing — the UI then renders the dashed placeholder box.
 */
export async function fetchGroupLogo(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('site_content')
    .select('group_logo_url')
    .eq('id', 'singleton')
    .maybeSingle()
  if (error) throw error
  const raw = (data?.group_logo_url as string | null | undefined) ?? null
  if (!raw || !raw.trim()) return null
  return raw
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

/** Full company record (id, name, description, logo_url, short_name).
 *  Used by CompanyDetail. */
export async function fetchCompany(companyId: string): Promise<Company | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, description, logo_url, short_name')
    .eq('id', companyId)
    .maybeSingle()
  if (error) throw error
  const row = (data ?? null) as Company | null
  if (row) registerCompanyShortNames([row])
  return row
}

/**
 * Phones that appear on 2+ resumes — i.e. students who submitted more than
 * once. Used by HRList (per-row "重复投递" badge + filter) and HRDashboard
 * (重复投递 KPI). Returns the raw list of duplicate phone numbers; the row
 * itself is considered duplicate when its resume phone is in this set.
 *
 * When `companyId` is provided, "duplicate" is scoped to that company —
 * a phone counts as duplicate only if it has 2+ resumes for that company.
 * This is what the company-group dashboard needs (no cross-company leak
 * into their stats). Admin / default pass null/undefined for global view.
 */
export async function fetchDuplicatePhones(companyId?: string | null): Promise<string[]> {
  if (!supabase) return []
  let query = supabase.from('resumes').select('phone, company_id')
  if (companyId) query = query.eq('company_id', companyId)
  const { data, error } = await query
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

/**
 * Edit an existing HR user. All fields are optional — only those provided are
 * updated. Username uniqueness is enforced by the DB (hr_users.username UNIQUE);
 * on conflict, Supabase returns a 23505 error which surfaces to the UI.
 */
export async function updateHrUser(
  id: string,
  patch: {
    username?: string
    display_name?: string | null
    password_hash?: string
  },
): Promise<HrUser | null> {
  if (!supabase) return null
  const update: Record<string, unknown> = {}
  if (patch.username !== undefined) update.username = patch.username
  if (patch.display_name !== undefined) update.display_name = patch.display_name
  if (patch.password_hash !== undefined) update.password_hash = patch.password_hash
  if (Object.keys(update).length === 0) return null
  const { data, error } = await supabase
    .from('hr_users')
    .update(update)
    .eq('id', id)
    .select('id, username, display_name, group_id, created_at')
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as HrUser | null
}

// =========================================================================
// HR → student notifications (P1)
// =========================================================================

export interface NotificationInsert {
  phone: string
  title: string
  content: string
  /** One of 'interview_invite' | 'test_invite' | 'status_update'. */
  type: 'interview_invite' | 'test_invite' | 'status_update'
}

export async function insertNotification(input: NotificationInsert): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notifications').insert({
    phone: input.phone,
    title: input.title,
    content: input.content,
    type: input.type,
  })
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