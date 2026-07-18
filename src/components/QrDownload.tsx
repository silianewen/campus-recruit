// Client-side QR code generator for static URLs (e.g. home page).
// Uses the `qrcode` npm package; renders the QR inline + offers a "下载 PNG"
// download so HR can print posters for students to scan.

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  text: string
  filename?: string
  size?: number // px square
  caption?: string
}

export function QrDownload({ text, filename = 'campus-recruit-qr.png', size = 200, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, text, { width: size, margin: 1 })
        .then(() => QRCode.toDataURL(text, { width: 1024, margin: 2 }))
        .then((url) => { if (!cancelled) setDataUrl(url) })
        .catch(() => { /* surface in UI later if needed */ })
    }
    return () => { cancelled = true }
  }, [text, size])

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-lg border border-slate-200" />
      {caption && <div className="text-xs text-slate-500">{caption}</div>}
      {dataUrl && (
        <a
          href={dataUrl}
          download={filename}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
        >
          下载二维码 PNG
        </a>
      )}
    </div>
  )
}
