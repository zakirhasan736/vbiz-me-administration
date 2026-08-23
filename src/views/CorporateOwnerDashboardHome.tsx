'use client'

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
import { useAppSelector } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { useDashboardLiveKpis } from '@/hooks/useAdminDashboardLiveKpis'
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
import { exportCorporateCardsCsv } from '@/lib/corporateExport'
import { notify } from '@/lib/toast/toast'
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
import { useCallback, useEffect, useMemo, useState } from 'react'

function formatTrendPercent(value?: number | null): { text?: string; negative?: boolean } {
  if (value == null || value === 0) return {}
  const negative = value < 0
  const abs = Math.abs(value)
  const text = `${negative ? '-' : '+'}${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)}%`
  return { text, negative }
}

export default function CorporateOwnerDashboardHome() {
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
  const { data: contactsRaw } = useGetContactsQuery(undefined, { skip: !showContactSavesModal })
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
  const headerQuotaLimit = profilesReady ? (capacity?.limit ?? 0) : undefined
  const headerCardCount = profilesReady ? (capacity?.used ?? liveCards.length) : undefined
  const headerCanCreate = (capacity?.canCreate ?? false) && canMutateVcards
  const headerCreateDisabledReason = !canMutateVcards
    ? ACCOUNT_PAUSED_CREATE_MESSAGE
    : (headerQuotaLimit ?? 0) <= 0
      ? 'No active package with card capacity. Upgrade your package to create cards.'
      : `Maximum of ${headerQuotaLimit} corporate cards reached`
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

  const cards = useMemo(() => applyCardOrder(liveCards, cardOrder), [liveCards, cardOrder])

  const contacts = useMemo(
    () =>
      Array.isArray(contactsRaw)
        ? (contactsRaw as DashboardContact[])
        : ((summary?.contactsPreview || []) as DashboardContact[]),
    [contactsRaw, summary?.contactsPreview]
  )
  const quotaLimit = headerQuotaLimit ?? 0
  const metricQuotaLimit = profilesReady ? (capacity?.limit ?? 0) : undefined
  const metricTotalCards = profilesReady ? (capacity?.used ?? liveCards.length) : undefined
  const activeCount = headerActiveCount
  const totalViews = headerTotalViews
  const savesCount = statsReady
    ? (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0) + liveKpis.saves
    : undefined
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
    setContactSavesModalTab(tab)
    setShowContactSavesModal(true)
  }

  const openQr = (url: string, name?: string, centerImageUrl?: string) => {
    const matched = cards.find((c) => {
      const slug = c.slug?.trim()
      return Boolean(slug) && (url.includes(`/v/${slug}`) || url.endsWith(`/${slug}`))
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
          count={savesCount ?? 0}
          contacts={contacts}
          notesCount={contacts.filter((c) => c.message || (c as { source?: string }).source === 'note').length}
          tab={contactSavesModalTab}
          onTabChange={setContactSavesModalTab}
          onClose={() => setShowContactSavesModal(false)}
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
        onSave={(text, type) => {
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
                  audience: 'all',
                  targetProfileId: noticeCard.id,
                }).unwrap()
                notify.success(`Notice saved for ${noticeCard.personal.fullName || 'this card'} only.`)
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
    </div>
  )
}
