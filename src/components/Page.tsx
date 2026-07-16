import type { ReactNode } from 'react'

interface PageProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function Page({ title, subtitle, children }: PageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="text-slate-500 hover:text-slate-900 text-sm">← 返回首页</a>
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