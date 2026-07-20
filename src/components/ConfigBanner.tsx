import { supabaseConfigured } from '../lib/supabase'

export function ConfigBanner() {
  if (supabaseConfigured) return null
  return (
    <div className="bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm px-4 py-2 text-center">
      ⚠️ Supabase 尚未配置。请复制 <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">.env.local.example</code> 为{' '}
      <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">.env.local</code>，填入 URL 与 anon key 后重启 <code>npm run dev</code>。
    </div>
  )
}