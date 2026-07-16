import { Link } from 'react-router-dom'

const POSITIONS = [
  { id: 'frontend', title: '前端工程师', desc: 'React / Vue / 移动端', color: 'bg-blue-500' },
  { id: 'backend', title: '后端工程师', desc: 'Java / Go / 数据库', color: 'bg-emerald-500' },
  { id: 'data', title: '数据分析师', desc: 'SQL / Python / 业务分析', color: 'bg-violet-500' },
  { id: 'product', title: '产品经理', desc: '需求 / 调研 / 推动落地', color: 'bg-orange-500' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">校招投递平台</h1>
          <p className="text-slate-600">扫码投递 · 在线测评 · 实时跟踪状态</p>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">📱 扫码投递简历</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {POSITIONS.map((p) => (
              <Link
                key={p.id}
                to={`/upload/${p.id}`}
                className="block rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition"
              >
                <div className={`w-2 h-2 rounded-full ${p.color} mb-2`} />
                <div className="font-semibold text-slate-900">{p.title}</div>
                <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                <div className="text-xs text-blue-600 mt-2">点击上传 →</div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            （生产环境每个岗位会配一个二维码；这里先用链接代替）
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/personality" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold text-slate-900">性格测评</div>
            <div className="text-sm text-slate-500 mt-1">20 题 MBTI 风格，了解自己</div>
          </Link>
          <Link to="/skill-test" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-semibold text-slate-900">专业能力测试</div>
            <div className="text-sm text-slate-500 mt-1">按岗位分类 · 5 分钟</div>
          </Link>
          <Link to="/status" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
            <div className="text-2xl mb-2">📬</div>
            <div className="font-semibold text-slate-900">我的投递状态</div>
            <div className="text-sm text-slate-500 mt-1">输入手机号查询</div>
          </Link>
        </section>

        <section className="bg-slate-900 text-slate-300 rounded-xl p-5 text-sm">
          <div className="font-semibold text-white mb-2">🛠️ HR 后台（仅招聘官可见）</div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/dashboard" className="text-blue-300 hover:underline">→ 简历列表 & 通知</Link>
            <span>·</span>
            <Link to="/stats" className="text-blue-300 hover:underline">→ 数据看板</Link>
          </div>
        </section>
      </div>
    </div>
  )
}