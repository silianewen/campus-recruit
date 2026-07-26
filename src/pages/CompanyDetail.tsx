import { Link, useParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { useAsync } from '../hooks/useAsync'
import { AsyncView } from '../components/AsyncView'
import { fetchCompany, fetchPositionsForCompany, type PositionRow } from '../lib/loaders'
import { companyColor, companyShortName, isCompanyId } from '../lib/companies'
import { isPositionId } from '../lib/positions'

export default function CompanyDetail() {
  const { companyId } = useParams()

  const validId = companyId && isCompanyId(companyId) ? companyId : null

  const companyAsync = useAsync(() => validId ? fetchCompany(validId) : Promise.resolve(null), [validId])
  const positionsAsync = useAsync<PositionRow[]>(
    () => validId ? fetchPositionsForCompany(validId) : Promise.resolve([]),
    [validId]
  )

  if (!validId) {
    return (
      <Page title="公司详情" backTo="/" backLabel="返回投递首页">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-600 dark:text-slate-300">
          <p className="mb-4">无效的公司链接。</p>
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">← 返回投递首页</Link>
        </div>
      </Page>
    )
  }

  const company = companyAsync.data
  const headerTitle = companyShortName(validId) // 简称放头部
  const companyName = company?.name ?? validId

  return (
    <Page
      title={headerTitle}
      subtitle={companyName}
      backTo="/"
      backLabel="返回投递首页"
    >
      <AsyncView
        data={company}
        loading={companyAsync.loading}
        error={companyAsync.error}
        refetch={companyAsync.refetch}
        isEmpty={() => false}
      >
        {(c) => (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl shadow-md flex-shrink-0"
                aria-label="公司 logo 占位"
              >
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${companyColor(c.id)}`} />
                  {c.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                  {c.description?.trim() ? c.description : '公司简介待补充'}
                </p>
              </div>
            </div>
          </section>
        )}
      </AsyncView>

      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          在招岗位
          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
            ({positionsAsync.data?.length ?? 0})
          </span>
        </h3>

        <AsyncView
          data={positionsAsync.data}
          loading={positionsAsync.loading}
          error={positionsAsync.error}
          refetch={positionsAsync.refetch}
          isEmpty={(d) => d.length === 0}
          empty={
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">该公司暂无在招岗位</p>
          }
        >
          {(positions: PositionRow[]) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {positions.map((p) => (
                <Link
                  key={p.id}
                  to={
                    isCompanyId(validId) && isPositionId(p.id)
                      ? `/upload?company=${validId}&position=${p.id}`
                      : `/upload?position=${p.id}`
                  }
                  className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {p.category ?? '—'}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">点击投递 →</div>
                </Link>
              ))}
            </div>
          )}
        </AsyncView>
      </section>
    </Page>
  )
}