import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="text-slate-500 hover:text-slate-900 text-sm"
          >
            ← {hasHistory ? '返回上一页' : '返回首页'}
          </button>
          <h1 className="text-lg font-semibold text-slate-900 flex-1">{title}</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {subtitle && <p className="text-slate-600 mb-4">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}