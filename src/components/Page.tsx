import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface PageProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function Page({ title, subtitle, children }: PageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  // React Router sets location.key = 'default' on initial entry; any push increments it.
  // So we can detect whether there's history to go back to.
  const hasHistory = location.key !== 'default'
  const goBack = () => {
    if (hasHistory) navigate(-1)
    else navigate('/')
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm"
          >
            ← {hasHistory ? '返回上一页' : '返回首页'}
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1">{title}</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {subtitle && <p className="text-slate-600 dark:text-slate-400 mb-4">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}