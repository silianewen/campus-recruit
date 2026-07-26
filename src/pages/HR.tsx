import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { QrDownload } from '../components/QrDownload'
import { hashPassword } from '../lib/crypto'
import { loginHrUser, fetchHrGroups } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'
import type { HrScope, HrUser, HrGroup } from '../lib/types'

// Stored auth state — username + display name + group id. Keep user id too.
const HR_AUTH_KEY = 'hr_auth'
interface AuthRecord {
  user: HrUser
  group: HrGroup | null
}

function deriveScope(_user: HrUser, group: HrGroup | null): HrScope {
  if (!group) return { kind: 'default' }
  if (group.id === 'group_admin') return { kind: 'admin' }
  if (group.id.startsWith('company_') && group.company_id) {
    return {
      kind: 'company',
      companyId: group.company_id,
      companyName: group.name,
    }
  }
  return { kind: 'default' }
}

export default function HR() {
  const navigate = useNavigate()
  const groupsAsync = useAsync(fetchHrGroups, [])
  const [auth, setAuth] = useState<AuthRecord | null>(() => {
    try {
      const raw = sessionStorage.getItem(HR_AUTH_KEY)
      return raw ? (JSON.parse(raw) as AuthRecord) : null
    } catch {
      return null
    }
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (auth) sessionStorage.setItem(HR_AUTH_KEY, JSON.stringify(auth))
    else sessionStorage.removeItem(HR_AUTH_KEY)
  }, [auth])

  const homeUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://campusrecruitment.vercel.app') + '/'

  const scope: HrScope | null = auth ? deriveScope(auth.user, auth.group) : null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setSubmitting(true)
    try {
      const hash = await hashPassword(username.trim(), password)
      const user = await loginHrUser(username.trim(), hash)
      if (!user) {
        setLoginError('用户名或密码错误')
        return
      }
      const groups = groupsAsync.data ?? []
      const group = groups.find((g) => g.id === user.group_id) ?? null
      setAuth({ user, group })
    } catch (err) {
      setLoginError('登录失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    setAuth(null)
    setUsername('')
    setPassword('')
    navigate('/hr', { replace: true })
  }

  // ============================================================
  // Login form (no auth)
  // ============================================================
  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col px-4">
        {/* Top bar: logo (left) · 返回投递平台 + theme toggle (right) */}
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
              ← 返回投递平台
            </button>
            <ThemeToggle />
          </div>
        </div>

        <div className="text-center mt-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            中南创发校招HR管理后台
          </h1>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full mx-auto space-y-3"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">HR 登录</h2>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">用户名</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              required autoFocus autoComplete="username"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">密码</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {loginError && <p className="text-red-600 dark:text-red-400 text-sm">{loginError}</p>}
          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700">
            {submitting ? '登录中…' : '进入'}
          </button>
        </form>
      </div>
    )
  }

  // ============================================================
  // HR landing (post-auth) — scoped by user.group
  // ============================================================
  const displayName = auth.user.display_name ?? auth.user.username
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Top bar: logo (left) · 返回投递平台 + theme toggle + logout (right) */}
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
              ← 返回投递平台
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* Centered title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 text-center mb-1">
          中南创发校招HR管理后台
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 text-center mb-1">
          简历投递 · 通知 · 数据看板
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-8">
          当前账号：<strong className="text-slate-700 dark:text-slate-300">{displayName}</strong>（{auth.user.username}） ·
          {' '}分组：<strong className="text-slate-700 dark:text-slate-300">{auth.group?.name ?? '未分配'}</strong> ·
          {' '}权限：<span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">{scopeLabel(scope)}</span>
          {scope?.kind === 'company' && <span className="ml-1 text-xs text-slate-500">（仅看 {scope.companyName}）</span>}
        </p>

        {/* QR for student page (all users can see) */}
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

        {/* Module entries — all users see these (content scoped by group on the inner page) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => navigate('/hr/list')}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">投递简历列表</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {scope?.kind === 'company' ? `仅看 ${scope.companyName} 的投递` : '查看所有学生投递、改状态'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/hr/dashboard')}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">数据看板</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {scope?.kind === 'company' ? `${scope.companyName} 维度分析` : '全局投递分析'}
            </div>
          </button>
        </section>

        {/* Admin-only: user management */}
        {scope?.kind === 'admin' && (
          <section>
            <button
              type="button"
              onClick={() => navigate('/hr/admin/users')}
              className="w-full text-left bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 hover:shadow-md transition flex items-center gap-4"
            >
              <div className="text-2xl">👥</div>
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-200">用户管理</div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">仅集团管理员可见 · 新增 / 删除 HR 账号</div>
              </div>
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

function scopeLabel(s: HrScope | null): string {
  if (!s) return '未知'
  if (s.kind === 'admin') return '集团管理员'
  if (s.kind === 'company') return '公司 HR'
  return '只读'
}
