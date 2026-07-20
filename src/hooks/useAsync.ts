// Generic async loader hook. Tracks loading / error / data state and exposes
// a `refetch` function so the caller can render a retry button.
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme

import { useState, useEffect, useCallback, useRef } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const run = useCallback(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    loaderRef.current()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }) })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setState({ data: null, loading: false, error: msg })
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, refetch: run }
}