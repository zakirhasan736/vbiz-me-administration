'use client'

import { ContactSaveChip, ShareCountChip, SocialClickChip } from '@/components/admin/AdminSocialClickChip'
import { TrafficSparkline } from '@/components/admin/AdminTrafficSparkline'
import VCardCardActions from '@/components/admin/AdminVCardCardActions'
import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { VCardOverflowMenu } from '@/components/dashboard/vcard/VCardOverflowMenu'
import { VCardVisibilityToggle } from '@/components/dashboard/vcard/VCardVisibilityToggle'
import type { AdminCard } from '@/lib/admin/adminCardShape'
import { getCardSocialClickStats } from '@/lib/adminSocialStats'
import { resolveCardAnalytics } from '@/lib/cardAnalytics'
import { ADMIN_PAUSED_CARD_MESSAGE, ADMIN_SUSPENDED_CARD_MESSAGE, resolveCardStatus } from '@/lib/cardStatus'
import { notify } from '@/lib/toast/toast'
import { useDeleteProfileMutation, useUpdateProfileCardMutation } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Building, GripVertical, Megaphone, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'

function personalField(personal: AdminCard['personal'], key: string): string {
  const value = personal?.[key]
  return typeof value === 'string' ? value : ''
}

function analyticsClicks(card: AdminCard): number {
  const analytics = card.analytics
  if (!analytics || typeof analytics !== 'object') return 0
  const clicks = (analytics as { clicks?: unknown }).clicks
  return Number(clicks) || 0
}

export type VCardTeamCardProps = {
  card: AdminCard
  /** Badge next to checkbox / left of slug — e.g. Corporate, My card, Single */
  badgeLabel?: string
  badgeTone?: 'neutral' | 'violet' | 'indigo'
  contactSaves?: number
  selected?: boolean
  showCheckbox?: boolean
  onToggleSelect?: () => void
  showDragHandle?: boolean
  dragged?: boolean
  onDragStart?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  /** Optional header slot (priority controls) replaces default badge row left side extras */
  headerLeft?: ReactNode
  showNotice?: boolean
  onNotice?: () => void
  /** Server notice text for this card; when set, overrides localStorage highlight. */
  cardNoticeText?: string | null
  cardNoticeType?: 'info' | 'warning' | 'success' | null
  /** Bump to re-read localStorage fallback after save/clear. */
  noticeVersion?: number
  onCardClick?: () => void
  onTrends?: () => void
  onEmail?: () => void
  onCall?: () => void
  onSchedule?: () => void
  onEdit: () => void
  onSettings?: () => void
  onView: () => void
  onPanel: () => void
  onQr: () => void
  onDuplicate: () => void
  duplicateDisabled?: boolean
  duplicateTitle?: string
  /** Shows spinner on the Duplicate button while this card is being copied. */
  isDuplicating?: boolean
  /** Primary border + chip to mark a card that was just duplicated or activated. */
  isNewlyDuplicated?: boolean
  /** Chip text when highlighted — defaults to duplicated. */
  highlightLabel?: 'duplicated' | 'activated' | 'paused' | 'new'
  /** Fired after a draft card is successfully published via Visibility ON. */
  onActivatedFromDraft?: (cardId: string) => void
  /** After a successful delete — mock cleanup, refetch, clear selection/panel */
  onDeleted?: (id: string) => void | Promise<void>
  className?: string
}

/**
 * Canonical team/vCard list card — same layout for corporate, admin My Cards, admin vCards, list.
 */
export default function VCardTeamCard({
  card,
  badgeLabel,
  badgeTone = 'neutral',
  contactSaves,
  selected,
  showCheckbox,
  onToggleSelect,
  showDragHandle = true,
  dragged,
  onDragStart,
  onDragOver,
  onDrop,
  headerLeft,
  showNotice = true,
  onNotice,
  cardNoticeText,
  cardNoticeType,
  noticeVersion = 0,
  onCardClick,
  onTrends,
  onEmail,
  onCall,
  onSchedule,
  onEdit,
  onSettings,
  onView,
  onPanel,
  onQr,
  onDuplicate,
  duplicateDisabled,
  duplicateTitle,
  isDuplicating = false,
  isNewlyDuplicated = false,
  highlightLabel = 'duplicated',
  onActivatedFromDraft,
  onDeleted,
  className,
}: VCardTeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [deleteProfile, { isLoading: isDeletingProfile }] = useDeleteProfileMutation()
  const [updateProfileCard] = useUpdateProfileCardMutation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [optimisticVisibility, setOptimisticVisibility] = useState<{
    cardId: string
    isPublic: boolean
    status: 'active' | 'inactive'
  } | null>(null)
  const [statsHovered, setStatsHovered] = useState(false)
  const [isDeletingLocal, setIsDeletingLocal] = useState(false)
  const [alertState, setAlertState] = useState<{
    title: string
    description: string
    variant?: 'default' | 'danger'
  } | null>(null)

  useEffect(() => {
    if (!isNewlyDuplicated) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isNewlyDuplicated])

  const slug = card.slug || 'profile'
  const cardId = String(card.id || '')
  const serverIsPublic = card.isPublic ?? true
  const isPublic = optimisticVisibility?.cardId === cardId ? optimisticVisibility.isPublic : serverIsPublic
  const isDraft = optimisticVisibility?.cardId === cardId ? false : Boolean(card.isDraft)
  const status = resolveCardStatus({
    status:
      optimisticVisibility?.cardId === cardId
        ? optimisticVisibility.status
        : typeof card.status === 'string'
          ? card.status
          : undefined,
    isDraft,
    isPublic,
  })

  const resolved = resolveCardAnalytics({
    id: card.id,
    slug: card.slug,
    viewCount: card.viewCount,
    uniqueViewCount: card.uniqueViewCount,
    shareCount: card.shareCount,
    saveCount: card.saveCount,
  })
  const views = resolved.viewCount
  const liveSocials = Array.isArray(card.socialClicks) ? card.socialClicks : []
  const clicks =
    analyticsClicks(card) ||
    liveSocials.reduce((sum, row) => sum + (Number(row.clickCount) || 0), 0) ||
    Number(card.shareCount) ||
    0
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0'
  const socialStats = getCardSocialClickStats(card, liveSocials)
  const saves = contactSaves !== undefined ? contactSaves : Number(card.saveCount || resolved.saveCount || 0)
  // Prefer server notice for this card id; fall back to per-card localStorage only.
  const localNoticeText =
    noticeVersion >= 0 && typeof window !== 'undefined' && card.id ? localStorage.getItem(`notice_${card.id}`) : null
  const noticeText = (cardNoticeText !== undefined ? cardNoticeText : localNoticeText) || null
  const noticeTone = cardNoticeType || 'info'
  const fullName = personalField(card.personal, 'fullName')
  const designation = personalField(card.personal, 'designation')
  const company = personalField(card.personal, 'company')
  const department = personalField(card.personal, 'department')
  const cardName = fullName || 'this vCard'
  const initial =
    fullName.trim()?.[0]?.toUpperCase() ||
    fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 1) ||
    'P'

  const badgeClass =
    badgeTone === 'violet'
      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/15'
      : badgeTone === 'indigo'
        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/15'
        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-150 dark:border-white/5'

  const isDeleting = isDeletingProfile || isDeletingLocal

  const handleVisibilityChange = (next: boolean) => {
    if (!cardId || status === 'paused' || status === 'suspended') return
    const activatingFromDraft = Boolean(card.isDraft) && next
    const nextStatus = next ? 'active' : 'inactive'
    setOptimisticVisibility({ cardId, isPublic: next, status: nextStatus })
    void updateProfileCard({
      id: cardId,
      body: next
        ? { isPublic: true, status: 'active', isDraft: false }
        : { isPublic: false, status: 'inactive', isDraft: false },
    })
      .unwrap()
      .then(() => {
        if (activatingFromDraft) onActivatedFromDraft?.(cardId)
      })
      .catch((error) => {
        setOptimisticVisibility((current) => (current?.cardId === cardId && current.isPublic === next ? null : current))
        const message =
          (error as { data?: { message?: string } })?.data?.message ||
          (error as Error)?.message ||
          'Could not update card visibility. Please try again.'
        notify.error(message)
      })
  }

  const handleDeleteConfirm = async () => {
    setIsDeletingLocal(true)
    try {
      // Pre-populated mock profiles are not API-backed
      if (cardId && !cardId.startsWith('vcard_')) {
        await deleteProfile(cardId).unwrap()
      }
      await onDeleted?.(cardId)
      setDeleteOpen(false)
      setMenuOpen(false)
    } catch {
      setAlertState({
        title: 'Delete failed',
        description: 'Could not delete this vCard. Please try again.',
        variant: 'danger',
      })
    } finally {
      setIsDeletingLocal(false)
    }
  }

  return (
    <div
      ref={cardRef}
      draggable={!!showDragHandle && !!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onCardClick}
      className={cn(
        'group relative flex h-auto cursor-pointer flex-col rounded-2xl border bg-white transition-all duration-300 hover:shadow-xl dark:bg-[#0b0f19]',
        dragged && 'opacity-40',
        isNewlyDuplicated
          ? 'border-primary-500 bg-primary-50/40 ring-primary-500/25 dark:bg-primary-500/10 border-2 ring-2'
          : status === 'suspended'
            ? 'border-rose-500/20 hover:border-rose-400/40'
            : status === 'paused'
              ? 'border-amber-500/20 hover:border-amber-400/40'
              : 'border-slate-200/60 hover:border-slate-400 dark:border-white/5 dark:hover:border-white/20',
        className
      )}
    >
      {isNewlyDuplicated ? (
        <span className="bg-primary-600 absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase shadow-sm">
          {highlightLabel === 'activated'
            ? 'Just activated'
            : highlightLabel === 'paused'
              ? 'Just paused'
              : highlightLabel === 'new'
                ? 'New card'
                : 'Just duplicated'}
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
        labelledBy={`delete-admin-vcard-title-${cardId}`}
        describedBy={`delete-admin-vcard-description-${cardId}`}
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

      {showDragHandle && (
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/60 bg-white/90 text-slate-400 dark:border-white/10 dark:bg-black/50">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}

      <VCardOverflowMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        cardRef={cardRef}
        isDeleting={isDeleting}
        onDelete={() => setDeleteOpen(true)}
        onSettings={onSettings}
      />

      <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
        <div>
          <div className={cn('flex items-start justify-between gap-2 pr-7', showDragHandle && 'pl-8')}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {headerLeft}
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onToggleSelect?.()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 accent-indigo-600 shadow-xs focus:ring-indigo-600"
                />
              )}
              {badgeLabel ? (
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                    badgeClass
                  )}
                >
                  {badgeLabel}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 rounded-md bg-indigo-500/5 px-2 py-0.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
              #{slug}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 text-base font-black text-indigo-600 shadow-inner dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400">
              {initial}
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
                  status === 'active' && 'bg-emerald-500',
                  status === 'draft' && 'bg-amber-500',
                  status === 'inactive' && 'bg-slate-400',
                  status === 'paused' && 'bg-amber-500',
                  status === 'suspended' && 'bg-rose-500'
                )}
              />
              {status}
            </span>
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm leading-snug font-extrabold text-slate-900 dark:text-white">
                {fullName || 'No Name Given'}
              </h3>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                {designation || 'Executive Team'}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <Building className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{company || department || 'Company'}</span>
              </div>
            </div>
            <VCardVisibilityToggle
              id={cardId ? `admin-vcard-visibility-${cardId}` : 'admin-vcard-visibility-missing'}
              checked={!isDraft && isPublic}
              disabled={!cardId}
              locked={status === 'paused' || status === 'suspended'}
              title={
                status === 'suspended'
                  ? ADMIN_SUSPENDED_CARD_MESSAGE
                  : status === 'paused'
                    ? ADMIN_PAUSED_CARD_MESSAGE
                    : undefined
              }
              compact
              onChange={handleVisibilityChange}
              onLockedAttempt={() =>
                notify.warning(status === 'suspended' ? ADMIN_SUSPENDED_CARD_MESSAGE : ADMIN_PAUSED_CARD_MESSAGE)
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
                {Number(views).toLocaleString()}
              </span>
            </div>
            <div className="border-x border-slate-200 text-center dark:border-white/10">
              <span className="block text-[8px] leading-none font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Clicks
              </span>
              <span className="mt-0.5 block text-[12px] leading-tight font-black text-slate-900 tabular-nums dark:text-white">
                {Number(clicks).toLocaleString()}
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
              <TrafficSparkline profileId={cardId} slug={slug} />
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
            {showNotice && noticeText ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[9px] font-black tracking-wider uppercase',
                  noticeTone === 'success'
                    ? 'border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/25 dark:text-emerald-200'
                    : noticeTone === 'warning'
                      ? 'border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/25 dark:text-amber-200'
                      : 'border-indigo-300/60 bg-indigo-100 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/25 dark:text-indigo-200'
                )}
                title={noticeText}
              >
                <Megaphone className="h-3 w-3" />
                Notice active
              </span>
            ) : null}
          </div>
        </div>

        <VCardCardActions
          onEmail={onEmail}
          onCall={onCall}
          onSchedule={onSchedule}
          onNotice={showNotice ? onNotice : undefined}
          onEdit={onEdit}
          onView={onView}
          onPanel={onPanel}
          onQr={onQr}
          onDuplicate={onDuplicate}
          duplicateDisabled={duplicateDisabled}
          duplicateTitle={duplicateTitle}
          isDuplicating={isDuplicating}
        />
      </div>
    </div>
  )
}
