// Central registry of all 39 positions across 7 companies.
// Mirrors `positions` table in Supabase (id + title + description).
// Order: company_id alphabetical, then title within company.

import type { Position } from './types'

export const POSITIONS: Position[] = [
  // 宏光纳米 (hongguang_nano) — 2
  { id: 'hongguang_nano-accounting-specialist',  title: '会计专员',     description: '负责日常账务处理与财务核算' },
  { id: 'hongguang_nano-hr-specialist',          title: '人力资源专员', description: '负责招聘、培训、绩效等人力工作' },

  // 昶联金属 (changlian_metal) — 10
  { id: 'changlian_metal-electrical-asst-engineer',         title: '电气助理工程师',     description: '协助电气系统设计、安装与维护' },
  { id: 'changlian_metal-mechanical-design-asst-engineer',  title: '机械设计助理工程师', description: '协助机械结构与零部件设计' },
  { id: 'changlian_metal-pd-asst-engineer',                  title: 'PD助理工程师',     description: '协助产品开发与项目管理' },
  { id: 'changlian_metal-ie-asst-engineer',                  title: 'IE助理工程师',     description: '协助工业工程改善与效率优化' },
  { id: 'changlian_metal-qe-asst-engineer',                  title: 'QE助理工程师',     description: '协助质量体系与质量改善' },
  { id: 'changlian_metal-project-specialist',                title: '项目专员',         description: '项目进度跟踪、协调与文档管理' },
  { id: 'changlian_metal-ops-asst-engineer',                 title: '运维助理工程师',     description: '协助设备运维与现场支持' },
  { id: 'changlian_metal-procurement-specialist',            title: '采购专员',         description: '供应商对接、采购订单与来料跟进' },
  { id: 'changlian_metal-measurement-technician',            title: '测量技术员',         description: '尺寸测量与首件检验' },
  { id: 'changlian_metal-cnc-technician',                    title: 'CNC技术员',         description: 'CNC 机床操作与日常维护' },

  // 中南机诚 (zhongnan_jicheng) — 10
  { id: 'zhongnan_jicheng-mechanical-design-asst-engineer',  title: '机械设计助理工程师', description: '协助机械结构设计' },
  { id: 'zhongnan_jicheng-pd-asst-engineer',                 title: 'PD助理工程师',     description: '产品开发与流程跟进' },
  { id: 'zhongnan_jicheng-ie-asst-engineer',                 title: 'IE助理工程师',     description: '工业工程与现场改善' },
  { id: 'zhongnan_jicheng-qe-asst-engineer',                 title: 'QE助理工程师',     description: '质量检验与体系推行' },
  { id: 'zhongnan_jicheng-project-specialist',               title: '项目专员',         description: '项目协调与进度管理' },
  { id: 'zhongnan_jicheng-ops-asst-engineer',                title: '运维助理工程师',     description: '生产设备运维' },
  { id: 'zhongnan_jicheng-procurement-specialist',           title: '采购专员',         description: '采购执行与供应商管理' },
  { id: 'zhongnan_jicheng-accounting-specialist',            title: '会计专员',         description: '财务日常核算' },
  { id: 'zhongnan_jicheng-hr-specialist',                    title: '人力资源专员',     description: '人力行政事务' },
  { id: 'zhongnan_jicheng-cnc-technician',                   title: 'CNC技术员',         description: 'CNC 机床操作' },

  // 中南智诚 (zhongnan_zhicheng) — 10
  { id: 'zhongnan_zhicheng-electrical-asst-engineer',         title: '电气助理工程师',     description: '电气设计、安装、调试辅助' },
  { id: 'zhongnan_zhicheng-pd-asst-engineer',                 title: 'PD助理工程师',     description: '产品开发协助' },
  { id: 'zhongnan_zhicheng-ie-asst-engineer',                 title: 'IE助理工程师',     description: 'IE 改善与效率提升' },
  { id: 'zhongnan_zhicheng-qe-asst-engineer',                 title: 'QE助理工程师',     description: '质量工程相关' },
  { id: 'zhongnan_zhicheng-project-specialist',               title: '项目专员',         description: '项目协调' },
  { id: 'zhongnan_zhicheng-cnc-engineer',                     title: 'CNC工程师',         description: 'CNC 编程与工艺优化' },
  { id: 'zhongnan_zhicheng-ops-asst-engineer',                title: '运维助理工程师',     description: '设备运维' },
  { id: 'zhongnan_zhicheng-procurement-specialist',           title: '采购专员',         description: '采购日常' },
  { id: 'zhongnan_zhicheng-accounting-specialist',            title: '会计专员',         description: '财务工作' },
  { id: 'zhongnan_zhicheng-measurement-technician',           title: '测量技术员',         description: '尺寸检测' },

  // 英硕激光 (yingshuo_laser) — 2
  { id: 'yingshuo_laser-software-asst-engineer',              title: '软件助理工程师',     description: '嵌入式 / 上位机软件开发' },
  { id: 'yingshuo_laser-optics-asst-engineer',                title: '光学助理工程师',     description: '光学元件与系统设计辅助' },

  // 中南雅园 (zhongnan_yayuan) — 3
  { id: 'zhongnan_yayuan-general-specialist',                 title: '综合专员',         description: '行政综合事务' },
  { id: 'zhongnan_yayuan-investment-specialist',              title: '招商专员',         description: '招商引资与客户对接' },
  { id: 'zhongnan_yayuan-accounting-specialist',             title: '会计专员',         description: '账务与出纳' },

  // 盈天实业 (yingtian_industrial) — 2
  { id: 'yingtian_industrial-electronics-asst-engineer',     title: '电子助理工程师',     description: '电子产品开发与测试辅助' },
  { id: 'yingtian_industrial-accounting-specialist',          title: '会计专员',         description: '财务日常工作' },
]

export const POSITION_MAP: Record<string, Position> = POSITIONS.reduce(
  (acc, p) => {
    acc[p.id] = p
    return acc
  },
  {} as Record<string, Position>
)

export const isPositionId = (s: string | undefined | null): s is string =>
  !!s && !!POSITION_MAP[s]

// Stable color per position id — used to tint cards in UI without forcing
// each position to define a color.
const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-teal-500', 'bg-lime-500', 'bg-amber-500',
]

export function positionColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

// Map Tailwind bg-* color classes to hex for ECharts.
// (ECharts doesn't understand Tailwind class names.)
const TAILWIND_TO_HEX: Record<string, string> = {
  'bg-blue-500':   '#3b82f6',
  'bg-emerald-500':'#10b981',
  'bg-violet-500': '#8b5cf6',
  'bg-orange-500': '#f97316',
  'bg-rose-500':   '#f43f5e',
  'bg-cyan-500':   '#06b6d4',
  'bg-amber-500':  '#f59e0b',
  'bg-pink-500':   '#ec4899',
  'bg-indigo-500': '#6366f1',
  'bg-teal-500':   '#14b8a6',
  'bg-lime-500':   '#84cc16',
}

export function positionHexColor(id: string): string {
  const cls = positionColor(id)
  return TAILWIND_TO_HEX[cls] ?? '#3b82f6'
}