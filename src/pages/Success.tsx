import { useParams } from 'react-router-dom'
import { Page } from '../components/Page'

export default function Success() {
  const { submissionId } = useParams()
  return (
    <Page title="投递成功">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">已收到你的简历</h2>
        <p className="text-slate-600 mb-4">
          招聘官会在 3 个工作日内查看，可在
          <a href="/status" className="text-blue-600 hover:underline mx-1">状态查询</a>
          页用手机号查看进度。
        </p>
        <p className="text-xs text-slate-400">提交 ID: {submissionId}</p>
      </div>
    </Page>
  )
}