// Supabase client. Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from env.
// If env vars are not set, returns a stub so the app still renders a
// "请先配置 Supabase 后再使用" banner instead of crashing.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured: boolean = Boolean(url && anon)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

if (!supabaseConfigured && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set. ' +
      'Copy .env.local.example to .env.local and fill in your Supabase project keys.'
  )
}