'use client'

import { AlertModal } from '@/components/AlertModal'
import {
  NoticeModal,
  QrCodeModal,
  VCardDetailSidebar,
  VCardsGrid,
  VCardsListHeader,
  type NoticeType,
  type VCardSortOption,
  type VCardStatusFilter,
} from '@/components/dashboard/vcard'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  mapApiProfileToVCardRecord,
  useGetProfilesQuery,
  useUpdateProfileCardMutation,
} from '@/redux/features/profiles/profiles.api'
import { replaceAllVCards } from '@/redux/features/vcards/vcards.slice'
import type { VCardRecord } from '@/types/vcard'
import { filterVCardsByQuery, getVCardPublicPath } from '@/utils/vcard'
import { useEffect, useMemo, useState } from 'react'

const DashboardVCardsView = () => {
  const dispatch = useAppDispatch()
  const role = useAppSelector((state) => state.user.user?.role)
  const isPersonal = role === 'vcard-owner'
  const { data: profilesResult, isLoading, isError, refetch } = useGetProfilesQuery({ limit: 100 })
  const [updateProfileCard] = useUpdateProfileCardMutation()

  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<VCardStatusFilter>('all')
  const [sort, setSort] = useState<VCardSortOption>('newest')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const capacity = profilesResult?.capacity
  const cards = useMemo(() => (profilesResult?.items ?? []).map(mapApiProfileToVCardRecord), [profilesResult?.items])

  useEffect(() => {
    if (isLoading) return
    dispatch(replaceAllVCards(cards))
  }, [cards, dispatch, isLoading])

  const panelCard = useMemo(
    () => (panelCardId ? (cards.find((c) => c.id === panelCardId) ?? null) : null),
    [cards, panelCardId]
  )

  const canCreate = capacity ? capacity.canCreate : !isPersonal || cards.length < 1

  const filtered = useMemo(() => {
    let list = filterVCardsByQuery(cards, query)
    if (status === 'active') list = list.filter((c) => c.isActive)
    if (status === 'inactive') list = list.filter((c) => !c.isActive)

    const sorted = [...list]
    if (sort === 'name') {
      sorted.sort((a, b) =>
        (a.personal.fullName || a.slug || '').localeCompare(b.personal.fullName || b.slug || '', undefined, {
          sensitivity: 'base',
        })
      )
    } else if (sort === 'views') {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    } else {
      sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }
    return sorted
  }, [cards, query, status, sort])

  const openQrModal = (url: string, name?: string) => {
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const openNotice = (card: VCardRecord) => {
    setNoticeCard(card)
  }

  const handleEmailCard = (card: VCardRecord) => {
    const email = card.personal.email?.trim()
    if (!email) {
      setAlertMessage('No email on this card.')
      return
    }
    window.open(`mailto:${email}`, '_blank')
  }

  const handleCallCard = (card: VCardRecord) => {
    const phone = card.personal.phone?.trim() || card.personal.whatsapp?.trim()
    if (!phone) {
      setAlertMessage('No phone on this card.')
      return
    }
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_self')
  }

  const handleScheduleCard = (card: VCardRecord) => {
    const name = card.personal.fullName || 'Contact'
    const title = encodeURIComponent(`Meeting with ${name}`)
    const path = getVCardPublicPath(card.slug?.trim() || 'profile')
    const details = encodeURIComponent(
      `vBiz card: ${typeof window !== 'undefined' ? window.location.origin : ''}${path}`
    )
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      '_blank'
    )
  }

  const handleToggleStatus = async (card: VCardRecord, nextStatus: string) => {
    try {
      await updateProfileCard({
        id: card.id,
        body: { isPublic: nextStatus === 'active' },
      }).unwrap()
      void refetch()
    } catch {
      setAlertMessage('Could not update card status. Please try again.')
    }
  }

  const noticeInitialText =
    noticeCard && typeof window !== 'undefined' ? localStorage.getItem(`notice_${noticeCard.id}`) || '' : ''
  const noticeInitialType = (
    noticeCard && typeof window !== 'undefined'
      ? localStorage.getItem(`notice_type_${noticeCard.id}`) || 'info'
      : 'info'
  ) as NoticeType

  return (
    <div className="animate-in fade-in duration-500">
      <VCardsListHeader
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        canCreate={canCreate}
        isPersonal={isPersonal}
        createDisabledReason={isPersonal && !canCreate ? 'Single card owners can create only one vCard' : undefined}
      />

      {isLoading && <p className="mb-4 text-sm text-slate-500">Loading your vCards…</p>}
      {isError && (
        <p className="mb-4 text-sm text-rose-500">
          Could not load vCards from the server.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      {!isLoading && filtered.length === 0 && cards.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No cards match your filters</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Try clearing filters or adjusting your search.</p>
        </div>
      ) : null}

      <VCardsGrid
        cards={filtered}
        onOpenQr={openQrModal}
        onPanel={(card) => setPanelCardId(card.id)}
        onNotice={openNotice}
        noticeVersion={noticeVersion}
        canCreate={canCreate}
        showLimitPlaceholder={isPersonal && !canCreate && cards.length > 0}
        isPersonal={isPersonal}
      />

      <QrCodeModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={selectedVCardUrl}
        title={qrModalTitle}
        zIndexClass="z-50"
      />

      <VCardDetailSidebar
        card={panelCard}
        onClose={() => setPanelCardId(null)}
        onEmail={handleEmailCard}
        onCall={handleCallCard}
        onSchedule={handleScheduleCard}
        onNotice={openNotice}
        onDuplicate={() => {
          setAlertMessage(
            canCreate ? 'Duplicate is not available yet.' : 'Single card owners can create only one vCard'
          )
        }}
        onToggleStatus={handleToggleStatus}
        canDuplicate={canCreate}
        duplicateDisabledReason="Single card owners can create only one vCard"
      />

      <AlertModal
        open={Boolean(alertMessage)}
        title="Notice"
        description={alertMessage || ''}
        onClose={() => setAlertMessage(null)}
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
        }}
        onClear={() => {
          if (!noticeCard) return
          localStorage.removeItem(`notice_${noticeCard.id}`)
          localStorage.removeItem(`notice_type_${noticeCard.id}`)
          setNoticeVersion((n) => n + 1)
        }}
      />
    </div>
  )
}

export default DashboardVCardsView
