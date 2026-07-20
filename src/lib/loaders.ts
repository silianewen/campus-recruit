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
    .select('id, title, description')
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
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description')
    .like('id', `${companyId}-%`)
    .order('title', { ascending: true })
  if (error) throw error
  return (data ?? []) as PositionRow[]
}

export async function fetchPosition(positionId: string): Promise<PositionRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('positions')
    .select('id, title, description')
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