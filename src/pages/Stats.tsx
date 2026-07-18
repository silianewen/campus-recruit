import { useEffect, useState, useMemo } from 'react'
import { Page } from '../components/Page'
import { EChart } from '../components/EChart'
import { supabase } from '../lib/supabase'
import { POSITIONS, POSITION_MAP } from '../lib/positions'
import { COMPANIES, COMPANY_MAP } from '../lib/companies'

const HR_SESSION_KEY = 'hr_authed'
const HR_PASSWORD = import.meta.env.VITE_HR_PASSWORD as string | undefined

interface Row {
  position_id: keyof typeof POSITION_MAP
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

  const filteredRows = useMemo(
    () => rows.filter((r) => filterCompany === 'all' || r.company_id === filterCompany),
    [rows, filterCompany]
  )

  // Aggregate: submissions per position
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = { frontend: 0, backend: 0, data: 0, product: 0 }
    for (const r of filteredRows) counts[r.position_id] = (counts[r.position_id] ?? 0) + 1
    return counts
  }, [filteredRows])

  // Aggregate: submissions per company per position (for stacked-bar chart)
  const companyPositionCounts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    for (const r of filteredRows) {
      const cid = r.company_id ?? '__none__'
      if (!out[cid]) out[cid] = { frontend: 0, backend: 0, data: 0, product: 0 }
      out[cid][r.position_id] = (out[cid][r.position_id] ?? 0) + 1
    }
    return out
  }, [filteredRows])

  // Aggregate: top 10 majors (always global, not company-filtered)
  const majorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const m = r.resume?.major?.trim()
      if (!m) continue
      counts[m] = (counts[m] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  }, [rows])

  const barOption = useMemo(() => ({
    title: { text: '各岗位投递数', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 30, top: 50, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: POSITIONS.map((p) => p.title),
    },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [{
      type: 'bar' as const,
      data: POSITIONS.map((p) => positionCounts[p.id] ?? 0),
      itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top' as const },
    }],
  }), [positionCounts])

  const pieOption = useMemo(() => ({
    title: { text: '专业分布 (Top 10 · 全局)', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' as const },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: majorCounts.map(([name, value]) => ({ name, value })),
    }],
  }), [majorCounts])

  const stackedOption = useMemo(() => {
    const companiesList = filterCompany === 'all'
      ? Object.keys(companyPositionCounts)
      : [filterCompany]
    return {
      title: { text: '各公司各岗位投递分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: { bottom: 0, type: 'scroll' as const },
      grid: { left: 50, right: 30, top: 50, bottom: 60 },
      xAxis: {
        type: 'category' as const,
        data: companiesList.map((cid) =>
          cid === '__none__' ? '(未分配)' : COMPANY_MAP[cid]?.name ?? cid
        ),
      },
      yAxis: { type: 'value' as const, minInterval: 1 },
      series: POSITIONS.map((p) => ({
        name: p.title,
        type: 'bar' as const,
        stack: 'count',
        data: companiesList.map((cid) => companyPositionCounts[cid]?.[p.id] ?? 0),
        itemStyle: { color: p.color.replace('bg-', '') },
      })),
    }
  }, [companyPositionCounts, filterCompany])

  if (!authed) {
    return (
      <Page title="数据看板登录">
        <form onSubmit={tryLogin} className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm mx-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">招聘官登录</h2>
          {!HR_PASSWORD ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded">
              ⚠️ 未设置 <code className="font-mono">VITE_HR_PASSWORD</code>，请在 <code className="font-mono">.env.local</code> 配置后重启 dev server。
            </div>
          ) : (
            <>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                placeholder="HR 密码"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              {pwdError && <p className="text-red-600 text-sm mb-3">{pwdError}</p>}
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
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          <option value="all">全部公司</option>
          {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-slate-400">（公司筛选影响下方两张图，专业分布始终是全局数据）</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="总投递数" value={filteredRows.length} />
        <Stat label="已约面" value={filteredRows.filter(r => r.status === 'interview_scheduled').length} />
        <Stat label="已 offer" value={filteredRows.filter(r => r.status === 'offered').length} />
        <Stat label="活跃岗位" value={POSITIONS.length} />
      </div>

      {loading && <p className="text-center text-slate-400 py-10">加载中…</p>}

      {!loading && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          暂无投递数据。让人先扫个码试试？
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <EChart option={stackedOption} height={360} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <EChart option={barOption} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
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
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  )
}