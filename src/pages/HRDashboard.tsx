import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { EChart } from '../components/EChart'
import { supabase } from '../lib/supabase'
import {
  fetchCompanies,
  fetchAllPositions,
  fetchPositionsForCompany,
  fetchDuplicatePhones,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import type { HrScope, HrGroup } from '../lib/types'

const HR_AUTH_KEY = 'hr_auth'

function readScope(): HrScope | null {
  try {
    const raw = sessionStorage.getItem(HR_AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { group: HrGroup | null }
    if (!parsed.group) return { kind: 'default' }
    if (parsed.group.id === 'group_admin') return { kind: 'admin' }
    if (parsed.group.id.startsWith('company_') && parsed.group.company_id) {
      return { kind: 'company', companyId: parsed.group.company_id, companyName: parsed.group.name }
    }
    return { kind: 'default' }
  } catch {
    return null
  }
}

interface Row {
  position_id: string
  company_id: string | null
  status: string
  resume: {
    phone: string
    major: string
    university: string
    degree: string | null
  } | null
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  // Track dark mode to refresh charts with new colors.
  const [, setDarkVersion] = useState(0)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const scope = useMemo(() => readScope(), [])
  const scopeCompanyId = scope?.kind === 'company' ? scope.companyId : undefined

  // P8 strict-scope: company group only sees own positions.
  // P4 mobile: still loads all (we don't need to change the data flow).
  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync(
    () => scope?.kind === 'company'
      ? fetchPositionsForCompany(scope.companyId)
      : fetchAllPositions(),
    [scope?.kind === 'company' ? scope.companyId : null],
  )
  // For admin / default, ALSO fetch other companies' positions for the
  // stacked-bar chart x-axis. (For company group, we already have only its
  // own positions.)
  const allPositionsAsync = useAsync(
    () => scope?.kind === 'company' ? Promise.resolve([]) : fetchAllPositions(),
    [scope?.kind],
  )

  const positions = positionsAsync.data ?? []
  const allPositions = allPositionsAsync.data ?? []
  const companies = companiesAsync.data ?? []
  // P8: company-scoped duplicate count. Admin / default see the full set;
  // company group sees only phones duplicated within its own company.
  const dupePhonesAsync = useAsync(
    () => fetchDuplicatePhones(scopeCompanyId),
    [scopeCompanyId],
  )

  useEffect(() => {
    if (!scope) {
      navigate('/hr', { replace: true })
      return
    }
    if (!supabase) return
    setLoading(true)
    void (async () => {
      let query = supabase
        .from('submissions')
        .select('position_id, status, company_id, resume:resumes ( phone, major, university, degree )')
      if (scope.kind === 'company') query = query.eq('company_id', scope.companyId)
      const { data, error } = await query
      if (error) { alert('加载失败：' + error.message); setLoading(false); return }
      const normalized = ((data ?? []) as any[]).map((d) => ({
        position_id: d.position_id,
        status: d.status,
        company_id: d.company_id,
        resume: Array.isArray(d.resume) ? d.resume[0] ?? null : d.resume ?? null,
      })) as Row[]
      setRows(normalized)
      setLoading(false)
    })()
  }, [navigate, scope])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const obs = new MutationObserver(() => setDarkVersion((v) => v + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // -------------------------------------------------------------------------
  // Aggregations
  // -------------------------------------------------------------------------

  // 1. Per-position counts → 投递数 by position
  //    For company group: positions = own; for admin: positions = all.
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of positions) counts[p.id] = 0
    for (const r of rows) counts[r.position_id] = (counts[r.position_id] ?? 0) + 1
    return counts
  }, [rows, positions])

  // 2. Per-company × per-position → stacked bar (admin / default only;
  //    company group only sees own segment so we collapse to one slice).
  const companyPositionCounts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    if (scope?.kind === 'company') {
      // Company group: only the user's own segment, just own positions.
      out[scope.companyId] = {}
      for (const p of positions) out[scope.companyId][p.id] = 0
      for (const r of rows) {
        if (r.company_id === scope.companyId) {
          out[scope.companyId][r.position_id] = (out[scope.companyId][r.position_id] ?? 0) + 1
        }
      }
      return out
    }
    for (const c of companies) {
      out[c.id] = {}
      for (const p of allPositions) out[c.id][p.id] = 0
    }
    for (const r of rows) {
      const cid = r.company_id
      if (!cid || !out[cid]) continue
      out[cid][r.position_id] = (out[cid][r.position_id] ?? 0) + 1
    }
    return out
  }, [rows, companies, allPositions, positions, scope?.kind, scopeCompanyId])

  // 3. Per-company counts → pie of 公司分布 (admin / default only;
  //    company group always shows 100% self)
  const companyCounts = useMemo(() => {
    if (scope?.kind === 'company') {
      const cnt = rows.filter((r) => r.company_id === scope.companyId).length
      return { [scope.companyId]: cnt }
    }
    const counts: Record<string, number> = {}
    for (const c of companies) counts[c.id] = 0
    for (const r of rows) {
      if (r.company_id) counts[r.company_id] = (counts[r.company_id] ?? 0) + 1
    }
    return counts
  }, [rows, companies, scope?.kind, scopeCompanyId])

  // 4. Per-degree counts → pie of 学历分布 (always scope-scoped; rows
  //    are already filtered to the user's company when scope=company)
  const degreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const d = r.resume?.degree?.trim() ?? '未填'
      counts[d] = (counts[d] ?? 0) + 1
    }
    return counts
  }, [rows])

  // 5. Top-10 majors
  const majorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const m = r.resume?.major?.trim()
      if (!m) continue
      counts[m] = (counts[m] ?? 0) + 1
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10)
  }, [rows])

  const colorPalette = isDark
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb7185', '#facc15']
    : ['#2563eb', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#eab308']

  // Chart heights — smaller on mobile (P4).
  const bigHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 240 : 360
  const smallHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 300

  // -------------------------------------------------------------------------
  // ECharts options
  // -------------------------------------------------------------------------
  const positionBarOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '各职位投递数', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 30, top: 50, bottom: 80 },
    xAxis: {
      type: 'category' as const,
      data: positions.map((p) => p.title),
      axisLabel: { color: isDark ? '#cbd5e1' : '#475569', rotate: 30, interval: 0, fontSize: 10 },
    },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'bar' as const,
      data: positions.map((p) => positionCounts[p.id] ?? 0),
      itemStyle: { color: colorPalette[0], borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top' as const, color: isDark ? '#f1f5f9' : '#0f172a' },
    }],
  }), [positionCounts, positions, isDark])

  const stackedOption = useMemo(() => {
    const companiesList = scope?.kind === 'company'
      ? [scope.companyId]
      : companies.map((c) => c.id)
    const positionsForStack = scope?.kind === 'company' ? positions : allPositions
    return {
      backgroundColor: 'transparent',
      title: { text: '各公司各职位投递分布', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
      grid: { left: 50, right: 30, top: 50, bottom: 70 },
      xAxis: {
        type: 'category' as const,
        data: companiesList.map((cid) =>
          cid === scopeCompanyId
            ? (companies.find((c) => c.id === cid)?.name ?? cid)
            : (companies.find((c) => c.id === cid)?.name ?? cid)
        ),
        axisLabel: { color: isDark ? '#cbd5e1' : '#475569', rotate: 20, fontSize: 10, interval: 0 },
      },
      yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: isDark ? '#cbd5e1' : '#475569' } },
      series: positionsForStack.map((p, i) => ({
        name: p.title,
        type: 'bar' as const,
        stack: 'count',
        data: companiesList.map((cid) => companyPositionCounts[cid]?.[p.id] ?? 0),
        itemStyle: { color: colorPalette[i % colorPalette.length] },
      })),
    }
  }, [companyPositionCounts, companies, positions, allPositions, isDark, scope?.kind, scopeCompanyId])

  const companyPieOption = useMemo(() => {
    const data = scope?.kind === 'company'
      ? [{ name: companies.find((c) => c.id === scope.companyId)?.name ?? scope.companyId, value: companyCounts[scope.companyId] ?? 0, itemStyle: { color: colorPalette[0] } }]
      : companies.map((c) => ({
          name: c.name,
          value: companyCounts[c.id] ?? 0,
          itemStyle: { color: colorPalette[companies.indexOf(c) % colorPalette.length] },
        }))
    return {
      backgroundColor: 'transparent',
      title: { text: '按公司', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
      series: [{
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data,
      }],
    }
  }, [companies, companyCounts, isDark, scope?.kind, scopeCompanyId])

  const degreePieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '按学历', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: Object.entries(degreeCounts).map(([name, value], i) => ({
        name,
        value,
        itemStyle: { color: colorPalette[i % colorPalette.length] },
      })),
    }],
  }), [degreeCounts, isDark])

  const majorsPieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '专业 Top 10', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: majorCounts.map(([name, value]) => ({ name, value })),
    }],
  }), [majorCounts, isDark])

  const total = rows.length
  const scheduledCount = rows.filter((r) => r.status === 'interview_scheduled').length
  const offeredCount = rows.filter((r) => r.status === 'offered').length
  const dupePhones = dupePhonesAsync.data ?? []
  const duplicateSubmissionCount = rows.reduce((acc, r) => acc + (r.resume?.phone && dupePhones.includes(r.resume.phone) ? 1 : 0), 0)
  const duplicatePhonesCount = dupePhones.length
  const companyCountLabel = scope?.kind === 'company' ? '1' : companies.length.toString()

  return (
    <Page title="数据看板">
      {/* Top stats — P4: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="总投递数" value={total} />
        <Stat label="已约面" value={scheduledCount} />
        <Stat label="已 offer" value={offeredCount} />
        <Stat label="公司" value={companyCountLabel} />
      </div>

      {/* Duplicate-submission KPI strip (P8: scope-scoped) */}
      {dupePhones.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="font-semibold text-orange-700 dark:text-orange-300">⚠ 重复投递</div>
          <div className="text-orange-800 dark:text-orange-200">
            涉及 <strong>{duplicatePhonesCount}</strong> 个手机号 / 共 <strong>{duplicateSubmissionCount}</strong> 条记录
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-400">
            （HR 后台 &gt; 投递简历列表 &gt; "只看重复投递"筛选）
          </div>
        </div>
      )}

      {loading && <p className="text-center text-slate-400 dark:text-slate-500 py-10">加载中…</p>}

      {!loading && total === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
          暂无投递数据。让人先扫个码试试？
        </div>
      )}

      {!loading && total > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <EChart option={positionBarOption} height={bigHeight} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <EChart option={stackedOption} height={bigHeight} />
          </div>
          {/* P4: 1 col on mobile, 3 on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={companyPieOption} height={smallHeight} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={degreePieOption} height={smallHeight} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={majorsPieOption} height={smallHeight} />
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
    </div>
  )
}
