import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { QrDownload } from '../components/QrDownload'

const HR_SESSION_KEY = 'hr_authed'
const HR_PASSWORD = import.meta.env.VITE_HR_PASSWORD as string | undefined

export default function HR() {
  const navigate = useNavigate()
  const authed = sessionStorage.getItem(HR_SESSION_KEY) === 'true'
  const homeUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://campusrecruitment.vercel.app/'

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
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
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header: logo · title · theme toggle + logout */}
        <header className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-6 py-5 mb-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0"
            aria-label="中南创发集团 logo 占位"
          >
            中
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">中南创发校招HR管理后台</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">简历投递 · 通知 · 数据看板</p>
          </div>
          <div className="flex items-center gap-2">
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
        </header>

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
          <Link
            to="/hr/list"
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">投递简历列表</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看所有学生投递、改状态、发送面试通知</div>
          </Link>
          <Link
            to="/hr/dashboard"
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">数据看板</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">按公司/职位/学历等维度分析投递数据</div>
          </Link>
        </section>
      </div>
    </div>
  )
}