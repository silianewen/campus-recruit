// scripts/seed-test-data.mjs
// Inserts 50 fake resumes + submissions + a few notifications / personality / skill results
// into the production Supabase project. Used for Day 7 stress-test demo data.
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local — same keys the
// app uses, no service_role needed (RLS is intentionally disabled for MVP).
//
// Run: node scripts/seed-test-data.mjs
// Re-running is safe: it checks for existing rows first and exits if any are found.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

if (!existsSync(envPath)) {
  console.error('✗ .env.local not found at', envPath)
  process.exit(1)
}

// Minimal .env parser — no need for dotenv package
function loadEnv(path) {
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

const env = loadEnv(envPath)
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('✗ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anon, { auth: { persistSession: false } })

// =========================================================================
// Realistic seed pools
// =========================================================================
const SURNAMES = ['张', '王', '李', '赵', '陈', '杨', '黄', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗', '郑', '梁']
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英']

const MAJOR_POOL = [
  { name: '计算机科学与技术', weight: 15 },
  { name: '软件工程', weight: 10 },
  { name: '数据科学与大数据技术', weight: 8 },
  { name: '人工智能', weight: 5 },
  { name: '电子信息工程', weight: 4 },
  { name: '信息管理与信息系统', weight: 3 },
  { name: '工商管理', weight: 2 },
  { name: '市场营销', weight: 2 },
  { name: '产品设计', weight: 1 },
]

const UNIVERSITY_POOL = [
  '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学',
  '南京大学', '中国科学技术大学', '武汉大学', '中山大学', '同济大学',
  '哈尔滨工业大学', '西安交通大学', '北京航空航天大学', '北京邮电大学', '华东师范大学',
]

const POSITION_DISTRIBUTION = [
  { id: 'frontend', weight: 20 },
  { id: 'backend',  weight: 15 },
  { id: 'data',     weight: 10 },
  { id: 'product',  weight: 5  },
]

const STATUS_DISTRIBUTION = [
  { id: 'submitted',            weight: 35 },
  { id: 'reviewed',             weight: 8  },
  { id: 'interview_scheduled',  weight: 5  },
  { id: 'interviewed',          weight: 1  },
  { id: 'offered',              weight: 1  },
]

// =========================================================================
// Weighted random helpers
// =========================================================================
function pickWeighted(items) {
  const total = items.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function randPhone() {
  // Fake but valid-format 11-digit mobile number
  return `138${String(randInt(10000000, 99999999))}`
}

function randName() {
  return pick(SURNAMES) + pick(GIVEN_NAMES) + (Math.random() < 0.4 ? pick(GIVEN_NAMES) : '')
}

function randTimestamp(daysBack = 7) {
  const now = Date.now()
  const offset = Math.random() * daysBack * 24 * 3600 * 1000
  return new Date(now - offset).toISOString()
}

// =========================================================================
// Main
// =========================================================================
async function main() {
  // Fetch companies from DB (if any). Empty array if table has no rows yet.
  const { data: companyRows, error: compErr } = await supabase
    .from('companies')
    .select('id')
  if (compErr) throw compErr
  const companyIds = (companyRows ?? []).map((c) => c.id)
  if (companyIds.length > 0) {
    console.log(`✓ Found ${companyIds.length} companies; will assign them to new + existing rows.`)
  } else {
    console.log('ℹ No companies in DB yet — new submissions will have company_id = NULL.')
  }

  // Idempotency guard: if submissions already exist, do ONLY a company_id
  // backfill pass and exit (the user opted to migrate old records to random
  // companies rather than wipe them).
  const { count: existing } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
  if (existing && existing > 0) {
    if (companyIds.length === 0) {
      console.log(`✓ Skipped: ${existing} submissions already exist; no companies in DB to backfill with.`)
      process.exit(0)
    }
    console.log(`→ Backfilling company_id on existing rows…`)
    const { data: oldResumes, error: rErr } = await supabase
      .from('resumes')
      .select('id, company_id')
      .is('company_id', null)
    if (rErr) throw rErr
    let rUpdated = 0
    for (const r of (oldResumes ?? [])) {
      const cid = pick(companyIds)
      const { error: u1 } = await supabase.from('resumes').update({ company_id: cid }).eq('id', r.id)
      if (u1) { console.warn('resume update failed:', u1.message); continue }
      const { error: u2 } = await supabase
        .from('submissions')
        .update({ company_id: cid })
        .eq('resume_id', r.id)
        .is('company_id', null)
      if (u2) { console.warn('submission update failed:', u2.message); continue }
      rUpdated++
    }
    console.log(`✓ Backfilled ${rUpdated} existing resume/submission pairs to random companies.`)
    console.log(`  (Total submissions: ${existing}, untouched) `)
    process.exit(0)
  }

  console.log('→ Seeding 50 fake resumes + submissions…')

  const resumes = []
  const submissions = []

  for (let i = 0; i < 50; i++) {
    const major = pickWeighted(MAJOR_POOL).name
    const position = pickWeighted(POSITION_DISTRIBUTION).id
    const status = pickWeighted(STATUS_DISTRIBUTION).id
    const createdAt = randTimestamp(7)
    const companyId = companyIds.length > 0 ? pick(companyIds) : null

    const resume = {
      student_name: randName(),
      phone: randPhone(),
      email: `${randInt(1000, 9999)}@example.com`,
      major,
      university: pick(UNIVERSITY_POOL),
      position_id: position,
      company_id: companyId,
      file_url: `https://placeholder.example.com/resume-${i + 1}.pdf`,
      file_name: `${randName()}_简历.pdf`,
      file_size: randInt(80_000, 2_000_000),
      created_at: createdAt,
    }
    resumes.push(resume)
  }

  // Insert resumes in one batch
  const { data: insertedResumes, error: resumeErr } = await supabase
    .from('resumes')
    .insert(resumes)
    .select('id, position_id, company_id, created_at')
  if (resumeErr) throw resumeErr

  // Build submissions with matching status distribution
  for (const r of insertedResumes) {
    const status = pickWeighted(STATUS_DISTRIBUTION).id
    submissions.push({
      resume_id: r.id,
      position_id: r.position_id,
      company_id: r.company_id,
      channel: 'qr-homepage',
      status,
      created_at: r.created_at,
      updated_at: r.created_at,
    })
  }

  const { error: subErr } = await supabase.from('submissions').insert(submissions)
  if (subErr) throw subErr

  // Seed a few notifications for ~10 of the interview_scheduled phones
  const phones = [...new Set(insertedResumes.slice(0, 15).map(() => randPhone()))]
  const notifications = phones.map((phone, i) => ({
    phone,
    title: '面试通知',
    content: `同学你好，恭喜你通过 ${pick(UNIVERSITY_POOL)} 招聘的简历初筛。面试时间：${randInt(2026, 2026)} 年 ${randInt(7, 8)} 月 ${randInt(10, 28)} 日 ${randInt(10, 18)}:00。请准时参加。`,
    type: 'interview_invite',
    created_at: randTimestamp(3),
  }))
  const { error: notifErr } = await supabase.from('notifications').insert(notifications)
  if (notifErr) throw notifErr

  // Seed ~5 personality + ~10 skill results for variety on status page
  const personalities = phones.slice(0, 5).map((phone) => ({
    phone,
    scores: { E: 3, I: 2, S: 2, N: 3, T: 3, F: 2, J: 2, P: 3 },
    mbti_type: pick(['INTJ', 'ENFP', 'ISTP', 'INFJ', 'ENTJ']),
    created_at: randTimestamp(5),
  }))
  const { error: pErr } = await supabase.from('personality_results').insert(personalities)
  if (pErr) throw pErr

  const skills = phones.slice(0, 10).map((phone) => ({
    phone,
    position_id: pick(['frontend', 'backend', 'data', 'product']),
    score: randInt(2, 5),
    total: 5,
    answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'A', q5: 'B' },
    created_at: randTimestamp(5),
  }))
  const { error: sErr } = await supabase.from('skill_results').insert(skills)
  if (sErr) throw sErr

  console.log(`✓ Inserted ${insertedResumes.length} resumes + ${submissions.length} submissions + ${notifications.length} notifications + ${personalities.length} personality + ${skills.length} skill results`)
  console.log('')
  console.log('Open https://campusrecruitment.vercel.app/dashboard to see the data.')
  console.log('Open https://campusrecruitment.vercel.app/stats to see the ECharts.')
}

main().catch((err) => {
  console.error('✗ Seed failed:', err.message ?? err)
  process.exit(1)
})