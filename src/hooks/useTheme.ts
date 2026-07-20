// Theme management — light/dark toggle persisted in localStorage.
//
// Strategy: `class` on <html>. The inline boot script in index.html reads
// localStorage and applies the class before React mounts to prevent FOUC.
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  // First visit: respect OS preference.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  // Apply theme to <html> on mount + whenever it changes.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const set = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t)
    setTheme(t)
  }, [])

  return { theme, toggle, setTheme: set }
}