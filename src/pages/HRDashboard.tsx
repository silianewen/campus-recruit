import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { EChart } from '../components/EChart'
import { supabase } from '../lib/supabase'
import { fetchCompanies, fetchAllPositions, fetchDuplicatePhones } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'

const HR_SESSION_KEY = 'hr_authed'

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

  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync(fetchAllPositions, [])

  const positions = positionsAsync.data ?? []
  const companies = companiesAsync.data ?? []
  const dupePhonesAsync = useAsync(fetchDuplicatePhones, [])

  useEffect(() => {
    if (sessionStorage.getItem(HR_SESSION_KEY) !== 'true') {
      navigate('/hr', { replace: true })
      return
    }
    if (!supabase) return
    setLoading(true)
    void (async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('position_id, status, company_id, resume:resumes ( phone, major, university, degree )')
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
  }, [navigate])

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
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of positions) counts[p.id] = 0
    for (const r of rows) counts[r.position_id] = (counts[r.position_id] ?? 0) + 1
    return counts
  }, [rows, positions])

  // 2. Per-company × per-position → stacked bar
  const companyPositionCounts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    for (const c of companies) {
      out[c.id] = {}
      for (const p of positions) out[c.id][p.id] = 0
    }
    for (const r of rows) {
      const cid = r.company_id
      if (!cid || !out[cid]) continue
      out[cid][r.position_id] = (out[cid][r.position_id] ?? 0) + 1
    }
    return out
  }, [rows, companies, positions])

  // 3. Per-company counts → pie of 公司分布
  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) counts[c.id] = 0
    for (const r of rows) {
      if (r.company_id) counts[r.company_id] = (counts[r.company_id] ?? 0) + 1
    }
    return counts
  }, [rows, companies])

  // 4. Per-degree counts → pie of 学历分布
  const degreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const d = r.resume?.degree?.trim() ?? '未填'
      counts[d] = (counts[d] ?? 0) + 1
    }
    return counts
  }, [rows])

  // Top-10 majors (used in 1 chart)
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

  const stackedOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '各公司各职位投递分布', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
    grid: { left: 50, right: 30, top: 50, bottom: 70 },
    xAxis: {
      type: 'category' as const,
      data: companies.map((c) => c.name),
      axisLabel: { color: isDark ? '#cbd5e1' : '#475569', rotate: 20, fontSize: 10, interval: 0 },
    },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: positions.map((p, i) => ({
      name: p.title,
      type: 'bar' as const,
      stack: 'count',
      data: companies.map((c) => companyPositionCounts[c.id]?.[p.id] ?? 0),
      itemStyle: { color: colorPalette[i % colorPalette.length] },
    })),
  }), [companyPositionCounts, companies, positions, isDark])

  const companyPieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '按公司', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: companies.map((c) => ({
        name: c.name,
        value: companyCounts[c.id] ?? 0,
        itemStyle: { color: colorPalette[companies.indexOf(c) % colorPalette.length] },
      })),
    }],
  }), [companies, companyCounts, isDark])

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
  // Count of submissions whose underlying resume phone has 2+ entries.
  const dupePhones = dupePhonesAsync.data ?? []
  const duplicateSubmissionCount = rows.reduce((acc, r) => acc + (r.resume?.phone && dupePhones.includes(r.resume.phone) ? 1 : 0), 0)
  const duplicatePhonesCount = dupePhones.length

  return (
    <Page title="数据看板">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="总投递数" value={total} />
        <Stat label="已约面" value={scheduledCount} />
        <Stat label="已 offer" value={offeredCount} />
        <Stat label="公司" value={companies.length} />
      </div>

      {/* Duplicate-submission KPI strip (when there are dupes) */}
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
            <EChart option={positionBarOption} height={360} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <EChart option={stackedOption} height={360} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={companyPieOption} height={360} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={degreePieOption} height={360} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={majorsPieOption} height={360} />
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
    </div>
  )
}