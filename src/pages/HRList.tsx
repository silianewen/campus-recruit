import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import {
  fetchAllPositions,
  fetchCompanies,
  fetchDuplicatePhones,
  fetchCrossCompanyContext,
  insertNotification,
  type PositionRow,
  type CrossCompanyRow,
  type NotificationInsert,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { companyColor, companyShortName } from '../lib/companies'
import { rowsToCsv, downloadCsv } from '../lib/csv'
import type { HrScope, SubmissionStatus, HrGroup } from '../lib/types'
import { SUBMISSION_STATUS_LABEL } from '../lib/types'

const HR_AUTH_KEY = 'hr_auth'
const CSV_ROW_CAP = 1000

interface AuthRecord {
  user: { id: string; group_id: string }
  group: HrGroup | null
}

function readAuth(): (AuthRecord & { scope: HrScope }) | null {
  try {
    const raw = sessionStorage.getItem(HR_AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthRecord
    const scope: HrScope = !parsed.group
      ? { kind: 'default' }
      : parsed.group.id === 'group_admin'
      ? { kind: 'admin' }
      : parsed.group.id.startsWith('company_') && parsed.group.company_id
      ? { kind: 'company', companyId: parsed.group.company_id, companyName: parsed.group.name }
      : { kind: 'default' }
    return { ...parsed, scope }
  } catch {
    return null
  }
}

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
  const [filterDuplicate, setFilterDuplicate] = useState<'all' | 'only'>('all')
  const [search, setSearch] = useState('')

  const [mbtiByPhone, setMbtiByPhone] = useState<Record<string, string>>({})
  const [skillByPhonePos, setSkillByPhonePos] = useState<Record<string, { score: number; total: number }>>({})
  // Cross-company context for repeated phones (visible only to admins + the
  // originating company group; default-group also gets it).
  const [crossCtx, setCrossCtx] = useState<Record<string, CrossCompanyRow[]>>({})

  // P1: send-notification modal state
  const [notifTarget, setNotifTarget] = useState<SubmissionRow | null>(null)
  const [notifTitle, setNotifTitle] = useState('面试通知')
  const [notifContent, setNotifContent] = useState(
    '同学你好，你投递的岗位已进入面试环节，请回复本消息确认可面试时间。',
  )
  const [notifType, setNotifType] = useState<NotificationInsert['type']>('interview_invite')
  const [notifSending, setNotifSending] = useState(false)
  const [notifResult, setNotifResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // P5: per-row "下载" success flash
  const [downloadFlash, setDownloadFlash] = useState<Record<string, boolean>>({})

  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync(fetchAllPositions, [])
  const dupePhonesAsync = useAsync(fetchDuplicatePhones, [])

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

  const auth = readAuth()
  const scope = auth?.scope ?? null
  const isReadOnly = scope?.kind === 'default'
  const canSend = scope?.kind === 'admin' || scope?.kind === 'company'

  // P7: bulk selection + download + bulk status update
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const toggleRow = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [bulkStatusApplying, setBulkStatusApplying] = useState(false)
  const applyBulkStatus = async (status: SubmissionStatus) => {
    if (!supabase) return
    if (isReadOnly) {
      alert('默认分组只有只读权限，无法批量改状态')
      setShowStatusMenu(false)
      return
    }
    setBulkStatusApplying(true)
    setShowStatusMenu(false)
    try {
      const ids = Array.from(selectedIds)
      // Use in() to apply to all selected at once
      const { error } = await supabase
        .from('submissions')
        .update({ status })
        .in('id', ids)
      if (error) { alert('批量修改失败：' + error.message); return }
      // Update local state so the UI reflects new statuses without refetch.
      setRows((prev) => prev.map((r) => selectedIds.has(r.id) ? { ...r, status } : r))
      setSelectedIds(new Set())
    } finally {
      setBulkStatusApplying(false)
    }
  }

  const fetchRows = async () => {
    if (!supabase) return
    setLoading(true)
    if (!auth) return
    const companyFilter = auth.scope.kind === 'company' ? auth.scope.companyId : null

    let query = supabase
      .from('submissions')
      .select(`
        id, status, channel, notes, created_at, updated_at, resume_id, position_id, company_id,
        resume:resumes ( id, student_name, phone, major, university, degree, file_url, file_name )
      `)
      .order('created_at', { ascending: false })
    if (companyFilter) query = query.eq('company_id', companyFilter)

    const [{ data, error }, persRes, skillRes] = await Promise.all([
      query,
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

    const dupes = (normalized ?? []).filter((r) => r.resume?.phone)
    const uniqPhones = Array.from(new Set(dupes.map((r) => r.resume!.phone)))
    const ctxMap: Record<string, CrossCompanyRow[]> = {}
    await Promise.all(uniqPhones.map(async (phone) => {
      const exclude = auth.scope.kind === 'company' ? auth.scope.companyId : null
      const rows = await fetchCrossCompanyContext(phone, exclude)
      if (rows.length > 0) ctxMap[phone] = rows
    }))
    setCrossCtx(ctxMap)
    setLoading(false)
  }

  useEffect(() => {
    if (!auth) {
      navigate('/hr', { replace: true })
      return
    }
    void fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const dupeSet = new Set(dupePhonesAsync.data ?? [])
    return rows.filter((r) => {
      if (filterCompany !== 'all' && r.company_id !== filterCompany) return false
      if (filterPos !== 'all' && r.position_id !== filterPos) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (filterDuplicate === 'only' && !(r.resume?.phone && dupeSet.has(r.resume.phone))) return false
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
  }, [rows, filterCompany, filterPos, filterStatus, filterDuplicate, search, dupePhonesAsync.data])

  // P7: selection helpers — depend on `filtered` above
  const filteredIds = useMemo(() => filtered.map((r) => r.id), [filtered])
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const selectedCount = filteredIds.filter((id) => selectedIds.has(id)).length
  const toggleAll = () => {
    setSelectedIds((s) => {
      if (allFilteredSelected) {
        const next = new Set(s)
        for (const id of filteredIds) next.delete(id)
        return next
      }
      const next = new Set(s)
      for (const id of filteredIds) next.add(id)
      return next
    })
  }
  const bulkDownload = () => {
    const targets = filtered.filter(
      (r) => selectedIds.has(r.id) && r.resume?.file_url,
    )
    if (targets.length === 0) return
    targets.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = r.resume!.file_url!
        a.download = r.resume!.file_name
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }, 200 * i)
    })
  }

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    if (!supabase) return
    if (isReadOnly) {
      alert('默认分组只有只读权限，无法改状态')
      return
    }
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id)
    if (error) { alert('更新失败：' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  // P1: send notification
  const openNotifModal = (r: SubmissionRow) => {
    if (!r.resume?.phone) return
    setNotifTarget(r)
    setNotifTitle('面试通知')
    const companyName = r.company_id ? companyNameById[r.company_id] ?? r.company_id : ''
    const posName = positionsById[r.position_id]?.title ?? r.position_id
    setNotifContent(
      `同学你好，你投递的 ${companyName ? companyName + ' · ' : ''}${posName} 岗位已进入面试环节，请回复本消息确认可面试时间。`,
    )
    setNotifType('interview_invite')
    setNotifResult(null)
  }
  const closeNotifModal = () => {
    setNotifTarget(null)
    setNotifResult(null)
  }
  const sendNotif = async () => {
    if (!notifTarget?.resume?.phone || !supabase) return
    setNotifSending(true)
    setNotifResult(null)
    try {
      await insertNotification({
        phone: notifTarget.resume.phone,
        title: notifTitle.trim() || '面试通知',
        content: notifContent.trim(),
        type: notifType,
      })
      setNotifResult({ ok: true, msg: '已发送 ✅' })
      // Auto-flip status to 已约面 when sending an interview_invite
      if (notifType === 'interview_invite' && notifTarget.status !== 'interview_scheduled') {
        await supabase
          .from('submissions')
          .update({ status: 'interview_scheduled' })
          .eq('id', notifTarget.id)
        setRows((prev) => prev.map((r) => (r.id === notifTarget.id ? { ...r, status: 'interview_scheduled' } : r)))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setNotifResult({ ok: false, msg: '发送失败：' + msg })
    } finally {
      setNotifSending(false)
    }
  }

  // P3: CSV export
  const exportCsv = () => {
    if (filtered.length > CSV_ROW_CAP) {
      alert(`筛选结果过大（${filtered.length} 条，上限 ${CSV_ROW_CAP}），请缩小范围`)
      return
    }
    const headers = [
      '姓名', '手机', '标记重复', '应聘公司', '职位', '学校 (学历)', '专业',
      '性格 (MBTI)', '专业测试', '状态', '投递时间', '其它投递', '简历 URL',
    ]
    const body = filtered.map((r) => {
      const phone = r.resume?.phone ?? ''
      const isDup = !!phone && (dupePhonesAsync.data ?? []).includes(phone)
      const otherApps = (crossCtx[phone] ?? [])
        .map((x) => `${companyShortName(x.company_id) || x.company_name}-${x.position_title}`)
        .join('; ')
      return [
        r.resume?.student_name ?? '',
        phone,
        isDup ? '是' : '否',
        r.company_id ? (companyNameById[r.company_id] ?? r.company_id) : '',
        positionsById[r.position_id]?.title ?? r.position_id,
        r.resume
          ? `${r.resume.university ?? ''}${r.resume.degree ? ` (${r.resume.degree})` : ''}`
          : '',
        r.resume?.major ?? '',
        phone ? (mbtiByPhone[phone] ?? '') : '',
        phone ? (skillByPhonePos[`${phone}|${r.position_id}`]
          ? `${skillByPhonePos[`${phone}|${r.position_id}`].score}/${skillByPhonePos[`${phone}|${r.position_id}`].total}`
          : '') : '',
        SUBMISSION_STATUS_LABEL[r.status] ?? r.status,
        new Date(r.created_at).toLocaleString('zh-CN'),
        otherApps,
        r.resume?.file_url ?? '',
      ]
    })
    const csv = rowsToCsv(headers, body)
    const dateStr = new Date().toISOString().slice(0, 10)
    const parts: string[] = ['投递简历', dateStr]
    if (filterCompany !== 'all') parts.push(filterCompany)
    if (filterPos !== 'all') parts.push(filterPos)
    if (filterStatus !== 'all') parts.push(filterStatus)
    if (filterDuplicate === 'only') parts.push('重复')
    const filename = parts.join('_') + '.csv'
    downloadCsv(filename, csv)
  }

  // P5: resume download
  const handleDownload = (r: SubmissionRow) => {
    if (!r.resume?.file_url) return
    setDownloadFlash((m) => ({ ...m, [r.id]: true }))
    setTimeout(() => setDownloadFlash((m) => { const { [r.id]: _, ...rest } = m; return rest }), 1500)
  }

  // Filter chips for the mobile card list
  const renderCardList = () => (
    <div className="sm:hidden space-y-3">
      {filtered.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-400 dark:text-slate-500">
          {loading ? '加载中…' : '暂无数据'}
        </div>
      )}
      {filtered.map((r, idx) => {
        const phone = r.resume?.phone ?? ''
        const isDup = !!phone && (dupePhonesAsync.data ?? []).includes(phone)
        const checked = selectedIds.has(r.id)
        return (
          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono w-6 text-right flex-shrink-0">{idx + 1}.</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRow(r.id)}
                  className="w-4 h-4 flex-shrink-0"
                />
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{r.resume?.student_name ?? '—'}</div>
                {isDup && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex-shrink-0">
                    重复投递
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1 ml-8">{phone}</div>
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 ml-8">
              {r.company_id && (
                <span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${companyColor(r.company_id)}`} />
                  {companyShortName(r.company_id) || companyNameById[r.company_id] || r.company_id}
                </span>
              )}{' '}
              · {positionsById[r.position_id]?.title ?? r.position_id}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 ml-8">
              {r.resume?.university ?? '—'}{r.resume?.degree && ` (${r.resume.degree})`}
            </div>
            <div className="flex items-center justify-between ml-8">
              <select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as SubmissionStatus)}
                className="px-2 py-0.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-xs">
                {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
                  <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                )}
              </select>
              <div className="flex gap-3 text-xs">
                {r.resume?.file_url && (
                  <a href={r.resume.file_url} target="_blank" rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline">查看</a>
                )}
                {r.resume?.file_url && (
                  <a href={r.resume.file_url} download={r.resume.file_name}
                    onClick={() => handleDownload(r)}
                    className="text-blue-600 dark:text-blue-400 hover:underline">
                    {downloadFlash[r.id] ? '已下载 ✓' : '下载'}
                  </a>
                )}
                {canSend && r.resume?.phone && (
                  <button onClick={() => openNotifModal(r)} className="text-blue-600 dark:text-blue-400 hover:underline">
                    通知
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Desktop table
  const renderTable = () => (
    <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-left sticky top-0 z-20">
          <tr>
            <th className="px-3 py-2 whitespace-nowrap w-10 text-center sticky left-0 z-10 bg-slate-50 dark:bg-slate-900/50">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAll}
                aria-label="全选当前筛选结果"
                className="w-4 h-4"
              />
            </th>
            <th className="px-3 py-2 whitespace-nowrap w-10 sticky left-10 z-10 bg-slate-50 dark:bg-slate-900/50">#</th>
            <th className="px-3 py-2 whitespace-nowrap min-w-[6rem] sticky left-[5rem] z-10 bg-slate-50 dark:bg-slate-900/50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">姓名</th>
            <th className="px-3 py-2 whitespace-nowrap min-w-[7rem] sticky left-[11rem] z-10 bg-slate-50 dark:bg-slate-900/50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">手机</th>
            <th className="px-3 py-2 whitespace-nowrap">标记</th>
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
            <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">
              {loading ? '加载中…' : '暂无数据'}
            </td></tr>
          )}
          {filtered.map((r, idx) => {
            const phone = r.resume?.phone ?? ''
            const isDuplicate = !!phone && (dupePhonesAsync.data ?? []).includes(phone)
            const mbti = phone ? mbtiByPhone[phone] : undefined
            const skill = phone ? skillByPhonePos[`${phone}|${r.position_id}`] : undefined
            const checked = selectedIds.has(r.id)
            return (
              <tr key={r.id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${checked ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}>
                <td className="px-3 py-2 text-center sticky left-0 z-[5] bg-white dark:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRow(r.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 font-mono text-center w-10 sticky left-10 z-[5] bg-white dark:bg-slate-800">
                  {idx + 1}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap min-w-[6rem] sticky left-[5rem] z-[5] bg-white dark:bg-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  {r.resume?.student_name ?? '—'}
                </td>
                <td className={`px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-100 whitespace-nowrap min-w-[7rem] sticky left-[11rem] z-[5] ${checked ? 'bg-blue-50/40 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>
                  {r.resume?.phone ?? '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {isDuplicate && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                      重复投递
                    </span>
                  )}
                  {isDuplicate && phone && crossCtx[phone] && crossCtx[phone].length > 0 && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="block">其它投递：</span>
                      {crossCtx[phone].map((x) => (
                        <span key={x.position_id} className="block">
                          · {companyShortName(x.company_id) || x.company_name} — {x.position_title}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {r.company_id ? (
                    <span>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${companyColor(r.company_id)}`} />
                      {companyShortName(r.company_id) || companyNameById[r.company_id] || r.company_id}
                    </span>
                  ) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                </td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100 whitespace-nowrap">{positionsById[r.position_id]?.title ?? r.position_id}</td>
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
                <td className="px-3 py-2 whitespace-nowrap space-x-2">
                  {r.resume?.file_url && (
                    <a href={r.resume.file_url} target="_blank" rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs">查看</a>
                  )}
                  {r.resume?.file_url && (
                    <a href={r.resume.file_url} download={r.resume.file_name}
                      onClick={() => handleDownload(r)}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                      {downloadFlash[r.id] ? '已下载 ✓' : '下载'}
                    </a>
                  )}
                  {canSend && r.resume?.phone && (
                    <button onClick={() => openNotifModal(r)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                      通知
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <Page title="投递简历列表">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {scope?.kind !== 'company' && (
          <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
            <option value="all">应聘公司（全部）</option>
            {(companiesAsync.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {scope?.kind === 'company' && (
          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            🏢 仅看 {scope.companyName}
          </span>
        )}
        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">职位（全部）</option>
          {(positionsAsync.data ?? [])
            .filter((p) => scope?.kind !== 'company' || p.id.startsWith(`${scope.companyId}-`))
            .map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">状态（全部）</option>
          {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
            <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
          )}
        </select>
        <select value={filterDuplicate} onChange={(e) => setFilterDuplicate(e.target.value as 'all' | 'only')}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="all">重复投递（全部）</option>
          <option value="only">只看重复投递</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名/手机/专业"
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm flex-1 min-w-40" />
        <button onClick={() => void fetchRows()} disabled={loading}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm">
          {loading ? '加载中…' : '刷新'}
        </button>
        <button onClick={exportCsv}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm">
          导出 CSV
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">共 {filtered.length} 条</span>
      </div>

      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm px-3 py-2 rounded-lg mb-3">
          ⚠ 默认分组：当前为只读模式，无法修改状态或发送通知
        </div>
      )}

      {/* P7 selection bar (bulk download + bulk status update) */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 text-sm relative">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAll}
              className="w-4 h-4"
            />
            <span className="font-medium text-slate-800 dark:text-slate-200">全选当前筛选结果</span>
          </label>
          <span className="text-slate-500 dark:text-slate-400">
            已选 <strong className="text-slate-700 dark:text-slate-300">{selectedCount}</strong> / {filteredIds.length} 条
          </span>
          <span className="flex-1" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu((v) => !v)}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              批量修改状态
            </button>
            {showStatusMenu && selectedCount > 0 && (
              <div className="absolute top-full mt-1 right-0 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-40">
                {(['submitted','reviewed','interview_scheduled','interviewed','offered','rejected'] as SubmissionStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void applyBulkStatus(s)}
                    disabled={bulkStatusApplying}
                    className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {SUBMISSION_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={bulkDownload}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            批量下载 ({selectedCount})
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              清除选择
            </button>
          )}
        </div>
      )}

      {renderCardList()}
      {renderTable()}

      {/* Send notification modal (P1) */}
      {notifTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">发送通知</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              收件人：{notifTarget.resume?.student_name}（{notifTarget.resume?.phone}）
            </p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">标题</label>
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3" />
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">类型</label>
            <select value={notifType} onChange={(e) => setNotifType(e.target.value as NotificationInsert['type'])}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3">
              <option value="interview_invite">面试邀请</option>
              <option value="test_invite">测评邀请</option>
              <option value="status_update">状态更新</option>
            </select>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">内容</label>
            <textarea value={notifContent} onChange={(e) => setNotifContent(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3" />
            {notifResult && (
              <p className={`text-sm mb-3 ${notifResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {notifResult.msg}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={closeNotifModal}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">取消</button>
              <button onClick={() => void sendNotif()} disabled={notifSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700">
                {notifSending ? '发送中…' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}
