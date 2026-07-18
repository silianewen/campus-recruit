import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { POSITION_MAP, isPositionId } from '../lib/positions'
import { COMPANY_MAP, isCompanyId } from '../lib/companies'

export default function Success() {
  const { submissionId } = useParams()
  const [searchParams] = useSearchParams()
  const companyParam = searchParams.get('company')
  const positionParam = searchParams.get('position')
  const companyId = companyParam && isCompanyId(companyParam) ? companyParam : null
  const positionId = positionParam && isPositionId(positionParam) ? positionParam : null
  const pos = positionId ? POSITION_MAP[positionId] : null
  const company = companyId ? COMPANY_MAP[companyId] : null

  const skillTestHref = (companyId && positionId)
    ? `/skill-test?company=${companyId}&position=${positionId}`
    : '/skill-test'

  return (
    <Page title="投递成功">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">已收到你的简历</h2>
        {company && pos && (
          <p className="text-sm text-slate-500 mb-4">
            {company.name} · {pos.title}
          </p>
        )}
        <p className="text-slate-600 mb-6">
          招聘官会在 3 个工作日内查看。提交 ID: <code className="text-xs">{submissionId}</code>
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="text-sm font-semibold text-blue-900 mb-3">📝 接下来完成测评（可选）</div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/personality"
              className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
              🧠 性格测评（5 分钟）
            </Link>
            <Link to={skillTestHref}
              className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
              💼 专业能力测试（5 道题）
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-2">完成测试会大幅提高你的综合评分</p>
        </div>

        <Link to="/status" className="text-blue-600 hover:underline text-sm">
          或到状态查询页用手机号查进度 →
        </Link>
      </div>
    </Page>
  )
}