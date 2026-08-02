import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'

/**
 * Privacy Policy.
 *
 * Two modes:
 *  1. <Privacy /> as a page — render the content inside <Page>. Used at
 *     route /privacy if anyone deep-links there.
 *  2. <PrivacyModal open onClose /> — floating overlay on the current
 *     page (used by Upload so the form keeps state when the user comes
 *     back). Renders via portal to document.body, supports close on
 *     backdrop click, ESC, and the × button. Scroll is locked while
 *     open.
 *
 * Content is DB-driven: site_content.privacy_policy (TEXT, see migration
 * 0017). Empty value renders a placeholder card explaining the admin
 * hasn't shipped the policy yet.
 *
 * To populate:
 *   UPDATE site_content
 *      SET privacy_policy = '你的完整隐私政策正文…'
 *    WHERE id = 'singleton';
 */

async function fetchPrivacyPolicy(): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('site_content')
    .select('privacy_policy')
    .eq('id', 'singleton')
    .maybeSingle()
  if (error) throw error
  const raw = (data?.privacy_policy as string | null | undefined) ?? null
  if (!raw || !raw.trim()) return null
  return raw
}

function PrivacyBody({ body }: { body: string | null }) {
  if (!body) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">📄</div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          隐私政策待补充
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          平台管理员暂未发布隐私政策内容。
        </p>
      </div>
    )
  }
  return (
    <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
      {body}
    </div>
  )
}

export function PrivacyModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const policyAsync = useAsync(fetchPrivacyPolicy, [open])

  // Lock body scroll while the modal is open + close on ESC.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="隐私政策"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            隐私政策
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-5 overflow-y-auto">
          {policyAsync.loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">加载中…</p>
          ) : (
            <PrivacyBody body={policyAsync.data ?? null} />
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default function Privacy() {
  // Standalone /privacy route — render the same body inside <Page>.
  const policyAsync = useAsync(fetchPrivacyPolicy, [])
  const location = useLocation()
  const [now] = useState(() => new Date())
  const lastUpdated = useMemo(
    () => (policyAsync.data ? now.toLocaleDateString('zh-CN') : ''),
    [policyAsync.data, now],
  )

  return (
    <Page title="隐私政策" backTo="/" backLabel="返回投递首页">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-3xl mx-auto">
        {policyAsync.loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">加载中…</p>
        ) : policyAsync.data ? (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              最后更新：{lastUpdated}
            </p>
            <PrivacyBody body={policyAsync.data} />
            {location.pathname !== '/upload' && (
              <div className="mt-8 text-center">
                <Link
                  to="/"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  返回投递首页
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <PrivacyBody body={null} />
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                返回投递首页
              </Link>
            </div>
          </>
        )}
      </div>
    </Page>
  )
}