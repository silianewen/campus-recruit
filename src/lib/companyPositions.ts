// Maps each company to the position IDs it recruits for.
// Mirrors Supabase `company_positions` mapping (not yet a separate table —
// implied by joins on resumes/submissions.company_id).
//
// To edit positions per company: change this file, commit, push. Vercel
// will redeploy. (Long-term: move to a `company_positions` table for no-code
// editing from Supabase dashboard.)

import type { PositionId } from './types'

export const COMPANY_POSITIONS: Record<string, PositionId[]> = {
  hongguang_nano: [
    'hongguang_nano-accounting-specialist',
    'hongguang_nano-hr-specialist',
  ],
  changlian_metal: [
    'changlian_metal-electrical-asst-engineer',
    'changlian_metal-mechanical-design-asst-engineer',
    'changlian_metal-pd-asst-engineer',
    'changlian_metal-ie-asst-engineer',
    'changlian_metal-qe-asst-engineer',
    'changlian_metal-project-specialist',
    'changlian_metal-ops-asst-engineer',
    'changlian_metal-procurement-specialist',
    'changlian_metal-measurement-technician',
    'changlian_metal-cnc-technician',
  ],
  zhongnan_jicheng: [
    'zhongnan_jicheng-mechanical-design-asst-engineer',
    'zhongnan_jicheng-pd-asst-engineer',
    'zhongnan_jicheng-ie-asst-engineer',
    'zhongnan_jicheng-qe-asst-engineer',
    'zhongnan_jicheng-project-specialist',
    'zhongnan_jicheng-ops-asst-engineer',
    'zhongnan_jicheng-procurement-specialist',
    'zhongnan_jicheng-accounting-specialist',
    'zhongnan_jicheng-hr-specialist',
    'zhongnan_jicheng-cnc-technician',
  ],
  zhongnan_zhicheng: [
    'zhongnan_zhicheng-electrical-asst-engineer',
    'zhongnan_zhicheng-pd-asst-engineer',
    'zhongnan_zhicheng-ie-asst-engineer',
    'zhongnan_zhicheng-qe-asst-engineer',
    'zhongnan_zhicheng-project-specialist',
    'zhongnan_zhicheng-cnc-engineer',
    'zhongnan_zhicheng-ops-asst-engineer',
    'zhongnan_zhicheng-procurement-specialist',
    'zhongnan_zhicheng-accounting-specialist',
    'zhongnan_zhicheng-measurement-technician',
  ],
  yingshuo_laser: [
    'yingshuo_laser-software-asst-engineer',
    'yingshuo_laser-optics-asst-engineer',
  ],
  zhongnan_yayuan: [
    'zhongnan_yayuan-general-specialist',
    'zhongnan_yayuan-investment-specialist',
    'zhongnan_yayuan-accounting-specialist',
  ],
  yingtian_industrial: [
    'yingtian_industrial-electronics-asst-engineer',
    'yingtian_industrial-accounting-specialist',
  ],
}

export function positionsForCompany(companyId: string | undefined | null): PositionId[] {
  if (!companyId) return []
  return COMPANY_POSITIONS[companyId] ?? []
}