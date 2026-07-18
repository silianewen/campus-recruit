// 7 companies recruiting in this校招 campaign.
// Source of truth: Supabase `companies` table; this file must stay in sync
// (or be replaced by a DB fetch in a future iteration).

import type { Company } from './types'

export const COMPANIES: Company[] = [
  { id: 'hongguang_nano',     name: '宏光纳米科技（深圳）有限公司',     description: '纳米科技' },
  { id: 'changlian_metal',    name: '昶联金属材料应用制品（广州）有限公司', description: '金属材料制品' },
  { id: 'zhongnan_jicheng',   name: '中南机诚精密制品（深圳）有限公司',   description: '精密制造' },
  { id: 'zhongnan_zhicheng',  name: '中南智诚科技（东莞）有限公司',       description: '科技制造' },
  { id: 'yingshuo_laser',     name: '英硕激光科技（珠海）有限公司',       description: '激光科技' },
  { id: 'zhongnan_yayuan',    name: '中南雅园产业管理（深圳）有限公司',   description: '产业园区管理' },
  { id: 'yingtian_industrial',name: '盈天实业（深圳）有限公司',           description: '电子实业' },
]

export const COMPANY_MAP: Record<string, Company> = COMPANIES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<string, Company>
)

export const isCompanyId = (s: string | undefined | null): s is string =>
  !!s && !!COMPANY_MAP[s]

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
]

export function companyColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}