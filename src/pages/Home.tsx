import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCompanies, fetchAllPositions } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { companyColor } from '../lib/companies'
import { ThemeToggle } from '../components/ThemeToggle'

export default function Home() {
  const navigate = useNavigate()

  const companiesAsync = useAsync(fetchCompanies, [])
  const allPositionsAsync = useAsync(fetchAllPositions, [])

  // Count positions per company for the "X 个岗位" badge on each card.
  const positionCountByCompanyId = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = 0
    for (const p of allPositionsAsync.data ?? []) {
      const dashIdx = p.id.indexOf('-')
      if (dashIdx <= 0) continue
      const cid = p.id.slice(0, dashIdx)
      m[cid] = (m[cid] ?? 0) + 1
    }
    return m
  }, [companiesAsync.data, allPositionsAsync.data])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Top bar — logo (top-left) · theme toggle (top-right) */}
        <div className="flex items-center justify-between mb-6">
          <div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-md"
            aria-label="中南创发集团 logo 占位"
          >
            中
          </div>
          <ThemeToggle />
        </div>

        {/* Centered title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            中南创发校招投递平台
          </h1>
          <p className="text-base sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            扫码投递 · 在线测评 · 实时跟踪状态
          </p>
        </div>

        {/* 中南创发集团简介 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
            <span className="inline-block w-1.5 h-4 rounded-sm bg-blue-500" />
            中南创发集团简介
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">集团简介待补充</p>
        </section>

        {/* Company cards — click navigates to /companies/:id (positions live there) */}
        <AsyncView
          data={companiesAsync.data}
          loading={companiesAsync.loading}
          error={companiesAsync.error}
          refetch={companiesAsync.refetch}
          isEmpty={(d) => d.length === 0}
          empty={
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
              公司列表尚未配置。
            </div>
          }
        >
          {() => (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {(companiesAsync.data ?? []).map((c) => {
                const count = positionCountByCompanyId[c.id] ?? 0
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/companies/${c.id}`)}
                    className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${companyColor(c.id)}`} />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{count} 个岗位</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-3 mb-2 min-h-12">
                      {c.description?.trim() ? c.description : '公司简介待补充'}
                    </p>
                    <div className="text-sm text-blue-600 dark:text-blue-400">查看岗位 →</div>
                  </button>
                )
              })}
            </section>
          )}
        </AsyncView>

        {/* Bottom — assessment + status */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link to="/personality" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">性格测评</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">49 题 MBTI 风格，了解自己</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">约 8 分钟</div>
          </Link>
          <Link to="/skill-test" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">专业能力测试</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">按公司/岗位分类，5 道题</div>
          </Link>
          <Link to="/status" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">📬</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">我的投递状态</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">输入手机号查询</div>
          </Link>
        </section>

        {/* HR entry link */}
        <div className="text-center">
          <Link
            to="/hr"
            className="inline-block text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg"
          >
            🛠 中南创发校招HR管理后台
          </Link>
        </div>
      </div>
    </div>
  )
}