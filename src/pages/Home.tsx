import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCompanies,
  fetchPositionsForCompany,
  fetchAllPositions,
  type PositionRow,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { companyColor } from '../lib/companies'
import { ThemeToggle } from '../components/ThemeToggle'
import type { Company } from '../lib/types'

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const companiesAsync = useAsync(fetchCompanies, [])
  const allPositionsAsync = useAsync(fetchAllPositions, [])
  const companyPositionsAsync = useAsync<PositionRow[]>(
    () => selectedCompany ? fetchPositionsForCompany(selectedCompany) : Promise.resolve([]),
    [selectedCompany]
  )

  const companiesById: Record<string, Company> = useMemo(() => {
    const m: Record<string, Company> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = c
    return m
  }, [companiesAsync.data])

  const positionsByCompanyId = useMemo<Record<string, PositionRow[]>>(() => {
    const m: Record<string, PositionRow[]> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = []
    for (const p of allPositionsAsync.data ?? []) {
      // Position id format: "<companyId>-<slug>". Derive company id by first dash.
      const dashIdx = p.id.indexOf('-')
      if (dashIdx <= 0) continue
      const cid = p.id.slice(0, dashIdx)
      if (!m[cid]) m[cid] = []
      m[cid].push(p)
    }
    return m
  }, [companiesAsync.data, allPositionsAsync.data])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ============================================================
            Header: logo (left) · title + tagline (center) · theme toggle (right)
           ============================================================ */}
        <header className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-6 py-5 mb-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0"
            aria-label="中南创发集团 logo 占位"
          >
            中
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              中南创发校招投递平台
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
              扫码投递 · 在线测评 · 实时跟踪状态
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* ============================================================
            Filter row: company dropdown (left only)
           ============================================================ */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            按公司筛选
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCompany ?? ''}
              onChange={(e) => setSelectedCompany(e.target.value || null)}
              disabled={companiesAsync.loading}
              className="flex-1 min-w-60 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">— 全部公司 —</option>
              {(companiesAsync.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCompany && (
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                清除筛选
              </button>
            )}
          </div>
        </section>

        {/* ============================================================
            All-companies view (when no filter) — grouped by company
           ============================================================ */}
        {!selectedCompany && (
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
              <section className="space-y-6 mb-6">
                {(companiesAsync.data ?? []).map((c) => {
                  const positions = positionsByCompanyId[c.id] ?? []
                  return (
                    <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${companyColor(c.id)}`} />
                          {c.name}
                        </h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{positions.length} 个岗位</span>
                      </div>
                      {positions.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">暂无在招岗位</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {positions.map((p) => (
                            <Link
                              key={p.id}
                              to={`/upload?company=${c.id}&position=${p.id}`}
                              className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                            >
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{p.category ?? '—'}</div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{p.title}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">点击投递 →</div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>
            )}
          </AsyncView>
        )}

        {/* ============================================================
            Single-company view (when company selected)
           ============================================================ */}
        {selectedCompany && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${companyColor(selectedCompany)}`} />
              {companiesById[selectedCompany]?.name ?? selectedCompany}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
              {companiesById[selectedCompany]?.description?.trim()
                ? companiesById[selectedCompany]!.description
                : '公司简介待补充'}
            </p>

            <AsyncView
              data={companyPositionsAsync.data}
              loading={companyPositionsAsync.loading}
              error={companyPositionsAsync.error}
              refetch={companyPositionsAsync.refetch}
              isEmpty={(d) => d.length === 0}
              empty={
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">该公司暂无在招岗位</p>
              }
            >
              {(positions: PositionRow[]) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {positions.map((p) => (
                    <Link
                      key={p.id}
                      to={`/upload?company=${selectedCompany}&position=${p.id}`}
                      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                    >
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {p.category ?? '—'}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">点击投递 →</div>
                    </Link>
                  ))}
                </div>
              )}
            </AsyncView>
          </section>
        )}

        {/* ============================================================
            Bottom — assessment + status + HR entry
           ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/personality" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">性格测评</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">49 题 MBTI 风格，了解自己</div>
          </Link>
          <Link to="/skill-test" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">专业能力测试</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">按公司/岗位分类，5 分钟</div>
          </Link>
          <Link to="/status" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">📬</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">我的投递状态</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">输入手机号查询</div>
          </Link>
        </section>

        {/* HR entry link, unobtrusive but findable */}
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