// Renders one of four branches based on async state: spinner / error+retry /
// empty / children(data).
//
// OpenSpec change: post-mvp-cleanup-and-dark-theme

import type { ReactNode } from 'react'

interface AsyncViewProps<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch?: () => void
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

export function AsyncView<T>({
  data,
  loading,
  error,
  refetch,
  isEmpty,
  empty,
  children,
}: AsyncViewProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-10" role="status" aria-label="加载中">
        <div className="animate-spin h-6 w-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 rounded-full" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
        <p className="text-sm">加载失败：{error}</p>
        {refetch && (
          <button onClick={refetch} className="mt-2 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 rounded">
            重试
          </button>
        )}
      </div>
    )
  }
  if (!data || (isEmpty && isEmpty(data))) {
    return <>{empty ?? <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">暂无数据</p>}</>
  }
  return <>{children(data)}</>
}