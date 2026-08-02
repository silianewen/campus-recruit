import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCompanies, fetchAllPositions, fetchGroupIntro } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { ThemeToggle } from '../components/ThemeToggle'

export default function Home() {
  const navigate = useNavigate()

  const companiesAsync = useAsync(fetchCompanies, [])
  const allPositionsAsync = useAsync(fetchAllPositions, [])
  const groupIntroAsync = useAsync(fetchGroupIntro, [])

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
          <img
            src="/logos/group.png"
            alt="集团 logo"
            className="h-14 w-auto"
            onError={(e) => {
              // Until the user uploads a real logo, fall back to the dashed
              // placeholder so the slot stays reserved.
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
              const ph = document.createElement('div')
              ph.setAttribute('aria-label', '集团 logo 占位')
              ph.className =
                'h-14 w-14 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30'
              el.parentElement?.appendChild(ph)
            }}
          />
          <ThemeToggle />
        </div>

        {/* Centered title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            XX校招投递平台
          </h1>
          <p className="text-base sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            扫码投递 · 在线测评 · 实时跟踪状态
          </p>
        </div>

        {/* 集团简介模块 — 内容由 site_content 表管理（迁移 0015） */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
            <span className="inline-block w-1.5 h-4 rounded-sm bg-blue-500" />
            集团简介
          </h3>
          {groupIntroAsync.data ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {groupIntroAsync.data}
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">集团简介待补充</p>
          )}
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
                      {c.logo_url ? (
                        <img
                          src={c.logo_url}
                          alt={c.name}
                          className="h-12 w-12 object-contain rounded-lg bg-slate-50 dark:bg-slate-700 p-1 flex-shrink-0"
                        />
                      ) : (
                        <div
                          aria-label="公司 logo 占位"
                          className="h-12 w-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30 flex-shrink-0"
                        />
                      )}
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1 min-w-0">{c.name}</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0">{count} 个岗位</span>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">查看岗位 →</div>
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
            🛠 XX校招HR管理后台
          </Link>
        </div>
      </div>
    </div>
  )
}