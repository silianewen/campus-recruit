import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { hashPassword } from '../lib/crypto'
import {
  createHrUser,
  deleteHrUser,
  fetchHrGroups,
  fetchHrUsers,
} from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'

const HR_AUTH_KEY = 'hr_auth'

interface AuthRecord {
  user: { id: string; group_id: string }
}

export default function HRAdminUsers() {
  const navigate = useNavigate()
  const [auth] = useState<AuthRecord | null>(() => {
    try {
      const raw = sessionStorage.getItem(HR_AUTH_KEY)
      return raw ? (JSON.parse(raw) as AuthRecord) : null
    } catch {
      return null
    }
  })

  // Authorisation: only group_admin may enter.
  useEffect(() => {
    if (!auth) { navigate('/hr', { replace: true }); return }
    if (auth.user.group_id !== 'group_admin') {
      alert('仅集团管理员可访问')
      navigate('/hr', { replace: true })
    }
  }, [auth, navigate])

  const groupsAsync = useAsync(fetchHrGroups, [])
  const usersAsync = useAsync(fetchHrUsers, [])

  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const groups = groupsAsync.data ?? []
  const users = usersAsync.data ?? []

  const refresh = () => { void usersAsync.refetch() }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!newUsername.trim() || !newPassword || !newGroupId) {
      setCreateError('用户名、密码、分组必填')
      return
    }
    if (newPassword.length < 6) {
      setCreateError('密码至少 6 位')
      return
    }
    setCreating(true)
    try {
      const hash = await hashPassword(newUsername.trim(), newPassword)
      await createHrUser({
        username: newUsername.trim(),
        passwordHash: hash,
        displayName: newDisplayName.trim() || null,
        groupId: newGroupId,
      })
      setNewUsername('')
      setNewPassword('')
      setNewDisplayName('')
      setNewGroupId('')
      setShowCreate(false)
      refresh()
    } catch (err) {
      setCreateError('创建失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`确认删除用户 "${username}" ？`)) return
    setDeleteError(null)
    try {
      await deleteHrUser(id)
      refresh()
    } catch (err) {
      setDeleteError('删除失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  if (!auth) return null

  return (
    <Page
      title="用户管理"
      toolbar={
        <button onClick={() => navigate('/hr')} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          ← 返回后台
        </button>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {users.length} 个账号 · {groups.length} 个分组
        </p>
        <button type="button" onClick={() => setShowCreate((v) => !v)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showCreate ? '取消新建' : '+ 新建账号'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">新建 HR 账号</h3>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="用户名 (登录用)">
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </Field>
            <Field label="显示名 (界面显示)">
              <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </Field>
            <Field label="密码 (≥6 位)">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </Field>
            <Field label="分组">
              <select value={newGroupId} onChange={(e) => setNewGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— 选择分组 —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <button type="submit" disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700">
            {creating ? '创建中…' : '创建'}
          </button>
        </form>
      )}

      {deleteError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{deleteError}</p>}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">用户名</th>
              <th className="px-3 py-2 whitespace-nowrap">显示名</th>
              <th className="px-3 py-2 whitespace-nowrap">分组</th>
              <th className="px-3 py-2 whitespace-nowrap">创建时间</th>
              <th className="px-3 py-2 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">暂无账号</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-3 py-2 font-mono">{u.username}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{u.display_name ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className="text-slate-700 dark:text-slate-300">
                    {groups.find((g) => g.id === u.group_id)?.name ?? u.group_id}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(u.created_at).toLocaleString('zh-CN')}
                </td>
                <td className="px-3 py-2">
                  {u.id !== auth.user.id ? (
                    <button type="button" onClick={() => void handleDelete(u.id, u.username)}
                      className="text-red-600 dark:text-red-400 hover:underline text-xs">
                      删除
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">（自己）</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        注：当前 HR 密码用 SHA-256 + 用户名做盐的客户端 hash。这是 MVP 简化实现，
        上线前必须切到 Supabase Auth + 服务端 bcrypt。详见 docs/security.md。
      </p>
    </Page>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  )
}
