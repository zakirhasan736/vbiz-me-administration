'use client'

import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import {
  CorporateContactSavesPanel,
  type CorporateLeadRecord,
} from '@/components/dashboard/corporate/CorporateContactSavesPanel'
import { CorporateLeadNotesRepliesPanel } from '@/components/dashboard/corporate/CorporateLeadNotesRepliesPanel'
import { VCardTeamCard } from '@/components/dashboard/vcard/VCardTeamCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { isNewCardHighlight, newCardHighlightLabel } from '@/lib/cardHighlight'
import { noticeForCard, noticeTypeFromTeamNotice } from '@/lib/cardNotice'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import type { DashboardSocialChannel, TeamNotice } from '@/redux/features/profiles/profiles.api'
import {
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useExportContactsCsvMutation,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import {
  Bell,
  Download,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Save,
  Sliders,
  Trash2,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
} from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'

export type HubTab = 'directory' | 'leads' | 'socials'
type LeadsTab = 'saves' | 'notes'

type SocialChannelStat = {
  channel: DashboardSocialChannel | string
  label: string
  count: number
  trendPercent?: number
}

type SocialClickRow = { platform: string; clickCount: number }

type CorporateControlsHubProps = {
  cards: VCardRecord[]
  contacts: CorporateLeadRecord[]
  socialChannels?: SocialChannelStat[]
  socialClicksByCard?: Record<string, SocialClickRow[]>
  teamNotices?: TeamNotice[]
  totalViews?: number
  statsLoading?: boolean
  activeCount?: number
  canCreate: boolean
  createDisabledReason: string
  quotaLimit: number | null
  draggedIndex: number | null
  onDragStart: (index: number) => void
  onDragDrop: (cards: VCardRecord[], targetIndex: number) => void
  onPanel: (card: VCardRecord) => void
  onNotice: (card: VCardRecord) => void
  onOpenQr: (url: string, name?: string, centerImageUrl?: string) => void
  onDuplicate: (card: VCardRecord) => void
  onTrends?: (card: VCardRecord) => void
  noticeVersion?: number
  duplicatingCardId?: string | null
  highlightedDuplicatedId?: string | null
  highlightedActivatedId?: string | null
  onActivatedFromDraft?: (cardId: string) => void
  activeTab?: HubTab
  onActiveTabChange?: (tab: HubTab) => void
  showBulkSelect?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
  contactHandlersForCard?: (card: VCardRecord) => {
    onEmail: () => void
    onCall: () => void
    onSchedule: () => void
  }
}

const DEPT_COLORS = ['bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-slate-400', 'bg-emerald-500', 'bg-cyan-500']

export function CorporateControlsHub({
  cards,
  contacts,
  socialChannels = [],
  socialClicksByCard = {},
  teamNotices = [],
  totalViews,
  statsLoading = false,
  activeCount,
  canCreate,
  createDisabledReason,
  draggedIndex,
  onDragStart,
  onDragDrop,
  onPanel,
  onNotice,
  onOpenQr,
  onDuplicate,
  onTrends,
  noticeVersion = 0,
  duplicatingCardId = null,
  highlightedDuplicatedId = null,
  highlightedActivatedId = null,
  onActivatedFromDraft,
  activeTab: controlledTab,
  onActiveTabChange,
  showBulkSelect = false,
  selectedIds = [],
  onToggleSelect,
  contactHandlersForCard,
}: CorporateControlsHubProps) {
  const [internalTab, setInternalTab] = useState<HubTab>('directory')
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = onActiveTabChange ?? setInternalTab

  const [leadsInboxTab, setLeadsInboxTab] = useState<LeadsTab>('saves')
  const [filterLeadCardId, setFilterLeadCardId] = useState('all')
  const [newBroadcastText, setNewBroadcastText] = useState('')
  const [newBroadcastAudience, setNewBroadcastAudience] = useState<'all' | 'savers'>('all')
  const [newBroadcastType, setNewBroadcastType] = useState<'broadcast' | 'system' | 'info' | 'warning' | 'success'>(
    'info'
  )
  const [broadcastCardFilter, setBroadcastCardFilter] = useState('')
  const [alert, setAlert] = useState<{ title: string; description: string } | null>(null)
  const [deleteBroadcastId, setDeleteBroadcastId] = useState<string | null>(null)

  const [createTeamNotice, { isLoading: creatingNotice }] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()
  const [exportContactsCsv, { isLoading: exportingCsv }] = useExportContactsCsvMutation()

  const resolvedBroadcastCardFilter = broadcastCardFilter || cards[0]?.id || ''

  const broadcastTargetCard = useMemo(
    () => cards.find((c) => c.id === resolvedBroadcastCardFilter) || null,
    [cards, resolvedBroadcastCardFilter]
  )
  const broadcastTargetLocked = Boolean(broadcastTargetCard && isOwnerCardLocked(broadcastTargetCard.status))

  const cardStatusById = useMemo(() => {
    const map = new Map<string, string | null | undefined>()
    for (const c of cards) {
      map.set(c.id, c.status)
    }
    return map
  }, [cards])

  const cardNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of cards) {
      map.set(c.id, c.personal?.fullName || c.slug || c.id)
    }
    return map
  }, [cards])

  const visibleTeamNotices = useMemo(() => {
    if (!resolvedBroadcastCardFilter) return teamNotices
    return teamNotices.filter((n) => !n.targetCardId || n.targetCardId === resolvedBroadcastCardFilter)
  }, [teamNotices, resolvedBroadcastCardFilter])

  const filteredContacts = useMemo(() => {
    if (filterLeadCardId === 'all') return contacts
    return contacts.filter((c) => c.profile?.id === filterLeadCardId)
  }, [contacts, filterLeadCardId])

  const savesContacts = useMemo(() => filteredContacts.filter((c) => c.source !== 'note'), [filteredContacts])
  const notesContacts = useMemo(
    () => filteredContacts.filter((c) => Boolean((c.message || '').trim()) || c.source === 'note'),
    [filteredContacts]
  )

  const aggregatedSocial = useMemo(() => {
    const map: Record<string, number> = {}
    const cardClickEntries = Object.values(socialClicksByCard)
    const hasCardClicks = cardClickEntries.some((rows) => rows.length > 0)

    if (hasCardClicks) {
      for (const rows of cardClickEntries) {
        for (const row of rows) {
          map[row.platform] = (map[row.platform] || 0) + row.clickCount
        }
      }
      return map
    }

    for (const ch of socialChannels) {
      const label = ch.label || String(ch.channel)
      map[label] = (map[label] || 0) + ch.count
    }
    return map
  }, [socialChannels, socialClicksByCard])

  const totalSocialClicks = Object.values(aggregatedSocial).reduce((a, b) => a + b, 0)
  const topChannel = Object.entries(aggregatedSocial).sort((a, b) => b[1] - a[1])[0]
  const viewsReady = typeof totalViews === 'number' && Number.isFinite(totalViews)
  const avgClicksPerCard = cards.length ? Math.round(totalSocialClicks / cards.length) : 0
  const reachRate = viewsReady && totalViews > 0 ? ((totalSocialClicks / totalViews) * 100).toFixed(1) : undefined

  const designationBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    for (const card of cards) {
      const label = (card.personal?.designation || '').trim() || 'Unspecified'
      const clicks = (socialClicksByCard[card.id] || []).reduce((sum, row) => sum + (row.clickCount || 0), 0)
      totals.set(label, (totals.get(label) || 0) + clicks)
    }
    const grand = [...totals.values()].reduce((a, b) => a + b, 0)
    return [...totals.entries()]
      .map(([dept, count], index) => ({
        dept,
        count: `${count.toLocaleString()} clicks`,
        pct: grand > 0 ? Math.round((count / grand) * 100) : 0,
        color: DEPT_COLORS[index % DEPT_COLORS.length],
        sortCount: count,
      }))
      .sort((a, b) => b.sortCount - a.sortCount)
  }, [cards, socialClicksByCard])

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBroadcastText.trim() || creatingNotice) return
    if (!resolvedBroadcastCardFilter) {
      setAlert({
        title: 'Select a card',
        description: 'Announcements must target one team card — they are never published to every card.',
      })
      return
    }
    if (broadcastTargetLocked) {
      setAlert({
        title: 'Card suspended',
        description: SUSPENDED_CARD_MESSAGE,
      })
      return
    }
    try {
      const created = await createTeamNotice({
        text: newBroadcastText.trim(),
        type: newBroadcastType,
        audience: newBroadcastAudience,
        targetProfileId: resolvedBroadcastCardFilter,
      }).unwrap()
      setNewBroadcastText('')
      if (!broadcastCardFilter) setBroadcastCardFilter(resolvedBroadcastCardFilter)
      const cardLabel = cardNameById.get(resolvedBroadcastCardFilter) || 'selected card'
      setAlert({
        title: newBroadcastAudience === 'savers' ? 'Sent to savers' : 'Notice published',
        description:
          newBroadcastAudience === 'savers'
            ? `Notified ${created.recipientCount ?? 0} saver${(created.recipientCount ?? 0) === 1 ? '' : 's'} for ${cardLabel}.`
            : `Announcement is scoped to ${cardLabel} only.`,
      })
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        (err as Error)?.message ||
        'Could not publish notice.'
      setAlert({ title: 'Publish failed', description: message })
    }
  }

  const handleExportLeadsCsv = async () => {
    try {
      const blob = await exportContactsCsv(filterLeadCardId === 'all' ? undefined : filterLeadCardId).unwrap()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `corporate-leads_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message || (err as Error)?.message || 'Could not export CSV.'
      setAlert({ title: 'Export failed', description: message })
    }
  }

  const activeProfilesLabel = activeCount ?? cards.filter((c) => c.isActive).length

  return (
    <>
      <div
        id="corporate-controls-hub"
        className="animate-in fade-in relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/20 duration-500 dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-none"
      >
        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 px-4 pt-4 md:gap-6 md:px-8 md:pt-0 dark:border-white/5 dark:bg-white/2">
          <TabButton
            active={activeTab === 'directory'}
            onClick={() => setActiveTab('directory')}
            tone="indigo"
            icon={Sliders}
          >
            Priority & Directory
          </TabButton>
          <TabButton
            active={activeTab === 'leads'}
            onClick={() => setActiveTab('leads')}
            tone="emerald"
            icon={Users}
            badge={contacts.length}
          >
            Leads & Notices
          </TabButton>
          <TabButton
            active={activeTab === 'socials'}
            onClick={() => setActiveTab('socials')}
            tone="purple"
            icon={Globe}
          >
            Socials Engagement Insights
          </TabButton>
        </div>

        {activeTab === 'directory' && (
          <div>
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-5 sm:flex-row sm:items-center dark:border-white/5 dark:bg-white/0.5">
              <div>
                <h3 className="text-slate-850 text-sm font-black tracking-wider uppercase dark:text-slate-200">
                  Managed Team Cards
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  Drag cards to reorder priority. Social click counts shown on each profile.
                </p>
              </div>
              <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/10 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase">
                {activeProfilesLabel} Active Profiles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 bg-slate-50/20 p-8 md:grid-cols-2 lg:grid-cols-3 dark:bg-black/10">
              {cards.map((card, idx) => {
                const serverNotice = noticeForCard(card.id, teamNotices)
                const contact = contactHandlersForCard?.(card)
                return (
                  <VCardTeamCard
                    key={card.id}
                    card={card}
                    mode="corporate"
                    badgeLabel="Corporate"
                    showDragHandle
                    dragged={draggedIndex === idx}
                    onDragStart={(e: DragEvent) => {
                      onDragStart(idx)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e: DragEvent) => e.preventDefault()}
                    onDrop={(e: DragEvent) => {
                      e.preventDefault()
                      onDragDrop(cards, idx)
                    }}
                    showCheckbox={showBulkSelect}
                    selected={selectedIds.includes(card.id)}
                    onToggleSelect={() => onToggleSelect?.(card.id)}
                    onCardClick={() => onPanel(card)}
                    onOpenQr={onOpenQr}
                    onPanel={onPanel}
                    onNotice={onNotice}
                    onEmail={contact?.onEmail}
                    onCall={contact?.onCall}
                    onSchedule={contact?.onSchedule}
                    onTrends={onTrends ? () => onTrends(card) : undefined}
                    noticeVersion={noticeVersion}
                    cardNoticeText={serverNotice?.text ?? null}
                    cardNoticeType={serverNotice ? noticeTypeFromTeamNotice(serverNotice) : null}
                    canDuplicate={canCreate}
                    duplicateDisabledReason={createDisabledReason}
                    onDuplicate={() => onDuplicate(card)}
                    isDuplicating={duplicatingCardId === card.id}
                    isNewlyDuplicated={
                      isNewCardHighlight(card.createdAt) ||
                      highlightedDuplicatedId === card.id ||
                      highlightedActivatedId === card.id
                    }
                    highlightLabel={
                      highlightedActivatedId === card.id
                        ? 'activated'
                        : newCardHighlightLabel(card.duplicatedFrom) === 'duplicated' ||
                            highlightedDuplicatedId === card.id
                          ? 'duplicated'
                          : 'new'
                    }
                    onActivatedFromDraft={onActivatedFromDraft}
                  />
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="animate-in fade-in space-y-8 p-8 duration-300">
            <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/1">
              <div className="border-slate-150 mb-6 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center dark:border-white/5">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                    <Bell className="h-4 w-4 animate-pulse text-amber-500" />
                    Team Announcements
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Publish info / warning / success notices for one team card at a time (never all cards).
                  </p>
                </div>
              </div>

              {broadcastTargetLocked ? (
                <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {SUSPENDED_CARD_MESSAGE}
                </p>
              ) : null}

              <form
                onSubmit={(e) => void handleCreateBroadcast(e)}
                className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-12"
              >
                <div className="space-y-1.5 lg:col-span-4">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Announcement Text
                  </label>
                  <input
                    required
                    value={newBroadcastText}
                    onChange={(e) => setNewBroadcastText(e.target.value)}
                    disabled={broadcastTargetLocked}
                    placeholder="e.g. Please note: Our HQ office has relocated!"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Audience</label>
                  <select
                    value={newBroadcastAudience}
                    onChange={(e) => setNewBroadcastAudience(e.target.value as 'all' | 'savers')}
                    disabled={broadcastTargetLocked}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="all">This card (owner dashboard)</option>
                    <option value="savers">Savers of this card</option>
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Target card</label>
                  <select
                    required
                    value={resolvedBroadcastCardFilter}
                    onChange={(e) => setBroadcastCardFilter(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    {!resolvedBroadcastCardFilter ? (
                      <option value="" disabled>
                        Select a card…
                      </option>
                    ) : null}
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.personal.fullName || c.slug || c.id}
                        {isOwnerCardLocked(c.status) ? ' (suspended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Notice type</label>
                  <select
                    value={newBroadcastType}
                    onChange={(e) =>
                      setNewBroadcastType(e.target.value as 'broadcast' | 'system' | 'info' | 'warning' | 'success')
                    }
                    disabled={broadcastTargetLocked}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="system">Critical alert</option>
                    <option value="broadcast">Announcement</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingNotice || broadcastTargetLocked}
                  title={broadcastTargetLocked ? SUSPENDED_CARD_MESSAGE : undefined}
                  className="w-full rounded-xl bg-amber-600 py-3 text-xs font-black tracking-wider text-white uppercase transition-all hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
                >
                  {creatingNotice
                    ? 'Publishing…'
                    : newBroadcastAudience === 'savers'
                      ? 'Send to Savers'
                      : 'Publish Notice'}
                </button>
              </form>

              <div className="mt-6">
                <h4 className="mb-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Recent messages for{' '}
                  {resolvedBroadcastCardFilter ? cardNameById.get(resolvedBroadcastCardFilter) || 'selected card' : '…'}{' '}
                  ({visibleTeamNotices.length})
                </h4>
                {visibleTeamNotices.length === 0 ? (
                  <p className="text-[11px] font-bold text-slate-400 italic">No announcements for this card yet.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                    {visibleTeamNotices.map((msg) => {
                      const noticeTargetLocked = Boolean(
                        msg.targetCardId && isOwnerCardLocked(cardStatusById.get(msg.targetCardId))
                      )
                      return (
                        <div
                          key={msg.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3 text-xs dark:border-white/5 dark:bg-slate-900"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-[8px] font-black tracking-wider uppercase',
                                msg.type === 'warning' || msg.type === 'system'
                                  ? 'border border-amber-500/20 bg-amber-500/15 text-amber-600'
                                  : msg.type === 'success'
                                    ? 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-600'
                                    : 'border border-indigo-500/20 bg-indigo-500/15 text-indigo-600'
                              )}
                            >
                              {msg.type}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate pr-4 font-semibold text-slate-700 dark:text-zinc-200">
                                {msg.text}
                              </p>
                              {msg.targetCardId ? (
                                <p className="truncate text-[10px] font-bold text-slate-400">
                                  {cardNameById.get(msg.targetCardId) || 'Card'}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                            </span>
                            <button
                              type="button"
                              disabled={noticeTargetLocked}
                              title={noticeTargetLocked ? SUSPENDED_CARD_MESSAGE : 'Remove announcement'}
                              onClick={() => {
                                if (noticeTargetLocked) {
                                  setAlert({ title: 'Card suspended', description: SUSPENDED_CARD_MESSAGE })
                                  return
                                }
                                setDeleteBroadcastId(msg.id)
                              }}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-full min-w-0 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f15]">
              <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-3 pt-4 sm:px-6 dark:border-white/5">
                <div className="flex w-full min-w-0 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setLeadsInboxTab('saves')}
                    className={cn(
                      'min-w-0 flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase sm:px-4 sm:text-[11px]',
                      leadsInboxTab === 'saves'
                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Save className="h-3.5 w-3.5 shrink-0" /> Saves
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadsInboxTab('notes')}
                    className={cn(
                      'min-w-0 flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase sm:px-4 sm:text-[11px]',
                      leadsInboxTab === 'notes'
                        ? 'bg-white text-rose-700 shadow-sm dark:bg-slate-800 dark:text-rose-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" /> Notes
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <select
                    value={filterLeadCardId}
                    onChange={(e) => setFilterLeadCardId(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none sm:max-w-xs dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="all">All cards</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.personal.fullName || c.slug || c.id}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={exportingCsv}
                    onClick={() => void handleExportLeadsCsv()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black tracking-wider text-slate-700 uppercase hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCsv ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-5">
                {leadsInboxTab === 'saves' ? (
                  <CorporateContactSavesPanel contacts={savesContacts} className="rounded-2xl border-0 shadow-none" />
                ) : (
                  <CorporateLeadNotesRepliesPanel contacts={notesContacts} />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'socials' && (
          <div className="animate-in fade-in space-y-8 p-8 duration-300">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center dark:border-white/5">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <Globe className="h-5 w-5 text-purple-500" />
                  Social Clicks Breakdown & Platform Engagement
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Aggregate social platform interaction metrics, click-through performance, and card-by-card social
                  handle traffic statistics.
                </p>
              </div>
              <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-black tracking-wider text-purple-600 uppercase dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                Live Updates Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total Social Clicks"
                value={statsLoading ? undefined : totalSocialClicks.toLocaleString()}
                loading={statsLoading}
                hint="Cumulative clicks on all cards"
              />
              <KpiCard
                label="Top Social Channel"
                value={statsLoading ? undefined : topChannel?.[0] || '—'}
                loading={statsLoading}
                hint={statsLoading ? 'Leading channel visits' : `Leading with ${topChannel?.[1] || 0} visits`}
              />
              <KpiCard
                label="Avg Clicks Per Card"
                value={statsLoading ? undefined : String(avgClicksPerCard)}
                loading={statsLoading}
                hint="Across managed directory cards"
              />
              <KpiCard
                label="Est. Reach Rate"
                value={statsLoading || reachRate == null ? undefined : `${reachRate}%`}
                loading={statsLoading || !viewsReady}
                hint="Social interaction vs views"
              />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-[#0b0f19]">
                  <h4 className="mb-2 text-xs font-black tracking-wider text-slate-400 uppercase">
                    Platform Clicks Breakdown List
                  </h4>
                  <div className="space-y-4">
                    {Object.keys(aggregatedSocial).length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 italic">No social clicks recorded yet.</p>
                    ) : (
                      (Object.entries(aggregatedSocial) as [string, number][]).map(([platform, count]) => {
                        const percentage = totalSocialClicks ? ((count / totalSocialClicks) * 100).toFixed(1) : '0.0'
                        const styling = platformStyling(platform)
                        return (
                          <div
                            key={platform}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-100/30 dark:border-white/5 dark:bg-white/0.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-xl border',
                                    styling.bg,
                                    styling.color,
                                    styling.border
                                  )}
                                >
                                  <PlatformIcon platform={platform} />
                                </div>
                                <div>
                                  <span className="block text-sm font-extrabold text-slate-800 dark:text-white">
                                    {platform}
                                  </span>
                                  <span className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                    {percentage}% Share
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-xl font-black text-slate-900 dark:text-white">
                                  {count.toLocaleString()} clicks
                                </span>
                                <span className="mt-0.5 block text-[10px] font-bold text-slate-400">
                                  Verified Click interactions
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-white/5">
                              <div
                                className={cn('h-full rounded-full transition-all duration-500', styling.fill)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-[#0b0f19]">
                  <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                    Department Engagement Breakdown
                  </h4>
                  <p className="text-[11px] leading-snug font-semibold text-slate-400">
                    Distribution of click engagement across designations (same basis as Consolidated).
                  </p>
                  <div className="space-y-4 pt-2">
                    {designationBreakdown.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 italic">No engagement data yet.</p>
                    ) : (
                      designationBreakdown.map((d) => (
                        <div key={d.dept} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>{d.dept}</span>
                            <span>
                              {d.count} ({d.pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                            <div className={cn('h-full rounded-full', d.color)} style={{ width: `${d.pct}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-[#0b0f19]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-sm font-black tracking-wider text-slate-800 uppercase dark:text-slate-200">
                    Card-by-Card Social Performance Grid
                  </h4>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">
                    Detailed view of social link performance for each managed profile
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => {
                  const cardClicksList = socialClicksByCard[card.id] || []
                  const sumClicks = cardClicksList.reduce((acc, cur) => acc + (cur.clickCount || 0), 0)
                  const views = card.views || 0
                  return (
                    <div
                      key={card.id}
                      className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 transition-all hover:border-indigo-500/30 dark:border-white/5 dark:bg-white/0.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-[14px] leading-tight font-black text-slate-900 dark:text-white">
                              {card.personal?.fullName}
                            </h5>
                            <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                              {card.personal?.designation || 'Specialist'}
                            </span>
                            <span className="mt-1.5 inline-block rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-black tracking-wide text-indigo-500 uppercase dark:border-indigo-500/20 dark:bg-indigo-500/10">
                              {card.personal?.profession || 'Directory'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-lg font-black text-slate-900 dark:text-white">
                              {sumClicks || 0}
                            </span>
                            <span className="mt-0.5 block text-[9px] font-black text-slate-400 uppercase">
                              Total Clicks
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                          <span className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            Active channels and click details:
                          </span>
                          {cardClicksList.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {cardClicksList.map((ch) => (
                                <span
                                  key={ch.platform}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-300"
                                >
                                  {ch.platform}:{' '}
                                  <strong className="font-extrabold text-slate-900 dark:text-white">
                                    {ch.clickCount || 0}
                                  </strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] font-medium text-slate-400 italic">
                              No social clicks recorded for this card yet.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px] dark:border-white/5">
                        <span className="text-slate-400">
                          Views: <strong>{views}</strong>
                        </span>
                        <span className="font-extrabold text-indigo-500">
                          CTR: {views ? ((sumClicks / views) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertModal
        open={!!alert}
        title={alert?.title || ''}
        description={alert?.description || ''}
        onClose={() => setAlert(null)}
        variant={alert?.title?.toLowerCase().includes('fail') ? 'danger' : 'success'}
      />

      <ConfirmModal
        open={!!deleteBroadcastId}
        title="Remove announcement?"
        description="Visitors will no longer see this banner."
        confirmLabel="Remove"
        variant="danger"
        icon={Trash2}
        onCancel={() => setDeleteBroadcastId(null)}
        onConfirm={() => {
          if (deleteBroadcastId) {
            void deleteTeamNotice(deleteBroadcastId)
          }
          setDeleteBroadcastId(null)
        }}
      />
    </>
  )
}

function platformStyling(platform: string) {
  if (platform === 'Facebook') {
    return {
      color: 'text-[#1877F2]',
      bg: 'bg-[#1877F2]/10',
      border: 'border-[#1877F2]/20',
      fill: 'bg-[#1877F2]',
    }
  }
  if (platform === 'Instagram') {
    return {
      color: 'text-[#E4405F]',
      bg: 'bg-[#E4405F]/10',
      border: 'border-[#E4405F]/20',
      fill: 'bg-[#E4405F]',
    }
  }
  if (platform === 'WhatsApp') {
    return {
      color: 'text-[#25D366]',
      bg: 'bg-[#25D366]/10',
      border: 'border-[#25D366]/20',
      fill: 'bg-[#25D366]',
    }
  }
  if (platform === 'Twitter') {
    return {
      color: 'text-[#1DA1F2]',
      bg: 'bg-[#1DA1F2]/10',
      border: 'border-[#1DA1F2]/20',
      fill: 'bg-[#1DA1F2]',
    }
  }
  if (platform === 'YouTube') {
    return {
      color: 'text-[#FF0000]',
      bg: 'bg-[#FF0000]/10',
      border: 'border-[#FF0000]/20',
      fill: 'bg-[#FF0000]',
    }
  }
  if (platform.includes('Web')) {
    return {
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#8b5cf6]/10',
      border: 'border-[#8b5cf6]/20',
      fill: 'bg-[#8b5cf6]',
    }
  }
  return {
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    border: 'border-[#0A66C2]/20',
    fill: 'bg-[#0A66C2]',
  }
}

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'h-5 w-5'
  if (platform === 'LinkedIn') return <Linkedin className={cls} />
  if (platform === 'Facebook') return <Facebook className={cls} />
  if (platform === 'Instagram') return <Instagram className={cls} />
  if (platform === 'WhatsApp') return <MessageCircle className={cls} />
  if (platform === 'Twitter') return <Twitter className={cls} />
  if (platform === 'YouTube') return <Youtube className={cls} />
  return <Globe className={cls} />
}

function TabButton({
  active,
  onClick,
  tone,
  icon: Icon,
  badge,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'indigo' | 'emerald' | 'purple'
  icon: typeof Sliders
  badge?: number
  children: React.ReactNode
}) {
  const colors = {
    indigo: active ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400' : '',
    emerald: active ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400' : '',
    purple: active ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400' : '',
  }
  const bg = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
    purple: 'bg-purple-50 dark:bg-purple-500/10',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.5 border-b-2 px-4 py-4 text-[11px] font-black tracking-widest uppercase outline-none md:py-6',
        active
          ? colors[tone]
          : 'border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:hover:border-slate-700 dark:hover:text-slate-200'
      )}
    >
      <div className={cn('rounded-lg p-1.5 transition-colors', active ? bg[tone] : 'bg-transparent')}>
        <Icon className="h-4 w-4" />
      </div>
      {children}
      {badge != null ? (
        <span
          className={cn(
            'ml-1 rounded-md px-2 py-0.5 text-[10px] font-bold',
            active
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function KpiCard({
  label,
  value,
  hint,
  trend,
  loading = false,
}: {
  label: string
  value?: string
  hint: string
  trend?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/1">
      <span className="block text-[10px] font-black tracking-wider text-slate-400 uppercase">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        {loading || value == null ? (
          <Skeleton className="h-9 w-20 rounded-xl" />
        ) : (
          <span className="max-w-37.5 truncate text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        )}
        {trend ? (
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
            <TrendingUp className="h-3 w-3" /> {trend}
          </span>
        ) : (
          <TrendingUp className="h-3 w-3 text-emerald-500" />
        )}
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{hint}</p>
    </div>
  )
}
