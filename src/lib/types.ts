// Shared types — mirror the Supabase schema in supabase/migrations/.

// PositionId is now a free-form string (position IDs are slugified as
// `{companyId}-{english-title-slug}`, e.g. `hongguang_nano-accounting-specialist`).
// We type it as `string` since the registry is the source of truth.
export type PositionId = string

export interface Position {
  id: PositionId
  title: string
  description: string
  // Optional UI metadata — set by positionRegistry's helpers if absent.
  color?: string
  // Drives the right-side category filter on the student page.
  // Supabase column `positions.category` (added in 0007).
  category?: string | null
  // Optional soft deadline (Supabase column `positions.closes_at`, added in 0010).
  // Past this timestamp, the student upload form shows "已截止" instead of
  // the form. NOT auto-enforced by a backend job — a follow-up Edge Function
  // would actually flip `is_active` to false past the deadline.
  closes_at?: string | null
}

// CompanyId is set by user-provided data in src/lib/companies.ts.
// We type it as `string` for now so the registry stays the source of truth.
export type CompanyId = string

export interface Company {
  id: CompanyId
  name: string
  description?: string
  logo_url?: string
}

export type SubmissionStatus =
  | 'submitted'
  | 'reviewed'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offered'
  | 'rejected'

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  submitted: '已投递',
  reviewed: '已查看',
  interview_scheduled: '已约面',
  interviewed: '已面试',
  offered: '已发 offer',
  rejected: '已拒绝',
}

export interface Resume {
  id: string
  student_name: string
  phone: string
  email: string | null
  major: string
  university: string
  // Optional 学历 (degree level).  Supabase column `resumes.degree` (added in 0007).
  degree?: string | null
  position_id: PositionId
  company_id: string | null
  file_url: string
  file_name: string
  file_size: number
  created_at: string
}

export interface Submission {
  id: string
  resume_id: string
  position_id: PositionId
  company_id: string | null
  channel: string
  status: SubmissionStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface NotificationRow {
  id: string
  phone: string
  title: string
  content: string
  type: 'interview_invite' | 'status_update' | 'test_invite'
  read: boolean
  created_at: string
}

export interface HrGroup {
  id: string
  name: string
  company_id: string | null
  created_at: string
}

export interface HrUser {
  id: string
  username: string
  display_name: string | null
  group_id: string
  created_at: string
}

/**
 * Effective access scope for the current HR session.
 *
 *   group_admin             → see everything, edit everything
 *   company_<companyId>     → see only submissions for that company; on
 *                              duplicate rows, also see cross-company context
 *                              (which other companies/positions the phone
 *                              applied to)
 *   default                 → read-only across all companies (pending
 *                              detailed permission assignment)
 */
export type HrScope =
  | { kind: 'admin' }
  | { kind: 'company'; companyId: string; companyName: string }
  | { kind: 'default' }

export interface PersonalityResult {
  id: string
  phone: string
  scores: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number }
  mbti_type: string
  created_at: string
}

export interface SkillResult {
  id: string
  phone: string
  position_id: PositionId
  score: number
  total: number
  answers: Record<string, string>
  created_at: string
}

export interface SkillQuestion {
  id: string
  position_id: PositionId
  question: string
  options: { key: string; text: string }[]
  answer: string
}