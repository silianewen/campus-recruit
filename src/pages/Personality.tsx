import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { MBTI_QUESTIONS, scoreMbti, MBTI_DESCRIPTIONS } from '../lib/questions-mbti'

export default function Personality() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = MBTI_QUESTIONS.length
  const current = MBTI_QUESTIONS[step]
  const answered = Object.keys(answers).length
  const allDone = answered === total

  const result = useMemo(() => {
    if (!allDone) return null
    return scoreMbti(answers)
  }, [allDone, answers])

  const start = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError('请输入 11 位手机号')
      return
    }
    setStarted(true)
  }

  const choose = (qid: number, key: string) => {
    setAnswers((a) => ({ ...a, [qid]: key }))
  }

  const next = () => {
    if (step < total - 1) setStep(step + 1)
  }
  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  const submit = async () => {
    if (!supabase) { setError('Supabase 未配置'); return }
    if (!result) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: insErr } = await supabase.from('personality_results').insert({
        phone: phone.trim(),
        scores: result.scores,
        mbti_type: result.type,
      })
      if (insErr) throw insErr
    } catch (err) {
      setError('提交失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStarted(false)
    setStep(0)
    setAnswers({})
    setPhone('')
  }

  // Step 0: phone gate
  if (!started) {
    return (
      <Page title="性格测评" subtitle="20 道题，约 5 分钟。结果仅用于自我了解与岗位匹配参考。">
        <form onSubmit={start} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">开始测评</h2>
          <p className="text-sm text-slate-500 mb-4">输入手机号用于关联你的测评记录，HR 在后台可查看。</p>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="11 位手机号"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            开始
          </button>
        </form>
      </Page>
    )
  }

  // All answered: show result
  if (allDone && result) {
    const desc = MBTI_DESCRIPTIONS[result.type]
    return (
      <Page title="你的测评结果">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-2xl mx-auto text-center">
          <p className="text-sm text-slate-500 mb-2">你的 MBTI 类型是</p>
          <div className="text-6xl font-bold text-blue-600 mb-2">{result.type}</div>
          <div className="text-xl text-slate-700 mb-4">{desc?.name ?? '独特个性'}</div>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">{desc?.summary ?? '继续保持真我。'}</p>

          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-6 text-xs">
            {(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const).map((k) => (
              <div key={k} className="bg-slate-50 rounded-lg p-2">
                <div className="font-bold text-slate-900">{k}</div>
                <div className="text-slate-500">{result.scores[k]}/5</div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {!error && (
            <p className="text-xs text-emerald-600 mb-3">✅ 已保存到 HR 后台</p>
          )}

          <div className="flex gap-2 justify-center">
            <button onClick={() => navigate('/status')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
              查看我的全部状态
            </button>
            <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              再测一次
            </button>
          </div>

          <button onClick={() => void submit()} disabled={submitting}
            className="mt-3 text-xs text-slate-400 hover:text-blue-600 disabled:opacity-50">
            {submitting ? '保存中…' : '手动重新保存结果'}
          </button>
        </div>
      </Page>
    )
  }

  // In-progress: show question
  return (
    <Page title="性格测评" subtitle={`第 ${step + 1} / ${total} 题`}>
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto">
        <div className="h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <div className="text-xs text-slate-400 mb-1">{current.dimension} 维度</div>
        <h2 className="text-lg font-medium text-slate-900 mb-5">{current.text}</h2>

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
              <span className="text-sm text-slate-700">{opt.text}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={step === 0}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30">
            ← 上一题
          </button>
          {step < total - 1 ? (
            <button onClick={next} disabled={!answers[current.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300">
              下一题 →
            </button>
          ) : (
            <button onClick={() => void submit()} disabled={!allDone || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300">
              {submitting ? '提交中…' : '查看结果'}
            </button>
          )}
        </div>
      </div>
    </Page>
  )
}
