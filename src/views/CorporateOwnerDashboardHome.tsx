'use client'

import { OneOnOneRequestsPanel } from '@/components/admin/OneOnOneRequestsPanel'
import { AlertModal } from '@/components/AlertModal'
import {
  CorporateControlsHub,
  CorporateDashboardHeader,
  CorporateEmptyState,
  CorporateEngagementSection,
  CorporateMetricCards,
  CorporateQuotaWarning,
  CorporateSocialBreakdown,
  type HubTab,
} from '@/components/dashboard/corporate'
import {
  ContactModal,
  ContactSavesModal,
  type ContactSavesModalTab,
  type DashboardContact,
  type OwnerFeedbackMode,
} from '@/components/dashboard/home'
import {
  NoticeModal,
  type NoticeType,
  QrCodeModal,
  VCardDetailSidebar,
  VCardTrendsPopup,
} from '@/components/dashboard/vcard'
import { UpcomingSchedulesPanel } from '@/components/schedules/UpcomingSchedulesPanel'
import { useAppSelector } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { useDashboardLiveKpis } from '@/hooks/useAdminDashboardLiveKpis'
import { useVCardContactActions } from '@/hooks/useVCardContactActions'
import { ACCOUNT_PAUSED_CREATE_MESSAGE } from '@/lib/accountStatus'
import {
  clearLocalCardNotice,
  noticeForCard,
  noticeTypeFromTeamNotice,
  readLocalCardNotice,
  writeLocalCardNotice,
} from '@/lib/cardNotice'
import { applyCardOrder, CORPORATE_CARD_ORDER_KEY, loadCardOrder, reorderByIndex, saveCardOrder } from '@/lib/cardOrder'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { corporateCardCreateBlockedReason } from '@/lib/corporateCardCapacity'
import { exportCorporateCardsCsv } from '@/lib/corporateExport'
import { resolveDashboardContactSaves } from '@/lib/dashboardContactSaves'
import { notify } from '@/lib/toast/toast'
import { useGetOwnerUpcomingMeetingsQuery } from '@/redux/features/meetings/meetings.api'
import {
  dashboardOverviewQueryOptions,
  mapApiProfileToVCardRecord,
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useDuplicateProfileMutation,
  useGetContactsQuery,
  useGetDashboardSummaryQuery,
  useGetProfilesQuery,
  useGetTeamNoticesQuery,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { getVCardPublicPath } from '@/utils/vcard'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

function formatTrendPercent(value?: number | null): { text?: string; negative?: boolean } {
  if (value == null || value === 0) return {}
  const negative = value < 0
  const abs = Math.abs(value)
  const text = `${negative ? '-' : '+'}${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)}%`
  return { text, negative }
}

export default function CorporateOwnerDashboardHome() {
  const router = useRouter()
  const user = useAppSelector((state) => state.user.user)

  const {
    data: profilesResult,
    isLoading: profilesLoading,
    refetch: refetchProfiles,
  } = useGetProfilesQuery(
    {
      status: 'all',
      skip: 0,
      limit: 100,
    },
    dashboardOverviewQueryOptions
  )
  const { data: summary, isLoading: statsLoading } = useGetDashboardSummaryQuery(
    { period: 'all' },
    dashboardOverviewQueryOptions
  )
  const stats = summary?.stats
  const { overlay: liveKpis } = useDashboardLiveKpis('all')
  const [showContactSavesModal, setShowContactSavesModal] = useState(false)
  const [contactsSkip, setContactsSkip] = useState(0)
  const [contactsAccum, setContactsAccum] = useState<DashboardContact[]>([])
  const { data: contactsPage, isFetching: contactsFetching } = useGetContactsQuery(
    { skip: contactsSkip, limit: 50, source: 'guest_save' },
    { skip: !showContactSavesModal }
  )
  const socialClickRows = summary?.socialClicks ?? []
  const socialClicksByCardRows = useMemo(() => summary?.socialClicksByCard ?? [], [summary?.socialClicksByCard])
  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [duplicateProfile] = useDuplicateProfileMutation()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const liveCards = useMemo(
    () => (profilesResult?.items ?? []).map(mapApiProfileToVCardRecord),
    [profilesResult?.items]
  )
  const capacity = profilesResult?.capacity
  const { canMutateVcards } = useAccountStatus()
  const profilesReady = Boolean(profilesResult) && !profilesLoading
  const statsReady = Boolean(stats) && !statsLoading
  const headerQuotaLimit = profilesReady ? (capacity?.limit ?? null) : undefined
  const headerQuotaRemaining = profilesReady ? (capacity?.remaining ?? null) : undefined
  const headerCardCount = profilesReady ? (capacity?.used ?? liveCards.length) : undefined
  const headerCanCreate = (capacity?.canCreate ?? false) && canMutateVcards
  const headerCreateDisabledReason = corporateCardCreateBlockedReason({
    canMutateVcards,
    pausedMessage: ACCOUNT_PAUSED_CREATE_MESSAGE,
    limit: headerQuotaLimit,
    used: headerCardCount ?? 0,
    remaining: headerQuotaRemaining,
  })
  const headerActiveCount = profilesReady ? liveCards.filter((c) => c.isActive).length : undefined
  const headerTotalViews = statsReady ? (stats?.totalViews ?? 0) + liveKpis.views : undefined
  const headerUniqueViews = statsReady ? (stats?.uniqueViews ?? 0) + liveKpis.views : undefined
  const headerShares = statsReady ? (stats?.shares ?? 0) : undefined

  const [cardOrder, setCardOrder] = useState<string[]>(() => loadCardOrder(CORPORATE_CARD_ORDER_KEY))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [ownerFeedbackMode, setOwnerFeedbackMode] = useState<OwnerFeedbackMode | null>(null)
  const [contactSavesModalTab, setContactSavesModalTab] = useState<ContactSavesModalTab>('saves')
  const [hubTab, setHubTab] = useState<HubTab>('directory')
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [trendsCard, setTrendsCard] = useState<VCardRecord | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('vCard QR Code')
  const [qrCenterImageUrl, setQrCenterImageUrl] = useState('')
  const [upgradeAlert, setUpgradeAlert] = useState(false)
  const [duplicatingCardId, setDuplicatingCardId] = useState<string | null>(null)
  const [highlightedDuplicatedId, setHighlightedDuplicatedId] = useState<string | null>(null)
  const [highlightedActivatedId, setHighlightedActivatedId] = useState<string | null>(null)
  const {
    contactHandlersForCard,
    modals: contactModals,
    openEmailForCard,
    openCallForCard,
    openScheduleForCard,
  } = useVCardContactActions()

  const { data: upcomingMeetingsPage, isLoading: upcomingMeetingsLoading } = useGetOwnerUpcomingMeetingsQuery({
    limit: 5,
  })

  const cards = useMemo(() => applyCardOrder(liveCards, cardOrder), [liveCards, cardOrder])

  const modalContacts = useMemo(() => {
    if (!showContactSavesModal) return [] as DashboardContact[]
    const pageItems = (contactsPage?.items ?? []) as DashboardContact[]
    if (contactsSkip === 0) return pageItems
    const seen = new Set(contactsAccum.map((row) => row.id))
    return [...contactsAccum, ...pageItems.filter((row) => !seen.has(row.id))]
  }, [showContactSavesModal, contactsPage, contactsSkip, contactsAccum])

  const contacts = useMemo(
    () => (modalContacts.length ? modalContacts : ((summary?.contactsPreview || []) as DashboardContact[])),
    [modalContacts, summary?.contactsPreview]
  )
  const contactsHasMore = Boolean(
    contactsPage?.hasMore ?? (contactsPage?.total != null && modalContacts.length < contactsPage.total)
  )

  const quotaLimit = headerQuotaLimit ?? null
  const metricQuotaLimit = profilesReady ? (capacity?.limit ?? null) : undefined
  const metricTotalCards = profilesReady ? (capacity?.used ?? liveCards.length) : undefined
  const activeCount = headerActiveCount
  const totalViews = headerTotalViews
  const savesCount = statsReady ? resolveDashboardContactSaves(stats) + liveKpis.saves : undefined
  const viewsTrend = statsReady ? formatTrendPercent(stats?.visitsChart?.trendPercent) : {}
  const canCreate = headerCanCreate
  const createDisabledReason = headerCreateDisabledReason
  const hubStatsLoading = !statsReady

  const socialClicksByCard = useMemo(() => {
    const map: Record<string, Array<{ platform: string; clickCount: number }>> = {}
    for (const row of socialClicksByCardRows) {
      map[row.profileId] = (row.channels || []).map((ch) => ({
        platform: ch.label || ch.channel,
        clickCount: ch.clickCount || 0,
      }))
    }
    return map
  }, [socialClicksByCardRows])

  const panelCard = useMemo(
    () => (panelCardId ? (cards.find((c) => c.id === panelCardId) ?? null) : null),
    [cards, panelCardId]
  )

  const openContactSaves = (tab: ContactSavesModalTab = 'saves') => {
    setContactsSkip(0)
    setContactsAccum([])
    setContactSavesModalTab(tab)
    setShowContactSavesModal(true)
  }

  const closeContactSaves = () => {
    setShowContactSavesModal(false)
    setContactsSkip(0)
    setContactsAccum([])
  }

  const loadMoreContacts = () => {
    if (contactsPage?.items?.length) {
      const pageItems = contactsPage.items as DashboardContact[]
      setContactsAccum((prev) => {
        if (contactsSkip === 0) return pageItems
        const seen = new Set(prev.map((row) => row.id))
        return [...prev, ...pageItems.filter((row) => !seen.has(row.id))]
      })
    }
    setContactsSkip((prev) => prev + 50)
  }

  const openQr = (url: string, name?: string, centerImageUrl?: string) => {
    const matched = cards.find((c) => {
      const slug = c.slug?.trim()
      return Boolean(slug) && (url.includes(getVCardPublicPath(slug)) || url.endsWith(`/${slug}`))
    })
    if (matched && isOwnerCardLocked(matched.status)) {
      notify.error(SUSPENDED_CARD_MESSAGE)
      return
    }
    setQrUrl(url)
    setQrTitle(name ? `${name} · QR` : 'vCard QR Code')
    setQrCenterImageUrl(centerImageUrl?.trim() || matched?.avatarImageUrl?.trim() || '')
    setIsQrOpen(true)
  }

  const openNotice = (card: VCardRecord) => {
    if (isOwnerCardLocked(card.status)) {
      notify.error(SUSPENDED_CARD_MESSAGE)
      return
    }
    setNoticeCard(card)
  }

  const handleExportCsv = () => {
    exportCorporateCardsCsv(liveCards)
  }

  const handleDuplicate = useCallback(
    async (card: VCardRecord) => {
      if (!canCreate) {
        notify.warning(createDisabledReason)
        return
      }
      if (isOwnerCardLocked(card.status)) {
        notify.error(SUSPENDED_CARD_MESSAGE)
        return
      }
      if (!card.id || duplicatingCardId) return
      setDuplicatingCardId(card.id)
      try {
        const created = await duplicateProfile(card.id).unwrap()
        void refetchProfiles()
        const newId = created?.id
        if (newId) {
          notify.success('Saved as a draft.', {
            title: 'Card duplicated',
            action: {
              label: 'View in Draft',
              onClick: () => {
                setHubTab('directory')
                setHighlightedDuplicatedId(newId)
                setPanelCardId(null)
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
    },
    [canCreate, createDisabledReason, duplicateProfile, duplicatingCardId, refetchProfiles]
  )

  const handleActivatedFromDraft = useCallback((cardId: string) => {
    notify.success('Your card is now active.', {
      title: 'Card activated',
      action: {
        label: 'View in Active',
        onClick: () => {
          setHubTab('directory')
          setHighlightedActivatedId(cardId)
          setHighlightedDuplicatedId(null)
          setPanelCardId(null)
        },
      },
    })
  }, [])

  const handleDragDrop = (ordered: VCardRecord[], targetIndex: number) => {
    if (draggedIndex == null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      return
    }
    const next = reorderByIndex(ordered, draggedIndex, targetIndex)
    const ids = next.map((c) => c.id).filter(Boolean)
    setCardOrder(ids)
    saveCardOrder(CORPORATE_CARD_ORDER_KEY, ids)
    setDraggedIndex(null)
  }

  const noticeInitialText = noticeCard
    ? noticeForCard(noticeCard.id, teamNotices)?.text || readLocalCardNotice(noticeCard.id).text
    : ''
  const noticeServer = noticeCard ? noticeForCard(noticeCard.id, teamNotices) : null
  const noticeInitialType: NoticeType = noticeCard
    ? noticeServer
      ? noticeTypeFromTeamNotice(noticeServer)
      : readLocalCardNotice(noticeCard.id).type
    : 'info'

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-10 duration-500">
      <CorporateDashboardHeader
        quotaLimit={headerQuotaLimit}
        quotaRemaining={headerQuotaRemaining}
        activeCount={headerActiveCount}
        cardCount={headerCardCount}
        totalViews={headerTotalViews}
        uniqueViews={headerUniqueViews}
        shares={headerShares}
        statsLoading={!statsReady}
        profilesLoading={!profilesReady}
        canCreate={headerCanCreate}
        createDisabledReason={headerCreateDisabledReason}
        onExportCsv={handleExportCsv}
        onFeedback={() => setOwnerFeedbackMode('feedback')}
        onSupport={() => setOwnerFeedbackMode('support')}
      />

      {!profilesReady ? (
        <div className="rounded-4xl border border-dashed border-slate-200 bg-white py-24 text-center text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-[#0b0f19]">
          Loading corporate directory…
        </div>
      ) : cards.length === 0 ? (
        <CorporateEmptyState canCreate={canCreate} createDisabledReason={createDisabledReason} />
      ) : (
        <>
          <CorporateQuotaWarning
            cardCount={metricTotalCards ?? 0}
            quotaLimit={quotaLimit}
            onRequestUpgrade={() => setUpgradeAlert(true)}
          />

          <CorporateMetricCards
            totalViews={totalViews}
            totalSaves={savesCount}
            activeCount={activeCount}
            totalCards={metricTotalCards}
            quotaLimit={metricQuotaLimit}
            loading={!statsReady}
            profilesLoading={!profilesReady}
            viewsChangeText={viewsTrend.text}
            viewsChangeNegative={viewsTrend.negative}
            onOpenContactSaves={() => openContactSaves('saves')}
          />

          <UpcomingSchedulesPanel
            meetings={upcomingMeetingsPage?.items ?? []}
            isLoading={upcomingMeetingsLoading}
            title="Upcoming team sessions"
            subtitle="Latest admin-scheduled calls for your corporate cards."
            emptyMessage="No upcoming sessions scheduled for your team."
            onViewAll={() => router.push('/events')}
          />

          <OneOnOneRequestsPanel className="mt-2" />

          <CorporateSocialBreakdown
            channels={statsReady ? stats?.socialChannels : undefined}
            loading={!statsReady}
            onOpenSocialsTab={() => {
              setHubTab('socials')
              setTimeout(() => {
                document.getElementById('corporate-controls-hub')?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
          />

          <CorporateEngagementSection cards={liveCards} />

          <CorporateControlsHub
            cards={cards}
            contacts={contacts}
            socialChannels={
              socialClickRows.length
                ? socialClickRows.map((r) => ({
                    channel: r.channel,
                    label: r.label,
                    count: r.clickCount,
                  }))
                : statsReady
                  ? stats?.socialChannels
                  : undefined
            }
            socialClicksByCard={socialClicksByCard}
            teamNotices={teamNotices}
            totalViews={totalViews}
            statsLoading={hubStatsLoading}
            activeCount={activeCount}
            canCreate={canCreate}
            createDisabledReason={createDisabledReason}
            quotaLimit={quotaLimit}
            draggedIndex={draggedIndex}
            onDragStart={setDraggedIndex}
            onDragDrop={handleDragDrop}
            onPanel={(card) => setPanelCardId(card.id)}
            onNotice={openNotice}
            onOpenQr={openQr}
            onDuplicate={(card) => void handleDuplicate(card)}
            onTrends={setTrendsCard}
            noticeVersion={noticeVersion}
            duplicatingCardId={duplicatingCardId}
            highlightedDuplicatedId={highlightedDuplicatedId}
            highlightedActivatedId={highlightedActivatedId}
            onActivatedFromDraft={handleActivatedFromDraft}
            activeTab={hubTab}
            onActiveTabChange={setHubTab}
            contactHandlersForCard={contactHandlersForCard}
          />
        </>
      )}

      {ownerFeedbackMode && (
        <ContactModal
          key={ownerFeedbackMode}
          mode={ownerFeedbackMode}
          onClose={() => setOwnerFeedbackMode(null)}
          fromRole="corporate"
          fromName={user?.name || 'Corporate Owner'}
          fromEmail={user?.email || undefined}
        />
      )}

      {showContactSavesModal && (
        <ContactSavesModal
          count={savesCount ?? contactsPage?.total ?? 0}
          contacts={contacts}
          notesCount={stats?.notesLast30Days ?? 0}
          tab={contactSavesModalTab}
          onTabChange={setContactSavesModalTab}
          onClose={closeContactSaves}
          hasMore={contactsHasMore}
          loadingMore={contactsFetching && contactsSkip > 0}
          onLoadMore={loadMoreContacts}
        />
      )}

      <QrCodeModal
        open={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={qrUrl}
        title={qrTitle}
        centerImageUrl={qrCenterImageUrl}
        zIndexClass="z-50"
      />

      <VCardDetailSidebar
        card={panelCard}
        onClose={() => setPanelCardId(null)}
        onEmail={openEmailForCard}
        onCall={openCallForCard}
        onSchedule={openScheduleForCard}
        onNotice={openNotice}
        onDuplicate={() => panelCard && void handleDuplicate(panelCard)}
        canDuplicate={canCreate}
        duplicateDisabledReason={createDisabledReason}
        isDuplicating={Boolean(panelCard?.id && duplicatingCardId === panelCard.id)}
      />

      <VCardTrendsPopup card={trendsCard} onClose={() => setTrendsCard(null)} />

      <NoticeModal
        open={!!noticeCard}
        cardName={noticeCard?.personal.fullName || 'this card'}
        initialText={noticeInitialText}
        initialType={['info', 'warning', 'success'].includes(noticeInitialType) ? noticeInitialType : 'info'}
        onClose={() => setNoticeCard(null)}
        onSave={(text, type, options) => {
          if (!noticeCard) return
          if (isOwnerCardLocked(noticeCard.status)) {
            notify.error(SUSPENDED_CARD_MESSAGE)
            setNoticeCard(null)
            return
          }
          void (async () => {
            try {
              if (text.trim()) {
                writeLocalCardNotice(noticeCard.id, text, type)
                await createTeamNotice({
                  text: text.trim(),
                  type,
                  audience: options.onlyBackoffice ? 'savers' : 'all',
                  targetProfileId: noticeCard.id,
                  onlyBackoffice: options.onlyBackoffice,
                  deliver: !options.onlyBackoffice,
                }).unwrap()
                notify.success(
                  options.onlyBackoffice
                    ? `Notice saved for ${noticeCard.personal.fullName || 'this card'} backoffice only.`
                    : `Notice saved for ${noticeCard.personal.fullName || 'this card'} only.`
                )
              } else {
                clearLocalCardNotice(noticeCard.id)
                const existing = noticeForCard(noticeCard.id, teamNotices)
                if (existing?.id) await deleteTeamNotice(existing.id).unwrap()
              }
              setNoticeVersion((n) => n + 1)
            } catch (e) {
              const message =
                (e as { data?: { message?: string } })?.data?.message ||
                (e as Error)?.message ||
                'Could not save card notice.'
              notify.error(message)
            }
          })()
        }}
        onClear={() => {
          if (!noticeCard) return
          if (isOwnerCardLocked(noticeCard.status)) {
            notify.error(SUSPENDED_CARD_MESSAGE)
            setNoticeCard(null)
            return
          }
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
          })()
        }}
      />

      <AlertModal
        open={upgradeAlert}
        title="Request upgrade"
        description="Contact support to increase your corporate card quota. We will review your directory usage and enterprise plan options."
        onClose={() => setUpgradeAlert(false)}
        confirmLabel="Got it"
      />

      {contactModals}
    </div>
  )
}
