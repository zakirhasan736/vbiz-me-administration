'use client'

import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useAppDispatch } from '@/hooks/redux'
import { buildEditorSectionPath } from '@/lib/vcardEditorRoutes'
import { useDeleteProfileMutation } from '@/redux/features/profiles/profiles.api'
import { removeVCard } from '@/redux/features/vcards/vcards.slice'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { getVCardPublicPath, getVCardPublicUrl } from '@/utils/vcard'
import { Building, GripVertical, Megaphone, MoreHorizontal, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type DragEvent } from 'react'
import { ContactSaveChip, SocialClickChip } from './SocialClickChip'
import { TrafficSparkline } from './TrafficSparkline'
import { VCardCardActions } from './VCardCardActions'
import { getCardSocialClickStats } from './socialStats'

type VCardTeamCardProps = {
  card: VCardRecord
  onOpenQr: (url: string, name?: string) => void
  onPanel: (card: VCardRecord) => void
  onNotice: (card: VCardRecord) => void
  /** Bumps when notice modal saves/clears so chip refreshes */
  noticeVersion?: number
  /** Single-card owners cannot duplicate past the 1-card limit */
  canDuplicate?: boolean
  duplicateDisabledReason?: string
  mode?: 'personal' | 'corporate'
  badgeLabel?: string
  showDragHandle?: boolean
  dragged?: boolean
  onDragStart?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  showCheckbox?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onCardClick?: () => void
  onTrends?: () => void
  onDuplicate?: () => void
}

export function VCardTeamCard({
  card,
  onOpenQr,
  onPanel,
  onNotice,
  noticeVersion = 0,
  canDuplicate = false,
  duplicateDisabledReason = 'Single card owners can create only one vCard',
  mode = 'personal',
  badgeLabel,
  showDragHandle = false,
  dragged = false,
  onDragStart,
  onDragOver,
  onDrop,
  showCheckbox = false,
  selected = false,
  onToggleSelect,
  onCardClick,
  onTrends,
  onDuplicate,
}: VCardTeamCardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [statsHovered, setStatsHovered] = useState(false)
  const [alertState, setAlertState] = useState<{
    title: string
    description: string
    variant?: 'default' | 'danger'
  } | null>(null)
  // Read during render; noticeVersion re-render after modal save/clear (no sync setState in effect)
  const noticeText =
    noticeVersion >= 0 && typeof window !== 'undefined' && card.id ? localStorage.getItem(`notice_${card.id}`) : null

  const status = card.isActive ? 'active' : 'inactive'
  const views = Number(card.views) || 0
  const clicks = Math.max(0, Math.round(views * 0.65))
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0'
  const saves = Number(card.saves) || 0
  const socialStats = getCardSocialClickStats(card)
  const slug = card.slug?.trim() || 'profile'
  const publicPath = getVCardPublicPath(slug)
  const fullUrl = getVCardPublicUrl(slug)
  const cardName = card.personal.fullName || 'this vCard'
  const initial = card.personal.fullName?.trim()?.[0]?.toUpperCase() || 'P'
  const avatarSrc = card.avatarImageUrl?.trim() || null
  const editPath = buildEditorSectionPath('/vcards/edit', 'home', card.id)

  const goEdit = () => router.push(editPath)

  const handleEmail = () => {
    const email = card.personal.email?.trim()
    if (!email) {
      setAlertState({ title: 'No email', description: 'No email on this card.' })
      return
    }
    window.open(`mailto:${email}`, '_blank')
  }

  const handleCall = () => {
    const phone = card.personal.phone?.trim() || card.personal.whatsapp?.trim()
    if (!phone) {
      setAlertState({ title: 'No phone', description: 'No phone on this card.' })
      return
    }
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_self')
  }

  const handleSchedule = () => {
    const name = card.personal.fullName || 'Contact'
    const title = encodeURIComponent(`Meeting with ${name}`)
    const details = encodeURIComponent(
      `vBiz card: ${typeof window !== 'undefined' ? window.location.origin : ''}${publicPath}`
    )
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      '_blank'
    )
  }

  const handleView = () => {
    if (!slug || slug === 'profile') {
      setAlertState({ title: 'URL slug required', description: 'Set a URL slug in the editor first.' })
      return
    }
    window.open(publicPath, '_blank')
  }

  const handleQr = () => {
    if (!fullUrl) {
      setAlertState({ title: 'URL slug required', description: 'Set a URL slug in the editor first.' })
      return
    }
    onOpenQr(fullUrl, card.personal.fullName || undefined)
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

  const isCorporate = mode === 'corporate'
  const label = badgeLabel || (isCorporate ? 'Corporate' : 'My card')
  const handleRootClick = () => {
    if (onCardClick) {
      onCardClick()
      return
    }
    goEdit()
  }

  return (
    <div
      draggable={showDragHandle}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleRootClick}
      className={cn(
        'group relative flex h-auto cursor-pointer flex-col rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 hover:border-slate-400 hover:shadow-xl dark:border-white/5 dark:bg-[#0b0f19] dark:hover:border-white/20',
        status === 'inactive' && 'border-slate-200/80',
        dragged && 'opacity-50 ring-2 ring-indigo-400'
      )}
    >
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

      {showDragHandle ? (
        <div
          className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-slate-200/60 bg-white/90 text-slate-400 active:cursor-grabbing dark:border-white/10 dark:bg-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      ) : null}

      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/60 bg-white/90 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-black/50"
          aria-label="Card actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen ? (
          <div className="absolute top-9 right-0 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]">
            <button
              type="button"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                setDeleteOpen(true)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete card
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
        <div>
          <div className={cn('flex items-center justify-between gap-2 pr-7', showDragHandle && 'pl-8')}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {showCheckbox ? (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onToggleSelect?.()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500"
                  aria-label={`Select ${cardName}`}
                />
              ) : null}
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                  isCorporate
                    ? 'border-slate-300/60 bg-slate-100 text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300'
                    : 'border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                )}
              >
                {label}
              </span>
            </div>
            <span className="shrink-0 rounded-md bg-indigo-500/5 px-2 py-0.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
              #{slug}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 text-base font-black text-indigo-600 shadow-inner dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={card.personal.fullName || 'Avatar'}
                  className="h-full w-full object-cover"
                  width={60}
                  height={60}
                />
              ) : (
                initial
              )}
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                status === 'active' &&
                  'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                status === 'inactive' &&
                  'border-slate-500/20 bg-slate-500/5 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400'
              )}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')}
              />
              {status}
            </span>
          </div>

          <div className="mt-2">
            <h3 className="truncate text-sm leading-snug font-extrabold text-slate-900 dark:text-white">
              {card.personal.fullName || 'No Name Given'}
            </h3>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
              {card.personal.designation || 'Executive Team'}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <Building className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{card.personal.company || 'Company'}</span>
            </div>
          </div>
        </div>

        <div className="group/stats relative" onMouseEnter={() => setStatsHovered(true)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTrends?.()
            }}
            className="grid w-full grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 px-1.5 py-1.5 text-left transition-colors hover:bg-slate-200/70 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="View 7-day trend"
          >
            <div className="text-center">
              <span className="block text-[8px] leading-none font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Views
              </span>
              <span className="mt-0.5 block text-[12px] leading-tight font-black text-slate-900 tabular-nums dark:text-white">
                {views.toLocaleString()}
              </span>
            </div>
            <div className="border-x border-slate-200 text-center dark:border-white/10">
              <span className="block text-[8px] leading-none font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Clicks
              </span>
              <span className="mt-0.5 block text-[12px] leading-tight font-black text-slate-900 tabular-nums dark:text-white">
                {clicks.toLocaleString()}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[8px] leading-none font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                CTR
              </span>
              <span className="mt-0.5 block text-[12px] leading-tight font-black text-emerald-700 tabular-nums dark:text-emerald-300">
                {ctr}%
              </span>
            </div>
          </button>
          {statsHovered ? (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 group-hover/stats:block">
              <TrafficSparkline profileId={card.id} slug={slug} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 pt-2 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-1">
            {socialStats.slice(0, 5).map((soc) => (
              <SocialClickChip key={soc.key} stat={soc} compact />
            ))}
            <ContactSaveChip count={saves} compact />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onNotice(card)
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[9px] font-black tracking-wider uppercase transition-colors',
                noticeText
                  ? 'border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/25 dark:text-amber-200'
                  : 'border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25'
              )}
              title={noticeText || 'Card announcement'}
            >
              <Megaphone className="h-3 w-3" />
              Notice
            </button>
          </div>
        </div>

        <VCardCardActions
          onEmail={handleEmail}
          onCall={handleCall}
          onSchedule={handleSchedule}
          onEdit={goEdit}
          onView={handleView}
          onPanel={() => onPanel(card)}
          onQr={handleQr}
          onDuplicate={() => {
            if (onDuplicate) {
              onDuplicate()
              return
            }
            if (!canDuplicate) setAlertState({ title: 'Cannot duplicate', description: duplicateDisabledReason })
          }}
          duplicateDisabled={!canDuplicate && !onDuplicate}
          duplicateTitle={canDuplicate || onDuplicate ? 'Duplicate this card' : duplicateDisabledReason}
        />
      </div>
    </div>
  )
}
