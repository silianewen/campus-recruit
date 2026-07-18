// Central registry of companies recruiting in this校招.
//
// ⚠️ USER MUST FILL THIS IN.
// The 7 companies come from the user. Once the user provides the list,
// replace the empty array with the actual entries.
//
// Example shape (one company per line):
//   { id: 'alibaba', name: '阿里巴巴集团', description: '电商 / 云 / AI',  logo_url: undefined },
//   { id: 'tencent', name: '腾讯',         description: '社交 / 游戏 / 云', logo_url: undefined },
//
// The `id` is the slug used in URLs (?company=alibaba) and the FK in DB.
// It should be lowercase, alphanumeric, no spaces.

import type { Company } from './types'

// TODO: replace with the real 7 companies once the user provides them.
export const COMPANIES: Company[] = [
  // Example entry — keep commented until the user provides the list:
  // { id: 'example', name: '示例公司', description: '临时占位' },
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

// Stable color per company id — used to tint cards in UI without forcing
// the company list to define colors.
const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-amber-500',
]

export function companyColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}