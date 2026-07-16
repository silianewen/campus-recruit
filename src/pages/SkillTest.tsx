import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { POSITIONS, isPositionId } from '../lib/positions'
import { SKILL_QUESTIONS } from '../lib/questions-skill'
import type { PositionId, SkillQuestion } from '../lib/types'

export default function SkillTest() {
  const { positionId: positionParam } = useParams()
  const initial = isPositionId(positionParam) ? positionParam : null
  const navigate = useNavigate()

  const [step, setStep] = useState<'select' | 'phone' | 'quiz' | 'done'>('select')
  const [position, setPosition] = useState<PositionId | null>(initial)
  const [phone, setPhone] = useState('')
  const [questions, setQuestions] = useState<SkillQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // When position changes, load questions (from local seed for now; could swap to Supabase fetch).
  useEffect(() => {
    if (position) {
      setQuestions(SKILL_QUESTIONS.filter((q) => q.position_id === position))
    }
  }, [position])

  const choosePosition = (id: PositionId) => {
    setPosition(id)
    setStep('phone')
  }

  const startQuiz = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { setError('请输入 11 位手机号'); return }
    setStep('quiz')
  }

  const choose = (qid: string, key: string) => {
    setAnswers((a) => ({ ...a, [qid]: key }))
  }
  const next = () => { if (idx < questions.length - 1) setIdx(idx + 1) }
  const prev = () => { if (idx > 0) setIdx(idx - 1) }

  const submit = async () => {
    if (!supabase || !position) return
    const correct = questions.reduce((s, q) => s + (answers[q.id] === q.answer ? 1 : 0), 0)
    setScore(correct)
    setSubmitting(true)
    setError(null)
    try {
      const { error: insErr } = await supabase.from('skill_results').insert({
        phone: phone.trim(),
        position_id: position,
        score: correct,
        total: questions.length,
        answers,
      })
      if (insErr) throw insErr
      setStep('done')
    } catch (err) {
      setError('提交失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  // Step: select position
  if (step === 'select') {
    return (
      <Page title="专业能力测试" subtitle="选一个岗位开始 5 题作答。">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {POSITIONS.map((p) => (
            <button key={p.id} onClick={() => choosePosition(p.id)}
              className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition">
              <div className={`w-2 h-2 rounded-full ${p.color} mb-2`} />
              <div className="font-semibold text-slate-900">{p.title}</div>
              <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
              <div className="text-xs text-blue-600 mt-2">开始测试 →</div>
            </button>
          ))}
        </div>
      </Page>
    )
  }

  // Step: phone gate
  if (step === 'phone') {
    return (
      <Page title="专业能力测试" subtitle={`岗位：${POSITIONS.find(p => p.id === position)?.title}`}>
        <form onSubmit={startQuiz} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto">
          <p className="text-sm text-slate-600 mb-4">输入手机号关联你的测试结果（HR 后台可查看）。</p>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="11 位手机号"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            开始答题
          </button>
          <button type="button" onClick={() => { setStep('select'); setPosition(null) }}
            className="w-full mt-2 text-sm text-slate-500 hover:text-slate-700">
            ← 换个岗位
          </button>
        </form>
      </Page>
    )
  }

  // Step: done
  if (step === 'done') {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <Page title="测试结果">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md mx-auto text-center">
          <div className="text-sm text-slate-500 mb-1">{POSITIONS.find(p => p.id === position)?.title}</div>
          <div className="text-6xl font-bold text-blue-600 mb-2">{score} / {questions.length}</div>
          <div className="text-slate-600 mb-1">正确率 {pct}%</div>
          <p className="text-sm text-emerald-600 mb-4">✅ 已保存到 HR 后台</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => navigate('/status')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
              查看我的全部状态
            </button>
            <button onClick={() => { setStep('select'); setPosition(null); setPhone(''); setAnswers({}); setIdx(0) }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              再测一次
            </button>
          </div>
        </div>
      </Page>
    )
  }

  // Step: quiz
  const q = questions[idx]
  const answered = Object.keys(answers).length
  return (
    <Page title="专业能力测试" subtitle={`${POSITIONS.find(p => p.id === position)?.title} · 第 ${idx + 1} / ${questions.length} 题`}>
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto">
        <div className="h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <h2 className="text-lg font-medium text-slate-900 mb-5">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <label key={opt.key}
              className={`block border rounded-lg p-3 cursor-pointer transition
                ${answers[q.id] === opt.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name={`q${q.id}`}
                className="mr-2"
                checked={answers[q.id] === opt.key}
                onChange={() => choose(q.id, opt.key)} />
              <span className="text-sm text-slate-700"><span className="font-mono mr-2 text-slate-400">{opt.key}.</span>{opt.text}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={idx === 0}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30">
            ← 上一题
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={next} disabled={!answers[q.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300">
              下一题 →
            </button>
          ) : (
            <button onClick={() => void submit()} disabled={answered < questions.length || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300">
              {submitting ? '提交中…' : '提交'}
            </button>
          )}
        </div>
      </div>
    </Page>
  )
}