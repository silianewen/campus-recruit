import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Page'
import { supabase } from '../lib/supabase'
import { POSITION_MAP, isPositionId } from '../lib/positions'
import { COMPANY_MAP, isCompanyId } from '../lib/companies'
import type { Submission } from '../lib/types'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function Upload() {
  const [searchParams] = useSearchParams()
  const companyParam = searchParams.get('company')
  const positionParam = searchParams.get('position')

  const companyId = companyParam && isCompanyId(companyParam) ? companyParam : null
  const positionId = positionParam && isPositionId(positionParam) ? positionParam : null
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [major, setMajor] = useState('')
  const [university, setUniversity] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const company = companyId ? COMPANY_MAP[companyId] : null
  const pos = positionId ? POSITION_MAP[positionId] : null

  const handleFile = (f: File | null) => {
    setError(null)
    if (!f) { setFile(null); return }
    if (f.size > MAX_FILE_BYTES) {
      setError(`文件超过 10MB（当前 ${(f.size / 1024 / 1024).toFixed(1)} MB）`)
      return
    }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('仅支持 PDF / Word 文档')
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!supabase) { setError('Supabase 未配置'); return }
    if (!companyId) { setError('请从首页选择公司后再投递'); return }
    if (!positionId) { setError('请从首页选择岗位后再投递'); return }
    if (!name.trim() || !phone.trim() || !major.trim() || !university.trim()) {
      setError('请填写所有必填项'); return
    }
    if (!file) { setError('请选择简历文件'); return }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError('手机号格式不正确'); return
    }

    setSubmitting(true)
    try {
      // 1. Duplicate check — same phone + same company + same position blocked.
      //    (Same phone can apply to same role at different companies.)
      const { data: existing, error: dupErr } = await supabase
        .from('resumes')
        .select('id, submissions!inner(position_id, company_id, status)')
        .eq('phone', phone.trim())
        .eq('company_id', companyId)
        .eq('submissions.position_id', positionId)
        .limit(1)
      if (dupErr) throw dupErr
      if (existing && existing.length > 0) {
        throw new Error('同一公司同一岗位不可重复投递，请勿重复提交')
      }

      // 2. Upload file to Storage
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('resumes')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('resumes').getPublicUrl(path)
      const fileUrl = pub.publicUrl

      // 3. Insert resume row
      const { data: resumeRow, error: insErr } = await supabase
        .from('resumes')
        .insert({
          student_name: name.trim(),
          phone: phone.trim(),
          major: major.trim(),
          university: university.trim(),
          company_id: companyId,
          position_id: positionId,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
        })
        .select('id')
        .single()
      if (insErr) throw insErr

      // 4. Insert submission row
      const { data: subRow, error: subErr } = await supabase
        .from('submissions')
        .insert({
          resume_id: resumeRow.id,
          company_id: companyId,
          position_id: positionId,
          channel: 'qr-homepage',
          status: 'submitted',
        })
        .select('id')
        .single()
      if (subErr) throw subErr

      navigate(`/success/${(subRow as Pick<Submission, 'id'>).id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`投递失败：${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!companyId || !positionId) {
    return (
      <Page title="扫码投递">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
          <p className="mb-4">缺少公司或岗位参数。</p>
          <p className="text-sm text-slate-500 mb-4">请通过首页选择公司和岗位后再投递。</p>
          <a href="/" className="text-blue-600 hover:underline">← 返回首页选择</a>
        </div>
      </Page>
    )
  }

  return (
    <Page
      title={`投递：${pos?.title ?? positionId}`}
      subtitle={`公司：${company?.name ?? companyId} · 岗位：${pos?.title ?? positionId}`}
    >
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="姓名" required>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </Field>
          <Field label="手机号" required>
            <input
              type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="11 位手机号"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </Field>
          <Field label="专业" required>
            <input
              type="text" required value={major} onChange={(e) => setMajor(e.target.value)}
              placeholder="如：计算机科学与技术"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </Field>
          <Field label="学校" required>
            <input
              type="text" required value={university} onChange={(e) => setUniversity(e.target.value)}
              placeholder="如：清华大学"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </Field>
          <Field label="简历文件 (PDF / Word, ≤10MB)" required>
            <input
              ref={fileInputRef} type="file" required
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && <p className="text-xs text-slate-500 mt-1">已选：{file.name}（{(file.size / 1024).toFixed(0)} KB）</p>}
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中…' : '提交投递'}
          </button>
          <p className="text-xs text-slate-400 text-center">
            公司：<code>{companyId}</code> · 岗位：<code>{positionId}</code> · 用于本次投递
          </p>
        </form>
      </div>
    </Page>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}