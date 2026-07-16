import type { PositionId } from './types'

export const POSITIONS: { id: PositionId; title: string; desc: string; color: string }[] = [
  { id: 'frontend', title: '前端工程师', desc: 'React / Vue / 移动端 H5', color: 'bg-blue-500' },
  { id: 'backend',  title: '后端工程师', desc: 'Java / Go / 数据库与中间件', color: 'bg-emerald-500' },
  { id: 'data',     title: '数据分析师', desc: 'SQL / Python / 业务分析', color: 'bg-violet-500' },
  { id: 'product',  title: '产品经理',   desc: '需求调研 / 推动落地 / 数据驱动', color: 'bg-orange-500' },
]

export const POSITION_MAP: Record<PositionId, { title: string; color: string }> =
  POSITIONS.reduce((acc, p) => {
    acc[p.id] = { title: p.title, color: p.color }
    return acc
  }, {} as Record<PositionId, { title: string; color: string }>)

export const isPositionId = (s: string | undefined): s is PositionId =>
  !!s && POSITIONS.some((p) => p.id === s)