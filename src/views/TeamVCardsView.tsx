'use client'

import { PromptModal } from '@/components/PromptModal'
import {
  TeamVCardsBulkBar,
  TeamVCardsCreatePlaceholder,
  TeamVCardsEmptyState,
  TeamVCardsHeader,
  TeamVCardsQuotaTracker,
  TeamVCardsToolbar,
  useCorporateDirectory,
  type CorporateSortOption,
} from '@/components/dashboard/corporate'
import {
  NoticeModal,
  QrCodeModal,
  VCardDetailSidebar,
  VCardTrendsPopup,
  type NoticeType,
} from '@/components/dashboard/vcard'
import { VCardTeamCard } from '@/components/dashboard/vcard/VCardTeamCard'
import {
  clearLocalCardNotice,
  noticeForCard,
  noticeTypeFromTeamNotice,
  readLocalCardNotice,
  writeLocalCardNotice,
} from '@/lib/cardNotice'
import { notify } from '@/lib/toast/toast'
import {
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useGetTeamNoticesQuery,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { getVCardPublicUrl } from '@/utils/vcard'
import { useMemo, useState, type DragEvent } from 'react'

export default function TeamVCardsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [lifecycleTab, setLifecycleTab] = useState<'active' | 'draft'>('active')
  const [sort, setSort] = useState<CorporateSortOption>('newest')
  const directory = useCorporateDirectory({
    searchTerm,
    statusFilter: 'all',
    sort,
    lifecycleTab,
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [trendsCard, setTrendsCard] = useState<VCardRecord | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [promptNoticeCard, setPromptNoticeCard] = useState<VCardRecord | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('vCard QR Code')

  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const filteredCards = directory.filteredCards

  const panelCard = useMemo(
    () => (panelCardId ? (directory.cards.find((c) => c.id === panelCardId) ?? null) : null),
    [directory.cards, panelCardId]
  )

  const hasFilters = Boolean(searchTerm) || lifecycleTab !== 'active' || sort !== 'newest'

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const openQr = (card: VCardRecord) => {
    const url = getVCardPublicUrl(card.slug?.trim() || 'profile')
    setQrUrl(url)
    setQrTitle(card.personal.fullName ? `${card.personal.fullName} · QR` : 'vCard QR Code')
    setIsQrOpen(true)
  }

  const goCreate = () => {
    if (!directory.canCreate) {
      notify.warning(directory.createDisabledReason)
    }
  }

  const handleDuplicate = async (card: VCardRecord) => {
    if (!directory.canCreate) {
      notify.warning(directory.createDisabledReason)
      return
    }
    await directory.duplicateCard(card)
  }

  const promptDefault = promptNoticeCard
    ? noticeForCard(promptNoticeCard.id, teamNotices)?.text || readLocalCardNotice(promptNoticeCard.id).text
    : ''

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
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 duration-500">
      <TeamVCardsHeader canCreate={directory.canCreate} createDisabledReason={directory.createDisabledReason} />

      <TeamVCardsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        lifecycleTab={lifecycleTab}
        onLifecycleTabChange={setLifecycleTab}
        activeCount={directory.activeCount}
        draftCount={directory.draftCount}
        sort={sort}
        onSortChange={setSort}
      />

      <TeamVCardsQuotaTracker
        currentCount={directory.currentCount}
        quotaLimit={directory.quotaLimit}
        quotaPercentage={directory.quotaPercentage}
      />

      {directory.isError ? (
        <div className="rounded-4xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-300">Could not load team vCards.</p>
          <button
            type="button"
            className="mt-2 text-xs font-bold tracking-wider text-rose-700 uppercase underline dark:text-rose-200"
            onClick={() => void directory.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {directory.isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-slate-300 py-20 text-center dark:border-white/10">
          <div className="border-primary-500 mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-sm font-bold tracking-widest text-slate-500 uppercase">Loading vCards…</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <TeamVCardsEmptyState
          hasFilters={hasFilters}
          canCreate={directory.canCreate}
          createDisabledReason={directory.createDisabledReason}
          onClearFilters={() => {
            setSearchTerm('')
            setLifecycleTab('active')
            setSort('newest')
          }}
          onCreate={goCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card, idx) => {
            const serverNotice = noticeForCard(card.id, teamNotices)
            return (
              <VCardTeamCard
                key={card.id}
                card={card}
                mode="corporate"
                badgeLabel="Corporate"
                showCheckbox
                selected={selectedIds.includes(card.id)}
                onToggleSelect={() => toggleSelect(card.id)}
                showDragHandle
                dragged={directory.draggedIndex === idx}
                onDragStart={(e: DragEvent) => {
                  directory.handleDragStart(idx)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e: DragEvent) => e.preventDefault()}
                onDrop={(e: DragEvent) => {
                  e.preventDefault()
                  directory.handleDragDrop(filteredCards, idx)
                }}
                onCardClick={() => setPanelCardId(card.id)}
                onOpenQr={() => openQr(card)}
                onPanel={(c) => setPanelCardId(c.id)}
                onNotice={(c) => setPromptNoticeCard(c)}
                noticeVersion={noticeVersion}
                cardNoticeText={serverNotice?.text ?? null}
                cardNoticeType={serverNotice ? noticeTypeFromTeamNotice(serverNotice) : null}
                canDuplicate={directory.canCreate}
                duplicateDisabledReason={directory.createDisabledReason}
                onDuplicate={() => void handleDuplicate(card)}
                onTrends={() => setTrendsCard(card)}
              />
            )
          })}
          {lifecycleTab === 'active' ? (
            <TeamVCardsCreatePlaceholder
              canCreate={directory.canCreate}
              quotaLimit={directory.quotaLimit}
              onCreate={goCreate}
            />
          ) : null}
        </div>
      )}

      <TeamVCardsBulkBar
        selectedIds={selectedIds}
        cards={directory.cards}
        onClear={() => setSelectedIds([])}
        onBulkStatus={async (active) => {
          await directory.bulkUpdateStatus(selectedIds, active)
          setSelectedIds([])
        }}
        onDeleted={() => void directory.refetch()}
      />

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

      <PromptModal
        open={!!promptNoticeCard}
        title="Card notice"
        description="Shown only for this card on the corporate owner dashboard (info notice)."
        label="Notice text"
        placeholder="e.g. Out of office until Monday"
        defaultValue={promptDefault}
        confirmLabel="Save notice"
        onCancel={() => setPromptNoticeCard(null)}
        onConfirm={(text) => {
          if (!promptNoticeCard) return
          const trimmed = text.trim()
          void (async () => {
            try {
              if (trimmed) {
                writeLocalCardNotice(promptNoticeCard.id, trimmed, 'info')
                await createTeamNotice({
                  text: trimmed,
                  type: 'info',
                  audience: 'all',
                  targetProfileId: promptNoticeCard.id,
                }).unwrap()
              } else {
                clearLocalCardNotice(promptNoticeCard.id)
                const existing = noticeForCard(promptNoticeCard.id, teamNotices)
                if (existing?.id) await deleteTeamNotice(existing.id).unwrap()
              }
              setNoticeVersion((n) => n + 1)
              setPromptNoticeCard(null)
              notify.success(trimmed ? 'Notice saved for this card only.' : 'Notice cleared.')
            } catch (e) {
              const message =
                (e as { data?: { message?: string } })?.data?.message ||
                (e as Error)?.message ||
                'Could not save notice.'
              notify.error(message)
            }
          })()
        }}
      />

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
              } else {
                clearLocalCardNotice(noticeCard.id)
                const existing = noticeForCard(noticeCard.id, teamNotices)
                if (existing?.id) await deleteTeamNotice(existing.id).unwrap()
              }
              setNoticeVersion((n) => n + 1)
              notify.success(text ? 'Notice saved for this card only.' : 'Notice cleared.')
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
            notify.success('Notice cleared.')
          })()
        }}
      />
    </div>
  )
}
