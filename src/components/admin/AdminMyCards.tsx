'use client'

import VCardTeamCard from '@/components/admin/AdminDirectoryVCardTeamCard'
import VCardDetailSidebar, { VCardTrendsPopup } from '@/components/admin/AdminVCardDetailSidebar'
import VCardQrModal from '@/components/admin/AdminVCardQrModal'
import { VCardWeeklyEngagement } from '@/components/admin/VCardWeeklyEngagement'
import { CardLifecycleTabs, type CardLifecycleTab } from '@/components/dashboard/vcard/CardLifecycleTabs'
import { NoticeModal, type NoticeType } from '@/components/dashboard/vcard/NoticeModal'
import { VCardDirectoryListSkeleton } from '@/components/dashboard/vcard/VCardDirectoryListSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatNumber } from '@/components/ui/StatNumber'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import { useAppSelector } from '@/hooks/redux'
import { resolveMyCardsBadge } from '@/lib/admin/adminCardBadge'
import { toAdminCardShape, type AdminCard } from '@/lib/admin/adminCardShape'
import { useVCard } from '@/lib/admin/AdminVCardListContext'
import {
  clearLocalCardNotice,
  noticeForCard,
  noticeTypeFromTeamNotice,
  readLocalCardNotice,
  writeLocalCardNotice,
} from '@/lib/cardNotice'
import { notify } from '@/lib/toast/toast'
import { buildEditorSectionPath, buildEditorSettingsPath } from '@/lib/vcardEditorRoutes'
import { useAuth } from '@/providers/AuthProvider'
import {
  dashboardOverviewQueryOptions,
  mapApiProfileToVCardRecord,
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useDuplicateProfileMutation,
  useGetDashboardSummaryQuery,
  useGetProfilesQuery,
  useGetTeamNoticesQuery,
  type DashboardSocialChannel,
} from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import {
  CreditCard,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Pin,
  Plus,
  Radio,
  Save,
  Share2,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const CHANNEL_UI: Record<DashboardSocialChannel, { icon: LucideIcon; tone: string }> = {
  facebook: { icon: Facebook, tone: 'text-[#1877F2]' },
  twitter: { icon: Twitter, tone: 'text-sky-500' },
  instagram: { icon: Instagram, tone: 'text-pink-500' },
  whatsapp: { icon: MessageCircle, tone: 'text-emerald-500' },
  linkedin: { icon: Linkedin, tone: 'text-[#0A66C2]' },
  youtube: { icon: Youtube, tone: 'text-red-500' },
  tiktok: { icon: Music2, tone: 'text-slate-900 dark:text-white' },
  truth: { icon: Radio, tone: 'text-[#5415D0]' },
  rumble: { icon: Radio, tone: 'text-[#85C742]' },
  pinterest: { icon: Pin, tone: 'text-[#E60023]' },
  website: { icon: Globe, tone: 'text-purple-500' },
}

function SocialChannelCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
      <Skeleton className="mb-2 h-4 w-4 rounded-md" />
      <Skeleton variant="text" className="h-2.5 w-14" />
      <Skeleton className="mt-2 h-6 w-10" />
    </div>
  )
}

export default function AdminMyCards() {
  const { user } = useAuth()
  const reduxUser = useAppSelector((s) => s.user.user)
  const ownerId = reduxUser?.id || user?.uid
  const router = useRouter()
  const { setCurrentEditingCardId } = useVCard()
  const [duplicateProfile] = useDuplicateProfileMutation()
  const { data: createdProfilesResult, isLoading: cardsLoading } = useGetProfilesQuery(
    { scope: 'created', limit: 100 },
    dashboardOverviewQueryOptions
  )
  const { data: summary, isLoading: statsLoading } = useGetDashboardSummaryQuery(
    { period: 'all', scope: 'created' },
    dashboardOverviewQueryOptions
  )
  const stats = summary?.stats
  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const [panelCard, setPanelCard] = useState<AdminCard | null>(null)
  const [trendsCard, setTrendsCard] = useState<AdminCard | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')
  const [noticeCard, setNoticeCard] = useState<AdminCard | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [lifecycleTab, setLifecycleTab] = useState<CardLifecycleTab>('active')
  const [duplicatingCardId, setDuplicatingCardId] = useState<string | null>(null)
  const [highlightedDuplicatedId, setHighlightedDuplicatedId] = useState<string | null>(null)
  const [highlightedActivatedId, setHighlightedActivatedId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedDuplicatedId) return
    const timer = window.setTimeout(() => setHighlightedDuplicatedId(null), 12000)
    return () => window.clearTimeout(timer)
  }, [highlightedDuplicatedId])

  useEffect(() => {
    if (!highlightedActivatedId) return
    const timer = window.setTimeout(() => setHighlightedActivatedId(null), 12000)
    return () => window.clearTimeout(timer)
  }, [highlightedActivatedId])

  const createdProfiles = useMemo(() => createdProfilesResult?.items ?? [], [createdProfilesResult?.items])
  const showListSkeleton = cardsLoading && createdProfiles.length === 0

  const openQrModal = (url: string, name?: string) => {
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const myCards = useMemo(() => {
    return createdProfiles.map((p) =>
      toAdminCardShape(mapApiProfileToVCardRecord(p), ownerId, {
        profileUserId: p.userId || ownerId,
        companyUserId: p.companyUserId || null,
        companyUserRole: p.companyUser?.role || null,
        createdById: p.createdById || p.createdBy?.id || null,
        createdByRole: p.createdBy?.role || null,
        ownerRole: p.user?.role || null,
      })
    )
  }, [createdProfiles, ownerId])

  const activeCount = useMemo(() => myCards.filter((c) => !c.isDraft).length, [myCards])
  const draftCount = useMemo(() => myCards.filter((c) => Boolean(c.isDraft)).length, [myCards])
  const visibleCards = useMemo(
    () => myCards.filter((c) => (lifecycleTab === 'draft' ? Boolean(c.isDraft) : !c.isDraft)),
    [myCards, lifecycleTab]
  )

  const statsReady = Boolean(stats) && !statsLoading
  const socialChannels = stats?.socialChannels ?? []
  const socialTotal = statsReady
    ? socialChannels.reduce((sum, row) => sum + (row.count || 0), 0) || Number(stats?.shares || 0)
    : undefined

  const handleCreate = () => {
    setCurrentEditingCardId(null)
  }

  const handleActivatedFromDraft = (cardId: string) => {
    notify.success('Your card is now active.', {
      title: 'Card activated',
      action: {
        label: 'View in Active',
        onClick: () => {
          setLifecycleTab('active')
          setHighlightedActivatedId(cardId)
          setHighlightedDuplicatedId(null)
          setPanelCard(null)
        },
      },
    })
  }

  const handleDuplicate = async (card: AdminCard) => {
    if (!card.id || duplicatingCardId) return
    setDuplicatingCardId(card.id)
    try {
      const created = await duplicateProfile(card.id).unwrap()
      const newId = created?.id
      if (newId) {
        notify.success('Saved as a draft. Enter a unique email and date of birth before activating.', {
          title: 'Card duplicated',
          action: {
            label: 'View in Draft',
            onClick: () => {
              setLifecycleTab('draft')
              setHighlightedDuplicatedId(newId)
              setPanelCard(null)
            },
          },
        })
      }
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not duplicate card.'
      notify.error(message)
    } finally {
      setDuplicatingCardId(null)
    }
  }

  const noticeInitialText = noticeCard?.id
    ? noticeForCard(noticeCard.id, teamNotices)?.text || readLocalCardNotice(noticeCard.id).text
    : ''
  const noticeServer = noticeCard?.id ? noticeForCard(noticeCard.id, teamNotices) : null
  const noticeInitialType: NoticeType = noticeCard?.id
    ? noticeServer
      ? noticeTypeFromTeamNotice(noticeServer)
      : readLocalCardNotice(noticeCard.id).type
    : 'info'

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-4 duration-300 sm:p-6 lg:p-8">
      <div className="border-b border-slate-100 pb-6 dark:border-white/5">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
          <CreditCard className="h-7 w-7 text-indigo-500" />
          My Cards
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Analytics and details for your admin portfolio cards only. Full network totals stay on the Dashboard; the full
          directory lives under vCards.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">My cards</p>
          <StatNumber
            value={statsReady ? (stats?.cards ?? myCards.length) : undefined}
            loading={!statsReady}
            className="mt-2 block text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="mt-2 h-9 w-20"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Eye className="h-3.5 w-3.5" /> Total views
          </p>
          <StatNumber
            value={stats?.totalViews}
            loading={!statsReady}
            className="mt-2 block text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="mt-2 h-9 w-20"
          />
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
            Unique{' '}
            <StatNumber
              value={stats?.uniqueViews ?? stats?.viewsLast30Days}
              loading={!statsReady}
              skeletonClassName="h-3 w-8"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Share2 className="h-3.5 w-3.5" /> Shares
          </p>
          <StatNumber
            value={stats?.shares}
            loading={!statsReady}
            className="mt-2 block text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="mt-2 h-9 w-20"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Save className="h-3.5 w-3.5" /> Contact saves
          </p>
          <StatNumber
            value={stats?.contactsLast30Days}
            loading={!statsReady}
            className="mt-2 block text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="mt-2 h-9 w-20"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Share2 className="h-3.5 w-3.5" /> Social clicks
          </p>
          <StatNumber
            value={socialTotal}
            loading={!statsReady}
            className="mt-2 block text-3xl font-black text-slate-900 dark:text-white"
            skeletonClassName="mt-2 h-9 w-20"
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Share2 className="h-4 w-4 text-indigo-500" />
            Social analytics (my cards)
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {!statsReady
            ? Array.from({ length: 6 }).map((_, index) => <SocialChannelCardSkeleton key={index} />)
            : socialChannels.map((row) => {
                const ui = CHANNEL_UI[row.channel] ?? { icon: Globe, tone: 'text-slate-500' }
                const Icon = ui.icon
                return (
                  <div
                    key={row.channel}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"
                  >
                    <Icon className={cn('mb-2 h-4 w-4', ui.tone)} />
                    <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">{row.label}</p>
                    <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      <StatNumber value={row.count || 0} skeletonClassName="h-6 w-12" />
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {(showListSkeleton || myCards.length > 0) && (
        <VCardWeeklyEngagement vCardsList={myCards} aggregateAll scope="created" listLoading={showListSkeleton} />
      )}

      <div>
        <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h2 className="text-sm font-black tracking-wider text-slate-400 uppercase">Card list</h2>
            <CardLifecycleTabs
              value={lifecycleTab}
              onChange={setLifecycleTab}
              activeCount={activeCount}
              draftCount={draftCount}
              countsLoading={showListSkeleton}
            />
          </div>
          <CreateCardLauncher portfolioOwnerAssignment>
            {(open) => (
              <button
                type="button"
                onClick={() => {
                  handleCreate()
                  open()
                }}
                className="inline-flex w-fit shrink-0 items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black tracking-wider text-white uppercase hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Create card
              </button>
            )}
          </CreateCardLauncher>
        </div>

        {showListSkeleton ? (
          <VCardDirectoryListSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <CreateCardLauncher portfolioOwnerAssignment>
              {(open) => (
                <button
                  type="button"
                  onClick={() => {
                    handleCreate()
                    open()
                  }}
                  className="group flex min-h-87.5 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-all hover:border-indigo-500/30 hover:bg-slate-100 dark:border-white/10 dark:bg-[#070a13] dark:hover:bg-white/2"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
                    <Plus className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Create New Card</h3>
                  <p className="mt-1 max-w-50 text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    Add a card for yourself or a team member to your admin portfolio.
                  </p>
                </button>
              )}
            </CreateCardLauncher>

            {myCards.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 p-12 text-center md:col-span-2 lg:col-span-3 xl:col-span-4 dark:border-white/10">
                <p className="mb-4 text-sm font-semibold text-slate-500">
                  No admin portfolio cards yet. Create a card for yourself or a team member to get started.
                </p>
                <CreateCardLauncher portfolioOwnerAssignment>
                  {(open) => (
                    <button
                      type="button"
                      onClick={() => {
                        handleCreate()
                        open()
                      }}
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white uppercase"
                    >
                      Create first card
                    </button>
                  )}
                </CreateCardLauncher>
              </div>
            ) : visibleCards.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 p-12 text-center md:col-span-2 lg:col-span-3 xl:col-span-4 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-500">
                  {lifecycleTab === 'draft'
                    ? 'No draft cards in your portfolio.'
                    : 'No active cards yet — check Draft.'}
                </p>
              </div>
            ) : (
              visibleCards.map((card) => {
                const contactSaves = Number(card.saveCount || 0)
                const badge = resolveMyCardsBadge(card)
                const serverNotice = card.id ? noticeForCard(card.id, teamNotices) : null

                return (
                  <VCardTeamCard
                    key={card.id}
                    card={card}
                    badgeLabel={badge?.label}
                    badgeTone={badge?.tone}
                    contactSaves={contactSaves}
                    showDragHandle={false}
                    showNotice
                    onNotice={() => setNoticeCard(card)}
                    cardNoticeText={serverNotice?.text ?? null}
                    cardNoticeType={serverNotice ? noticeTypeFromTeamNotice(serverNotice) : null}
                    noticeVersion={noticeVersion}
                    onCardClick={() => setPanelCard(card)}
                    onTrends={() => setTrendsCard(card)}
                    onEdit={() => {
                      setCurrentEditingCardId(card.id || null)
                      router.push(buildEditorSectionPath('/vcards/edit', 'home', card.id))
                    }}
                    onSettings={() => {
                      setCurrentEditingCardId(card.id || null)
                      router.push(buildEditorSettingsPath('/vcards/edit', 'info', card.id))
                    }}
                    onView={() => window.open(`/v/${card.slug || 'profile'}`, '_blank')}
                    onPanel={() => setPanelCard(card)}
                    onQr={() =>
                      openQrModal(
                        `${window.location.origin}/v/${card.slug || 'profile'}`,
                        String((card.personal as { fullName?: string })?.fullName || '')
                      )
                    }
                    onDuplicate={() => void handleDuplicate(card)}
                    isDuplicating={duplicatingCardId === card.id}
                    isNewlyDuplicated={highlightedDuplicatedId === card.id || highlightedActivatedId === card.id}
                    highlightLabel={highlightedActivatedId === card.id ? 'activated' : 'duplicated'}
                    onActivatedFromDraft={handleActivatedFromDraft}
                    onDeleted={async (id) => {
                      if (panelCard?.id === id) setPanelCard(null)
                      if (trendsCard?.id === id) setTrendsCard(null)
                      notify.info('Card deleted successfully.')
                    }}
                  />
                )
              })
            )}
          </div>
        )}
      </div>

      <VCardDetailSidebar
        card={panelCard}
        mode="admin"
        onClose={() => setPanelCard(null)}
        onDuplicate={handleDuplicate}
        isDuplicating={Boolean(panelCard?.id && duplicatingCardId === panelCard.id)}
      />
      <VCardTrendsPopup card={trendsCard} onClose={() => setTrendsCard(null)} />

      <VCardQrModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={selectedVCardUrl}
        title={qrModalTitle}
      />

      <NoticeModal
        open={!!noticeCard}
        cardName={String((noticeCard?.personal as { fullName?: string })?.fullName || 'this card')}
        initialText={noticeInitialText}
        initialType={['info', 'warning', 'success'].includes(noticeInitialType) ? noticeInitialType : 'info'}
        onClose={() => setNoticeCard(null)}
        onSave={(text, type) => {
          if (!noticeCard?.id) return
          void (async () => {
            try {
              if (text.trim()) {
                writeLocalCardNotice(noticeCard.id, text, type)
                await createTeamNotice({
                  text: text.trim(),
                  type,
                  audience: 'all',
                  targetProfileId: noticeCard.id,
                }).unwrap()
                notify.success('Notice saved for this card. Visitors will see it after the intro.')
              } else {
                clearLocalCardNotice(noticeCard.id)
                const existing = noticeForCard(noticeCard.id, teamNotices)
                if (existing?.id) await deleteTeamNotice(existing.id).unwrap()
                notify.success('Notice cleared.')
              }
              setNoticeVersion((n) => n + 1)
            } catch (e) {
              const message =
                (e as { data?: { message?: string } })?.data?.message ||
                (e as Error)?.message ||
                'Could not save notice.'
              notify.error(message)
            }
          })()
        }}
        onClear={() => {
          if (!noticeCard?.id) return
          void (async () => {
            clearLocalCardNotice(noticeCard.id)
            const existing = noticeForCard(noticeCard.id, teamNotices)
            if (existing?.id) {
              try {
                await deleteTeamNotice(existing.id).unwrap()
              } catch {
                /* ignore */
              }
            }
            setNoticeVersion((n) => n + 1)
            notify.success('Notice cleared.')
          })()
        }}
      />
    </div>
  )
}
