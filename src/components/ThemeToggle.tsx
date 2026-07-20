// Header icon button for theme toggle. Sun in light mode, moon in dark mode.
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
      title={isDark ? '切换到浅色主题' : '切换到深色主题'}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}