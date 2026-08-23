'use client'

import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Badge, Button, Card, Tooltip } from '@/components/ui'
import { useAppDispatch } from '@/hooks/redux'
import { isOwnerCardLocked, resolveCardStatus, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { buildEditorSectionPath } from '@/lib/vcardEditorRoutes'
import { useDeleteProfileMutation } from '@/redux/features/profiles/profiles.api'
import { removeVCard } from '@/redux/features/vcards/vcards.slice'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { formatViewCount, getVCardPublicPath, getVCardPublicUrl } from '@/utils/vcard'
import { Check, Copy, ExternalLink, MoreHorizontal, QrCode, Trash2, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type VCardGridCardProps = {
  card: VCardRecord
  onOpenQr: (url: string, name?: string, centerImageUrl?: string) => void
  isPersonal?: boolean
}

function isVideoMediaUrl(url: string): boolean {
  const path = url.split('?')[0]?.split('#')[0]?.toLowerCase() || ''
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path)
}

export function VCardGridCard({ card, onOpenQr, isPersonal = false }: VCardGridCardProps) {
  const dispatch = useAppDispatch()
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation()
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [alertState, setAlertState] = useState<{
    title: string
    description: string
    variant?: 'default' | 'danger'
  } | null>(null)
  const slug = card.slug.trim()
  const publicPath = getVCardPublicPath(slug)
  const fullUrl = getVCardPublicUrl(slug)
  const avatarSrc = card.avatarImageUrl?.trim() || null
  const coverSrc = card.backgroundImageUrl?.trim() || null
  const coverIsVideo = coverSrc ? isVideoMediaUrl(coverSrc) : false
  const cardName = card.personal.fullName || 'this vCard'
  const status = resolveCardStatus({
    status: card.status,
    isDraft: card.isDraft,
    isPublic: card.isPublic,
    isActive: card.isActive,
  })
  const ownerLocked = isOwnerCardLocked(status)

  const handleCopyLink = async () => {
    if (ownerLocked) {
      setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
      return
    }
    if (!fullUrl) return
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteClick = () => {
    if (ownerLocked) {
      setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
      return
    }
    setMenuOpen(false)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteProfile(card.id).unwrap()
      dispatch(removeVCard(card.id))
      setDeleteOpen(false)
    } catch {
      setAlertState({
        title: 'Delete failed',
        description: 'Could not delete this vCard. Please try again.',
        variant: 'danger',
      })
    }
  }

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.03)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)]">
      <ConfirmModal
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        isLoading={isDeleting}
        variant="danger"
        icon={Trash2}
        title={`Delete “${cardName}”?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        labelledBy={`delete-vcard-title-${card.id}`}
        describedBy={`delete-vcard-description-${card.id}`}
      />

      {alertState && (
        <AlertModal
          open
          title={alertState.title}
          description={alertState.description}
          variant={alertState.variant}
          onClose={() => setAlertState(null)}
        />
      )}
      {isPersonal && (
        <div className="absolute top-4 left-4 z-20">
          <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-violet-700 uppercase shadow-sm backdrop-blur-md dark:border-violet-500/25 dark:bg-violet-500/15 dark:text-violet-300">
            My card
          </span>
        </div>
      )}
      <div className={cn('absolute z-20', isPersonal ? 'top-4 right-4' : 'top-4 right-4')}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white/70 text-slate-700 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-white dark:border-white/10 dark:bg-black/50 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Card actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div className="absolute top-10 right-0 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]">
            <button
              type="button"
              disabled={isDeleting || ownerLocked}
              title={ownerLocked ? SUSPENDED_CARD_MESSAGE : undefined}
              onClick={handleDeleteClick}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete card
            </button>
          </div>
        ) : null}
      </div>

      <div className="from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 relative h-35 shrink-0 overflow-hidden bg-linear-to-br transition-transform duration-500 group-hover:scale-[1.02]">
        {coverSrc && coverIsVideo ? (
          <video
            src={coverSrc}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
            aria-hidden
          />
        ) : coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        )}
        <div className={cn('absolute z-10', isPersonal ? 'top-14 left-4' : 'top-4 left-4')}>
          <Badge
            variant={card.isDraft ? 'default' : card.isActive ? 'success' : 'default'}
            className="rounded-full border border-black/5 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90"
          >
            <div
              className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_0_rgba(16,185,129,0.5)] ${
                status === 'draft' || status === 'paused'
                  ? 'bg-amber-500'
                  : status === 'active'
                    ? 'animate-pulse bg-emerald-500'
                    : status === 'suspended'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
              }`}
            ></div>
            <span className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-700 uppercase dark:text-slate-300">
              {status === 'draft'
                ? 'Draft'
                : status === 'active'
                  ? 'Active'
                  : status === 'paused'
                    ? 'Paused'
                    : status === 'suspended'
                      ? 'Suspended'
                      : 'Inactive'}
            </span>
          </Badge>
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col bg-white px-6 pt-0 pb-6 dark:bg-[#0b0f19]">
        <div className="mb-5 flex items-end justify-between">
          <div className="group-hover:shadow-primary-500/20 relative -mt-11 h-22 w-22 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md transition-shadow dark:border-[#0b0f19] dark:bg-slate-800">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={card.personal.fullName || 'Avatar'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                width={100}
                height={100}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                <User className="h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden />
              </div>
            )}
          </div>

          <div className="mb-1.5 flex gap-4 sm:gap-5">
            <div className="text-center">
              <p className="text-[15px] font-black text-slate-900 dark:text-white">{formatViewCount(card.views)}</p>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">Views</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
            <div className="text-center">
              <p className="text-[15px] font-black text-slate-900 dark:text-white">{card.saves}</p>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">Saves</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {card.personal.fullName || 'Untitled card'}
          </h2>
          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
            {card.personal.designation || 'Add a title'}
          </p>
        </div>

        <div
          className={cn(
            'group/url relative mb-6 flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-300',
            copied
              ? 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5'
              : 'hover:border-primary-500/30 border-slate-200 bg-slate-50/50 dark:border-white/5 dark:bg-slate-800/30'
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300',
              copied ? 'bg-emerald-500/5 opacity-100' : 'bg-primary-500/5 opacity-0 group-hover/url:opacity-100'
            )}
          />
          <div className="relative z-10 flex w-full items-center gap-2.5 truncate pr-10">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-800">
              <ExternalLink className="text-primary-500 h-3 w-3" />
            </div>
            <span
              className={cn(
                'mt-0.5 truncate font-mono text-[13px] font-medium transition-colors duration-300',
                copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'
              )}
            >
              {slug ? `vbiz.me/v/${slug}` : 'Set URL slug in editor'}
            </span>
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, x: -4, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 4, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase dark:bg-emerald-500/15 dark:text-emerald-400"
                >
                  Copied
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <Tooltip
            content={copied ? 'Copied!' : 'Copy Link'}
            className="absolute top-1/2 right-3 z-20 -translate-y-1/2"
          >
            <button
              type="button"
              disabled={!fullUrl || ownerLocked}
              onClick={() => void handleCopyLink()}
              className={cn(
                'flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40',
                copied
                  ? 'border-emerald-200 bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] dark:border-emerald-500/40 dark:bg-emerald-500 dark:shadow-[0_2px_8px_rgba(16,185,129,0.25)]'
                  : 'border-slate-200 bg-white text-slate-400 hover:bg-white hover:text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              )}
              aria-label={copied ? 'Link copied' : 'Copy link'}
              title={ownerLocked ? SUSPENDED_CARD_MESSAGE : undefined}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0, rotate: -90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 90 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 28 }}
                    className="flex items-center justify-center"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Tooltip>
        </div>

        <div className="mt-auto grid grid-cols-[1fr_1fr_auto] gap-2">
          {ownerLocked ? (
            <button
              type="button"
              disabled
              title={SUSPENDED_CARD_MESSAGE}
              className="flex cursor-not-allowed items-center justify-center rounded-xl border-2 border-slate-200 bg-transparent py-2.5 text-[13px] font-bold text-slate-400 opacity-60 dark:border-white/10"
            >
              Edit
            </button>
          ) : (
            <Link
              href={buildEditorSectionPath('/vcards/edit', 'home', card.id)}
              className="hover:border-primary-500/50 hover:bg-primary-50 dark:hover:bg-primary-500/10 flex items-center justify-center rounded-xl border-2 border-slate-200 bg-transparent py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all dark:border-white/10 dark:text-slate-300"
            >
              Edit
            </Link>
          )}
          {ownerLocked ? (
            <button
              type="button"
              disabled
              title={SUSPENDED_CARD_MESSAGE}
              className="flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-300 py-2.5 text-[13px] font-bold text-white opacity-60 dark:bg-slate-700"
            >
              View
            </button>
          ) : slug ? (
            <Link
              href={publicPath}
              className="flex items-center justify-center rounded-xl bg-slate-900 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-slate-900/10 transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:shadow-white/10 dark:hover:bg-slate-100"
            >
              View
            </Link>
          ) : (
            <Button
              type="button"
              variant="dark"
              disabled
              className="rounded-xl bg-slate-300 py-2.5 opacity-70 dark:bg-slate-700"
            >
              View
            </Button>
          )}
          <Tooltip content={ownerLocked ? SUSPENDED_CARD_MESSAGE : 'Generate QR Code'}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!fullUrl || ownerLocked}
              onClick={() => {
                if (ownerLocked) {
                  setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
                  return
                }
                if (fullUrl) onOpenQr(fullUrl, card.personal.fullName || undefined, card.avatarImageUrl || undefined)
              }}
              className="hover:border-primary-500/50 w-11 rounded-xl border-2"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  )
}
