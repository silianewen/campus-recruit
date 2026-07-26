// CSV export helpers — client-side serialization of the HR list.
// UTF-8 with BOM so Excel / WPS pick up Chinese characters correctly.
//
// P3 of post-mvp-feature-gaps.

export function escapeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function rowsToCsv(headers: string[], rows: unknown[][]): string {
  return '﻿' +
    [headers, ...rows].map((r) => r.map(escapeCsvCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
