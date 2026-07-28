import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EChartsOption } from 'echarts'
import { Page } from '../components/Page'
import { EChart } from '../components/EChart'
import { supabase } from '../lib/supabase'
import {
  fetchCompanies,
  fetchAllPositions,
  fetchPositionsForCompany,
  fetchDuplicatePhones,
  type PositionRow,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { companyShortName } from '../lib/companies'
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
  // Admin-only client-side company filter on the position bar chart.
  // 'all' = every company; otherwise a specific company_id. Company-scoped
  // users always see only their own company and don't get this filter UI.
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  // Track dark mode to refresh charts with new colors.
  const [, setDarkVersion] = useState(0)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const scope = useMemo(() => readScope(), [])
  const scopeCompanyId = scope?.kind === 'company' ? scope.companyId : undefined

  // P8 strict-scope: company group only sees own positions.
  // P4 mobile: still loads all (we don't need to change the data flow).
  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync<PositionRow[]>(
    () => scope?.kind === 'company'
      ? fetchPositionsForCompany(scope.companyId)
      : fetchAllPositions(),
    [scope?.kind === 'company' ? scope.companyId : null],
  )
  // (P9: allPositions + stacked bar removed; positions comes from
  // positionsAsync which is company-scoped when scope=company.)

  const positions = positionsAsync.data ?? []
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

  // When the scope flips to a different company group, reset the admin's
  // client-side company filter so it doesn't dangle on a now-invalid id.
  useEffect(() => {
    setCompanyFilter('all')
  }, [scope?.kind, scopeCompanyId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const obs = new MutationObserver(() => setDarkVersion((v) => v + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // -------------------------------------------------------------------------
  // Aggregations
  // -------------------------------------------------------------------------

  // Filtered rows — rows already respect scope (company group sees own only).
  // Admin additionally applies the `companyFilter` to scope everything below.
  const filteredRows = useMemo(() => {
    if (scope?.kind === 'admin' && companyFilter !== 'all') {
      return rows.filter((r) => r.company_id === companyFilter)
    }
    return rows
  }, [rows, scope?.kind, companyFilter])

  // Positions list also respects the filter — admin picking a company
  // should only see that company's positions on the bar chart.
  const filteredPositions = useMemo(() => {
    if (scope?.kind === 'admin' && companyFilter !== 'all') {
      return positions.filter((p) => p.id.startsWith(`${companyFilter}-`))
    }
    return positions
  }, [positions, scope?.kind, companyFilter])

  // 1. Per-position counts (投递数 / 约面数 / offer 数) for the multi-series
  //    bar chart. For company group: positions = own; for admin: all (or the
  //    filtered subset if a companyFilter is set).
  const positionStats = useMemo(() => {
    // total / scheduled / offered per position
    const total: Record<string, number> = {}
    const scheduled: Record<string, number> = {}
    const offered: Record<string, number> = {}
    for (const p of filteredPositions) { total[p.id] = 0; scheduled[p.id] = 0; offered[p.id] = 0 }
    for (const r of filteredRows) {
      total[r.position_id] = (total[r.position_id] ?? 0) + 1
      if (r.status === 'interview_scheduled') {
        scheduled[r.position_id] = (scheduled[r.position_id] ?? 0) + 1
      }
      if (r.status === 'offered') {
        offered[r.position_id] = (offered[r.position_id] ?? 0) + 1
      }
    }
    return { total, scheduled, offered }
  }, [filteredRows, filteredPositions])

  // Positions grouped by company for the bar chart — labels show `短公司名 · 职位名`
  // so the chart scales well when the number of positions grows.
  const positionsGrouped = useMemo(() => {
    const getCompanyId = (posId: string): string => {
      const idx = posId.indexOf('-')
      return idx > 0 ? posId.slice(0, idx) : 'other'
    }
    const groupMap: Record<string, PositionRow[]> = {}
    for (const p of filteredPositions) {
      const cid = getCompanyId(p.id)
      if (!groupMap[cid]) groupMap[cid] = []
      groupMap[cid].push(p)
    }
    const companyOrder = companies.reduce<Record<string, number>>((m, c, i) => {
      m[c.id] = i
      return m
    }, {})
    const sortedEntries = Object.entries(groupMap).sort(
      ([a], [b]) => (companyOrder[a] ?? 999) - (companyOrder[b] ?? 999),
    )
    const labels: string[] = []
    const total: number[] = []
    const scheduled: number[] = []
    const offered: number[] = []
    for (const [cid, items] of sortedEntries) {
      items.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
      for (const p of items) {
        labels.push(`${companyShortName(cid)} · ${p.title}`)
        total.push(positionStats.total[p.id] ?? 0)
        scheduled.push(positionStats.scheduled[p.id] ?? 0)
        offered.push(positionStats.offered[p.id] ?? 0)
      }
    }
    return { labels, total, scheduled, offered }
  }, [filteredPositions, positionStats, companies])

  // 3. Per-company counts → pie of 公司分布 (admin / default only;
  //    company group always shows 100% self). Admin's companyFilter does
  //    NOT collapse this pie to 100% — it shows only the filtered slice as
  //    a single-company pie so HR can still see "which companies in this
  //    filter have data" (which is just one when filtered).
  const companyCounts = useMemo(() => {
    if (scope?.kind === 'company') {
      const cnt = filteredRows.filter((r) => r.company_id === scope.companyId).length
      return { [scope.companyId]: cnt }
    }
    if (scope?.kind === 'admin' && companyFilter !== 'all') {
      const cnt = filteredRows.filter((r) => r.company_id === companyFilter).length
      return { [companyFilter]: cnt }
    }
    const counts: Record<string, number> = {}
    for (const c of companies) counts[c.id] = 0
    for (const r of filteredRows) {
      if (r.company_id) counts[r.company_id] = (counts[r.company_id] ?? 0) + 1
    }
    return counts
  }, [filteredRows, companies, scope?.kind, scopeCompanyId, companyFilter])

  // 4. Per-degree counts → pie of 学历分布 (scope-scoped; admin can further
  //    narrow via companyFilter).
  const degreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of filteredRows) {
      const d = r.resume?.degree?.trim() ?? '未填'
      counts[d] = (counts[d] ?? 0) + 1
    }
    return counts
  }, [filteredRows])

  // 5. Top-10 majors
  const majorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of filteredRows) {
      const m = r.resume?.major?.trim()
      if (!m) continue
      counts[m] = (counts[m] ?? 0) + 1
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 10)
  }, [filteredRows])

  const colorPalette = isDark
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb7185', '#facc15']
    : ['#2563eb', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#eab308']

  // Chart heights — smaller on mobile (P4). Pies get a bigger band than
  // before so title + donut + legend all fit without overlap.
  const bigHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 240 : 360
  const smallHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 360

  // -------------------------------------------------------------------------
  // ECharts options
  // -------------------------------------------------------------------------
  // Stacked horizontal bar per position: 投递数 / 约面数 / offer 数
  //   stacked into a single bar; each segment shows its value in the middle.
  const positionBarOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '各职位 投递 / 约面 / offer', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: {
      data: ['投递数', '约面数', 'offer 数'],
      bottom: 0,
      textStyle: { color: isDark ? '#cbd5e1' : '#475569' },
    },
    grid: { left: 160, right: 50, top: 30, bottom: 40, containLabel: true },
    xAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { color: isDark ? '#cbd5e1' : '#475569' },
    },
    yAxis: {
      type: 'category' as const,
      data: positionsGrouped.labels,
      axisLabel: { color: isDark ? '#cbd5e1' : '#475569', fontSize: 11 },
      inverse: true,
    },
    series: [
      {
        name: '投递数',
        type: 'bar' as const,
        stack: 'total',
        data: positionsGrouped.total,
        itemStyle: { color: colorPalette[0] },
        label: {
          show: true,
          position: 'inside' as const,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? p.value : ''),
        },
      },
      {
        name: '约面数',
        type: 'bar' as const,
        stack: 'total',
        data: positionsGrouped.scheduled,
        itemStyle: { color: colorPalette[1] },
        label: {
          show: true,
          position: 'inside' as const,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? p.value : ''),
        },
      },
      {
        name: 'offer 数',
        type: 'bar' as const,
        stack: 'total',
        data: positionsGrouped.offered,
        itemStyle: { color: colorPalette[2], borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'inside' as const,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? p.value : ''),
        },
      },
    ],
  }), [positionsGrouped, isDark, colorPalette, companyFilter]) as unknown as EChartsOption

  // (P9: stacked bar chart removed; horizontal bar + 3 pies now)

  // Shared pie layout — title sits at the very top with its own band, the
// donut is centered in the remaining space, legend floats below. Labels
// are shown INSIDE each segment so the name + count are visible without
// hovering. Adjust heights below if more legend rows are expected.
const PIE_TITLE_STYLE = { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 'bold' as const }

const companyPieOption = useMemo(() => {
    const singleCompanyId =
      scope?.kind === 'company'
        ? scope.companyId
        : scope?.kind === 'admin' && companyFilter !== 'all'
          ? companyFilter
          : null
    const data = singleCompanyId
      ? [{ name: companyShortName(singleCompanyId) || singleCompanyId, value: companyCounts[singleCompanyId] ?? 0, itemStyle: { color: colorPalette[0] } }]
      : companies.map((c) => ({
          name: companyShortName(c.id) || c.name,
          value: companyCounts[c.id] ?? 0,
          itemStyle: { color: colorPalette[companies.indexOf(c) % colorPalette.length] },
        }))
    return {
      backgroundColor: 'transparent',
      title: { text: '按公司', left: 'center', top: 4, textStyle: PIE_TITLE_STYLE },
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 4, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569', fontSize: 11 } },
      grid: { top: 36, bottom: 36, left: 8, right: 8 },
      series: [{
        type: 'pie' as const,
        radius: ['35%', '60%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'inside' as const,
          formatter: ((p: any) => `${p.name}\n${p.value}`) as any,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 'bold' as const,
        },
        labelLine: { show: false },
        data,
      }],
    } as unknown as EChartsOption
  }, [companies, companyCounts, isDark, scope?.kind, scopeCompanyId, companyFilter, colorPalette])

  const degreePieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '按学历', left: 'center', top: 4, textStyle: PIE_TITLE_STYLE },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 4, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569', fontSize: 11 } },
    grid: { top: 36, bottom: 36, left: 8, right: 8 },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '60%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'inside' as const,
        formatter: ((p: any) => `${p.name}\n${p.value}`) as any,
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold' as const,
      },
      labelLine: { show: false },
      data: Object.entries(degreeCounts).map(([name, value], i) => ({
        name,
        value,
        itemStyle: { color: colorPalette[i % colorPalette.length] },
      })),
    }],
  }) as unknown as EChartsOption, [degreeCounts, isDark, colorPalette])

  const majorsPieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '专业 Top 10', left: 'center', top: 4, textStyle: PIE_TITLE_STYLE },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 4, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569', fontSize: 11 } },
    grid: { top: 36, bottom: 36, left: 8, right: 8 },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '60%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'inside' as const,
        formatter: ((p: any) => {
          // Inside label only for big-enough slices; small slices fall back
          // to the legend below.
          if (p.percent < 6) return ''
          return `${p.name}\n${p.value}`
        }) as any,
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold' as const,
      },
      labelLine: { show: false },
      data: majorCounts.map(([name, value]) => ({ name, value })),
    }],
  }) as unknown as EChartsOption, [majorCounts, isDark])

  const total = filteredRows.length
  const scheduledCount = filteredRows.filter((r) => r.status === 'interview_scheduled').length
  const offeredCount = filteredRows.filter((r) => r.status === 'offered').length
  const dupePhones = dupePhonesAsync.data ?? []
  const duplicateSubmissionCount = filteredRows.reduce((acc, r) => acc + (r.resume?.phone && dupePhones.includes(r.resume.phone) ? 1 : 0), 0)
  const duplicatePhonesCount = dupePhones.length
  // Company KPI: when admin is filtering to one company, show "1"; otherwise
  // total registered companies.
  const companyCountLabel = scope?.kind === 'company' || companyFilter !== 'all'
    ? '1'
    : companies.length.toString()

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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                各职位投递数 / 约面数 / offer 数（堆叠条形图）
              </div>
              {scope?.kind === 'admin' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">公司筛选：</span>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    <option value="all">全部</option>
                    {(companiesAsync.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{companyShortName(c.id) || c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <EChart option={positionBarOption} height={Math.max(bigHeight, positionsGrouped.labels.length * 36 + 60)} />
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
