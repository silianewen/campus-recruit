import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { fetchAllPositions, fetchCompanies, type PositionRow } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { companyColor } from '../lib/companies'
import type { SubmissionStatus } from '../lib/types'
import { SUBMISSION_STATUS_LABEL } from '../lib/types'

const HR_SESSION_KEY = 'hr_authed'

interface SubmissionRow {
  id: string
  status: SubmissionStatus
  channel: string
  notes: string | null
  created_at: string
  updated_at: string
  resume_id: string
  position_id: string
  company_id: string | null
  resume: {
    id: string
    student_name: string
    phone: string
    major: string
    university: string
    degree: string | null
    file_url: string
    file_name: string
  } | null
}

export default function HRList() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filterPos, setFilterPos] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [mbtiByPhone, setMbtiByPhone] = useState<Record<string, string>>({})
  const [skillByPhonePos, setSkillByPhonePos] = useState<Record<string, { score: number; total: number }>>({})

  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync(fetchAllPositions, [])

  const positionsById = useMemo<Record<string, PositionRow>>(() => {
    const m: Record<string, PositionRow> = {}
    for (const p of positionsAsync.data ?? []) m[p.id] = p
    return m
  }, [positionsAsync.data])
  const companyNameById = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = c.name
    return m
  }, [companiesAsync.data])

  const fetchRows = async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data, error }, persRes, skillRes] = await Promise.all([
      supabase
        .from('submissions')
        .select(`
          id, status, channel, notes, created_at, updated_at, resume_id, position_id, company_id,
          resume:resumes ( id, student_name, phone, major, university, degree, file_url, file_name )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('personality_results')
        .select('phone, mbti_type, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('skill_results')
        .select('phone, position_id, score, total, created_at')
        .order('created_at', { ascending: false }),
    ])
    if (error) { alert('加载失败：' + error.message); setLoading(false); return }
    const normalized = (data ?? []).map((d) => ({
      ...d,
      resume: Array.isArray(d.resume) ? d.resume[0] ?? null : d.resume ?? null,
    })) as SubmissionRow[]
    setRows(normalized)
    if (!persRes.error && persRes.data) {
      const m: Record<string, string> = {}
      for (const r of persRes.data as { phone: string; mbti_type: string; created_at: string }[]) {
        if (!m[r.phone]) m[r.phone] = r.mbti_type
      }
      setMbtiByPhone(m)
    }
    if (!skillRes.error && skillRes.data) {
      const s: Record<string, { score: number; total: number }> = {}
      for (const r of skillRes.data as { phone: string; position_id: string; score: number; total: number; created_at: string }[]) {
        const key = `${r.phone}|${r.position_id}`
        if (!s[key]) s[key] = { score: r.score, total: r.total }
      }
      setSkillByPhonePos(s)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (sessionStorage.getItem(HR_SESSION_KEY) !== 'true') {
      navigate('/hr', { replace: true })
      return
    }
    void fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterCompany !== 'all' && r.company_id !== filterCompany) return false
      if (filterPos !== 'all' && r.position_id !== filterPos) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        const hit =
          r.resume?.student_name.toLowerCase().includes(q) ||
          r.resume?.phone.includes(q) ||
          r.resume?.major.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [rows, filterCompany, filterPos, filterStatus, search])

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    if (!supabase) return
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id)
    if (error) { alert('更新失败：' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  return (
    <Page
      title="投递简历列表"
      toolbar={
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => navigate('/hr')} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            ← 返回后台
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">应聘公司（全部）</option>
          {(companiesAsync.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">职位（全部）</option>
          {(positionsAsync.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">状态（全部）</option>
          {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
            <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
          )}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名/手机/专业"
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm flex-1 min-w-40" />
        <button onClick={() => void fetchRows()} disabled={loading}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm">
          {loading ? '加载中…' : '刷新'}
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">共 {filtered.length} 条</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">姓名</th>
              <th className="px-3 py-2 whitespace-nowrap">手机</th>
              <th className="px-3 py-2 whitespace-nowrap">应聘公司</th>
              <th className="px-3 py-2 whitespace-nowrap">职位</th>
              <th className="px-3 py-2 whitespace-nowrap">学校</th>
              <th className="px-3 py-2 whitespace-nowrap">专业</th>
              <th className="px-3 py-2 whitespace-nowrap">性格（MBTI）</th>
              <th className="px-3 py-2 whitespace-nowrap">专业测试结果</th>
              <th className="px-3 py-2 whitespace-nowrap">状态</th>
              <th className="px-3 py-2 whitespace-nowrap">投递时间</th>
              <th className="px-3 py-2 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">
                {loading ? '加载中…' : '暂无数据'}
              </td></tr>
            )}
            {filtered.map((r) => {
              const phone = r.resume?.phone ?? ''
              const mbti = phone ? mbtiByPhone[phone] : undefined
              const skill = phone ? skillByPhonePos[`${phone}|${r.position_id}`] : undefined
              return (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{r.resume?.student_name ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.resume?.phone ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.company_id ? (
                      <span>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${companyColor(r.company_id)}`} />
                        {companyNameById[r.company_id] ?? r.company_id}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{positionsById[r.position_id]?.title ?? r.position_id}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.resume?.university ?? '—'}
                    {r.resume?.degree && (
                      <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">({r.resume.degree})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.resume?.major ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {mbti ? (
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{mbti}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {skill ? (
                      <span className="font-mono text-slate-900 dark:text-slate-100">{skill.score}/{skill.total}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as SubmissionStatus)}
                      className="px-2 py-0.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-xs">
                      {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
                        <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                      )}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.resume?.file_url && (
                      <a href={r.resume.file_url} target="_blank" rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                        简历
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Page>
  )
}