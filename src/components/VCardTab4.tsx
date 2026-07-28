'use client'

import { useCanvaConnection } from '@/components/canva'
import { Modal } from '@/components/ui/Modal'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import { useAuth } from '@/providers/AuthProvider'
import {
  Check,
  CreditCard,
  Grid,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Music,
  Palette,
  Upload,
  Video,
  Wand2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React, { ReactNode, useEffect, useRef, useState } from 'react'

function FieldGroup({ label, children, icon }: { label: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="group flex flex-col space-y-1.5">
      <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-3.5 z-10 flex -translate-y-1/2 items-center text-slate-500/70">
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

function GalleryModal({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (v: { id: number; title: string; img: string }) => void
}) {
  const videos = [
    {
      id: 1,
      title: 'Abstract Particles',
      img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=200',
    },
    {
      id: 2,
      title: 'Neon Lights',
      img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300&h=200',
    },
    {
      id: 3,
      title: 'Cyberpunk City',
      img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=300&h=200',
    },
    {
      id: 4,
      title: 'Nature Reveal',
      img: 'https://images.unsplash.com/photo-1444464666168-49b626422201?auto=format&fit=crop&q=80&w=300&h=200',
    },
  ]
  return (
    <Modal
      open
      onClose={onClose}
      overlayClassName="backdrop-blur-md"
      className="max-w-3xl overflow-hidden rounded-4xl border-slate-200/50 dark:border-white/5"
    >
      <div className="flex items-center justify-between border-b border-slate-200/50 p-6 dark:border-white/5">
        <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white">
          <div className="bg-primary-50 dark:bg-primary-500/10 rounded-xl p-2">
            <Grid className="text-primary-600 dark:text-primary-400 h-5 w-5" />
          </div>{' '}
          Choose Intro Video
        </h3>
        <button
          onClick={onClose}
          className="rounded-full bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="no-scrollbar grid max-h-[60vh] grid-cols-1 gap-5 overflow-y-auto bg-slate-50/50 p-8 sm:grid-cols-2 md:grid-cols-4 dark:bg-white/2">
        {videos.map((v) => (
          <div
            key={v.id}
            onClick={() => onSelect(v)}
            className="hover:border-primary-500 group relative aspect-video cursor-pointer overflow-hidden rounded-[20px] border-2 border-transparent bg-slate-200 shadow-sm dark:bg-slate-800"
          >
            <Image
              src={v.img}
              alt={v.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={100}
              height={100}
            />
            <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="truncate text-[12px] font-bold text-white">{v.title}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function CustomOrderModal({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 })

  React.useEffect(() => {
    if (confirmed) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
          return prev
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [confirmed])

  if (confirmed) {
    return (
      <Modal
        open
        onClose={onClose}
        overlayClassName="bg-black/80"
        className="max-w-md rounded-4xl border-emerald-500/20 p-8 text-center shadow-[0_0_100px_rgba(16,185,129,0.1)]"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Order Confirmed!</h3>
        <p className="mb-8 text-[14px] font-medium text-slate-500 dark:text-slate-400">{`Your custom intro video is in the works. Please upload your assets via the dashboard if you haven't yet.`}</p>

        <div className="mb-8 rounded-[20px] border border-black/5 bg-slate-50 p-6 dark:border-white/5 dark:bg-[#0b0f19]">
          <p className="mb-3 text-[12px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Estimated Delivery
          </p>
          <div className="text-primary-600 dark:text-primary-400 flex items-center justify-center gap-4 text-3xl font-black">
            <div className="flex flex-col">
              <span className="text-slate-900 dark:text-white">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Hours
              </span>
            </div>
            <span className="mb-4 text-slate-900/20">:</span>
            <div className="flex flex-col">
              <span className="text-slate-900 dark:text-white">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Minutes
              </span>
            </div>
            <span className="mb-4 text-slate-900/20">:</span>
            <div className="flex flex-col">
              <span className="text-slate-900 dark:text-white">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="mt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Seconds
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-[14px] font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:bg-emerald-400 active:scale-95"
        >
          Return to Editor
        </button>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      overlayClassName="overflow-y-auto bg-black/80 py-10"
      className="my-auto max-w-5xl overflow-hidden rounded-4xl border-black/10 dark:border-white/10"
    >
      <div className="flex flex-col items-start justify-between gap-4 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:p-8 dark:border-white/5">
        <div>
          <h3 className="mb-1 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
            <Wand2 className="text-primary-600 dark:text-primary-400 h-6 w-6" />
            Custom Intro Video
          </h3>
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 text-emerald-500" /> Secure SSL Encrypted Checkout
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-black/5 p-3 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left: Product & Instructions */}
        <div className="space-y-8 bg-white p-6 sm:p-8 md:w-1/2 dark:bg-[#0b0f19]">
          <div className="flex gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-black/5 bg-slate-50 sm:h-28 sm:w-28 dark:border-white/5 dark:bg-[#0b0f19]">
              <Image
                src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=200&h=200"
                alt="Custom Video"
                className="h-full w-full object-cover"
                width={100}
                height={100}
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">Premium Custom Intro</h4>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Tailored perfectly to your brand identity.
              </p>
              <div className="text-primary-600 dark:text-primary-400 mt-2 text-2xl font-black">
                $49.99{' '}
                <span className="ml-2 text-xs font-bold text-slate-500 line-through dark:text-slate-400">$99.99</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

          <div className="space-y-5">
            <h4 className="text-[13px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
              Requirements & Assets
            </h4>
            <FieldGroup label="Design Instructions">
              <textarea
                placeholder="Tell us how you want it to look... colors, feeling, style."
                className="focus:border-primary-500 focus:ring-primary-500 min-h-25 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              ></textarea>
            </FieldGroup>
            <FieldGroup label="Upload Logo / Assets">
              <div className="hover:border-primary-500/50 hover:bg-primary-500/5 group flex w-full cursor-pointer items-center justify-center gap-3 rounded-[14px] border border-dashed border-slate-200 bg-slate-50 p-6 shadow-sm transition-all dark:border-white/20 dark:bg-slate-800">
                <Upload className="group-hover:text-primary-600 dark:group-hover:text-primary-400 h-5 w-5 text-slate-500 dark:text-slate-400" />
                <span className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                  Pick files to upload...
                </span>
              </div>
            </FieldGroup>
          </div>
        </div>

        {/* Right: Payment */}
        <div className="border-t border-black/5 bg-slate-100 p-6 sm:p-8 md:w-1/2 md:border-t-0 md:border-l dark:border-white/5 dark:bg-[#09090b]">
          <h4 className="mb-6 text-[13px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Billing & Payment
          </h4>

          <div className="space-y-6">
            <div className="space-y-4">
              <FieldGroup label="Email Address" icon={<Mail className="h-4 w-4" />}>
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
            </div>

            <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

            <div className="space-y-4 rounded-[20px] border border-slate-200 bg-white p-5 shadow-inner dark:border-[#27272a] dark:bg-[#0b0f19]">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  <CreditCard className="h-4 w-4 text-emerald-500" /> Credit Card
                </span>
                <div className="flex gap-1.5">
                  <div className="flex h-5 w-8 items-center justify-center rounded bg-black/10 text-[8px] font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                    VISA
                  </div>
                  <div className="flex h-5 w-8 items-center justify-center rounded bg-black/10 text-[8px] font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                    MC
                  </div>
                </div>
              </div>
              <input type="text" placeholder="Card Number" className={inputClasses} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM/YY" className={inputClasses} />
                <input type="text" placeholder="CVC" className={inputClasses} />
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmed(true)
                localStorage.setItem('customOrderPlaced', Date.now().toString())
              }}
              className="bg-primary-600 hover:bg-primary-700 w-full rounded-2xl px-6 py-4 text-[15px] font-black text-white shadow-sm transition-all active:scale-95"
            >
              Pay $49.99 & Order Now
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function CanvaIntegrationModal({
  userId,
  onClose,
  onSelectVideo,
}: {
  userId?: string | null
  onClose: () => void
  onSelectVideo: (v: { name: string; url: string }) => void
}) {
  const { isConnected, isLoading, error, connect } = useCanvaConnection({ userId })
  const [isConnecting, setIsConnecting] = useState(false)
  const [workflowStep, setWorkflowStep] = useState<'editor' | 'exporting' | null>(null)

  const step: 'connect' | 'connecting' | 'connected' | 'editor' | 'exporting' =
    workflowStep === 'exporting'
      ? 'exporting'
      : workflowStep === 'editor'
        ? 'editor'
        : isConnected
          ? 'connected'
          : isConnecting
            ? 'connecting'
            : 'connect'

  const handleConnect = () => {
    if (!userId) return
    setIsConnecting(true)
    void connect()
  }

  const handleOpenEditor = () => {
    setWorkflowStep('editor')
    setTimeout(() => setWorkflowStep('exporting'), 3000)
  }

  useEffect(() => {
    if (workflowStep !== 'exporting') return

    const timer = setTimeout(() => {
      onSelectVideo({ name: 'Canva_Intro.mp4', url: 'https://www.w3schools.com/html/mov_bbb.mp4' })
      onClose()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onClose, onSelectVideo, workflowStep])

  return (
    <Modal
      open
      onClose={onClose}
      overlayClassName="bg-black/20 dark:bg-white/20"
      className="relative max-w-100 overflow-hidden p-8"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      </button>

      <div className="text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-linear-to-tr from-[#00C4CC] to-[#7D2AE8] p-0.5 shadow-[0_0_30px_rgba(125,42,232,0.3)]">
          <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-[#0b0f19]">
            <Palette className="h-10 w-10 text-[#00C4CC]" />
          </div>
        </div>

        <h3 className="mb-2 text-[22px] font-black text-slate-900 dark:text-white">Canva Integration</h3>
        <p className="mb-8 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          {step === 'connect' &&
            'Connect your Canva account to create beautiful intro videos directly from your vCard dashboard.'}
          {step === 'connecting' && 'Securely connecting to Canva...'}
          {step === 'connected' && 'Account connected successfully! You can now create your intro video.'}
          {step === 'editor' && 'Using Canva Editor... (Simulated)'}
          {step === 'exporting' && 'Exporting your design and automatically uploading...'}
        </p>

        {error ? <p className="mb-4 text-[13px] font-medium text-red-500">{error}</p> : null}

        {step === 'connect' && (
          <button
            onClick={handleConnect}
            disabled={!userId || isLoading}
            className="w-full rounded-2xl border border-black/10 bg-white py-4 text-[15px] font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
          >
            {userId ? 'Connect Canva' : 'Log in to connect Canva'}
          </button>
        )}

        {step === 'connecting' && (
          <div className="flex items-center justify-center py-4 text-[#00C4CC]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {step === 'connected' && (
          <button
            onClick={handleOpenEditor}
            className="w-full rounded-2xl bg-linear-to-r from-[#00C4CC] to-[#7D2AE8] py-4 text-[15px] font-bold text-white shadow-[0_0_20px_rgba(0,196,204,0.3)] transition-all hover:opacity-90 active:scale-95"
          >
            Create Video with Canva
          </button>
        )}

        {(step === 'editor' || step === 'exporting') && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#7D2AE8]" />
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full w-full animate-pulse bg-linear-to-r from-[#00C4CC] to-[#7D2AE8]"></div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

const FIELD_INTRO = 'Intro vCard Video'
const FIELD_INTRO_YT = 'Intro YouTube vCard Video Link'
const FIELD_MUSIC = 'Background Music'
const FIELD_MUSIC_YT = 'YouTube Background Music Link'
const FIELD_BG = 'Background Video/Image'

function mediaLabel(url: string, fallback: string) {
  if (!url) return fallback
  if (url.startsWith('blob:')) return 'Uploaded file'
  try {
    return new URL(url).pathname.split('/').pop() || fallback
  } catch {
    return fallback
  }
}

export function Tab4HomeMedia() {
  const { user } = useAuth()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()

  const introVideoUrl = getCustomValue(FIELD_INTRO)
  const bgMusicUrl = getCustomValue(FIELD_MUSIC)
  const bgMediaUrl = getCustomValue(FIELD_BG)
  const introYoutubeUrl = getCustomValue(FIELD_INTRO_YT)
  const musicYoutubeUrl = getCustomValue(FIELD_MUSIC_YT)

  const [introStart, setIntroStart] = useState('0')
  const [introEnd, setIntroEnd] = useState('0')
  const [musicStart, setMusicStart] = useState('0')
  const [musicEnd, setMusicEnd] = useState('0')

  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showCanvaModal, setShowCanvaModal] = useState(false)

  const introRef = useRef<HTMLInputElement>(null)
  const musicRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)

  const handleFileToField = (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string, maxSizeMB?: number) => {
    const file = e.target.files?.[0]
    if (file) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        alert(`File size exceeds ${maxSizeMB}MB`)
        return
      }
      setCustomValue(fieldKey, URL.createObjectURL(file))
    }
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl pb-12 duration-500">
      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-3xl border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Home Page Media</h3>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Set the background, intro video and background music for your vCard homepage. All fields are optional.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Intro Video */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <Video className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Intro Video</h4>
          </div>
          <div className="space-y-8 p-4 sm:p-8">
            <div className="space-y-4">
              <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Plays before your vCard loads &bull; Max 15MB
              </p>
              <div className="space-y-4">
                <div className="focus-within:border-primary-500/50 group relative flex w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
                  <input
                    type="file"
                    className="hidden"
                    ref={introRef}
                    accept="video/*"
                    onChange={(e) => handleFileToField(e, FIELD_INTRO, 15)}
                  />
                  <button
                    onClick={() => introRef.current?.click()}
                    className="flex shrink-0 cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 sm:px-5 sm:py-4 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white dark:hover:bg-slate-800"
                  >
                    <Upload className="h-4 w-4 shrink-0" /> Upload
                  </button>
                  <span className="flex min-w-0 flex-1 items-center truncate px-4 py-3.5 text-[13px] font-medium text-slate-500 sm:px-5 sm:py-4 dark:text-slate-400">
                    {introVideoUrl ? mediaLabel(introVideoUrl, 'Select video') : 'Select video'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => setShowCanvaModal(true)}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-[#00C4CC]/30 bg-[#00C4CC]/10 px-3 py-3.5 text-[13px] font-bold whitespace-nowrap text-[#00C4CC] transition-colors hover:border-[#00C4CC] hover:bg-[#00C4CC] hover:text-white sm:px-4 sm:py-4"
                  >
                    <Palette className="h-4 w-4 shrink-0 group-hover:animate-pulse" />
                    Connect Canva
                  </button>
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 hover:dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border-primary-500/20 hover:border-primary-500 flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-[13px] font-bold whitespace-nowrap transition-colors sm:px-4 sm:py-4"
                  >
                    <Grid className="h-4 w-4 shrink-0" /> Gallery
                  </button>
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 hover:dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border-primary-500/20 hover:border-primary-500 flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-[13px] font-bold whitespace-nowrap shadow-sm transition-colors sm:px-4 sm:py-4"
                  >
                    <Wand2 className="h-4 w-4 shrink-0" /> Custom Made
                  </button>
                </div>
              </div>
            </div>

            <div className="my-8 flex items-center gap-5 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
              OR YOUTUBE LINK
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
            </div>

            <div className="space-y-6">
              <FieldGroup label="YouTube Video Link">
                <input
                  type="text"
                  value={introYoutubeUrl}
                  onChange={(e) => setCustomValue(FIELD_INTRO_YT, e.target.value)}
                  placeholder="https://youtube.com/..."
                  className={inputClasses}
                />
              </FieldGroup>

              <div className="grid grid-cols-2 gap-6">
                <FieldGroup label="Start (seconds)">
                  <input
                    type="number"
                    value={introStart}
                    onChange={(e) => setIntroStart(e.target.value)}
                    className={inputClasses}
                  />
                </FieldGroup>
                <FieldGroup label="End (seconds)">
                  <input
                    type="number"
                    value={introEnd}
                    onChange={(e) => setIntroEnd(e.target.value)}
                    className={inputClasses}
                  />
                </FieldGroup>
              </div>
            </div>
          </div>
        </section>

        {/* Background Music */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <Music className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Background Music</h4>
          </div>
          <div className="space-y-8 p-4 sm:p-8">
            <div className="space-y-4">
              <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Plays quietly in the background
              </p>
              <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
                <input
                  type="file"
                  className="hidden"
                  ref={musicRef}
                  accept="audio/*"
                  onChange={(e) => handleFileToField(e, FIELD_MUSIC)}
                />
                <button
                  onClick={() => musicRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4" /> Browse
                </button>
                <span className="flex w-full items-center truncate px-5 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {bgMusicUrl ? mediaLabel(bgMusicUrl, 'Select audio file') : 'Select audio file'}
                </span>
              </div>
            </div>

            <div className="my-8 flex items-center gap-5 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
              OR YOUTUBE LINK
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
            </div>

            <div className="space-y-6">
              <FieldGroup label="YouTube Music Link">
                <input
                  type="text"
                  value={musicYoutubeUrl}
                  onChange={(e) => setCustomValue(FIELD_MUSIC_YT, e.target.value)}
                  placeholder="https://youtube.com/..."
                  className={inputClasses}
                />
              </FieldGroup>

              <div className="grid grid-cols-2 gap-6">
                <FieldGroup label="Start (seconds)">
                  <input
                    type="number"
                    value={musicStart}
                    onChange={(e) => setMusicStart(e.target.value)}
                    className={inputClasses}
                  />
                </FieldGroup>
                <FieldGroup label="End (seconds)">
                  <input
                    type="number"
                    value={musicEnd}
                    onChange={(e) => setMusicEnd(e.target.value)}
                    className={inputClasses}
                  />
                </FieldGroup>
              </div>
            </div>
          </div>
        </section>

        {/* Background Video / Image */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm lg:col-span-2 dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <ImageIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Background Media</h4>
          </div>
          <div className="p-4 sm:p-8">
            <div className="max-w-xl space-y-4">
              <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Displayed as the background of your entire vCard. Image or Video loop.
              </p>
              <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
                <input
                  type="file"
                  className="hidden"
                  ref={mediaRef}
                  accept="image/*,video/*"
                  onChange={(e) => handleFileToField(e, FIELD_BG)}
                />
                <button
                  onClick={() => mediaRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4" /> Browse
                </button>
                <span className="flex w-full items-center truncate px-5 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {bgMediaUrl ? mediaLabel(bgMediaUrl, 'Select media file') : 'Select media file'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showGalleryModal && (
        <GalleryModal
          onClose={() => setShowGalleryModal(false)}
          onSelect={(v) => {
            setCustomValue(FIELD_INTRO, v.img)
            setShowGalleryModal(false)
          }}
        />
      )}

      {showCustomModal && <CustomOrderModal onClose={() => setShowCustomModal(false)} />}

      {showCanvaModal && (
        <CanvaIntegrationModal
          userId={user?.uid}
          onClose={() => setShowCanvaModal(false)}
          onSelectVideo={(v) => setCustomValue(FIELD_INTRO, v.url)}
        />
      )}
    </div>
  )
}
