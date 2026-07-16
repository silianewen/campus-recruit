// Shared types — mirror the Supabase schema in supabase/migrations/0001_init.sql.

export type PositionId = 'frontend' | 'backend' | 'data' | 'product'

export interface Position {
  id: PositionId
  title: string
  description: string
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
  position_id: PositionId
  file_url: string
  file_name: string
  file_size: number
  created_at: string
}

export interface Submission {
  id: string
  resume_id: string
  position_id: PositionId
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