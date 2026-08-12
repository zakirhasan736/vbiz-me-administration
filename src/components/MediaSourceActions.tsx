'use client'

import { CanvaConnectModal } from '@/components/canva/CanvaConnectModal'
import { CanvaLibraryPicker, type CanvaPickedFile } from '@/components/canva/CanvaLibraryPicker'
import { useCanvaConnection } from '@/components/canva/useCanvaConnection'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import { Image as ImageIcon, LayoutGrid, Loader2, Palette, Video, Wand2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

export type MediaAsset = {
  id: string
  name: string
  url: string
  kind: 'image' | 'video'
  thumb?: string
}

export type MediaSourceMode = 'image' | 'video' | 'both'

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

function CustomOrderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="animate-in fade-in fixed inset-0 z-120 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/5 p-2 dark:bg-white/5"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <h3 className="mb-2 text-[22px] font-black text-slate-900 dark:text-white">Custom Made Video</h3>
        <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500">
          Tell us what you need and our team will produce a custom intro for your card.
        </p>
        <div className="space-y-4">
          <FieldGroup label="Brief">
            <textarea className={cn(inputClasses, 'min-h-28 resize-y')} placeholder="Describe your video…" />
          </FieldGroup>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-amber-500 py-4 text-[15px] font-bold text-white"
          >
            Submit request
          </button>
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
  /** Optional profile id so Canva imports attach to the card media library */
  profileId?: string | null
}

/**
 * Connect Canva (+ Gallery / Custom Made for video fields).
 * After Canva connect, opens the owner's real Canva designs, exports the pick,
 * uploads to vBiz media storage, and fills the field URL.
 */
export function MediaSourceActions({ mode = 'image', onSelect, className, compact, profileId }: Props) {
  const { user } = useAuth()
  const userId = user?.uid ?? null
  const { isConnected, isLoading, error, connect, justConnected, clearJustConnected } = useCanvaConnection({
    userId,
    enabled: Boolean(userId),
  })

  const [showConnect, setShowConnect] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickedName, setPickedName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!justConnected || !isConnected || !userId) return
    const t = setTimeout(() => {
      setShowConnect(false)
      setShowPicker(true)
      clearJustConnected()
    }, 0)
    return () => clearTimeout(t)
  }, [justConnected, isConnected, userId, clearJustConnected])

  const showVideoExtras = mode === 'video' || mode === 'both'

  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-[14px] text-[13px] font-bold transition-all active:scale-[0.98] whitespace-nowrap'

  const handleCanvaClick = () => {
    setLocalError(null)
    if (!userId) {
      setLocalError('Sign in to connect Canva')
      return
    }
    if (!isConnected) {
      setShowConnect(true)
      return
    }
    setShowPicker(true)
  }

  const handlePicked = async (picked: CanvaPickedFile) => {
    setShowPicker(false)
    setSaving(true)
    setLocalError(null)
    try {
      const uploaded = await uploadMediaWithProgress({
        file: picked.file,
        profileId: profileId ?? undefined,
      })
      onSelect({
        id: picked.id,
        name: picked.name,
        url: uploaded.url,
        kind: picked.kind,
        thumb: picked.thumb,
      })
      setPickedName(picked.name)
    } catch (err) {
      const message =
        err instanceof MediaUploadError ? err.message : err instanceof Error ? err.message : 'Failed to save Canva file'
      setLocalError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-2', compact ? 'gap-2' : 'gap-3')}>
        <button
          type="button"
          onClick={handleCanvaClick}
          disabled={isLoading || saving}
          className={cn(
            btnBase,
            compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
            'border border-[#00C4CC]/40 bg-[#00C4CC]/10 text-[#00C4CC] hover:border-[#00C4CC] hover:bg-[#00C4CC] hover:text-white disabled:opacity-60'
          )}
          title={isConnected ? 'Pick a design from your Canva account' : 'Connect your Canva account'}
        >
          {saving || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
          {saving ? 'Saving from Canva…' : isConnected ? 'Choose from Canva' : 'Connect Canva'}
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

      {pickedName && !saving && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#00C4CC]">
          {mode === 'video' ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Saved from Canva: {pickedName}
        </div>
      )}

      {(localError || error) && <p className="text-[12px] font-semibold text-rose-500">{localError || error}</p>}

      {showConnect && (
        <CanvaConnectModal
          isOpen
          onClose={() => setShowConnect(false)}
          userId={userId}
          onConnect={connect}
          error={error}
          description={`Connect Canva to pick ${mode === 'video' ? 'videos' : mode === 'image' ? 'images' : 'images & videos'} you created in Canva.`}
        />
      )}

      {showPicker && userId && (
        <CanvaLibraryPicker
          mode={mode}
          onClose={() => setShowPicker(false)}
          onPicked={(picked) => void handlePicked(picked)}
        />
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

/** @deprecated Demo helpers — kept for any legacy imports */
export function isCanvaConnected() {
  return false
}

/** @deprecated Demo helpers — kept for any legacy imports */
export function setCanvaConnected(_v: boolean) {
  /* no-op */
}

/** @deprecated Demo library removed — real Canva designs are listed via API */
export const CANVA_LIBRARY: MediaAsset[] = []
