import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface PageProps {
  title: string
  subtitle?: string
  /**
   * Optional override for the back-button destination. When provided, the
   * smart "history or home" fallback is replaced with a hard "← 返回<label>"
   * link to this path. Use for HR sub-pages that should always go back to
   * the HR landing instead of wherever the user came from.
   */
  backTo?: string
  backLabel?: string
  /**
   * Optional right-aligned content rendered in the header next to the
   * theme toggle. Use for "Logout" buttons or other HR controls.
   */
  toolbar?: ReactNode
  children: ReactNode
}

export function Page({ title, subtitle, backTo, backLabel, toolbar, children }: PageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const hasHistory = location.key !== 'default'

  const back = () => {
    if (backTo) navigate(backTo)
    else if (hasHistory) navigate(-1)
    else navigate('/')
  }

  const label = backLabel ?? (hasHistory ? '返回上一页' : '返回首页')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={back}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm"
          >
            ← {label}
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1">{title}</h1>
          {toolbar}
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {subtitle && <p className="text-slate-600 dark:text-slate-400 mb-4">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}