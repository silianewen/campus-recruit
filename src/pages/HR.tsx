import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { QrDownload } from '../components/QrDownload'

const HR_SESSION_KEY = 'hr_authed'
const HR_PASSWORD = import.meta.env.VITE_HR_PASSWORD as string | undefined

export default function HR() {
  const navigate = useNavigate()
  const authed = sessionStorage.getItem(HR_SESSION_KEY) === 'true'
  // Vite is CSR; `window` is guaranteed at runtime. Avoid hardcoding a domain
  // here so a staging or custom-domain deploy reflects the real origin.
  const homeUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://campusrecruitment.vercel.app') + '/'

  // ============================================================
  // Login form (pre-auth) — centered title + top bar (logo · 返回学生投递平台 + toggle)
  // ============================================================
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col px-4">
        {/* Top bar: logo (left) · 返回学生投递平台 + theme toggle (right) */}
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-md"
            aria-label="中南创发集团 logo 占位"
          >
            中
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ← 返回学生投递平台
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Centered title */}
        <div className="text-center mt-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            中南创发校招HR管理后台
          </h1>
        </div>

        {/* Login form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!HR_PASSWORD) { alert('系统未配置 HR 密码，请联系管理员'); return }
            const form = e.currentTarget
            const pwd = (form.elements.namedItem('pwd') as HTMLInputElement).value
            if (pwd === HR_PASSWORD) {
              sessionStorage.setItem(HR_SESSION_KEY, 'true')
              navigate('/hr', { replace: true })
            } else {
              alert('密码错误')
            }
          }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full mx-auto"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">HR 登录</h2>
          {!HR_PASSWORD ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs px-3 py-2 rounded">
              ⚠️ 未设置 <code className="font-mono">VITE_HR_PASSWORD</code>，请在 <code className="font-mono">.env.local</code> 配置后重启 dev server。
            </div>
          ) : (
            <>
              <input
                name="pwd" type="password" placeholder="HR 密码"
                autoFocus
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                进入
              </button>
            </>
          )}
        </form>
      </div>
    )
  }

  // ============================================================
  // HR landing page (post-auth)
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Top bar: logo (left) · "回到学生投递平台" + theme toggle + logout (right) */}
        <div className="flex items-center justify-between mb-6">
          <div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-md"
            aria-label="中南创发集团 logo 占位"
          >
            中
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ← 返回学生投递平台
            </button>
            <ThemeToggle />
            <button
              onClick={() => {
                sessionStorage.removeItem(HR_SESSION_KEY)
                navigate('/hr', { replace: true })
              }}
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* Centered title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          中南创发校招HR管理后台
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 text-center mb-8">
          简历投递 · 通知 · 数据看板
        </p>

        {/* QR for student page */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <QrDownload text={homeUrl} filename="学生投递首页二维码.png" size={140} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">📲 学生投递页面二维码</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              学生扫码 → 进入中南创发校招投递平台 → 选择公司/岗位 → 投递简历。
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 break-all">二维码内容：{homeUrl}</p>
          </div>
        </section>

        {/* Two module entries */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/hr/list')}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">投递简历列表</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看所有学生投递、改状态、发送面试通知</div>
          </button>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">数据看板</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">按公司/职位/学历等维度分析投递数据</div>
          </button>
        </section>
      </div>
    </div>
  )
}