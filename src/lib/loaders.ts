// DB-first loaders. All functions return Promises; handle the no-supabase case
// by returning [] (not throwing) so callers can use `<AsyncView isEmpty>` to
// distinguish "no supabase" from "loading" from "empty DB".
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme
// See: openspec/changes/post-mvp-cleanup-and-dark-theme/specs/data-loaders/spec.md

import { supabase } from './supabase'
import type { Company, SkillQuestion } from './types'

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