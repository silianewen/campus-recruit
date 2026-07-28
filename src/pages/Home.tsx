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
          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              中南创发集团于 1935 年在香港创建，以科技材料、精密工程技术为平台，专注于镁铝合金、玻璃、高级钟表零件、触摸屏、不锈钢、钛金属材料、陶瓷等开发，在美国硅谷、瑞士、英国设有公司，掌握触摸面板、金属注射成型等核心技术，在行业内处于领先地位。与英国牛津大学、香港科技大学有着良好合作关系，在科学材料应用于新领域方面进行广泛研究与开发。
            </p>
            <p>
              我们在香港、深圳、广州、珠海、赤壁、天津、台湾、泰国、越南、英国等地均设有工厂和办公室，拥有员工 12000 多名，有现代化的厂房和先进的设备生产线。
            </p>
            <p>
              旗下 BU 包括但不限于：昶联金属材料应用制品（广州）有限公司、中南机诚精密制品（深圳）有限公司、中南智诚科技（东莞）有限公司、英硕激光科技（珠海）有限公司、中南雅园产业管理（深圳）有限公司。
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              欢迎访问中南创发集团官方网址：
              <a href="http://www.cn-innovations.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                http://www.cn-innovations.com
              </a>
            </p>
          </div>
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