'use client'

import { CanvaConnectModal } from '@/components/canva/CanvaConnectModal'
import { CanvaLibraryPicker, type CanvaPickedFile } from '@/components/canva/CanvaLibraryPicker'
import { useCanvaConnection } from '@/components/canva/useCanvaConnection'
import { SkeletonImage } from '@/components/media/SkeletonMedia'
import { createCanvaDesignSessionApi, fetchCanvaImportSessionApi } from '@/lib/canva/backendClient'
import {
  clearCanvaHandoff,
  currentBuilderRoute,
  markCanvaImportApplied,
  readStoredCanvaDesignId,
  rememberCanvaHandoff,
  wasCanvaImportApplied,
} from '@/lib/canva/editHandoff'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import {
  CalendarClock,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Video,
  Wand2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

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
              <SkeletonImage
                src={v.img}
                alt={v.title}
                fill
                mediaClassName="object-cover transition-transform group-hover:scale-105"
                skeletonLabel="Loading thumbnail"
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

const CUSTOM_OFFER_OPTIONS = [
  { id: 'logo-animation', label: 'Logo animation', price: 49, hours: 24 },
  { id: 'intro-video', label: 'Intro video', price: 79, hours: 48 },
  { id: 'profile-media', label: 'Profile media pack', price: 39, hours: 24 },
  { id: 'custom-design', label: 'Custom design asset', price: 59, hours: 36 },
] as const

function CustomOrderModal({ onClose }: { onClose: () => void }) {
  const [offerId, setOfferId] = useState<(typeof CUSTOM_OFFER_OPTIONS)[number]['id']>('logo-animation')
  const [brand, setBrand] = useState('')
  const [brief, setBrief] = useState('')
  const [references, setReferences] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])
  const [step, setStep] = useState<'details' | 'checkout' | 'submitted'>('details')
  const offer = useMemo(
    () => CUSTOM_OFFER_OPTIONS.find((item) => item.id === offerId) || CUSTOM_OFFER_OPTIONS[0],
    [offerId]
  )
  const canCheckout = brand.trim().length > 1 && brief.trim().length > 10
  const [due, setDue] = useState<string>('')

  useEffect(() => {
    // compute due asynchronously to avoid synchronous setState in effect
    const t = setTimeout(() => {
      const date = new Date(Date.now() + offer.hours * 60 * 60 * 1000)
      setDue(date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))
    }, 0)
    return () => clearTimeout(t)
  }, [offer.hours])

  const submitOrder = () => {
    const request = {
      id: `custom_offer_${Date.now()}`,
      offerId,
      offer: offer.label,
      price: offer.price,
      brand,
      brief,
      references,
      fileNames,
      status: 'admin_approval_pending',
      productionHours: offer.hours,
      requestedAt: new Date().toISOString(),
    }
    try {
      const raw = localStorage.getItem('vbiz_custom_offer_requests')
      const list = raw ? (JSON.parse(raw) as unknown[]) : []
      localStorage.setItem('vbiz_custom_offer_requests', JSON.stringify([request, ...list]))
    } catch {
      /* local queue is best-effort only */
    }
    setStep('submitted')
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="relative max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-black/5 p-2 dark:bg-white/5"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5 pr-14 dark:border-white/10">
          <p className="text-[10px] font-black tracking-widest text-amber-600 uppercase dark:text-amber-300">
            Custom offer
          </p>
          <h3 className="mt-1 text-[22px] font-black text-slate-900 dark:text-white">Design request checkout</h3>
          <p className="mt-1 text-[13px] leading-relaxed font-semibold text-slate-500">
            Choose the offer, add details and references, then send it for admin approval and Stripe payment.
          </p>
        </div>

        {step === 'details' ? (
          <div className="max-h-[66vh] space-y-5 overflow-y-auto p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {CUSTOM_OFFER_OPTIONS.map((item) => {
                const selected = item.id === offerId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOfferId(item.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-all',
                      selected
                        ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 dark:border-white/10 dark:bg-white/3 dark:text-slate-200'
                    )}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block text-[12px] font-semibold opacity-75">
                      ${item.price} - {item.hours}h production window after approval
                    </span>
                  </button>
                )
              })}
            </div>

            <FieldGroup label="Brand / card owner" icon={<FileText className="h-4 w-4" />}>
              <input
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className={cn(inputClasses, 'pl-10')}
                placeholder="Business name, card name, or website"
              />
            </FieldGroup>

            <FieldGroup label="Required details">
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                className={cn(inputClasses, 'min-h-30 resize-y')}
                placeholder="Describe style, colors, logo idea, animation, video length, text, audience, and anything the designer must include."
              />
            </FieldGroup>

            <FieldGroup label="Reference links / document notes">
              <textarea
                value={references}
                onChange={(event) => setReferences(event.target.value)}
                className={cn(inputClasses, 'min-h-20 resize-y')}
                placeholder="Paste Canva links, website URLs, inspiration links, or notes about uploaded documents."
              />
            </FieldGroup>

            <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-white/15 dark:bg-white/3">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => setFileNames(Array.from(event.target.files || []).map((file) => file.name))}
              />
              <FileText className="mx-auto mb-2 h-5 w-5 text-amber-600 dark:text-amber-300" />
              <span className="block text-sm font-black text-slate-900 dark:text-white">
                Attach logo, brand guide, script, or examples
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                {fileNames.length
                  ? fileNames.join(', ')
                  : 'Files are held with the request and reviewed before production.'}
              </span>
            </label>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{offer.label}</p>
                  <p className="text-[12px] font-semibold text-slate-500">
                    Admin approval first, then Stripe checkout. ETA: {due}
                  </p>
                </div>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300">${offer.price}</span>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'checkout' ? (
          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">Stripe checkout summary</p>
                  <p className="text-[12px] font-semibold text-slate-500">
                    {offer.label} - ${offer.price}. Payment is captured after admin approval.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
                <p className="text-sm font-black text-slate-950 dark:text-white">Admin approved first</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-500">
                  The request waits for admin review before production starts.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <CalendarClock className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="text-sm font-black text-slate-950 dark:text-white">{offer.hours} hour schedule</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-500">
                  The countdown starts after approval and payment confirmation.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'submitted' ? (
          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <ShieldCheck className="mb-3 h-7 w-7 text-emerald-600" />
              <p className="text-base font-black text-emerald-900 dark:text-emerald-100">Offer request queued</p>
              <p className="mt-2 text-sm font-semibold text-emerald-800/80 dark:text-emerald-100/80">
                Admin approval is pending. After approval and Stripe payment, the card owner dashboard can show the{' '}
                {offer.hours} hour countdown for delivery.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-white/2">
          {step === 'details' ? (
            <>
              <p className="text-[11px] font-semibold text-slate-500">Required: brand and clear production details.</p>
              <button
                type="button"
                disabled={!canCheckout}
                onClick={() => setStep('checkout')}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" /> Continue to checkout
              </button>
            </>
          ) : step === 'checkout' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="rounded-xl px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-white dark:hover:bg-white/5"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={submitOrder}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <ShieldCheck className="h-4 w-4" /> Send for admin approval
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
            >
              Done
            </button>
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
  /** Optional profile id so Canva imports attach to the card media library */
  profileId?: string | null
  /**
   * When false, hide Gallery / Custom Made even if mode is video/both.
   * Defaults to true so existing video fields keep those extras.
   */
  showVideoExtras?: boolean
  /** Stable Card Builder field key (usually attachment type name). Required for Create in Canva. */
  fieldKey?: string | null
  /** Attachment type for media library binding. Defaults to fieldKey. */
  attachmentType?: string | null
  /** Stable repeatable-row id (service/blog/portfolio item) — survives reorder. */
  itemKey?: string | null
  /** Design title hint in Canva. */
  designTitle?: string | null
  /** Previously associated Canva design id for Edit in Canva. */
  canvaDesignId?: string | null
  /** Hide Create/Edit in Canva (picker-only). */
  allowCreateInCanva?: boolean
}

type CreateFlowStatus =
  'idle' | 'creating' | 'opening' | 'waiting_return' | 'exporting' | 'uploading' | 'ready' | 'failed'

/**
 * Connect Canva (+ Gallery / Custom Made for video fields).
 * After Canva connect, opens the owner's real Canva designs, exports the pick,
 * uploads to vBiz media storage, and fills the field URL.
 * Also supports Create / Edit in Canva via Return Navigation + auto-import.
 */
export function MediaSourceActions({
  mode = 'image',
  onSelect,
  className,
  compact,
  profileId,
  showVideoExtras: showVideoExtrasProp = true,
  fieldKey,
  attachmentType,
  itemKey,
  designTitle,
  canvaDesignId,
  allowCreateInCanva = true,
}: Props) {
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
  const [flowStatus, setFlowStatus] = useState<CreateFlowStatus>('idle')
  const [connectIntent, setConnectIntent] = useState<'picker' | 'create' | 'edit'>('picker')
  const onSelectRef = useRef(onSelect)

  const resolvedFieldKey = (fieldKey || attachmentType || '').trim()
  const resolvedAttachmentType = (attachmentType || fieldKey || '').trim()
  const storedDesignId =
    canvaDesignId ||
    (profileId && resolvedFieldKey ? readStoredCanvaDesignId(profileId, resolvedFieldKey, itemKey) : null)
  const canCreate = allowCreateInCanva && Boolean(profileId && resolvedFieldKey)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const ensureConnected = useCallback(
    (intent: 'picker' | 'create' | 'edit') => {
      setLocalError(null)
      if (!userId) {
        setLocalError('Sign in to connect Canva')
        return false
      }
      if (!isConnected) {
        setConnectIntent(intent)
        setShowConnect(true)
        return false
      }
      return true
    },
    [userId, isConnected]
  )

  const launchCreateOrEdit = useCallback(
    async (editExisting: boolean) => {
      if (!profileId || !resolvedFieldKey) {
        setLocalError('Save the card first, then create media in Canva for this field.')
        return
      }
      if (!ensureConnected(editExisting ? 'edit' : 'create')) return

      setLocalError(null)
      setFlowStatus('creating')
      try {
        const mediaKind: 'image' | 'video' = mode === 'video' ? 'video' : 'image'
        const session = await createCanvaDesignSessionApi({
          profileId,
          fieldKey: resolvedFieldKey,
          itemKey: itemKey || null,
          attachmentType: resolvedAttachmentType || resolvedFieldKey,
          mediaKind,
          builderRoute: currentBuilderRoute(),
          title: designTitle || undefined,
          designId: editExisting && storedDesignId ? storedDesignId : undefined,
        })
        if (!session.editUrl) throw new Error('Canva did not return an editor URL')
        rememberCanvaHandoff(session)
        setFlowStatus('opening')
        // Same-tab handoff — Canva Return Navigation brings the user back to our return URL.
        window.location.assign(session.editUrl)
      } catch (err) {
        setFlowStatus('failed')
        const message = err instanceof Error ? err.message : 'Failed to open Canva'
        if (/session expired|reconnect|not connected|missing scopes/i.test(message)) {
          setLocalError('Session expired — reconnect Canva')
          setShowConnect(true)
        } else {
          setLocalError(message)
        }
      }
    },
    [profileId, resolvedFieldKey, ensureConnected, mode, itemKey, resolvedAttachmentType, designTitle, storedDesignId]
  )

  useEffect(() => {
    if (!justConnected || !isConnected || !userId) return
    const t = setTimeout(() => {
      setShowConnect(false)
      if (connectIntent === 'create') {
        void launchCreateOrEdit(false)
      } else if (connectIntent === 'edit') {
        void launchCreateOrEdit(true)
      } else {
        setShowPicker(true)
      }
      clearJustConnected()
    }, 0)
    return () => clearTimeout(t)
  }, [justConnected, isConnected, userId, clearJustConnected, connectIntent, launchCreateOrEdit])

  // Apply auto-imported media when returning to this exact field from /canva/return
  useEffect(() => {
    if (typeof window === 'undefined' || !profileId || !resolvedFieldKey) return
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('canva_session')
    const matchField = params.get('canva_field')
    const matchItem = params.get('canva_item')
    if (!sessionId || matchField !== resolvedFieldKey) return
    if ((matchItem || '') !== (itemKey || '')) return
    if (wasCanvaImportApplied(sessionId)) return

    let cancelled = false
    const kick = window.setTimeout(() => {
      if (cancelled) return
      setFlowStatus('exporting')
      void (async () => {
        try {
          const session = await fetchCanvaImportSessionApi(sessionId)
          if (cancelled) return
          if (session.profileId !== profileId) return
          if (session.status === 'ready' && session.resultUrl) {
            markCanvaImportApplied(sessionId)
            clearCanvaHandoff()
            onSelectRef.current({
              id: session.designId,
              name: session.resultFilename || session.designTitle || 'Canva design',
              url: session.resultUrl,
              kind: session.mediaKind === 'video' ? 'video' : 'image',
            })
            setPickedName(session.resultFilename || session.designTitle || 'Canva design')
            setFlowStatus('ready')
            params.delete('canva_session')
            params.delete('canva_field')
            params.delete('canva_item')
            params.delete('canva_return')
            const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
            window.history.replaceState({}, '', next)
          } else if (session.status === 'failed') {
            setFlowStatus('failed')
            setLocalError(session.errorMessage || 'Canva export failed')
          } else {
            setFlowStatus('exporting')
          }
        } catch (err) {
          if (!cancelled) {
            setFlowStatus('failed')
            setLocalError(err instanceof Error ? err.message : 'Failed to apply Canva import')
          }
        }
      })()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(kick)
    }
  }, [profileId, resolvedFieldKey, itemKey])

  const showVideoExtras = showVideoExtrasProp && (mode === 'video' || mode === 'both')

  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-[14px] text-[13px] font-bold transition-all active:scale-[0.98] whitespace-nowrap'

  const handleCanvaClick = () => {
    if (!ensureConnected('picker')) return
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
        attachmentType: resolvedAttachmentType || undefined,
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

  const flowLabel =
    flowStatus === 'creating'
      ? 'Creating Canva design…'
      : flowStatus === 'opening'
        ? 'Opening Canva…'
        : flowStatus === 'waiting_return'
          ? 'Waiting for Canva return…'
          : flowStatus === 'exporting'
            ? 'Exporting design…'
            : flowStatus === 'uploading'
              ? 'Uploading to vBiz Me…'
              : flowStatus === 'ready'
                ? 'Ready to use'
                : flowStatus === 'failed'
                  ? 'Export failed'
                  : null

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-2', compact ? 'gap-2' : 'gap-3')}>
        <button
          type="button"
          onClick={handleCanvaClick}
          disabled={isLoading || saving || flowStatus === 'creating' || flowStatus === 'opening'}
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

        {canCreate && isConnected && (
          <button
            type="button"
            onClick={() => void launchCreateOrEdit(false)}
            disabled={isLoading || saving || flowStatus === 'creating' || flowStatus === 'opening'}
            className={cn(
              btnBase,
              compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
              'border border-[#7D2AE8]/40 bg-[#7D2AE8]/10 text-[#7D2AE8] hover:border-[#7D2AE8] hover:bg-[#7D2AE8] hover:text-white disabled:opacity-60'
            )}
            title="Create a new design in Canva and return here automatically"
          >
            {flowStatus === 'creating' || flowStatus === 'opening' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create in Canva
          </button>
        )}

        {canCreate && isConnected && storedDesignId && (
          <button
            type="button"
            onClick={() => void launchCreateOrEdit(true)}
            disabled={isLoading || saving || flowStatus === 'creating' || flowStatus === 'opening'}
            className={cn(
              btnBase,
              compact ? 'px-3.5 py-2.5' : 'px-5 py-3.5',
              'border border-slate-300/80 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200'
            )}
            title="Edit the linked Canva design and re-import on return"
          >
            <Pencil className="h-4 w-4" />
            Edit in Canva
          </button>
        )}

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

      {flowLabel && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#7D2AE8]">
          {(flowStatus === 'creating' ||
            flowStatus === 'opening' ||
            flowStatus === 'exporting' ||
            flowStatus === 'uploading' ||
            flowStatus === 'waiting_return') && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {flowLabel}
          {flowStatus === 'failed' && canCreate && (
            <button
              type="button"
              className="underline"
              onClick={() => void launchCreateOrEdit(Boolean(storedDesignId))}
            >
              Retry
            </button>
          )}
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
export function setCanvaConnected() {
  /* no-op */
}

/** @deprecated Demo library removed — real Canva designs are listed via API */
export const CANVA_LIBRARY: MediaAsset[] = []
