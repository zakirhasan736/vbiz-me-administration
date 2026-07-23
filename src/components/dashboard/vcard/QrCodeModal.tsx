'use client'

import { downloadQrCanvasFromContainer, readImageFileAsDataUrl } from '@/utils/vcard'
import { Download, Image as ImageIcon, QrCode, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState, type ChangeEvent } from 'react'

type QrCodeModalProps = {
  url: string
  onClose: () => void
}

export function QrCodeModal({ url, onClose }: QrCodeModalProps) {
  const [qrFgColor, setQrFgColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [qrLogo, setQrLogo] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrLogo(await readImageFileAsDataUrl(file))
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm duration-200 dark:bg-black/60">
      <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-slate-200/50 bg-white shadow-2xl duration-300 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex items-center justify-between border-b border-slate-200/50 px-6 py-5 dark:border-white/5">
          <h3 className="flex items-center gap-2 text-[18px] font-black text-slate-900 dark:text-white">
            <QrCode className="text-primary-500 h-5 w-5" />
            vCard QR Code
          </h3>
          <button
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-8">
          <div
            className="flex items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2"
            ref={qrRef}
          >
            <QRCodeCanvas
              value={url}
              size={200}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              level="H"
              includeMargin={false}
              imageSettings={qrLogo ? { src: qrLogo, height: 48, width: 48, excavate: true } : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="pl-1 text-[12px] font-bold tracking-widest text-slate-600 uppercase dark:text-slate-400">
                QR Color
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/5 dark:bg-white/2">
                <input
                  type="color"
                  value={qrFgColor}
                  onChange={(e) => setQrFgColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-xl border-none bg-transparent"
                />
                <span className="font-mono text-[13px] text-slate-600 uppercase dark:text-slate-300">{qrFgColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="pl-1 text-[12px] font-bold tracking-widest text-slate-600 uppercase dark:text-slate-400">
                Background
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/5 dark:bg-white/2">
                <input
                  type="color"
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-xl border-none bg-transparent"
                />
                <span className="font-mono text-[13px] text-slate-600 uppercase dark:text-slate-300">{qrBgColor}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="pl-1 text-[12px] font-bold tracking-widest text-slate-600 uppercase dark:text-slate-400">
              Center Logo (Optional)
            </label>
            <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/2 dark:hover:bg-white/5">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <ImageIcon className="group-hover:text-primary-500 h-5 w-5 text-slate-400 transition-colors" />
              <span className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">
                {qrLogo ? 'Change Logo' : 'Upload Logo'}
              </span>
            </label>
            {qrLogo && (
              <button
                onClick={() => setQrLogo(null)}
                className="self-start pl-1 text-[12px] font-medium text-red-500 hover:underline"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/1">
          <button
            onClick={() => downloadQrCanvasFromContainer(qrRef.current)}
            className="bg-primary-600 hover:bg-primary-700 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Download QR Code
          </button>
        </div>
      </div>
    </div>
  )
}
