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
  useCorporateDirectory,
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
import { exportCorporateCardsCsv } from '@/lib/corporateExport'
import {
  type DashboardPeriod,
  useExportDashboardOverviewMutation,
  useGetContactsQuery,
  useGetDashboardStatsQuery,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { useMemo, useState } from 'react'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function CorporateOwnerDashboardHome() {
  const user = useAppSelector((state) => state.user.user)
  const [period] = useState<DashboardPeriod>('30')
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
  const [dupAlert, setDupAlert] = useState<string | null>(null)

  const directory = useCorporateDirectory()
  const { data: stats } = useGetDashboardStatsQuery({ period })
  const { data: contactsRaw } = useGetContactsQuery()
  const [exportOverview, { isLoading: exporting }] = useExportDashboardOverviewMutation()

  const contacts = useMemo(() => (Array.isArray(contactsRaw) ? (contactsRaw as DashboardContact[]) : []), [contactsRaw])
  const savesCount = (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)
  const panelCard = useMemo(
    () => (panelCardId ? (directory.cards.find((c) => c.id === panelCardId) ?? null) : null),
    [directory.cards, panelCardId]
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
    exportCorporateCardsCsv(directory.cards)
  }

  const handleExportOverview = async () => {
    try {
      const blob = await exportOverview({ period }).unwrap()
      downloadBlob(blob, `corporate-overview_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch {
      // quiet
    }
  }

  const handleDuplicate = async (card: VCardRecord) => {
    const ok = await directory.duplicateCard(card)
    setDupAlert(ok ? 'Card duplicated successfully.' : 'Could not duplicate card. Check quota and try again.')
  }

  const noticeInitialText =
    noticeCard && typeof window !== 'undefined' ? localStorage.getItem(`notice_${noticeCard.id}`) || '' : ''
  const noticeInitialType = (
    noticeCard && typeof window !== 'undefined'
      ? localStorage.getItem(`notice_type_${noticeCard.id}`) || 'info'
      : 'info'
  ) as NoticeType

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-10 duration-500">
      <CorporateDashboardHeader
        quotaLimit={directory.quotaLimit}
        activeCount={directory.activeCount}
        cardCount={directory.currentCount}
        totalViews={stats?.totalViews ?? directory.totalViews}
        uniqueViews={stats?.uniqueViews ?? stats?.viewsLast30Days ?? 0}
        shares={stats?.shares ?? 0}
        canCreate={directory.canCreate}
        createDisabledReason={directory.createDisabledReason}
        onExportCsv={handleExportCsv}
        onFeedback={() => setOwnerFeedbackMode('feedback')}
        onSupport={() => setOwnerFeedbackMode('support')}
      />

      {directory.cards.length === 0 && !directory.isLoading ? (
        <CorporateEmptyState canCreate={directory.canCreate} createDisabledReason={directory.createDisabledReason} />
      ) : (
        <>
          <CorporateQuotaWarning
            cardCount={directory.currentCount}
            quotaLimit={directory.quotaLimit}
            onRequestUpgrade={() => setUpgradeAlert(true)}
          />

          <CorporateMetricCards
            totalViews={stats?.totalViews ?? directory.totalViews}
            totalSaves={savesCount}
            activeCount={directory.activeCount}
            totalCards={directory.currentCount}
            quotaLimit={directory.quotaLimit}
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

          <CorporateEngagementSection socialChannels={stats?.socialChannels} />

          <CorporateControlsHub
            cards={directory.orderedCards}
            contacts={contacts}
            socialChannels={stats?.socialChannels}
            totalViews={stats?.totalViews ?? directory.totalViews}
            canCreate={directory.canCreate}
            createDisabledReason={directory.createDisabledReason}
            quotaLimit={directory.quotaLimit}
            draggedIndex={directory.draggedIndex}
            onDragStart={directory.handleDragStart}
            onDragDrop={directory.handleDragDrop}
            onPanel={(card) => setPanelCardId(card.id)}
            onNotice={setNoticeCard}
            onOpenQr={openQr}
            onDuplicate={handleDuplicate}
            onTrends={setTrendsCard}
            noticeVersion={noticeVersion}
            activeTab={hubTab}
            onActiveTabChange={setHubTab}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleExportOverview()}
              disabled={exporting}
              className="text-xs font-bold text-slate-500 underline hover:text-slate-800 disabled:opacity-50 dark:hover:text-slate-200"
            >
              {exporting ? 'Exporting overview PDF…' : 'Export overview PDF'}
            </button>
          </div>
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
          notesCount={stats?.notesLast30Days ?? 0}
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
        canDuplicate={directory.canCreate}
        duplicateDisabledReason={directory.createDisabledReason}
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
          if (text) {
            localStorage.setItem(`notice_${noticeCard.id}`, text)
            localStorage.setItem(`notice_type_${noticeCard.id}`, type)
          } else {
            localStorage.removeItem(`notice_${noticeCard.id}`)
            localStorage.removeItem(`notice_type_${noticeCard.id}`)
          }
          setNoticeVersion((n) => n + 1)
        }}
        onClear={() => {
          if (!noticeCard) return
          localStorage.removeItem(`notice_${noticeCard.id}`)
          localStorage.removeItem(`notice_type_${noticeCard.id}`)
          setNoticeVersion((n) => n + 1)
        }}
      />

      <AlertModal
        open={upgradeAlert}
        title="Request upgrade"
        description="Contact support to increase your corporate card quota. We will review your directory usage and enterprise plan options."
        onClose={() => setUpgradeAlert(false)}
        confirmLabel="Got it"
      />

      <AlertModal
        open={!!dupAlert}
        title="Duplicate card"
        description={dupAlert || ''}
        onClose={() => setDupAlert(null)}
        variant="success"
      />
    </div>
  )
}
