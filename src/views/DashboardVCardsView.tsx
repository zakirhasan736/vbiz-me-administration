'use client'

import { AlertModal } from '@/components/AlertModal'
import {
  NoticeModal,
  QrCodeModal,
  VCardDetailSidebar,
  VCardDirectoryListSkeleton,
  VCardsGrid,
  VCardsListHeader,
  VCardTrendsPopup,
  type CardLifecycleTab,
  type NoticeType,
  type VCardSortOption,
} from '@/components/dashboard/vcard'
import { useAppDispatch } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { ACCOUNT_PAUSED_CREATE_MESSAGE } from '@/lib/accountStatus'
import { clearLocalCardNotice, noticeForCard, noticeTypeFromTeamNotice, writeLocalCardNotice } from '@/lib/cardNotice'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { notify } from '@/lib/toast/toast'
import {
  mapApiProfileToVCardRecord,
  useCreateTeamNoticeMutation,
  useDeleteTeamNoticeMutation,
  useGetProfilesQuery,
  useGetTeamNoticesQuery,
  useUpdateProfileCardMutation,
} from '@/redux/features/profiles/profiles.api'
import { replaceAllVCards } from '@/redux/features/vcards/vcards.slice'
import type { VCardRecord } from '@/types/vcard'
import { filterVCardsByQuery } from '@/utils/vcard'
import { useEffect, useMemo, useState } from 'react'

const DashboardVCardsView = () => {
  const dispatch = useAppDispatch()
  const { isSingleBackOffice } = useOwnerMode()
  const isPersonal = isSingleBackOffice
  const { data: profilesResult, isLoading, isError, refetch } = useGetProfilesQuery({ limit: 100 })
  const [updateProfileCard] = useUpdateProfileCardMutation()
  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')
  const [panelCardId, setPanelCardId] = useState<string | null>(null)
  const [trendsCard, setTrendsCard] = useState<VCardRecord | null>(null)
  const [noticeCard, setNoticeCard] = useState<VCardRecord | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [lifecycleTab, setLifecycleTab] = useState<CardLifecycleTab>('active')
  const [sort, setSort] = useState<VCardSortOption>('newest')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const capacity = profilesResult?.capacity
  const { canMutateVcards } = useAccountStatus()
  const cards = useMemo(() => (profilesResult?.items ?? []).map(mapApiProfileToVCardRecord), [profilesResult?.items])

  useEffect(() => {
    if (isLoading) return
    dispatch(replaceAllVCards(cards))
  }, [cards, dispatch, isLoading])

  const panelCard = useMemo(
    () => (panelCardId ? (cards.find((c) => c.id === panelCardId) ?? null) : null),
    [cards, panelCardId]
  )

  const activeCount = useMemo(() => cards.filter((c) => !c.isDraft).length, [cards])
  const draftCount = useMemo(() => cards.filter((c) => c.isDraft).length, [cards])

  const capacityAllowsCreate = capacity ? capacity.canCreate : !isPersonal || cards.length < 1
  const canCreate = capacityAllowsCreate && canMutateVcards
  const createDisabledReason = !canMutateVcards
    ? ACCOUNT_PAUSED_CREATE_MESSAGE
    : isPersonal && !capacityAllowsCreate
      ? 'Single card owners can create only one vCard'
      : undefined

  const filtered = useMemo(() => {
    let list = filterVCardsByQuery(cards, query)
    if (lifecycleTab === 'active') list = list.filter((c) => !c.isDraft)
    if (lifecycleTab === 'draft') list = list.filter((c) => c.isDraft)

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
  }, [cards, query, lifecycleTab, sort])

  const openQrModal = (url: string, name?: string) => {
    const matched = cards.find((c) => {
      const slug = c.slug?.trim()
      return Boolean(slug) && (url.includes(`/v/${slug}`) || url.endsWith(`/${slug}`))
    })
    if (matched && isOwnerCardLocked(matched.status)) {
      notify.error(SUSPENDED_CARD_MESSAGE)
      return
    }
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const openNotice = (card: VCardRecord) => {
    if (isOwnerCardLocked(card.status)) {
      notify.error(SUSPENDED_CARD_MESSAGE)
      return
    }
    setNoticeCard(card)
  }

  const handleToggleStatus = async (card: VCardRecord, nextStatus: string) => {
    try {
      const activate = nextStatus === 'active'
      await updateProfileCard({
        id: card.id,
        body: activate
          ? { status: 'active', isDraft: false, isPublic: true }
          : { status: 'inactive', isDraft: false, isPublic: false },
      }).unwrap()
      void refetch()
    } catch (error) {
      setAlertMessage(
        (error as { data?: { message?: string } })?.data?.message ||
          (error as Error)?.message ||
          'Could not update card status. Please try again.'
      )
    }
  }

  const noticeServer = noticeCard ? noticeForCard(noticeCard.id, teamNotices) : null
  const noticeInitialText = noticeServer?.text || ''
  const noticeInitialType: NoticeType = noticeServer ? noticeTypeFromTeamNotice(noticeServer) : 'info'

  return (
    <div className="animate-in fade-in duration-500">
      <VCardsListHeader
        query={query}
        onQueryChange={setQuery}
        lifecycleTab={lifecycleTab}
        onLifecycleTabChange={setLifecycleTab}
        activeCount={activeCount}
        draftCount={draftCount}
        sort={sort}
        onSortChange={setSort}
        canCreate={canCreate}
        isPersonal={isPersonal}
        createDisabledReason={createDisabledReason}
      />

      {isError && (
        <p className="mb-4 text-sm text-rose-500">
          Could not load vCards from the server.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      {isLoading ? (
        <VCardDirectoryListSkeleton cardCount={3} />
      ) : (
        <>
          {filtered.length === 0 && cards.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#0b0f19]">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {lifecycleTab === 'draft' ? 'No draft cards' : 'No active cards match your filters'}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {lifecycleTab === 'draft'
                  ? 'Incomplete cards appear here after you create them.'
                  : 'Try clearing filters or check the Draft tab.'}
              </p>
            </div>
          ) : null}

          <VCardsGrid
            cards={filtered}
            onOpenQr={openQrModal}
            onPanel={(card) => setPanelCardId(card.id)}
            onNotice={openNotice}
            noticeVersion={noticeVersion}
            teamNotices={teamNotices}
            canCreate={canCreate && lifecycleTab === 'active'}
            showLimitPlaceholder={isPersonal && !canCreate && cards.length > 0}
            isPersonal={isPersonal}
            onTrends={setTrendsCard}
          />
        </>
      )}

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

      <VCardTrendsPopup card={trendsCard} onClose={() => setTrendsCard(null)} />

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
              } else {
                clearLocalCardNotice(noticeCard.id)
                const existing = noticeForCard(noticeCard.id, teamNotices)
                if (existing?.id) await deleteTeamNotice(existing.id).unwrap()
              }
              setNoticeVersion((n) => n + 1)
              notify.success(
                text ? 'Notice saved for this card. Visitors will see it after the intro.' : 'Notice cleared.'
              )
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
            notify.success('Notice cleared.')
          })()
        }}
      />
    </div>
  )
}

export default DashboardVCardsView
