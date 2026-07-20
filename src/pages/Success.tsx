import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
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
              🧠 性格测评（5 分钟）
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
      </div>
    </Page>
  )
}