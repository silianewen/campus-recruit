import { useState, useEffect, useMemo } from 'react'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { POSITIONS, POSITION_MAP } from '../lib/positions'
import type { SubmissionStatus } from '../lib/types'
import { SUBMISSION_STATUS_LABEL } from '../lib/types'

const HR_SESSION_KEY = 'hr_authed'
// HR password is sourced exclusively from VITE_HR_PASSWORD.
// Set it in .env.local (gitignored) for dev, and in Vercel project env for prod.
// If unset, the login form is disabled — no fallback password in source.
const HR_PASSWORD = import.meta.env.VITE_HR_PASSWORD as string | undefined

interface SubmissionRow {
  id: string
  status: SubmissionStatus
  channel: string
  notes: string | null
  created_at: string
  updated_at: string
  resume_id: string
  position_id: keyof typeof POSITION_MAP
  resume: {
    id: string
    student_name: string
    phone: string
    major: string
    university: string
    file_url: string
    file_name: string
  } | null
}

export default function Dashboard() {
  const [authed, setAuthed] = useState<boolean>(() => sessionStorage.getItem(HR_SESSION_KEY) === 'true')
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)

  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filterPos, setFilterPos] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Notification modal
  const [notifTarget, setNotifTarget] = useState<SubmissionRow | null>(null)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifContent, setNotifContent] = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifResult, setNotifResult] = useState<string | null>(null)

  const tryLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!HR_PASSWORD) {
      setPwdError('系统未配置 HR 密码，请联系管理员')
      return
    }
    if (pwd === HR_PASSWORD) {
      sessionStorage.setItem(HR_SESSION_KEY, 'true')
      setAuthed(true)
      setPwdError(null)
    } else {
      setPwdError('密码错误')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(HR_SESSION_KEY)
    setAuthed(false)
    setRows([])
  }

  const fetchRows = async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id, status, channel, notes, created_at, updated_at, resume_id, position_id,
        resume:resumes ( id, student_name, phone, major, university, file_url, file_name )
      `)
      .order('created_at', { ascending: false })
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      alert('加载失败：' + error.message)
    } else {
      // Cast to our typed shape; Supabase returns resume as object or array depending on version
      const normalized = (data ?? []).map((d) => ({
        ...d,
        resume: Array.isArray(d.resume) ? d.resume[0] ?? null : d.resume ?? null,
      })) as SubmissionRow[]
      setRows(normalized)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authed) void fetchRows()
  }, [authed])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
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
  }, [rows, filterPos, filterStatus, search])

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    if (!supabase) return
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id)
    if (error) { alert('更新失败：' + error.message); return }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const openNotifModal = (row: SubmissionRow) => {
    setNotifTarget(row)
    setNotifTitle('面试通知')
    setNotifContent(`同学你好，你投递的 ${POSITION_MAP[row.position_id]?.title ?? row.position_id} 岗位已进入面试环节，请回复本消息确认可面试时间。`)
    setNotifResult(null)
  }

  const sendNotif = async () => {
    if (!supabase || !notifTarget || !notifTarget.resume) return
    setNotifSending(true)
    setNotifResult(null)
    const { error } = await supabase.from('notifications').insert({
      phone: notifTarget.resume.phone,
      title: notifTitle.trim(),
      content: notifContent.trim(),
      type: 'interview_invite',
    })
    setNotifSending(false)
    if (error) { setNotifResult('发送失败：' + error.message); return }
    setNotifResult('已发送 ✅')
    // Auto-mark status as interview_scheduled
    await updateStatus(notifTarget.id, 'interview_scheduled')
  }

  // --- Render: password gate ---
  if (!authed) {
    return (
      <Page title="HR 后台登录">
        <form onSubmit={tryLogin} className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm mx-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">招聘官登录</h2>
          {!HR_PASSWORD ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded mb-4">
              ⚠️ 未设置 <code className="font-mono">VITE_HR_PASSWORD</code>。<br />
              请在 <code className="font-mono">.env.local</code> 中添加：
              <pre className="bg-amber-100 px-2 py-1 mt-1 rounded">VITE_HR_PASSWORD=你的密码</pre>
              然后重启 <code className="font-mono">npm run dev</code>。
            </div>
          ) : (
            <>
              <input
                type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                placeholder="HR 密码"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {pwdError && <p className="text-red-600 text-sm mb-3">{pwdError}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                进入
              </button>
            </>
          )}
        </form>
      </Page>
    )
  }

  // --- Render: dashboard ---
  return (
    <Page title="HR 招聘官后台">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          <option value="all">全部岗位</option>
          {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          <option value="all">全部状态</option>
          {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
            <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
          )}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名 / 手机 / 专业"
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm flex-1 min-w-40" />
        <button onClick={() => void fetchRows()} disabled={loading}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
          {loading ? '加载中…' : '刷新'}
        </button>
        <span className="text-sm text-slate-500">共 {filtered.length} 条</span>
        <button onClick={logout} className="ml-auto text-sm text-slate-500 hover:text-red-600">退出登录</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-3 py-2">姓名</th>
              <th className="px-3 py-2">手机</th>
              <th className="px-3 py-2">岗位</th>
              <th className="px-3 py-2">专业</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">投递时间</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                {loading ? '加载中…' : '暂无数据'}
              </td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{r.resume?.student_name ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.resume?.phone ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${POSITION_MAP[r.position_id]?.color ?? 'bg-slate-300'}`} />
                  {POSITION_MAP[r.position_id]?.title ?? r.position_id}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.resume?.major ?? '—'}</td>
                <td className="px-3 py-2">
                  <select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as SubmissionStatus)}
                    className="px-2 py-0.5 border border-slate-200 rounded text-xs bg-white">
                    {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) =>
                      <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                    )}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                <td className="px-3 py-2 space-x-2">
                  {r.resume?.file_url && (
                    <a href={r.resume.file_url} target="_blank" rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs">简历</a>
                  )}
                  <button onClick={() => openNotifModal(r)} className="text-blue-600 hover:underline text-xs">
                    通知
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notification modal */}
      {notifTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-1">发送面试通知</h3>
            <p className="text-sm text-slate-500 mb-4">
              收件人：{notifTarget.resume?.student_name}（{notifTarget.resume?.phone}）
            </p>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3" />
            <label className="block text-sm font-medium mb-1">内容</label>
            <textarea value={notifContent} onChange={(e) => setNotifContent(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3" />
            {notifResult && (
              <p className={`text-sm mb-3 ${notifResult.startsWith('已发送') ? 'text-green-600' : 'text-red-600'}`}>
                {notifResult}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setNotifTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={() => void sendNotif()} disabled={notifSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400">
                {notifSending ? '发送中…' : '发送并标记为"已约面"'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}