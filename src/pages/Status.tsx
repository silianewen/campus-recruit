import { useState } from 'react'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { companyColor } from '../lib/companies'
import { fetchAllPositions, type PositionRow } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import type { NotificationRow, SubmissionStatus } from '../lib/types'
import { SUBMISSION_STATUS_LABEL } from '../lib/types'
import { extractErrorMessage } from '../lib/errors'

interface SubmissionView {
  id: string
  position_id: string
  company_id: string | null
  status: SubmissionStatus
  created_at: string
  updated_at: string
  resume: {
    student_name: string
    major: string
    university: string
    file_url: string
  } | null
}

interface PersonalityView {
  id: string
  mbti_type: string
  created_at: string
}

interface SkillView {
  id: string
  position_id: string
  score: number
  total: number
  created_at: string
}

export default function Status() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [queried, setQueried] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionView[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [personality, setPersonality] = useState<PersonalityView[]>([])
  const [skills, setSkills] = useState<SkillView[]>([])

  // Load positions + companies on mount so we can map id → title.
  const positionsAsync = useAsync(fetchAllPositions, [])
  const companiesAsync = useAsync<{ id: string; name: string }[]>(
    async () => {
      if (!supabase) return []
      const { data, error } = await supabase.from('companies').select('id, name').order('id')
      if (error) throw error
      return (data ?? []) as { id: string; name: string }[]
    },
    []
  )
  const positionsById: Record<string, PositionRow> = {}
  for (const p of positionsAsync.data ?? []) positionsById[p.id] = p
  const companiesById: Record<string, string> = {}
  for (const c of companiesAsync.data ?? []) companiesById[c.id] = c.name

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!supabase) { setError('Supabase 未配置'); return }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError('请输入 11 位手机号'); return
    }
    const p = phone.trim()
    setLoading(true)
    setQueried(true)
    try {
      const [subs, notifs, pers, sk] = await Promise.all([
        supabase
          .from('submissions')
          .select(`id, position_id, status, created_at, updated_at, company_id,
                   resume:resumes ( student_name, major, university, file_url )`)
          .eq('resumes.phone', p)
          .order('created_at', { ascending: false }),
        supabase
          .from('notifications')
          .select('*')
          .eq('phone', p)
          .order('created_at', { ascending: false }),
        supabase
          .from('personality_results')
          .select('id, mbti_type, created_at')
          .eq('phone', p)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('skill_results')
          .select('id, position_id, score, total, created_at')
          .eq('phone', p)
          .order('created_at', { ascending: false }),
      ])
      for (const r of [subs, notifs, pers, sk]) {
        if (r.error) throw r.error
      }
      setSubmissions(((subs.data ?? []) as any[]).map((d) => ({
        ...d,
        company_id: d.company_id ?? null,
        resume: Array.isArray(d.resume) ? d.resume[0] ?? null : d.resume ?? null,
      })))
      setNotifications((notifs.data ?? []) as NotificationRow[])
      setPersonality((pers.data ?? []) as PersonalityView[])
      setSkills((sk.data ?? []) as SkillView[])
    } catch (err) {
      setError('查询失败：' + extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page title="我的投递状态" subtitle="输入手机号查看投递进度、HR 通知、测评记录。">
      <form onSubmit={handleQuery} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-w-md mx-auto mb-6">
        <input
          type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="11 位手机号"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:bg-slate-700">
          {loading ? '查询中…' : '查询'}
        </button>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}
      </form>

      {queried && !loading && !error && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Section title="📨 HR 通知" empty={notifications.length === 0 ? '暂无通知' : ''}>
            {notifications.map((n) => (
              <div key={n.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 py-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{n.title}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(n.created_at).toLocaleString('zh-CN')}</div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{n.content}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {n.read ? '已读' : '🔔 未读'} · {n.type === 'interview_invite' ? '面试邀请' : n.type === 'test_invite' ? '测评邀请' : '状态更新'}
                </div>
              </div>
            ))}
          </Section>

          <Section title="📄 我的投递" empty={submissions.length === 0 ? '暂无投递记录' : ''}>
            {submissions.map((s) => {
              const companyName = s.company_id ? companiesById[s.company_id] ?? s.company_id : null
              const posTitle = s.position_id ? positionsById[s.position_id]?.title ?? s.position_id : '—'
              return (
              <div key={s.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 py-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {companyName && (
                      <span className="inline-flex items-center mr-2">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.company_id ? companyColor(s.company_id) : ''}`} />
                        {companyName}
                      </span>
                    )}
                    {posTitle}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {SUBMISSION_STATUS_LABEL[s.status]}
                  </span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {s.resume?.major ?? '—'} · {s.resume?.university ?? '—'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  投递时间：{new Date(s.created_at).toLocaleString('zh-CN')}
                </div>
                {s.resume?.file_url && (
                  <a href={s.resume.file_url} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                    查看简历 →
                  </a>
                )}
              </div>
              )
            })}
          </Section>

          <Section title="🧠 性格测评" empty={personality.length === 0 ? '尚未完成性格测评' : ''}>
            {personality.map((p) => (
              <div key={p.id} className="py-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-2">{p.mbti_type}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(p.created_at).toLocaleString('zh-CN')}</span>
              </div>
            ))}
          </Section>

          <Section title="💼 专业能力测试" empty={skills.length === 0 ? '尚未完成专业测试' : ''}>
            {skills.map((k) => (
              <div key={k.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 py-3">
                <div className="flex justify-between">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{positionsById[k.position_id]?.title ?? k.position_id}</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{k.score} / {k.total}</div>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(k.created_at).toLocaleString('zh-CN')}</div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </Page>
  )
}

function Section({ title, empty, children }: { title: string; empty?: string; children: React.ReactNode }) {
  const kids = Array.isArray(children) ? children : [children]
  const isEmpty = kids.length === 0 || (kids.length === 1 && kids[0] === null)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      {isEmpty ? <p className="text-sm text-slate-400 dark:text-slate-500">{empty}</p> : children}
    </div>
  )
}