'use client'

import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MousePointerClick,
  QrCode as QrCodeIcon,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import React, { useState } from 'react'

interface LinkData {
  id: string
  originalUrls: string[]
  shortUrl: string
  clicks: number
  createdAt: Date
}

export function TabLinkShortener() {
  const [inputText, setInputText] = useState('')
  const [links, setLinks] = useState<LinkData[]>([])
  const [showQRModal, setShowQRModal] = useState<string | null>(null) // holds shortUrl for QR

  // QR Customization State
  const [qrFgColor, setQrFgColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [qrLogo, setQrLogo] = useState<string | null>(null)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    // Split by newline, comma, or space
    const urls = inputText.split(/[\n, ]+/).filter((u) => u.trim() !== '')
    if (urls.length === 0) return

    // Generate a hash for this batch
    const hash = Math.random().toString(36).substring(2, 8)
    const shortUrl = `vbiz.me/${hash}`

    const newLink: LinkData = {
      id: hash,
      originalUrls: urls,
      shortUrl,
      clicks: Math.floor(Math.random() * 50), // Mock some clicks for demo
      createdAt: new Date(),
    }

    setLinks([newLink, ...links])
    setInputText('')
  }

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(`https://${url}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id: string) => {
    setLinks(links.filter((l) => l.id !== id))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setQrLogo(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      {/* Header & Main Input */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
        <div className="mb-6 flex h-16 w-16 rotate-12 transform items-center justify-center rounded-[20px] bg-linear-to-tr from-slate-900 to-slate-700 shadow-xl shadow-black/10 dark:from-white dark:to-slate-300 dark:shadow-white/10">
          <Link2 className="h-8 w-8 -rotate-12 text-white dark:text-slate-900" />
        </div>
        <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl dark:text-white">
          Link{' '}
          <span className="from-primary-500 to-primary-400 bg-linear-to-r bg-clip-text text-transparent">
            Shortener
          </span>
        </h2>
        <p className="mx-auto max-w-xl text-[15px] font-medium text-slate-500 md:text-[17px] dark:text-slate-400">
          Turn long, messy URLs into clean, memorable links. Track clicks and generate QR codes instantly.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-2xl md:p-8 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-none">
          {/* Background decorative glow */}
          <div className="bg-primary-500/10 dark:bg-primary-500/5 pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full blur-[100px]" />

          <form onSubmit={handleShorten} className="relative z-10 flex flex-col gap-4">
            <div className="relative w-full">
              <div className="pointer-events-none absolute top-5 left-5 flex items-start">
                <Link2 className="h-5 w-5 text-slate-400" />
              </div>
              <textarea
                required
                placeholder="Paste one or multiple URLs here (separated by newlines)..."
                className="dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[120px] w-full resize-y rounded-[24px] border border-slate-200 bg-slate-50 py-5 pr-6 pl-12 text-[15px] font-medium text-slate-900 shadow-sm transition-all outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-white/10 dark:bg-black/50 dark:text-white"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="dark:bg-primary-600 dark:hover:bg-primary-500 flex items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-8 py-4 text-[15px] font-bold whitespace-nowrap text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-800 dark:text-white"
              >
                Shorten Link(s) <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Generated Links List */}
        {links.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <h3 className="mb-2 ml-2 text-xl font-bold text-slate-900 dark:text-white">Recent Links</h3>
            {links.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-5 rounded-[24px] border border-black/10 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center dark:border-white/10 dark:bg-[#0b0f19]"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-1.5 flex items-center gap-3">
                    <a
                      href={`https://${link.shortUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1.5 truncate text-[16px] font-black text-slate-900 transition-colors dark:text-white"
                    >
                      {link.shortUrl} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold whitespace-nowrap text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      <MousePointerClick className="h-3 w-3" /> {link.clicks} clicks
                    </span>
                  </div>
                  <p
                    className="w-full truncate text-[13px] text-slate-500 dark:text-slate-400"
                    title={link.originalUrls.join(', ')}
                  >
                    {link.originalUrls.join(', ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 border-t border-black/5 pt-4 md:gap-3 md:border-0 md:pt-0 dark:border-white/5">
                  <button
                    onClick={() => setShowQRModal(link.shortUrl)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] font-bold text-slate-700 transition-all hover:bg-slate-200 md:flex-none dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <QrCodeIcon className="h-4 w-4" /> <span className="md:hidden">QR</span>
                  </button>
                  <button
                    onClick={() => handleCopy(link.id, link.shortUrl)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all md:flex-none ${
                      copiedId === link.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {copiedId === link.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="ml-1 flex items-center justify-center rounded-xl p-2.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 md:ml-0 dark:hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value Props / Features Grid */}
      <div className="mx-auto mt-8 grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {/* Feature 1 */}
        <div className="group rounded-[32px] border border-black/5 bg-white/60 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-[#0b0f19]/60">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-400">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-[18px] font-black text-slate-900 dark:text-white">Detailed Analytics</h3>
          <p className="text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Track clicks, geographic data, and referral sources to understand your audience better.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-white/5 dark:bg-slate-900/60">
          <div className="pointer-events-none absolute top-0 right-0 p-6 opacity-10">
            <QrCodeIcon className="h-24 w-24 text-slate-900 dark:text-white" />
          </div>
          <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
            <QrCodeIcon className="h-7 w-7" />
          </div>
          <h3 className="relative z-10 mb-2 text-[18px] font-black text-slate-900 dark:text-white">
            QR Code Generator
          </h3>
          <p className="relative z-10 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Instantly create scannable QR codes for your short links, perfect for menus and print media.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="group rounded-[32px] border border-black/5 bg-white/60 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-[#0b0f19]/60">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 transition-transform group-hover:scale-110 dark:bg-fuchsia-900/40 dark:text-fuchsia-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-[18px] font-black text-slate-900 dark:text-white">Custom Aliases</h3>
          <p className="text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Create memorable custom link aliases that reflect your brand identity and campaigns.
          </p>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="animate-in fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-200 dark:bg-black/60">
          <div className="animate-in zoom-in-95 hidden-scrollbar relative max-h-[90vh] w-full max-w-[400px] overflow-hidden overflow-y-auto rounded-[32px] border border-black/10 bg-white p-8 shadow-2xl duration-300 dark:border-white/10 dark:bg-[#0b0f19]">
            <button
              onClick={() => setShowQRModal(null)}
              className="absolute top-5 right-5 z-10 rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>

            <div className="h-full py-2 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-100 text-slate-900 shadow-sm dark:bg-black/20 dark:text-white">
                <QrCodeIcon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">QR Code Ready</h3>
              <p className="mb-6 text-[15px] font-medium text-slate-500 dark:text-slate-400">
                Scan this code to instantly visit your link.
              </p>

              <div className="mx-auto mb-6 inline-block rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={`https://${showQRModal}`}
                  size={180}
                  level={'H'}
                  className="rounded-xl"
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  imageSettings={qrLogo ? { src: qrLogo, excavate: true, height: 40, width: 40 } : undefined}
                />
              </div>

              <div className="mb-8 flex flex-col gap-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 ml-1 block text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      Foreground
                    </label>
                    <div className="h-10 w-full overflow-hidden rounded-xl border border-black/10 p-0.5 dark:border-white/10">
                      <input
                        type="color"
                        value={qrFgColor}
                        onChange={(e) => setQrFgColor(e.target.value)}
                        className="h-full w-full -translate-y-1 scale-150 transform cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 ml-1 block text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      Background
                    </label>
                    <div className="h-10 w-full overflow-hidden rounded-xl border border-black/10 p-0.5 dark:border-white/10">
                      <input
                        type="color"
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        className="h-full w-full -translate-y-1 scale-150 transform cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-[12px] font-bold text-slate-500 dark:text-slate-400">
                    Custom Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="group hover:border-primary-500 relative flex items-center justify-center gap-2 overflow-hidden rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5 text-[13px] font-medium text-slate-600 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      <Upload className="group-hover:text-primary-500 h-4 w-4 transition-colors" />{' '}
                      {qrLogo ? 'Change Logo' : 'Upload Logo'}
                    </div>
                  </div>
                  {qrLogo && (
                    <button
                      onClick={() => setQrLogo(null)}
                      className="mt-1.5 ml-1 text-[11px] font-bold text-red-500 hover:underline"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const svg = document.getElementById('qr-code-svg')
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg)
                      const canvas = document.createElement('canvas')
                      const ctx = canvas.getContext('2d')
                      const img = new Image()
                      img.onload = () => {
                        canvas.width = img.width
                        canvas.height = img.height
                        ctx?.drawImage(img, 0, 0)
                        const pngFile = canvas.toDataURL('image/png')
                        const downloadLink = document.createElement('a')
                        downloadLink.download = 'qrcode.png'
                        downloadLink.href = `${pngFile}`
                        downloadLink.click()
                      }
                      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
                    }
                  }}
                  className="dark:bg-primary-600 dark:hover:bg-primary-500 flex w-full items-center justify-center gap-2 rounded-[20px] bg-slate-900 py-4 text-[15px] font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-800 dark:text-white"
                >
                  Download HD PNG <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
