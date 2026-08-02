import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'

/**
 * Privacy Policy page.
 *
 * Content is DB-driven: site_content.privacy_policy (TEXT, see migration
 * 0017). When the column is empty the page shows a placeholder so the
 * route exists for the user to point to without forcing them to ship the
 * legal text on day one. The student Upload page links to /privacy
 * (`target="_blank"`) — opening in a new tab means the upload form
 * keeps its state when they come back.
 *
 * To populate:
 *   UPDATE site_content
 *      SET privacy_policy = '你的完整隐私政策正文…'
 *    WHERE id = 'singleton';
 *
 * Plain-text: blank lines render as paragraph breaks (CSS
 * `whitespace-pre-wrap`). Add bold/links later if needed; for an MVP,
 * plain text is fine.
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

export default function Privacy() {
  const policyAsync = useAsync(fetchPrivacyPolicy, [])
  const [now] = useState(() => new Date())

  const lastUpdated = useMemo(() => {
    if (policyAsync.data) {
      // Heuristic: just show the date the user opened the page if the DB
      // didn't store a dedicated updated_at column for privacy policy.
      return now.toLocaleDateString('zh-CN')
    }
    return ''
  }, [policyAsync.data, now])

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
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {policyAsync.data}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              隐私政策待补充
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              平台管理员暂未发布隐私政策内容。如需立即启用，请在
              Supabase → site_content 表中设置 <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">privacy_policy</code> 字段。
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              返回投递首页
            </Link>
          </div>
        )}
      </div>
    </Page>
  )
}