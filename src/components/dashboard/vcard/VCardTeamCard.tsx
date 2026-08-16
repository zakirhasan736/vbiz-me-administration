'use client'

import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useAppDispatch } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { ACCOUNT_PAUSED_VCARD_MESSAGE, ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { isCardPaused, isOwnerCardLocked, resolveCardStatus, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { notify } from '@/lib/toast/toast'
import { buildEditorSectionPath, buildEditorSettingsPath } from '@/lib/vcardEditorRoutes'
import { useDeleteProfileMutation, useUpdateProfileCardMutation } from '@/redux/features/profiles/profiles.api'
import { removeVCard, updateVCard } from '@/redux/features/vcards/vcards.slice'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { getVCardPublicPath, getVCardPublicUrl } from '@/utils/vcard'
import { Building, GripVertical, Megaphone, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ContactSaveChip, ShareCountChip, SocialClickChip } from './SocialClickChip'
import { TrafficSparkline } from './TrafficSparkline'
import { VCardCardActions } from './VCardCardActions'
import { VCardOverflowMenu } from './VCardOverflowMenu'
import { VCardVisibilityToggle } from './VCardVisibilityToggle'
import { getCardSocialClickStats } from './socialStats'

type VCardTeamCardProps = {
  card: VCardRecord
  onOpenQr: (url: string, name?: string) => void
  onPanel: (card: VCardRecord) => void
  onNotice: (card: VCardRecord) => void
  /** Bumps when notice modal saves/clears so chip refreshes */
  noticeVersion?: number
  /** Server-scoped notice text for this card only (preferred over localStorage). */
  cardNoticeText?: string | null
  cardNoticeType?: 'info' | 'warning' | 'success' | null
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
  /** Shows spinner on the Duplicate button while this card is being copied. */
  isDuplicating?: boolean
  /** Primary border + chip to mark a card that was just duplicated or activated. */
  isNewlyDuplicated?: boolean
  /** Chip text when highlighted — defaults to duplicated. */
  highlightLabel?: 'duplicated' | 'activated'
  /** Fired after a draft card is successfully published via Visibility ON. */
  onActivatedFromDraft?: (cardId: string) => void
}

export function VCardTeamCard({
  card,
  onOpenQr,
  onPanel,
  onNotice,
  noticeVersion = 0,
  cardNoticeText,
  cardNoticeType,
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
  isDuplicating = false,
  isNewlyDuplicated = false,
  highlightLabel = 'duplicated',
  onActivatedFromDraft,
}: VCardTeamCardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isPaused: accountPaused, isSuspended: accountSuspended, canMutateVcards } = useAccountStatus()
  const cardRef = useRef<HTMLDivElement>(null)
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation()
  const [updateProfileCard, { isLoading: isUpdatingVisibility }] = useUpdateProfileCardMutation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const serverIsPublic = card.isPublic ?? true
  const [optimisticPublic, setOptimisticPublic] = useState<{ cardId: string; value: boolean } | null>(null)
  const isPublic =
    optimisticPublic?.cardId === card.id && serverIsPublic !== optimisticPublic.value
      ? optimisticPublic.value
      : serverIsPublic
  const isDraft = optimisticPublic?.cardId === card.id ? false : Boolean(card.isDraft)
  const [statsHovered, setStatsHovered] = useState(false)
  const [alertState, setAlertState] = useState<{
    title: string
    description: string
    variant?: 'default' | 'danger'
  } | null>(null)
  // Prefer server notice for this card id; fall back to per-card localStorage only.
  const localNoticeText =
    noticeVersion >= 0 && typeof window !== 'undefined' && card.id ? localStorage.getItem(`notice_${card.id}`) : null
  const noticeText = (cardNoticeText !== undefined ? cardNoticeText : localNoticeText) || null
  const noticeTone = cardNoticeType || 'info'

  useEffect(() => {
    if (!isNewlyDuplicated) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isNewlyDuplicated])

  const status = resolveCardStatus({
    status: card.status,
    isDraft,
    isPublic,
    isActive: card.isActive,
  })
  const ownerLocked = isOwnerCardLocked(status) || accountSuspended
  const pausedByAdmin = isCardPaused(status) || accountPaused
  const visibilityLocked = ownerLocked || pausedByAdmin || !canMutateVcards
  const editLocked = ownerLocked || accountSuspended || accountPaused

  const views = Number(card.views) || 0
  const liveSocials = Array.isArray(card.socialClicks) ? card.socialClicks : []
  const clicks =
    Number(card.clickCount) ||
    liveSocials.reduce((sum, row) => sum + (Number(row.clickCount) || 0), 0) ||
    Number(card.shareCount) ||
    0
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0'
  const saves = Number(card.saves) || 0
  const socialStats = getCardSocialClickStats(card, liveSocials)
  const slug = card.slug?.trim() || 'profile'
  const publicPath = getVCardPublicPath(slug)
  const fullUrl = getVCardPublicUrl(slug)
  const cardName = card.personal.fullName || 'this vCard'
  const initial = card.personal.fullName?.trim()?.[0]?.toUpperCase() || 'P'
  const avatarSrc = card.avatarImageUrl?.trim() || null
  const editPath = buildEditorSectionPath('/vcards/edit', 'home', card.id)
  const settingsPath = buildEditorSettingsPath('/vcards/edit', 'info', card.id)

  const goEdit = () => {
    if (editLocked) {
      notify.warning(
        accountSuspended
          ? ACCOUNT_SUSPENDED_MESSAGE
          : accountPaused
            ? ACCOUNT_PAUSED_VCARD_MESSAGE
            : SUSPENDED_CARD_MESSAGE
      )
      return
    }
    router.push(editPath)
  }
  const goSettings = () => {
    if (editLocked) {
      notify.warning(
        accountSuspended
          ? ACCOUNT_SUSPENDED_MESSAGE
          : accountPaused
            ? ACCOUNT_PAUSED_VCARD_MESSAGE
            : SUSPENDED_CARD_MESSAGE
      )
      return
    }
    router.push(settingsPath)
  }

  const handleVisibilityChange = async (next: boolean) => {
    if (!card.id || visibilityLocked) return
    const activatingFromDraft = Boolean(card.isDraft) && next
    setOptimisticPublic({ cardId: card.id, value: next })
    try {
      await updateProfileCard({
        id: card.id,
        body: next
          ? { isPublic: true, status: 'active', isDraft: false }
          : { isPublic: false, status: 'inactive', isDraft: false },
      }).unwrap()
      dispatch(
        updateVCard({
          id: card.id,
          patch: { isPublic: next, isActive: next, isDraft: false, status: next ? 'active' : 'inactive' },
        })
      )
      if (activatingFromDraft) onActivatedFromDraft?.(card.id)
    } catch {
      setOptimisticPublic(null)
      notify.error('Could not update card visibility. Please try again.')
    }
  }

  const handleView = () => {
    if (ownerLocked) {
      setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
      return
    }
    if (!slug || slug === 'profile') {
      setAlertState({ title: 'URL slug required', description: 'Set a URL slug in the editor first.' })
      return
    }
    window.open(publicPath, '_blank')
  }

  const handleQr = () => {
    if (ownerLocked) {
      setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
      return
    }
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
    if (ownerLocked) {
      setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
      return
    }
    if (onCardClick) {
      onCardClick()
      return
    }
    goEdit()
  }

  return (
    <div
      ref={cardRef}
      draggable={showDragHandle}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleRootClick}
      className={cn(
        'group relative flex h-auto cursor-pointer flex-col rounded-2xl border bg-white transition-all duration-300 hover:shadow-xl dark:bg-[#0b0f19]',
        isNewlyDuplicated
          ? 'border-primary-500 bg-primary-50/40 ring-primary-500/25 dark:bg-primary-500/10 border-2 ring-2'
          : 'border-slate-200/60 hover:border-slate-400 dark:border-white/5 dark:hover:border-white/20',
        !isNewlyDuplicated && status === 'inactive' && 'border-slate-200/80',
        !isNewlyDuplicated && status === 'paused' && 'border-amber-500/25',
        !isNewlyDuplicated && status === 'suspended' && 'border-rose-500/25',
        dragged && 'opacity-50 ring-2 ring-indigo-400'
      )}
    >
      {isNewlyDuplicated ? (
        <span className="bg-primary-600 absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase shadow-sm">
          {highlightLabel === 'activated' ? 'Just activated' : 'Just duplicated'}
        </span>
      ) : null}
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

      <VCardOverflowMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        cardRef={cardRef}
        isDeleting={isDeleting}
        actionsDisabled={ownerLocked}
        actionsDisabledReason={SUSPENDED_CARD_MESSAGE}
        onDelete={() => setDeleteOpen(true)}
        onSettings={goSettings}
      />

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
                status === 'draft' &&
                  'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                status === 'inactive' &&
                  'border-slate-500/20 bg-slate-500/5 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
                status === 'paused' &&
                  'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                status === 'suspended' &&
                  'border-rose-500/20 bg-rose-500/5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  status === 'active'
                    ? 'bg-emerald-500'
                    : status === 'draft' || status === 'paused'
                      ? 'bg-amber-500'
                      : status === 'suspended'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                )}
              />
              {status}
            </span>
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
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
            <VCardVisibilityToggle
              id={card.id ? `vcard-visibility-${card.id}` : 'vcard-visibility-missing'}
              checked={!isDraft && isPublic}
              disabled={isUpdatingVisibility || !card.id}
              locked={visibilityLocked}
              title={
                ownerLocked
                  ? accountSuspended
                    ? ACCOUNT_SUSPENDED_MESSAGE
                    : SUSPENDED_CARD_MESSAGE
                  : pausedByAdmin
                    ? ACCOUNT_PAUSED_VCARD_MESSAGE
                    : undefined
              }
              compact
              onChange={(next) => void handleVisibilityChange(next)}
              onLockedAttempt={() =>
                notify.warning(
                  ownerLocked
                    ? accountSuspended
                      ? ACCOUNT_SUSPENDED_MESSAGE
                      : SUSPENDED_CARD_MESSAGE
                    : ACCOUNT_PAUSED_VCARD_MESSAGE
                )
              }
            />
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
            {socialStats.map((soc) => (
              <SocialClickChip key={soc.key} stat={soc} compact />
            ))}
            <ContactSaveChip count={saves} compact />
            <ShareCountChip count={Number(card.shareCount || clicks) || 0} compact />
            <button
              type="button"
              disabled={ownerLocked}
              onClick={(e) => {
                e.stopPropagation()
                if (ownerLocked) {
                  setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
                  return
                }
                onNotice(card)
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[9px] font-black tracking-wider uppercase transition-colors',
                ownerLocked
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500'
                  : noticeText
                    ? noticeTone === 'success'
                      ? 'border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/25 dark:text-emerald-200'
                      : noticeTone === 'warning'
                        ? 'border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/25 dark:text-amber-200'
                        : 'border-indigo-300/60 bg-indigo-100 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/25 dark:text-indigo-200'
                    : 'border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25'
              )}
              title={ownerLocked ? SUSPENDED_CARD_MESSAGE : noticeText || 'Card announcement'}
            >
              <Megaphone className="h-3 w-3" />
              Notice
            </button>
          </div>
        </div>

        <VCardCardActions
          onEdit={() => {
            if (ownerLocked) {
              setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
              return
            }
            goEdit()
          }}
          onView={handleView}
          onPanel={() => onPanel(card)}
          onQr={handleQr}
          onDuplicate={() => {
            if (ownerLocked) {
              setAlertState({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
              return
            }
            if (onDuplicate) {
              onDuplicate()
              return
            }
            if (!canDuplicate) setAlertState({ title: 'Cannot duplicate', description: duplicateDisabledReason })
          }}
          duplicateDisabled={ownerLocked || (!canDuplicate && !onDuplicate)}
          isDuplicating={isDuplicating}
          duplicateTitle={
            ownerLocked
              ? SUSPENDED_CARD_MESSAGE
              : canDuplicate || onDuplicate
                ? 'Duplicate this card'
                : duplicateDisabledReason
          }
          editDisabled={ownerLocked}
          editTitle={ownerLocked ? SUSPENDED_CARD_MESSAGE : 'Edit card'}
          viewDisabled={ownerLocked}
          viewTitle={ownerLocked ? SUSPENDED_CARD_MESSAGE : 'View live card'}
          qrDisabled={ownerLocked}
          qrTitle={ownerLocked ? SUSPENDED_CARD_MESSAGE : 'QR Code'}
        />
      </div>
    </div>
  )
}
