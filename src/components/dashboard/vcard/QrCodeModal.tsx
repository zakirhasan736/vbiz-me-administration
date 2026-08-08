'use client'

import { cn } from '@/utils/cn'
import { Check, Copy, Download, ImageIcon, Link2, QrCode, Sparkles, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'

const PRESETS = [
  { fg: '#0f172a', bg: '#ffffff', label: 'Ink' },
  { fg: '#4f46e5', bg: '#ffffff', label: 'Indigo' },
  { fg: '#0d9488', bg: '#ffffff', label: 'Teal' },
  { fg: '#be123c', bg: '#fff1f2', label: 'Rose' },
  { fg: '#ffffff', bg: '#0f172a', label: 'Inverse' },
] as const

type QrCodeModalProps = {
  open: boolean
  onClose: () => void
  url: string
  title?: string
  subtitle?: string
  allowLogo?: boolean
  zIndexClass?: string
  onCopyLink?: () => void
}

export function QrCodeModal({
  open,
  onClose,
  url,
  title = 'vCard QR Code',
  subtitle,
  allowLogo = true,
  zIndexClass = 'z-[80]',
  onCopyLink,
}: QrCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [fg, setFg] = useState('#4f46e5')
  const [bg, setBg] = useState('#ffffff')
  const [logo, setLogo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  // Reset ephemeral UI flags when the modal opens (avoid setState in an effect).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCopied(false)
      setDownloaded(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !url || typeof document === 'undefined') return null

  const shortLabel = (() => {
    try {
      const u = new URL(url)
      return `${u.host}${u.pathname}`.replace(/\/$/, '')
    } catch {
      return url
    }
  })()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      onCopyLink?.()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `vbiz-qr-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 1800)
  }

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(String(ev.target?.result || ''))
    reader.readAsDataURL(file)
  }

  return createPortal(
    <div className={cn('fixed inset-0 flex items-center justify-center p-4 sm:p-6', zIndexClass)}>
      <div
        className="animate-in fade-in absolute inset-0 bg-slate-950/55 backdrop-blur-md duration-200 dark:bg-black/70"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vcard-qr-title"
        className="animate-in zoom-in-95 fade-in relative w-full max-w-105 duration-300"
      >
        <div className="pointer-events-none absolute -inset-8 rounded-[48px] bg-linear-to-br from-indigo-500/25 via-teal-400/10 to-transparent blur-2xl" />

        <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_32px_80px_-20px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[#0a0e18]">
          <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-teal-400 to-violet-500" />

          <div className="relative px-5 pt-5 pb-2 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-2.5 py-1 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  <span className="text-[9px] font-black tracking-[0.14em] text-indigo-600 uppercase dark:text-indigo-300">
                    Scan · Share · Print
                  </span>
                </div>
                <h3
                  id="vcard-qr-title"
                  className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 sm:text-xl dark:text-white"
                >
                  <QrCode className="h-5 w-5 shrink-0 text-indigo-500" />
                  <span className="truncate">{title}</span>
                </h3>
                {(subtitle || shortLabel) && (
                  <p className="mt-1 truncate text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    {subtitle || shortLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-5 pb-5 sm:px-6">
            <div className="relative mx-auto mt-1">
              <div className="absolute inset-0 rounded-[28px] bg-linear-to-b from-slate-100 to-slate-50 dark:from-white/4 dark:to-transparent" />
              <div
                ref={qrRef}
                className="relative mx-auto flex items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6 dark:border-white/10"
                style={{ backgroundColor: bg }}
              >
                <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
                  <QRCodeCanvas
                    value={url}
                    size={220}
                    fgColor={fg}
                    bgColor={bg}
                    level="H"
                    includeMargin={false}
                    imageSettings={logo ? { src: logo, height: 44, width: 44, excavate: true } : undefined}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="group flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-left transition-colors hover:border-indigo-300 dark:border-white/10 dark:bg-white/3 dark:hover:border-indigo-500/40"
              title="Copy public URL"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/10">
                <Link2 className="h-3.5 w-3.5 text-indigo-500" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">Public link</span>
                <span className="block truncate font-mono text-[12px] font-bold text-slate-700 dark:text-slate-200">
                  {shortLabel}
                </span>
              </span>
              <span className="shrink-0 text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Copied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </span>
                )}
              </span>
            </button>

            <div>
              <p className="mb-2 px-0.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Style presets
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const active = fg === p.fg && bg === p.bg
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setFg(p.fg)
                        setBg(p.bg)
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-all',
                        active
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/2 dark:text-slate-300'
                      )}
                    >
                      <span
                        className="h-4 w-4 rounded-md border border-black/10 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }}
                      />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={cn('grid gap-3', allowLogo ? 'grid-cols-3' : 'grid-cols-2')}>
              <label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 transition-colors hover:border-indigo-300/60 dark:border-white/10 dark:bg-white/2">
                <span className="mb-1.5 block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                  QR color
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="truncate font-mono text-[11px] font-bold text-slate-600 uppercase dark:text-slate-300">
                    {fg}
                  </span>
                </span>
              </label>
              <label className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/60 p-2.5 transition-colors hover:border-indigo-300/60 dark:border-white/10 dark:bg-white/2">
                <span className="mb-1.5 block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                  Background
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="truncate font-mono text-[11px] font-bold text-slate-600 uppercase dark:text-slate-300">
                    {bg}
                  </span>
                </span>
              </label>
              {allowLogo && (
                <div className="flex flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-2.5 dark:border-white/15 dark:bg-white/2">
                  <span className="mb-1.5 block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                    Logo
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <ImageIcon className="h-3.5 w-3.5" />
                    {logo ? 'Change' : 'Add'}
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="mt-1 text-left text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[12px] font-black tracking-wider text-slate-800 uppercase transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/4 dark:text-white dark:hover:bg-white/8"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-[12px] font-black tracking-wider text-white uppercase shadow-lg shadow-indigo-500/20 transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {downloaded ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {downloaded ? 'Saved' : 'Download'}
              </button>
            </div>

            <p className="pb-1 text-center text-[11px] font-medium text-slate-400">
              Point any camera at the code to open this vCard instantly.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
