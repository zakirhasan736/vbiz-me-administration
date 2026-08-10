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
  type CorporateStatusFilter,
} from '@/components/dashboard/corporate'
import {
  NoticeModal,
  QrCodeModal,
  VCardDetailSidebar,
  VCardTrendsPopup,
  type NoticeType,
} from '@/components/dashboard/vcard'
import { VCardTeamCard } from '@/components/dashboard/vcard/VCardTeamCard'
import { notify } from '@/lib/toast/toast'
import type { VCardRecord } from '@/types/vcard'
import { getVCardPublicUrl } from '@/utils/vcard'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type DragEvent } from 'react'

export default function TeamVCardsView() {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CorporateStatusFilter>('all')
  const [sort, setSort] = useState<CorporateSortOption>('newest')
  const directory = useCorporateDirectory({ searchTerm, statusFilter, sort })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [trendsCard, setTrendsCard] = useState<VCardRecord | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [promptNoticeCard, setPromptNoticeCard] = useState<VCardRecord | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('vCard QR Code')

  const filteredCards = directory.filteredCards

  const panelCard = useMemo(
    () => (panelCardId ? (directory.cards.find((c) => c.id === panelCardId) ?? null) : null),
    [directory.cards, panelCardId]
  )

  const hasFilters = Boolean(searchTerm) || statusFilter !== 'all' || sort !== 'newest'

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
      return
    }
    router.push('/vcards/create/home')
  }

  const handleDuplicate = async (card: VCardRecord) => {
    if (!directory.canCreate) {
      notify.warning(directory.createDisabledReason)
      return
    }
    await directory.duplicateCard(card)
  }

  const promptDefault =
    promptNoticeCard && typeof window !== 'undefined' ? localStorage.getItem(`notice_${promptNoticeCard.id}`) || '' : ''

  const noticeInitialText =
    noticeCard && typeof window !== 'undefined' ? localStorage.getItem(`notice_${noticeCard.id}`) || '' : ''
  const noticeInitialType = (
    noticeCard && typeof window !== 'undefined'
      ? localStorage.getItem(`notice_type_${noticeCard.id}`) || 'info'
      : 'info'
  ) as NoticeType

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 duration-500">
      <TeamVCardsHeader canCreate={directory.canCreate} createDisabledReason={directory.createDisabledReason} />

      <TeamVCardsToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
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
            setStatusFilter('all')
            setSort('newest')
          }}
          onCreate={goCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card, idx) => (
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
              canDuplicate={directory.canCreate}
              duplicateDisabledReason={directory.createDisabledReason}
              onDuplicate={() => void handleDuplicate(card)}
              onTrends={() => setTrendsCard(card)}
            />
          ))}
          <TeamVCardsCreatePlaceholder
            canCreate={directory.canCreate}
            quotaLimit={directory.quotaLimit}
            onCreate={goCreate}
          />
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
        description="Shown on the public vCard as an announcement banner."
        label="Notice text"
        placeholder="e.g. Out of office until Monday"
        defaultValue={promptDefault}
        confirmLabel="Save notice"
        onCancel={() => setPromptNoticeCard(null)}
        onConfirm={(text) => {
          if (!promptNoticeCard) return
          const trimmed = text.trim()
          if (trimmed) localStorage.setItem(`notice_${promptNoticeCard.id}`, trimmed)
          else localStorage.removeItem(`notice_${promptNoticeCard.id}`)
          setNoticeVersion((n) => n + 1)
          setPromptNoticeCard(null)
          notify.success(trimmed ? 'Notice saved.' : 'Notice cleared.')
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
          if (text) {
            localStorage.setItem(`notice_${noticeCard.id}`, text)
            localStorage.setItem(`notice_type_${noticeCard.id}`, type)
          } else {
            localStorage.removeItem(`notice_${noticeCard.id}`)
            localStorage.removeItem(`notice_type_${noticeCard.id}`)
          }
          setNoticeVersion((n) => n + 1)
          notify.success(text ? 'Notice saved.' : 'Notice cleared.')
        }}
        onClear={() => {
          if (!noticeCard) return
          localStorage.removeItem(`notice_${noticeCard.id}`)
          localStorage.removeItem(`notice_type_${noticeCard.id}`)
          setNoticeVersion((n) => n + 1)
          notify.success('Notice cleared.')
        }}
      />
    </div>
  )
}
