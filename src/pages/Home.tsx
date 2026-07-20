import { useState } from 'react'
import { Link } from 'react-router-dom'
import { companyColor, isCompanyId } from '../lib/companies'
import { fetchCompanies, fetchPositionsForCompany, type PositionRow } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { ThemeToggle } from '../components/ThemeToggle'
import { QrDownload } from '../components/QrDownload'
import type { Company } from '../lib/types'

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const homeUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://campusrecruitment.vercel.app/'

  const viewingCompanyId = selectedCompany && isCompanyId(selectedCompany) ? selectedCompany : null

  const companiesAsync = useAsync(fetchCompanies, [])
  const positionsAsync = useAsync<PositionRow[]>(
    () => viewingCompanyId ? fetchPositionsForCompany(viewingCompanyId) : Promise.resolve([]),
    [viewingCompanyId]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="text-center mb-8 relative">
          <div className="absolute right-0 top-0"><ThemeToggle /></div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">校招投递平台</h1>
          <p className="text-slate-600 dark:text-slate-400">扫码投递 · 在线测评 · 实时跟踪状态</p>
        </header>

        {/* QR download — small, fixed placement so users find it */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <QrDownload text={homeUrl} filename="校招首页二维码.png" size={140} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">📲 扫这个码进入投递首页</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">学生扫码 → 选公司 → 选岗位 → 上传简历。所有流程在一页内完成。</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 break-all">二维码内容：{homeUrl}</p>
          </div>
        </section>

        {/* Tier 1: company grid */}
        {!viewingCompanyId && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">🏢 选择应聘公司</h2>
            <AsyncView
              data={companiesAsync.data}
              loading={companiesAsync.loading}
              error={companiesAsync.error}
              refetch={companiesAsync.refetch}
              isEmpty={(d) => d.length === 0}
              empty={
                <div className="text-sm text-slate-500 dark:text-slate-400 p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                  公司列表尚未配置。<br />
                  请在 Supabase <code className="font-mono text-xs">companies</code> 表中添加，或联系开发者。
                </div>
              }
            >
              {(companies: Company[]) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompany(c.id)}
                      className="block text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                    >
                      <div className={`w-2 h-2 rounded-full ${companyColor(c.id)} mb-2`} />
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{c.description}</div>
                      )}
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">查看岗位 →</div>
                    </button>
                  ))}
                </div>
              )}
            </AsyncView>
          </section>
        )}

        {/* Tier 2: positions for selected company */}
        {viewingCompanyId && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ← 换公司
              </button>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${companyColor(viewingCompanyId!)}`} />
                {companiesAsync.data?.find(c => c.id === viewingCompanyId)?.name ?? viewingCompanyId} · 在招岗位
              </h2>
            </div>

            <AsyncView
              data={positionsAsync.data}
              loading={positionsAsync.loading}
              error={positionsAsync.error}
              refetch={positionsAsync.refetch}
              isEmpty={(d) => d.length === 0}
              empty={
                <div className="text-sm text-slate-500 dark:text-slate-400 p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                  该公司暂无配置的岗位。
                </div>
              }
            >
              {(positions: PositionRow[]) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {positions.map((p) => (
                    <Link
                      key={p.id}
                      to={`/upload?company=${viewingCompanyId}&position=${p.id}`}
                      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mb-2" />
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">点击上传 →</div>
                    </Link>
                  ))}
                </div>
              )}
            </AsyncView>
          </section>
        )}

        {/* Bottom — assessment + status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/personality" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">性格测评</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">20 题 MBTI 风格，了解自己</div>
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

        {/* HR entry — small unobtrusive link in bottom corner */}
        <div className="text-center mt-4">
          <Link to="/dashboard" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            🛠 招聘官入口
          </Link>
        </div>
      </div>
    </div>
  )
}