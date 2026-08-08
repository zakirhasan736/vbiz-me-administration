'use client'

import { cn } from '@/utils/cn'
import {
  Check,
  ChevronDown,
  CreditCard,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Palette,
  Upload,
  Video,
  Wand2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export type MediaAsset = {
  id: string
  name: string
  url: string
  kind: 'image' | 'video'
  thumb?: string
}

export type MediaSourceMode = 'image' | 'video' | 'both'

const CANVA_KEY = 'vbiz_canva_connected'

export function isCanvaConnected() {
  try {
    return localStorage.getItem(CANVA_KEY) === '1'
  } catch {
    return false
  }
}

export function setCanvaConnected(v: boolean) {
  try {
    if (v) localStorage.setItem(CANVA_KEY, '1')
    else localStorage.removeItem(CANVA_KEY)
  } catch {
    /* ignore */
  }
}

/** Demo Canva library — after connect, user picks from this list */
export const CANVA_LIBRARY: MediaAsset[] = [
  {
    id: 'c_img_1',
    name: 'Brand Hero Banner',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_img_2',
    name: 'Profile Cover Gradient',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_img_3',
    name: 'Team Photo Layout',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_img_4',
    name: 'Service Card Visual',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_vid_1',
    name: 'Intro — Abstract Particles',
    kind: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_vid_2',
    name: 'Intro — Neon Motion',
    kind: 'video',
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'c_vid_3',
    name: 'Product Loop',
    kind: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=300',
  },
]

const GALLERY_VIDEOS = [
  {
    id: 1,
    title: 'Abstract Particles',
    img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=200',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 2,
    title: 'Neon Lights',
    img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300&h=200',
    url: 'https://www.w3schools.com/html/movie.mp4',
  },
  {
    id: 3,
    title: 'Cyberpunk City',
    img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=300&h=200',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 4,
    title: 'Nature Reveal',
    img: 'https://images.unsplash.com/photo-1444464666168-49b626422201?auto=format&fit=crop&q=80&w=300&h=200',
    url: 'https://www.w3schools.com/html/movie.mp4',
  },
]

function FieldGroup({ label, children, icon }: { label: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="group flex flex-col space-y-1.5">
      <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-slate-500/70">
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-primary-500 shadow-sm'

function GalleryModal({ onClose, onSelect }: { onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  return (
    <div className="animate-in fade-in fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md duration-200 dark:bg-black/60">
      <div className="w-full max-w-3xl overflow-hidden rounded-4xl border border-slate-200/50 bg-white shadow-2xl dark:border-white/5 dark:bg-[#0b0f19]">
        <div className="flex items-center justify-between border-b border-slate-200/50 p-6 dark:border-white/5">
          <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white">
            <span className="rounded-xl bg-amber-50 p-2 dark:bg-amber-500/10">
              <LayoutGrid className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </span>
            Choose from Gallery
          </h3>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2.5 dark:bg-white/5">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="grid max-h-[60vh] grid-cols-1 gap-5 overflow-y-auto p-8 sm:grid-cols-2 md:grid-cols-4">
          {GALLERY_VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                onSelect({
                  id: `gal_${v.id}`,
                  name: v.title,
                  url: v.url,
                  kind: 'video',
                  thumb: v.img,
                })
              }
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-[20px] border-2 border-transparent bg-slate-200 text-left shadow-sm hover:border-amber-500 dark:bg-slate-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.img}
                alt={v.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 group-hover:opacity-100">
                <span className="truncate text-[12px] font-bold text-white">{v.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CustomOrderModal({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 })

  useEffect(() => {
    if (!confirmed) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [confirmed])

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-4xl border border-emerald-500/20 bg-white p-8 text-center shadow-2xl dark:bg-[#0b0f19]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Order Confirmed!</h3>
          <p className="mb-8 text-[14px] font-medium text-slate-500">
            Your custom video is in the works. We&apos;ll notify you when it&apos;s ready.
          </p>
          <div className="mb-8 rounded-[20px] border border-black/5 bg-slate-50 p-6 dark:border-white/5 dark:bg-[#0b0f19]">
            <p className="mb-3 text-[12px] font-bold tracking-widest text-slate-500 uppercase">Estimated Delivery</p>
            <div className="flex items-center justify-center gap-4 text-3xl font-black text-amber-600">
              <span>{timeLeft.hours.toString().padStart(2, '0')}</span>:
              <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>:
              <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-[14px] font-bold text-white hover:bg-emerald-400"
          >
            Return to Editor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-black/80 p-4 py-10 backdrop-blur-sm">
      <div className="my-auto w-full max-w-5xl overflow-hidden rounded-4xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex items-start justify-between gap-4 border-b border-black/5 p-6 sm:p-8 dark:border-white/5">
          <div>
            <h3 className="mb-1 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
              <Wand2 className="h-6 w-6 text-amber-500" />
              Custom Made Video
            </h3>
            <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-500" /> Secure SSL Encrypted Checkout
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-black/5 p-3 dark:bg-white/5">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row">
          <div className="space-y-6 p-6 sm:p-8 md:w-1/2">
            <div className="flex gap-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] border border-black/5 dark:border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=200&h=200"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Premium Custom Intro</h4>
                <p className="text-[13px] text-slate-500">Tailored to your brand.</p>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  $49.99 <span className="ml-2 text-xs text-slate-400 line-through">$99.99</span>
                </div>
              </div>
            </div>
            <FieldGroup label="Design Instructions">
              <textarea
                placeholder="Colors, feeling, style…"
                className="min-h-25 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[13px] outline-none dark:border-white/10 dark:bg-slate-800"
              />
            </FieldGroup>
            <div className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-dashed border-slate-200 p-6 dark:border-white/20">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-500">Pick logo / assets…</span>
            </div>
          </div>
          <div className="space-y-4 border-t border-black/5 bg-slate-100 p-6 sm:p-8 md:w-1/2 md:border-t-0 md:border-l dark:border-white/5 dark:bg-[#09090b]">
            <h4 className="mb-2 text-[13px] font-bold tracking-widest text-slate-500 uppercase">Billing</h4>
            <FieldGroup label="Email" icon={<Mail className="h-4 w-4" />}>
              <input type="email" placeholder="you@example.com" className={`${inputClasses} pl-10`} />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="First Name">
                <input type="text" placeholder="John" className={inputClasses} />
              </FieldGroup>
              <FieldGroup label="Last Name">
                <input type="text" placeholder="Doe" className={inputClasses} />
              </FieldGroup>
            </div>
            <FieldGroup label="Billing Address" icon={<MapPin className="h-4 w-4" />}>
              <input type="text" placeholder="123 Main St" className={`${inputClasses} pl-10`} />
            </FieldGroup>
            <div className="space-y-3 rounded-[20px] border border-slate-200 bg-white p-5 dark:border-[#27272a] dark:bg-[#0b0f19]">
              <span className="flex items-center gap-2 text-[12px] font-bold text-slate-500 uppercase">
                <CreditCard className="h-4 w-4 text-emerald-500" /> Credit Card
              </span>
              <input type="text" placeholder="Card Number" className={inputClasses} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="MM/YY" className={inputClasses} />
                <input type="text" placeholder="CVC" className={inputClasses} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className="w-full rounded-2xl bg-amber-600 px-6 py-4 text-[15px] font-black text-white hover:bg-amber-700"
            >
              Pay $49.99 & Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CanvaConnectModal({
  mode,
  onClose,
  onConnected,
}: {
  mode: MediaSourceMode
  onClose: () => void
  onConnected: () => void
}) {
  const [step, setStep] = useState<'connect' | 'connecting' | 'connected'>('connect')

  return (
    <div className="animate-in fade-in fixed inset-0 z-120 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-100 rounded-[28px] border border-black/10 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/5 p-2 dark:bg-white/5"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <div className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-linear-to-tr from-[#00C4CC] to-[#7D2AE8] p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-[#0b0f19]">
              <Palette className="h-10 w-10 text-[#00C4CC]" />
            </div>
          </div>
          <h3 className="mb-2 text-[22px] font-black text-slate-900 dark:text-white">Canva Integration</h3>
          <p className="mb-8 text-[14px] leading-relaxed font-medium text-slate-500">
            {step === 'connect' &&
              `Connect Canva to pick ${mode === 'video' ? 'videos' : mode === 'image' ? 'images' : 'images & videos'} for this field.`}
            {step === 'connecting' && 'Securely connecting to Canva…'}
            {step === 'connected' && 'Connected! Choose a design from the dropdown below the buttons.'}
          </p>
          {step === 'connect' && (
            <button
              type="button"
              onClick={() => {
                setStep('connecting')
                window.setTimeout(() => {
                  setCanvaConnected(true)
                  setStep('connected')
                  window.setTimeout(() => {
                    onConnected()
                    onClose()
                  }, 700)
                }, 1200)
              }}
              className="w-full rounded-2xl border border-[#00C4CC]/40 bg-[#00C4CC]/15 py-4 text-[15px] font-bold text-[#00C4CC] transition-all hover:bg-[#00C4CC] hover:text-white"
            >
              Connect Canva
            </button>
          )}
          {step === 'connecting' && (
            <div className="flex justify-center py-4 text-[#00C4CC]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {step === 'connected' && (
            <div className="flex justify-center py-2 text-emerald-500">
              <Check className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Props = {
  mode?: MediaSourceMode
  onSelect: (asset: MediaAsset) => void
  className?: string
  /** Compact layout under a choose-file strip */
  compact?: boolean
}

/**
 * Connect Canva (+ Gallery / Custom Made for video fields).
 * After Canva connect, shows a dropdown of Canva assets to auto-fill the field.
 */
export function MediaSourceActions({ mode = 'image', onSelect, className, compact }: Props) {
  const [connected, setConnected] = useState(isCanvaConnected)
  const [showCanva, setShowCanva] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [pickedId, setPickedId] = useState('')

  useEffect(() => {
    const sync = () => setConnected(isCanvaConnected())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const showVideoExtras = mode === 'video' || mode === 'both'

  const library = useMemo(() => {
    if (mode === 'image') return CANVA_LIBRARY.filter((a) => a.kind === 'image')
    if (mode === 'video') return CANVA_LIBRARY.filter((a) => a.kind === 'video')
    return CANVA_LIBRARY
  }, [mode])

  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-[14px] text-[13px] font-bold transition-all active:scale-[0.98] whitespace-nowrap'

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-2', compact ? 'gap-2' : 'gap-3')}>
        <button
          type="button"
          onClick={() => {
            if (!connected) setShowCanva(true)
          }}
          className={cn(
            btnBase,
            compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
            'border border-[#00C4CC]/40 bg-[#00C4CC]/10 text-[#00C4CC] hover:border-[#00C4CC] hover:bg-[#00C4CC] hover:text-white',
            connected && 'cursor-default hover:bg-[#00C4CC]/10 hover:text-[#00C4CC]'
          )}
          title={connected ? 'Canva linked — pick an asset below' : 'Connect your Canva account'}
        >
          <Palette className="h-4 w-4" />
          {connected ? 'Canva Connected' : 'Connect Canva'}
        </button>

        {showVideoExtras && (
          <>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className={cn(
                btnBase,
                compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
                'border border-amber-500/35 bg-amber-500/10 text-amber-600 hover:border-amber-500 hover:bg-amber-500/20 dark:text-amber-400'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Gallery
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className={cn(
                btnBase,
                compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
                'border border-amber-500/35 bg-amber-500/10 text-amber-600 hover:border-amber-500 hover:bg-amber-500/20 dark:text-amber-400'
              )}
            >
              <Wand2 className="h-4 w-4" />
              Custom Made
            </button>
          </>
        )}
      </div>

      {connected && (
        <div className="relative">
          <label className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Select from Canva library
          </label>
          <div className="relative">
            <select
              value={pickedId}
              onChange={(e) => {
                const id = e.target.value
                setPickedId(id)
                const asset = library.find((a) => a.id === id)
                if (asset) onSelect(asset)
              }}
              className="w-full appearance-none rounded-[14px] border border-[#00C4CC]/35 bg-[#00C4CC]/5 px-4 py-3 pr-10 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#00C4CC] focus:ring-1 focus:ring-[#00C4CC]/40 dark:bg-[#00C4CC]/10 dark:text-slate-100"
            >
              <option value="">
                {mode === 'video'
                  ? 'Choose a Canva video…'
                  : mode === 'image'
                    ? 'Choose a Canva image…'
                    : 'Choose a Canva image or video…'}
              </option>
              {library.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kind === 'video' ? '▶ ' : '🖼 '}
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#00C4CC]" />
          </div>
          {pickedId && (
            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#00C4CC]">
              {library.find((a) => a.id === pickedId)?.kind === 'video' ? (
                <Video className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              Auto-filled from Canva
            </div>
          )}
        </div>
      )}

      {showCanva && (
        <CanvaConnectModal mode={mode} onClose={() => setShowCanva(false)} onConnected={() => setConnected(true)} />
      )}
      {showGallery && (
        <GalleryModal
          onClose={() => setShowGallery(false)}
          onSelect={(asset) => {
            onSelect(asset)
            setShowGallery(false)
          }}
        />
      )}
      {showCustom && <CustomOrderModal onClose={() => setShowCustom(false)} />}
    </div>
  )
}
