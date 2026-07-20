import { useEffect, useState, useMemo } from 'react'
import { Page } from '../components/Page'
import { EChart } from '../components/EChart'
import { supabase } from '../lib/supabase'
import { fetchCompanies, fetchAllPositions, type PositionRow } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'

const HR_SESSION_KEY = 'hr_authed'
const HR_PASSWORD = import.meta.env.VITE_HR_PASSWORD as string | undefined

interface Row {
  position_id: string
  status: string
  company_id: string | null
  resume: { major: string } | null
}

export default function Stats() {
  const [authed, setAuthed] = useState<boolean>(() => sessionStorage.getItem(HR_SESSION_KEY) === 'true')
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [filterCompany, setFilterCompany] = useState<string>('all')

  // Dark mode: ECharts uses its own theme — switch by class on <html>.
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const tryLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!HR_PASSWORD) { setPwdError('系统未配置 HR 密码'); return }
    if (pwd === HR_PASSWORD) {
      sessionStorage.setItem(HR_SESSION_KEY, 'true')
      setAuthed(true)
      setPwdError(null)
    } else {
      setPwdError('密码错误')
    }
  }

  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync(fetchAllPositions, [])

  useEffect(() => {
    if (!authed || !supabase) return
    setLoading(true)
    void (async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('position_id, status, company_id, resume:resumes ( major )')
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
  }, [authed])

  // Track dark mode changes — re-render charts when theme flips.
  const [, setDarkVersion] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const obs = new MutationObserver(() => setDarkVersion((v) => v + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const filteredRows = useMemo(
    () => rows.filter((r) => filterCompany === 'all' || r.company_id === filterCompany),
    [rows, filterCompany]
  )

  const positions = positionsAsync.data ?? []
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of positions) counts[p.id] = 0
    for (const r of filteredRows) counts[r.position_id] = (counts[r.position_id] ?? 0) + 1
    return counts
  }, [filteredRows, positions])

  const companyPositionCounts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    for (const r of filteredRows) {
      const cid = r.company_id ?? '__none__'
      if (!out[cid]) {
        out[cid] = {}
        for (const p of positions) out[cid][p.id] = 0
      }
      out[cid][r.position_id] = (out[cid][r.position_id] ?? 0) + 1
    }
    return out
  }, [filteredRows, positions])

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
    ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb7185']
    : ['#2563eb', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  const barOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '各岗位投递数', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 30, top: 50, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: positions.map((p: PositionRow) => p.title),
      axisLabel: { color: isDark ? '#cbd5e1' : '#475569', rotate: 30 },
    },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'bar' as const,
      data: positions.map((p: PositionRow) => positionCounts[p.id] ?? 0),
      itemStyle: { color: colorPalette[0], borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top' as const, color: isDark ? '#f1f5f9' : '#0f172a' },
    }],
  }), [positionCounts, positions, isDark])

  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    title: { text: '专业分布 (Top 10 · 全局)', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: majorCounts.map(([name, value]) => ({ name, value })),
    }],
  }), [majorCounts, isDark])

  const stackedOption = useMemo(() => {
    const companiesList = filterCompany === 'all'
      ? Object.keys(companyPositionCounts)
      : [filterCompany]
    return {
      backgroundColor: 'transparent',
      title: { text: '各公司各岗位投递分布', left: 'center', textStyle: { fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' } },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: { bottom: 0, type: 'scroll' as const, textStyle: { color: isDark ? '#cbd5e1' : '#475569' } },
      grid: { left: 50, right: 30, top: 50, bottom: 60 },
      xAxis: {
        type: 'category' as const,
        data: companiesList.map((cid) =>
          cid === '__none__' ? '(未分配)' : (companiesAsync.data?.find(c => c.id === cid)?.name ?? cid)
        ),
        axisLabel: { color: isDark ? '#cbd5e1' : '#475569' },
      },
      yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: isDark ? '#cbd5e1' : '#475569' } },
      series: positions.map((p: PositionRow, i: number) => ({
        name: p.title,
        type: 'bar' as const,
        stack: 'count',
        data: companiesList.map((cid) => companyPositionCounts[cid]?.[p.id] ?? 0),
        itemStyle: { color: colorPalette[i % colorPalette.length] },
      })),
    }
  }, [companyPositionCounts, filterCompany, positions, isDark, companiesAsync.data])

  if (!authed) {
    return (
      <Page title="数据看板登录">
        <form onSubmit={tryLogin} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm mx-auto">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">招聘官登录</h2>
          {!HR_PASSWORD ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs px-3 py-2 rounded">
              ⚠️ 未设置 <code className="font-mono">VITE_HR_PASSWORD</code>，请在 <code className="font-mono">.env.local</code> 配置后重启 dev server。
            </div>
          ) : (
            <>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                placeholder="HR 密码"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              {pwdError && <p className="text-red-600 dark:text-red-400 text-sm mb-3">{pwdError}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">进入</button>
            </>
          )}
        </form>
      </Page>
    )
  }

  return (
    <Page title="数据看板">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">全部公司</option>
          {(companiesAsync.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-slate-400 dark:text-slate-500">（公司筛选影响下方两张图，专业分布始终是全局数据）</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="总投递数" value={filteredRows.length} />
        <Stat label="已约面" value={filteredRows.filter(r => r.status === 'interview_scheduled').length} />
        <Stat label="已 offer" value={filteredRows.filter(r => r.status === 'offered').length} />
        <Stat label="活跃岗位" value={positions.length} />
      </div>

      {loading && <p className="text-center text-slate-400 dark:text-slate-500 py-10">加载中…</p>}

      {!loading && rows.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
          暂无投递数据。让人先扫个码试试？
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <EChart option={stackedOption} height={360} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={barOption} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EChart option={pieOption} height={400} />
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