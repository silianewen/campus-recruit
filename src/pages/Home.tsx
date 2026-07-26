import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCompanies,
  fetchPositionsForCompany,
  fetchPositionsByCategory,
  type PositionRow,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { companyColor, isCompanyId } from '../lib/companies'
import { isPositionId } from '../lib/positions'
import { ThemeToggle } from '../components/ThemeToggle'
import type { Company } from '../lib/types'

// All categories hardcoded for ordering + filter dropdown UI.
// Mirrors the `category` column in `positions` (set by migration 0007).
const CATEGORIES = [
  '人力行政', '采购', '工程', '项目', '质量', '软件', '光学', '招商', '财务',
]

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter mode is mutually exclusive (company XOR category) — mirrors the
  // user's spec ("click company → see company positions; click category → see
  // category positions").
  const mode: 'company' | 'category' | 'all' = selectedCompany ? 'company'
    : selectedCategory ? 'category'
    : 'all'

  const companiesAsync = useAsync(fetchCompanies, [])

  const positionsAsync = useAsync<PositionRow[]>(
    () => {
      if (selectedCompany) return fetchPositionsForCompany(selectedCompany)
      if (selectedCategory) return fetchPositionsByCategory(selectedCategory)
      return Promise.resolve([])
    },
    [selectedCompany, selectedCategory]
  )

  const companiesById: Record<string, Company> = useMemo(() => {
    const m: Record<string, Company> = {}
    for (const c of companiesAsync.data ?? []) m[c.id] = c
    return m
  }, [companiesAsync.data])

  const activeCompany = selectedCompany ? companiesById[selectedCompany] : null

  const handleCompanySelect = (id: string | null) => {
    setSelectedCompany(id)
    if (id) setSelectedCategory(null)
  }
  const handleCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat)
    if (cat) setSelectedCompany(null)
  }

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
            Filter row: company (left) + category (right)
           ============================================================ */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                按公司筛选
              </label>
              <select
                value={selectedCompany ?? ''}
                onChange={(e) => handleCompanySelect(e.target.value || null)}
                disabled={companiesAsync.loading}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">— 选择公司 —</option>
                {(companiesAsync.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                按职位类别筛选
              </label>
              <select
                value={selectedCategory ?? ''}
                onChange={(e) => handleCategorySelect(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">— 选择类别 —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ============================================================
            Results — company description (when company selected) + position list
           ============================================================ */}
        {mode === 'company' && activeCompany && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${companyColor(activeCompany.id)}`} />
              {activeCompany.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
              {activeCompany.description?.trim() ? activeCompany.description : '公司简介待补充'}
            </p>
          </section>
        )}

        <AsyncView
          data={positionsAsync.data}
          loading={positionsAsync.loading}
          error={positionsAsync.error}
          refetch={positionsAsync.refetch}
          isEmpty={(d) => d.length === 0}
          empty={
            mode === 'company' ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
                该公司暂无在招岗位。
              </div>
            ) : mode === 'category' ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
                该类别暂无在招岗位。
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400">
                请在上方筛选公司或职位类别，查看在招岗位。
              </div>
            )
          }
        >
          {(positions: PositionRow[]) => (
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {positions.length} 个职位
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {positions.map((p) => {
                  // p.id is "<companyId>-<slug>"; derive companyId for the upload URL.
                  const dashIdx = p.id.indexOf('-')
                  const companyForUrl = dashIdx > 0 ? p.id.slice(0, dashIdx) : ''
                  return (
                    <Link
                      key={p.id}
                      to={
                        isCompanyId(companyForUrl) && isPositionId(p.id)
                          ? `/upload?company=${companyForUrl}&position=${p.id}`
                          : `/upload?position=${p.id}`
                      }
                      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                    >
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {p.category ?? '—'} · {companyForUrl}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{p.description}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">点击投递 →</div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </AsyncView>

        {/* ============================================================
            Bottom — assessment + status (unchanged from MVP)
           ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
      </div>
    </div>
  )
}