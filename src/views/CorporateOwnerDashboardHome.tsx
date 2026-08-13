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
  mapApiProfileToVCardRecord,
  mapVCardDataToProfilePayload,
  useCreateProfileMutation,
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useGetContactsQuery,
  useGetDashboardStatsQuery,
  useGetProfilesQuery,
  useGetSocialClicksByCardQuery,
  useGetSocialClicksQuery,
  useGetTeamNoticesQuery,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { useCallback, useMemo, useState } from 'react'

function formatTrendPercent(value?: number | null): { text?: string; negative?: boolean } {
  if (value == null || value === 0) return {}
  const negative = value < 0
  const abs = Math.abs(value)
  const text = `${negative ? '-' : '+'}${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)}%`
  return { text, negative }
}

export default function CorporateOwnerDashboardHome() {
  const user = useAppSelector((state) => state.user.user)

  const { data: profilesResult, refetch: refetchProfiles } = useGetProfilesQuery({
    status: 'all',
    skip: 0,
    limit: 100,
  })
  const { data: stats } = useGetDashboardStatsQuery({ period: 'all' })
  const { data: contactsRaw } = useGetContactsQuery()
  const { data: socialClickRows = [] } = useGetSocialClicksQuery()
  const { data: socialClicksByCardRows = [] } = useGetSocialClicksByCardQuery()
  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [createProfile] = useCreateProfileMutation()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const liveCards = useMemo(
    () => (profilesResult?.items ?? []).map(mapApiProfileToVCardRecord),
    [profilesResult?.items]
  )
  const capacity = profilesResult?.capacity
  const headerQuotaLimit = capacity?.limit ?? 0
  const headerCardCount = capacity?.used ?? liveCards.length
  const headerCanCreate = capacity?.canCreate ?? false
  const headerCreateDisabledReason =
    headerQuotaLimit <= 0
      ? 'No active package with card capacity. Upgrade your package to create cards.'
      : `Maximum of ${headerQuotaLimit} corporate cards reached`
  const headerActiveCount = liveCards.filter((c) => c.isActive).length
  const headerTotalViews = stats?.totalViews ?? 0
  const headerUniqueViews = stats?.uniqueViews ?? 0
  const headerShares = stats?.shares ?? 0

  const [cardOrder, setCardOrder] = useState<string[]>(() => loadCardOrder(CORPORATE_CARD_ORDER_KEY))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [ownerFeedbackMode, setOwnerFeedbackMode] = useState<OwnerFeedbackMode | null>(null)
  const [showContactSavesModal, setShowContactSavesModal] = useState(false)
  const [contactSavesModalTab, setContactSavesModalTab] = useState<ContactSavesModalTab>('saves')
  const [hubTab, setHubTab] = useState<HubTab>('directory')
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [trendsCard, setTrendsCard] = useState<VCardRecord | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('vCard QR Code')
  const [upgradeAlert, setUpgradeAlert] = useState(false)

  const cards = useMemo(() => applyCardOrder(liveCards, cardOrder), [liveCards, cardOrder])

  const contacts = useMemo(() => (Array.isArray(contactsRaw) ? (contactsRaw as DashboardContact[]) : []), [contactsRaw])
  const quotaLimit = headerQuotaLimit
  const metricQuotaLimit = capacity?.limit ?? 0
  const metricTotalCards = capacity?.used ?? liveCards.length
  const activeCount = headerActiveCount
  const totalViews = headerTotalViews
  const savesCount = (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)
  const viewsTrend = formatTrendPercent(stats?.visitsChart?.trendPercent)
  const canCreate = headerCanCreate
  const createDisabledReason = headerCreateDisabledReason

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

  const openQr = (url: string, name?: string) => {
    setQrUrl(url)
    setQrTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrOpen(true)
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
      const suffix = Math.floor(1000 + Math.random() * 9000)
      const payload = mapVCardDataToProfilePayload(card)
      try {
        await createProfile({
          ...payload,
          name: `${payload.name || 'Card'} (Copy)`,
          slug: `${payload.slug || 'card'}-${suffix}`,
        }).unwrap()
        notify.success('Card duplicated successfully.')
        void refetchProfiles()
      } catch (e) {
        const message =
          (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not duplicate card.'
        notify.error(message)
      }
    },
    [canCreate, createDisabledReason, createProfile, refetchProfiles]
  )

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
        canCreate={headerCanCreate}
        createDisabledReason={headerCreateDisabledReason}
        onExportCsv={handleExportCsv}
        onFeedback={() => setOwnerFeedbackMode('feedback')}
        onSupport={() => setOwnerFeedbackMode('support')}
      />

      {cards.length === 0 ? (
        <CorporateEmptyState canCreate={canCreate} createDisabledReason={createDisabledReason} />
      ) : (
        <>
          <CorporateQuotaWarning
            cardCount={metricTotalCards}
            quotaLimit={quotaLimit}
            onRequestUpgrade={() => setUpgradeAlert(true)}
          />

          <CorporateMetricCards
            totalViews={totalViews}
            totalSaves={savesCount}
            activeCount={activeCount}
            totalCards={metricTotalCards}
            quotaLimit={metricQuotaLimit}
            viewsChangeText={viewsTrend.text}
            viewsChangeNegative={viewsTrend.negative}
            onOpenContactSaves={() => openContactSaves('saves')}
          />

          <CorporateSocialBreakdown
            channels={stats?.socialChannels}
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
                : stats?.socialChannels
            }
            socialClicksByCard={socialClicksByCard}
            teamNotices={teamNotices}
            totalViews={totalViews}
            activeCount={activeCount}
            canCreate={canCreate}
            createDisabledReason={createDisabledReason}
            quotaLimit={quotaLimit}
            draggedIndex={draggedIndex}
            onDragStart={setDraggedIndex}
            onDragDrop={handleDragDrop}
            onPanel={(card) => setPanelCardId(card.id)}
            onNotice={setNoticeCard}
            onOpenQr={openQr}
            onDuplicate={(card) => void handleDuplicate(card)}
            onTrends={setTrendsCard}
            noticeVersion={noticeVersion}
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
          count={savesCount}
          contacts={contacts}
          notesCount={contacts.filter((c) => c.message || (c as { source?: string }).source === 'note').length}
          tab={contactSavesModalTab}
          onTabChange={setContactSavesModalTab}
          onClose={() => setShowContactSavesModal(false)}
        />
      )}

      <QrCodeModal open={isQrOpen} onClose={() => setIsQrOpen(false)} url={qrUrl} title={qrTitle} zIndexClass="z-50" />

      <VCardDetailSidebar
        card={panelCard}
        onClose={() => setPanelCardId(null)}
        onNotice={setNoticeCard}
        onDuplicate={() => panelCard && void handleDuplicate(panelCard)}
        canDuplicate={canCreate}
        duplicateDisabledReason={createDisabledReason}
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
