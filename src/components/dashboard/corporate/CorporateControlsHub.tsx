'use client'

import { AlertModal } from '@/components/AlertModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ContactSavesPanel, LeadNotesPanel, type DashboardContact } from '@/components/dashboard/home'
import { VCardTeamCard } from '@/components/dashboard/vcard/VCardTeamCard'
import { getCardSocialClickStats } from '@/components/dashboard/vcard/socialStats'
import {
  addCorporateBroadcast,
  deleteCorporateBroadcast,
  loadCorporateBroadcasts,
  type CorporateBroadcast,
} from '@/lib/corporateBroadcasts'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Bell, Download, Globe, MessageCircle, Save, Sliders, Trash2, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent } from 'react'

type HubTab = 'directory' | 'leads' | 'socials'
type LeadsTab = 'saves' | 'notes'

type SocialChannelStat = {
  channel: DashboardSocialChannel
  label: string
  count: number
}

type CorporateControlsHubProps = {
  cards: VCardRecord[]
  contacts: DashboardContact[]
  socialChannels?: SocialChannelStat[]
  totalViews: number
  canCreate: boolean
  createDisabledReason: string
  quotaLimit: number
  draggedIndex: number | null
  onDragStart: (index: number) => void
  onDragDrop: (cards: VCardRecord[], targetIndex: number) => void
  onPanel: (card: VCardRecord) => void
  onNotice: (card: VCardRecord) => void
  onOpenQr: (url: string, name?: string) => void
  onDuplicate: (card: VCardRecord) => void
  onTrends?: (card: VCardRecord) => void
  noticeVersion?: number
  activeTab?: HubTab
  onActiveTabChange?: (tab: HubTab) => void
  showBulkSelect?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

export function CorporateControlsHub({
  cards,
  contacts,
  socialChannels = [],
  totalViews,
  canCreate,
  createDisabledReason,
  quotaLimit,
  draggedIndex,
  onDragStart,
  onDragDrop,
  onPanel,
  onNotice,
  onOpenQr,
  onDuplicate,
  onTrends,
  noticeVersion = 0,
  activeTab: controlledTab,
  onActiveTabChange,
  showBulkSelect = false,
  selectedIds = [],
  onToggleSelect,
}: CorporateControlsHubProps) {
  const [internalTab, setInternalTab] = useState<HubTab>('directory')
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = onActiveTabChange ?? setInternalTab

  const [leadsInboxTab, setLeadsInboxTab] = useState<LeadsTab>('saves')
  const [filterLeadCardId, setFilterLeadCardId] = useState('all')
  const [broadcasts, setBroadcasts] = useState<CorporateBroadcast[]>([])
  const [newBroadcastText, setNewBroadcastText] = useState('')
  const [newBroadcastAudience, setNewBroadcastAudience] = useState<'all' | 'savers'>('all')
  const [newBroadcastType, setNewBroadcastType] = useState<'broadcast' | 'system'>('broadcast')
  const [broadcastCardFilter, setBroadcastCardFilter] = useState('all')
  const [alert, setAlert] = useState<{ title: string; description: string } | null>(null)
  const [deleteBroadcastId, setDeleteBroadcastId] = useState<string | null>(null)

  useEffect(() => {
    const load = () => setBroadcasts(loadCorporateBroadcasts())
    load()
    window.addEventListener('corporate_broadcasts_change', load)
    return () => window.removeEventListener('corporate_broadcasts_change', load)
  }, [])

  const filteredContacts = useMemo(() => {
    if (filterLeadCardId === 'all') return contacts
    return contacts.filter((c) => c.profile?.id === filterLeadCardId)
  }, [contacts, filterLeadCardId])

  const aggregatedSocial = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ch of socialChannels) {
      const label = ch.label || ch.channel
      map[label] = (map[label] || 0) + ch.count
    }
    for (const card of cards) {
      for (const stat of getCardSocialClickStats(card)) {
        map[stat.label] = (map[stat.label] || 0) + stat.clickCount
      }
    }
    return map
  }, [socialChannels, cards])

  const totalSocialClicks = Object.values(aggregatedSocial).reduce((a, b) => a + b, 0)
  const topChannel = Object.entries(aggregatedSocial).sort((a, b) => b[1] - a[1])[0]

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBroadcastText.trim()) return
    addCorporateBroadcast({
      text: newBroadcastText.trim(),
      type: newBroadcastType,
      audience: newBroadcastAudience,
      targetCardId: newBroadcastAudience === 'savers' ? broadcastCardFilter : undefined,
      recipientCount: newBroadcastAudience === 'savers' ? filteredContacts.length : undefined,
    })
    setNewBroadcastText('')
    setAlert({
      title: newBroadcastAudience === 'savers' ? 'Sent to savers' : 'Notice published',
      description: 'Your announcement has been saved and will appear on team cards.',
    })
  }

  const exportLeadsCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Card', 'Created']
    const rows = filteredContacts.map((c) => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.profile?.name || '',
      c.createdAt || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `corporate-leads_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div
        id="corporate-controls-hub"
        className="animate-in fade-in relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/20 duration-500 dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-none"
      >
        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 px-4 pt-4 md:gap-6 md:px-8 md:pt-0 dark:border-white/5 dark:bg-white/[0.02]">
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
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-5 sm:flex-row sm:items-center dark:border-white/5 dark:bg-white/[0.005]">
              <div>
                <h3 className="text-slate-850 text-sm font-black tracking-wider uppercase dark:text-slate-200">
                  Managed Team Cards
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  Drag cards to reorder priority. Social click counts shown on each profile.
                </p>
              </div>
              <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/10 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase">
                {cards.length} Active Profiles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 bg-slate-50/20 p-8 md:grid-cols-2 lg:grid-cols-3 dark:bg-black/10">
              {cards.map((card, idx) => (
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
                  noticeVersion={noticeVersion}
                  canDuplicate={canCreate}
                  duplicateDisabledReason={createDisabledReason}
                  onDuplicate={() => onDuplicate(card)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="animate-in fade-in space-y-8 p-8 duration-300">
            <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/[0.01]">
              <div className="border-slate-150 mb-6 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center dark:border-white/5">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                    <Bell className="h-4 w-4 animate-pulse text-amber-500" />
                    Team Announcements
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Publish notices shown on all public team vCards (office moves, events, urgent alerts).
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateBroadcast}
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
                    placeholder="e.g. Please note: Our HQ office has relocated!"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500/50 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Audience</label>
                  <select
                    value={newBroadcastAudience}
                    onChange={(e) => setNewBroadcastAudience(e.target.value as 'all' | 'savers')}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="all">Public card banners</option>
                    <option value="savers">People who saved contact</option>
                  </select>
                </div>
                {newBroadcastAudience === 'savers' && (
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Card filter
                    </label>
                    <select
                      value={broadcastCardFilter}
                      onChange={(e) => setBroadcastCardFilter(e.target.value)}
                      className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="all">All team cards</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.personal.fullName || c.slug || c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Alert Theme Type
                  </label>
                  <select
                    value={newBroadcastType}
                    onChange={(e) => setNewBroadcastType(e.target.value as 'broadcast' | 'system')}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="broadcast">Announcement (Neutral)</option>
                    <option value="system">Critical System Alert (Amber)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-600 py-3 text-xs font-black tracking-wider text-white uppercase transition-all hover:bg-amber-700 active:scale-95 lg:col-span-2"
                >
                  {newBroadcastAudience === 'savers' ? 'Send to Savers' : 'Publish Notice'}
                </button>
              </form>

              <div className="mt-6">
                <h4 className="mb-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Recent messages ({broadcasts.length})
                </h4>
                {broadcasts.length === 0 ? (
                  <p className="text-[11px] font-bold text-slate-400 italic">No announcements published yet.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                    {broadcasts.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-3 text-xs dark:border-white/5 dark:bg-slate-900"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-[8px] font-black tracking-wider uppercase',
                              msg.audience === 'savers'
                                ? 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-600'
                                : msg.type === 'system'
                                  ? 'border border-amber-500/20 bg-amber-500/15 text-amber-600'
                                  : 'border border-indigo-500/20 bg-indigo-500/15 text-indigo-600'
                            )}
                          >
                            {msg.audience === 'savers' ? 'savers' : msg.type}
                          </span>
                          <p className="truncate pr-4 font-semibold text-slate-700 dark:text-zinc-200">{msg.text}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteBroadcastId(msg.id)}
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                        ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-800 dark:text-rose-300'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" /> Notes
                    </span>
                  </button>
                </div>
                <div className="flex min-w-0 flex-col gap-2 pb-3 sm:flex-row">
                  <select
                    value={filterLeadCardId}
                    onChange={(e) => setFilterLeadCardId(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none dark:border-white/10 dark:bg-slate-900"
                  >
                    <option value="all">All Source Cards</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.personal.fullName || 'Unnamed Card'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={filteredContacts.length === 0}
                    onClick={exportLeadsCsv}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black tracking-wider text-white uppercase hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>
              </div>
              <div className="min-w-0 overflow-x-hidden p-2 sm:p-4">
                {leadsInboxTab === 'saves' ? (
                  <ContactSavesPanel contacts={filteredContacts} className="rounded-2xl border-0 shadow-none" />
                ) : (
                  <LeadNotesPanel
                    contacts={filteredContacts}
                    notesCount={filteredContacts.filter((c) => c.message).length}
                  />
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
                  Aggregate social platform interaction metrics across your corporate directory.
                </p>
              </div>
              <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-black tracking-wider text-purple-600 uppercase dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                Live Updates Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total Social Clicks"
                value={totalSocialClicks.toLocaleString()}
                hint="Cumulative clicks on all cards"
              />
              <KpiCard
                label="Top Social Channel"
                value={topChannel?.[0] || '—'}
                hint={`Leading with ${topChannel?.[1] || 0} visits`}
              />
              <KpiCard
                label="Avg Clicks Per Card"
                value={cards.length ? Math.round(totalSocialClicks / cards.length).toString() : '0'}
                hint="Highly balanced distribution"
              />
              <KpiCard
                label="Est. Reach Rate"
                value={totalViews > 0 ? `${((totalSocialClicks / totalViews) * 100).toFixed(1)}%` : '0.0%'}
                hint="Social interaction vs views"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {Object.entries(aggregatedSocial).map(([platform, count]) => {
                  const pct = totalSocialClicks ? ((count / totalSocialClicks) * 100).toFixed(1) : '0'
                  return (
                    <div
                      key={platform}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.005]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">{platform}</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {count.toLocaleString()} clicks
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/50 dark:bg-white/5">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-[#0b0f19]">
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">Card Performance</h4>
                <div className="mt-4 space-y-3">
                  {cards.slice(0, 6).map((card) => {
                    const stats = getCardSocialClickStats(card)
                    const sum = stats.reduce((a, s) => a + s.clickCount, 0)
                    return (
                      <div key={card.id} className="flex items-center justify-between text-xs">
                        <span className="truncate font-bold text-slate-700 dark:text-slate-200">
                          {card.personal.fullName || card.slug}
                        </span>
                        <span className="font-black text-indigo-500">{sum} clicks</span>
                      </div>
                    )
                  })}
                </div>
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
        variant="success"
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
          if (deleteBroadcastId) deleteCorporateBroadcast(deleteBroadcastId)
          setDeleteBroadcastId(null)
        }}
      />
    </>
  )
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

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
      <span className="block text-[10px] font-black tracking-wider text-slate-400 uppercase">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        <TrendingUp className="h-3 w-3 text-emerald-500" />
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{hint}</p>
    </div>
  )
}

export type { HubTab }
