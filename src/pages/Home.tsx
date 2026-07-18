import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COMPANIES, companyColor, isCompanyId } from '../lib/companies'
import { positionsForCompany } from '../lib/companyPositions'
import { POSITIONS, POSITION_MAP, isPositionId } from '../lib/positions'
import { QrDownload } from '../components/QrDownload'

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const homeUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://campusrecruitment.vercel.app/'

  // Which company is currently being viewed (or null → list all)
  const viewingCompanyId = selectedCompany && isCompanyId(selectedCompany) ? selectedCompany : null
  const viewingCompany = viewingCompanyId ? COMPANIES.find(c => c.id === viewingCompanyId) : null
  const viewingPositions = positionsForCompany(viewingCompanyId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">校招投递平台</h1>
          <p className="text-slate-600">扫码投递 · 在线测评 · 实时跟踪状态</p>
        </header>

        {/* QR download — small, fixed placement so users find it */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <QrDownload text={homeUrl} filename="校招首页二维码.png" size={140} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-slate-900 mb-1">📲 扫这个码进入投递首页</h3>
            <p className="text-sm text-slate-600">学生扫码 → 选公司 → 选岗位 → 上传简历。所有流程在一页内完成。</p>
            <p className="text-xs text-slate-400 mt-2 break-all">二维码内容：{homeUrl}</p>
          </div>
        </section>

        {/* Tier 1: company grid */}
        {!viewingCompany && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">🏢 选择应聘公司</h2>
            {COMPANIES.length === 0 ? (
              <div className="text-sm text-slate-500 p-6 text-center bg-slate-50 rounded-lg">
                公司列表尚未配置。<br />
                请把 7 家公司信息（id + name）发给开发者，让他们填写{' '}
                <code className="font-mono text-xs">src/lib/companies.ts</code>。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COMPANIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c.id)}
                    className="block text-left rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition"
                  >
                    <div className={`w-2 h-2 rounded-full ${companyColor(c.id)} mb-2`} />
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    {c.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</div>
                    )}
                    <div className="text-xs text-blue-600 mt-2">查看岗位 →</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tier 2: positions for selected company */}
        {viewingCompany && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← 换公司
              </button>
              <h2 className="text-xl font-semibold text-slate-900">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${companyColor(viewingCompany.id)}`} />
                {viewingCompany.name} · 在招岗位
              </h2>
            </div>

            {viewingPositions.length === 0 ? (
              <div className="text-sm text-slate-500 p-6 text-center bg-slate-50 rounded-lg">
                该公司暂无配置的岗位。<br />
                请把职位清单发给开发者，让他们填写{' '}
                <code className="font-mono text-xs">src/lib/companyPositions.ts</code>。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {viewingPositions
                  .filter((p) => isPositionId(p))
                  .map((p) => {
                    const pos = POSITION_MAP[p]
                    return (
                      <Link
                        key={p}
                        to={`/upload?company=${viewingCompany.id}&position=${p}`}
                        className="block rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition"
                      >
                        <div className={`w-2 h-2 rounded-full ${pos.color} mb-2`} />
                        <div className="font-semibold text-slate-900">{pos.title}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{POSITIONS.find(x => x.id === p)?.description}</div>
                        <div className="text-xs text-blue-600 mt-2">点击上传 →</div>
                      </Link>
                    )
                  })}
              </div>
            )}
          </section>
        )}

        {/* Bottom — assessment + status (HR section intentionally hidden from students) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/personality" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold text-slate-900">性格测评</div>
            <div className="text-sm text-slate-500 mt-1">20 题 MBTI 风格，了解自己</div>
          </Link>
          <Link to="/status" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">📬</div>
            <div className="font-semibold text-slate-900">我的投递状态</div>
            <div className="text-sm text-slate-500 mt-1">输入手机号查询</div>
          </Link>
          <a href="https://campusrecruitment.vercel.app/skill-test"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-semibold text-slate-900">专业能力测试</div>
            <div className="text-sm text-slate-500 mt-1">提交简历后系统会提示</div>
          </a>
        </section>
        {/* HR section intentionally not shown to students — access /dashboard directly via URL. */}
      </div>
    </div>
  )
}
