import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { POSITION_MAP, isPositionId } from '../lib/positions'
import { COMPANY_MAP, isCompanyId } from '../lib/companies'
import type { SkillQuestion } from '../lib/types'
import { extractErrorMessage } from '../lib/errors'

interface RemoteQuestion {
  id: string
  position_id: string
  question: string
  options: { key: string; text: string }[]
  answer: string
}

export default function SkillTest() {
  const [searchParams] = useSearchParams()
  const companyParam = searchParams.get('company')
  const positionParam = searchParams.get('position')

  const companyId = companyParam && isCompanyId(companyParam) ? companyParam : null
  const positionId = positionParam && isPositionId(positionParam) ? positionParam : null

  const [phone, setPhone] = useState('')
  const [questions, setQuestions] = useState<RemoteQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = questions.length
  const answered = Object.keys(answers).length
  const allDone = answered === total
  const current = questions[idx]

  const pos = positionId ? POSITION_MAP[positionId] : null
  const company = companyId ? COMPANY_MAP[companyId] : null

  // Load questions from Supabase when position is set (and student has clicked 开始答题).
  useEffect(() => {
    if (!positionId || !supabase) return
    if (started) return // only load once after start
    setLoading(true)
    void (async () => {
      const { data, error: qErr } = await supabase
        .from('questions_skill')
        .select('id, position_id, question, options, answer')
        .eq('position_id', positionId)
      if (qErr) { setError('题库加载失败：' + qErr.message); setLoading(false); return }
      const normalized = ((data ?? []) as any[]).map((d) => ({
        id: d.id, position_id: d.position_id, question: d.question,
        answer: d.answer,
        options: (d.options as { key: string; text: string }[]),
      }))
      setQuestions(normalized)
      setLoading(false)
    })()
  }, [positionId, started, supabase])

  const startQuiz = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { setError('请输入 11 位手机号'); return }
    setStarted(true)
  }

  const choose = (qid: string, key: string) => {
    setAnswers((a) => ({ ...a, [qid]: key }))
  }
  const next = () => { if (idx < total - 1) setIdx(idx + 1) }
  const prev = () => { if (idx > 0) setIdx(idx - 1) }

  const submit = async () => {
    if (!supabase || !positionId) return
    const correct = questions.reduce((s, q) => s + (answers[q.id] === q.answer ? 1 : 0), 0)
    setScore(correct)
    setSubmitting(true)
    setError(null)
    try {
      const { error: insErr } = await supabase.from('skill_results').insert({
        phone: phone.trim(),
        position_id: positionId,
        company_id: companyId,
        score: correct,
        total: questions.length,
        answers,
      })
      if (insErr) throw insErr
      setStarted(false)
      setIdx(0)
      setAnswers({})
    } catch (err) {
      setError('提交失败：' + extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Missing context: prompt to go via Home or Success page
  if (!companyId || !positionId) {
    return (
      <Page title="专业能力测试">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md mx-auto text-center text-slate-600">
          <p className="mb-2">缺少公司或岗位信息。</p>
          <p className="text-sm text-slate-500 mb-4">请通过首页选择公司+岗位，或从投递成功页进入。</p>
          <Link to="/" className="text-blue-600 hover:underline">← 返回首页</Link>
        </div>
      </Page>
    )
  }

  const subtitle = `${company?.name ?? companyId} · ${pos?.title ?? positionId}`

  // Step: results page (after submit)
  if (started === false && score > 0) {
    const pct = Math.round((score / total) * 100)
    return (
      <Page title="测试结果" subtitle={subtitle}>
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md mx-auto text-center">
          <div className="text-6xl font-bold text-blue-600 mb-2">{score} / {total}</div>
          <div className="text-slate-600 mb-1">正确率 {pct}%</div>
          <p className="text-sm text-emerald-600 mb-4">✅ 已保存到 HR 后台</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link to="/status" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
              查看我的全部状态
            </Link>
            <Link to="/personality" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              做性格测评
            </Link>
          </div>
        </div>
      </Page>
    )
  }

  // Step: phone gate (before starting)
  if (!started) {
    return (
      <Page title="专业能力测试" subtitle={subtitle}>
        <form onSubmit={startQuiz} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto">
          {loading && <p className="text-sm text-slate-500 text-center">题库加载中…</p>}
          {!loading && total === 0 && !error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded mb-3">
              该岗位题库暂未准备，请联系 HR。
            </div>
          )}
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <p className="text-sm text-slate-600 mb-4">输入手机号关联你的测试结果（HR 后台可查看）。</p>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="11 位手机号"
            disabled={loading || total === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
          />
          <button type="submit" disabled={loading || total === 0}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400">
            开始答题
          </button>
          <Link to="/" className="block w-full mt-2 text-sm text-slate-500 hover:text-slate-700 text-center">
            ← 返回首页
          </Link>
        </form>
      </Page>
    )
  }

  // Step: quiz
  if (!current) {
    return (
      <Page title="专业能力测试" subtitle={subtitle}>
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto text-center text-slate-500">
          题库为空。
        </div>
      </Page>
    )
  }

  return (
    <Page title="专业能力测试" subtitle={`${subtitle} · 第 ${idx + 1} / ${total} 题`}>
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto">
        <div className="h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <h2 className="text-lg font-medium text-slate-900 mb-5">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt) => (
            <label key={opt.key}
              className={`block border rounded-lg p-3 cursor-pointer transition
                ${answers[current.id] === opt.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name={`q${current.id}`}
                className="mr-2"
                checked={answers[current.id] === opt.key}
                onChange={() => choose(current.id, opt.key)} />
              <span className="text-sm text-slate-700">
                <span className="font-mono mr-2 text-slate-400">{opt.key}.</span>{opt.text}
              </span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={idx === 0}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30">
            ← 上一题
          </button>
          {idx < total - 1 ? (
            <button onClick={next} disabled={!answers[current.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300">
              下一题 →
            </button>
          ) : (
            <button onClick={() => void submit()} disabled={!allDone || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300">
              {submitting ? '提交中…' : '提交'}
            </button>
          )}
        </div>
      </div>
    </Page>
  )
}

// Compatibility: keep the type exported for older imports
export type { SkillQuestion }