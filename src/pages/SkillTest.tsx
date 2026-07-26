import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { companyColor, isCompanyId } from '../lib/companies'
import { isPositionId } from '../lib/positions'
import {
  fetchCompanies,
  fetchCompany,
  fetchAllPositions,
  fetchPosition,
  fetchQuestionsForPosition,
  type PositionRow,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { extractErrorMessage } from '../lib/errors'
import { ClosesAtBadge } from '../components/ClosesAtBadge'
import type { Company, SkillQuestion } from '../lib/types'

export default function SkillTest() {
  const [searchParams] = useSearchParams()
  const companyParam = searchParams.get('company')
  const positionParam = searchParams.get('position')

  const companyId = companyParam && isCompanyId(companyParam) ? companyParam : null
  const positionId = positionParam && isPositionId(positionParam) ? positionParam : null

  // Direct entry mode (with URL params) vs picker mode (without).
  const directEntry = !!(companyId && positionId)

  const [phone, setPhone] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('')  // "" = all companies
  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load questions + position metadata only when in direct-entry mode.
  const posAsync = useAsync(
    () => positionId ? fetchPosition(positionId) : Promise.resolve(null),
    [positionId]
  )
  const questionsAsync = useAsync<SkillQuestion[]>(
    () => positionId ? fetchQuestionsForPosition(positionId) : Promise.resolve([]),
    [positionId]
  )

  // Load companies + all positions for picker mode.
  const companiesAsync = useAsync(
    () => directEntry ? Promise.resolve([]) : fetchCompanies(),
    [directEntry]
  )
  const allPositionsAsync = useAsync(
    () => directEntry ? Promise.resolve([] as PositionRow[]) : fetchAllPositions(),
    [directEntry]
  )

  // In direct-entry mode the picker async above is empty, so we also fetch
  // the single company record to render a human-readable subtitle and a
  // fallback if the record is missing.
  const directCompanyAsync = useAsync(
    () => directEntry && companyId ? fetchCompany(companyId) : Promise.resolve(null),
    [directEntry, companyId]
  )

  const questions = questionsAsync.data ?? []
  const total = questions.length
  const answered = Object.keys(answers).length
  const allDone = answered === total && total > 0
  const current = questions[idx]

  const posTitle = posAsync.data?.title ?? positionId ?? '专业能力测试'
  const companyName = directEntry
    ? (directCompanyAsync.data?.name ?? companyId ?? null)
    : (companyId ? companiesAsync.data?.find((c) => c.id === companyId)?.name ?? null : null)

  // Group positions by company for picker rendering.
  const positionsByCompanyId = useMemo<Record<string, PositionRow[]>>(() => {
    const m: Record<string, PositionRow[]> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = []
    for (const p of allPositionsAsync.data ?? []) {
      const dashIdx = p.id.indexOf('-')
      if (dashIdx <= 0) continue
      const cid = p.id.slice(0, dashIdx)
      if (!m[cid]) m[cid] = []
      m[cid].push(p)
    }
    return m
  }, [companiesAsync.data, allPositionsAsync.data])

  // Apply the company filter to the picker: empty = all companies, otherwise
  // show only positions under the selected company.
  const filteredCompanies: Company[] = useMemo(() => {
    if (!filterCompany) return companiesAsync.data ?? []
    return (companiesAsync.data ?? []).filter((c) => c.id === filterCompany)
  }, [companiesAsync.data, filterCompany])

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
      setShowResult(true)
    } catch (err) {
      setError('提交失败：' + extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setStarted(false)
    setIdx(0)
    setAnswers({})
    setShowResult(false)
    setScore(0)
    setPhone('')
  }

  const subtitle = [companyName, posTitle].filter(Boolean).join(' · ')

  // ============================================================
  // Mode: picker (no URL params) — show all companies + their positions
  // ============================================================
  if (!directEntry) {
    const loading = companiesAsync.loading || allPositionsAsync.loading
    return (
      <Page title="专业能力测试" subtitle="选择一家公司和对应岗位开始测试（5 道题，约 5 分钟）">
        {/* Filter row: company (empty = all) */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            按公司筛选
          </label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">— 全部公司 —</option>
            {(companiesAsync.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </section>

        <AsyncView
          data={companiesAsync.data}
          loading={loading}
          error={companiesAsync.error ?? allPositionsAsync.error}
          refetch={() => { void companiesAsync.refetch(); void allPositionsAsync.refetch() }}
          isEmpty={(d) => d.length === 0}
          empty={
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
              公司列表尚未配置。请稍后再来。
            </div>
          }
        >
          {() => (
            <div className="space-y-6">
              {filteredCompanies.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                  该筛选条件下暂无岗位，请切换公司。
                </div>
              ) : (
                filteredCompanies.map((c: Company) => {
                  const positions = positionsByCompanyId[c.id] ?? []
                  if (positions.length === 0) return null
                  return (
                    <section
                      key={c.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${companyColor(c.id)}`} />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{positions.length} 个岗位</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {positions.map((p) => (
                          <Link
                            key={p.id}
                            to={`/skill-test?company=${c.id}&position=${p.id}`}
                            className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{p.category ?? '—'}</span>
                              <ClosesAtBadge closesAt={p.closes_at} />
                            </div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{p.title}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">开始测试 →</div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )
                })
              )}
            </div>
          )}
        </AsyncView>
      </Page>
    )
  }

  // ============================================================
  // Mode: direct entry (with ?company=&position=) — phone gate → quiz
  // ============================================================

  // Result view
  if (showResult) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    return (
      <Page title="测试结果" subtitle={subtitle}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-md mx-auto text-center">
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">{score} / {total}</div>
          <div className="text-slate-600 dark:text-slate-300 mb-1">正确率 {pct}%</div>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">✅ 已保存到 HR 后台</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link to="/status" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm">
              查看我的全部状态
            </Link>
            <button onClick={restart} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              再测一次
            </button>
          </div>
        </div>
      </Page>
    )
  }

  // Phone gate
  if (!started) {
    const loadedTotal = total
    return (
      <Page title="专业能力测试" subtitle={subtitle}>
        <form onSubmit={startQuiz} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md mx-auto">
          <AsyncView
            data={questions}
            loading={questionsAsync.loading}
            error={questionsAsync.error}
            refetch={questionsAsync.refetch}
            isEmpty={(d) => d.length === 0}
            empty={
              !questionsAsync.loading ? (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm px-3 py-2 rounded mb-3">
                  该岗位题库暂未准备，请联系 HR。
                </div>
              ) : null
            }
          >
            {() => (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">题库已就绪（{loadedTotal} 题）</p>
            )}
          </AsyncView>

          {error && <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>}
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">输入手机号关联你的测试结果（HR 后台可查看）。</p>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="11 位手机号"
            disabled={questionsAsync.loading || loadedTotal === 0}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800"
          />
          <button type="submit" disabled={questionsAsync.loading || loadedTotal === 0}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700">
            开始答题
          </button>
          <Link to="/skill-test" className="block w-full mt-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-center">
            ← 换个岗位
          </Link>
        </form>
      </Page>
    )
  }

  // Quiz
  if (!current) return null

  return (
    <Page title="专业能力测试" subtitle={`${subtitle} · 第 ${idx + 1} / ${total} 题`}>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-xl mx-auto">
        <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-5">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt) => (
            <label key={opt.key}
              className={`block border rounded-lg p-3 cursor-pointer transition
                ${answers[current.id] === opt.key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              <input type="radio" name={`q${current.id}`}
                className="mr-2"
                checked={answers[current.id] === opt.key}
                onChange={() => choose(current.id, opt.key)} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-mono mr-2 text-slate-400 dark:text-slate-500">{opt.key}.</span>{opt.text}
              </span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={idx === 0}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30">
            ← 上一题
          </button>
          {idx < total - 1 ? (
            <button onClick={next} disabled={!answers[current.id]}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700">
                下一题 →
            </button>
          ) : (
            <button onClick={() => void submit()} disabled={!allDone || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700">
              {submitting ? '提交中…' : '提交'}
            </button>
          )}
        </div>
      </div>
    </Page>
  )
}