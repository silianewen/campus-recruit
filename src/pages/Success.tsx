import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { fetchCompanyName, fetchPosition } from '../lib/loaders'
import { useAsync } from '../hooks/useAsync'

export default function Success() {
  const { submissionId } = useParams()
  const [searchParams] = useSearchParams()
  const companyParam = searchParams.get('company')
  const positionParam = searchParams.get('position')

  const companyAsync = useAsync(() => companyParam ? fetchCompanyName(companyParam) : Promise.resolve(null), [companyParam])
  const posAsync = useAsync(() => positionParam ? fetchPosition(positionParam) : Promise.resolve(null), [positionParam])
  const companyName = companyAsync.data ?? companyParam
  const posTitle = posAsync.data?.title ?? positionParam

  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawn, setWithdrawn] = useState(false)

  const handleWithdraw = async () => {
    if (!window.confirm('确定要撤销本次投递吗？撤销后不可恢复。')) return
    if (!supabase || !submissionId) return
    setWithdrawing(true)
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', submissionId)
      if (error) throw error
      setWithdrawn(true)
    } catch (err) {
      alert('撤销失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setWithdrawing(false)
    }
  }

  const skillTestHref = (companyParam && positionParam)
    ? `/skill-test?company=${companyParam}&position=${positionParam}`
    : '/skill-test'

  return (
    <Page title="投递成功">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">已收到你的简历</h2>
        {(companyName || posTitle) && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {companyName} · {posTitle}
          </p>
        )}
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          招聘官会在 3 个工作日内查看。提交 ID: <code className="text-xs">{submissionId}</code>
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">📝 接下来完成测评（可选）</div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/personality"
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50">
              🧠 性格测评（8 分钟）
            </Link>
            <Link to={skillTestHref}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50">
              💼 专业能力测试（5 道题）
            </Link>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">完成测试会大幅提高你的综合评分</p>
        </div>

        <Link to="/status" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          或到状态查询页用手机号查进度 →
        </Link>

        {withdrawn ? (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-green-600 dark:text-green-400">✅ 已成功撤销投递</p>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => void handleWithdraw()}
              disabled={withdrawing}
              className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              {withdrawing ? '撤销中…' : '撤销投递'}
            </button>
          </div>
        )}
      </div>
    </Page>
  )
}