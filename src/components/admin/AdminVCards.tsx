'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import VCardTeamCard from '@/components/admin/AdminDirectoryVCardTeamCard'
import VCardDetailSidebar, { VCardTrendsPopup } from '@/components/admin/AdminVCardDetailSidebar'
import VCardQrModal from '@/components/admin/AdminVCardQrModal'
import { CardLifecycleTabs } from '@/components/dashboard/vcard/CardLifecycleTabs'
import { NoticeModal, type NoticeType } from '@/components/dashboard/vcard/NoticeModal'
import { VCardDirectoryListSkeleton } from '@/components/dashboard/vcard/VCardDirectoryListSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useVCard } from '@/lib/admin/AdminVCardListContext'
import { resolveDirectoryBadge } from '@/lib/admin/adminCardBadge'
import { type AdminCard } from '@/lib/admin/adminCardShape'
import { canAdminContactCard } from '@/lib/admin/canAdminContactCard'
import { mapAdminProfileRowToCard } from '@/lib/admin/mapAdminProfileRow'
import {
  clearLocalCardNotice,
  noticeForCard,
  noticeTypeFromTeamNotice,
  readLocalCardNotice,
  writeLocalCardNotice,
} from '@/lib/cardNotice'
import { appendAuditLog } from '@/lib/mockStore'
import { notifyCardOwner } from '@/lib/notifications'
import { notify } from '@/lib/toast/toast'
import { buildEditorSectionPath, buildEditorSettingsPath } from '@/lib/vcardEditorRoutes'
import { api } from '@/redux/api/api'
import {
  useCreateAnnouncementMutation,
  useGetAnnouncementsQuery,
  useUpdateAnnouncementMutation,
} from '@/redux/features/adminAnnouncements/adminAnnouncements.api'
import {
  exportAdminProfilesCsv,
  useGetAdminProfileFiltersQuery,
  useGetAdminProfilesQuery,
  useLazyGetAdminProfilesQuery,
  useSendAdminProfileEmailMutation,
} from '@/redux/features/adminProfiles/adminProfiles.api'
import {
  appendItems,
  clearFilters,
  setDebouncedQ,
  setLifecycleTab,
  setListSnapshot,
  setProfessionFilter,
  setSearchQuery,
  setShowAll,
  setStatusFilter,
  setTotal,
} from '@/redux/features/adminVCardsList/adminVCardsList.slice'
import { useCreateMeetingMutation } from '@/redux/features/meetings/meetings.api'
import {
  useCreateTeamNoticeMutation,
  useDeleteProfileMutation,
  useDeleteTeamNoticeMutation,
  useDuplicateProfileMutation,
  useGetTeamNoticesQuery,
} from '@/redux/features/profiles/profiles.api'
import type { AnnouncementType } from '@/types/announcement'
import { MEETING_TYPES, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  Calendar,
  Contact,
  Delete,
  Download,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

function personalField(personal: AdminCard['personal'], key: string): string {
  const value = personal?.[key]
  return typeof value === 'string' ? value : ''
}

const PAGE_SIZE = 20

export default function AdminVCards() {
  const { updateCorporateCardControls, setCurrentEditingCardId } = useVCard()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.user.token)
  const ownerId = useAppSelector((s) => s.user.user?.id)
  const {
    searchQuery,
    debouncedQ,
    professionFilter,
    statusFilter,
    lifecycleTab,
    showAll,
    accumulatedItems,
    listSyncKey: storedListSyncKey,
    total: storedTotal,
  } = useAppSelector((s) => s.adminVCardsList)
  const [deleteProfile] = useDeleteProfileMutation()
  const [duplicateProfile] = useDuplicateProfileMutation()

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [duplicatingCardId, setDuplicatingCardId] = useState<string | null>(null)
  const [highlightedDuplicatedId, setHighlightedDuplicatedId] = useState<string | null>(null)
  const [highlightedActivatedId, setHighlightedActivatedId] = useState<string | null>(null)
  const [highlightedPausedId, setHighlightedPausedId] = useState<string | null>(null)
  const listTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => dispatch(setDebouncedQ(searchQuery.trim())), 300)
    return () => window.clearTimeout(t)
  }, [dispatch, searchQuery])

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

  useEffect(() => {
    if (!highlightedPausedId) return
    const timer = window.setTimeout(() => setHighlightedPausedId(null), 12000)
    return () => window.clearTimeout(timer)
  }, [highlightedPausedId])

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      profession: professionFilter !== 'All' ? professionFilter : undefined,
      lifecycle: lifecycleTab,
      skip: 0,
      limit: PAGE_SIZE,
      showAll,
    }),
    [debouncedQ, statusFilter, professionFilter, lifecycleTab, showAll]
  )

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetAdminProfilesQuery(listQuery)

  const [fetchMoreProfiles] = useLazyGetAdminProfilesQuery()

  const { data: filterOptions } = useGetAdminProfileFiltersQuery()
  const { data: activeMeta } = useGetAdminProfilesQuery({ lifecycle: 'active', limit: 1, skip: 0 })
  const { data: draftMeta } = useGetAdminProfilesQuery({ lifecycle: 'draft', limit: 1, skip: 0 })
  const activeCount = activeMeta?.total ?? 0
  const draftCount = draftMeta?.total ?? 0

  const listSyncKey = useMemo(
    () => [debouncedQ, statusFilter, professionFilter, lifecycleTab, showAll ? 'all' : 'page'].join('|'),
    [debouncedQ, statusFilter, professionFilter, lifecycleTab, showAll]
  )

  useEffect(() => {
    if (!listData || isListFetching) return
    const keyChanged = storedListSyncKey !== listSyncKey
    if (!keyChanged && !showAll) {
      // Same filters after remount / soft nav — keep Show more progress; refresh total only.
      if (typeof listData.total === 'number' && listData.total !== storedTotal) {
        dispatch(setTotal(listData.total))
      }
      return
    }
    dispatch(
      setListSnapshot({
        items: listData.items,
        total: listData.total,
        listSyncKey,
      })
    )
  }, [dispatch, listData, listSyncKey, showAll, isListFetching, storedListSyncKey, storedTotal])

  const cards = useMemo(() => {
    const mapped = accumulatedItems.map(mapAdminProfileRowToCard)
    // Keep Active / Draft tabs mutually exclusive even if API cache is stale
    return mapped.filter((c) => (lifecycleTab === 'draft' ? Boolean(c.isDraft) : !c.isDraft))
  }, [accumulatedItems, lifecycleTab])

  const total = listData?.total ?? storedTotal
  const hasMore = !showAll && accumulatedItems.length < total
  const hasCachedList = accumulatedItems.length > 0 && storedListSyncKey === listSyncKey
  const showListSkeleton = isListLoading && !hasCachedList

  const refreshListFromStart = async () => {
    try {
      const result = await refetchList()
      if (result.data) {
        dispatch(
          setListSnapshot({
            items: result.data.items,
            total: result.data.total,
            listSyncKey,
          })
        )
      }
    } catch {
      /* ignore */
    }
  }

  const handleShowMore = async () => {
    if (!hasMore || isLoadingMore || showAll) return
    setIsLoadingMore(true)
    try {
      const result = await fetchMoreProfiles({
        q: debouncedQ || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        profession: professionFilter !== 'All' ? professionFilter : undefined,
        lifecycle: lifecycleTab,
        skip: accumulatedItems.length,
        limit: PAGE_SIZE,
        showAll: false,
      }).unwrap()
      dispatch(appendItems(result.items))
      if (typeof result.total === 'number') {
        dispatch(setTotal(result.total))
      }
    } catch {
      notify.info('Could not load more cards.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const [panelCard, setPanelCard] = useState<AdminCard | null>(null)
  const [selectedCard, setSelectedCard] = useState<AdminCard | null>(null)
  const [trendsCard, setTrendsCard] = useState<AdminCard | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')

  const handleActivatedFromDraft = (cardId: string) => {
    notify.success('Your card is now active.', {
      title: 'Card activated',
      action: {
        label: 'View in Active',
        onClick: () => {
          dispatch(setLifecycleTab('active'))
          setHighlightedActivatedId(cardId)
          setHighlightedDuplicatedId(null)
          setHighlightedPausedId(null)
          setPanelCard(null)
        },
      },
    })
  }

  const openQrModal = (url: string, name?: string) => {
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCallPadOpen, setIsCallPadOpen] = useState(false)
  const [callDigits, setCallDigits] = useState('')

  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sendAdminProfileEmail, { isLoading: isSendingEmail }] = useSendAdminProfileEmailMutation()

  const [cardNoticeText, setCardNoticeText] = useState('')
  const [cardNoticeType, setCardNoticeType] = useState('info')
  const [isNoticeSaved, setIsNoticeSaved] = useState(false)

  const [meetingType, setMeetingType] = useState<MeetingType>('Growth Meeting')
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
  const [meetingTime, setMeetingTime] = useState('10:00 AM')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [isMeetingSaved, setIsMeetingSaved] = useState(false)
  const [createMeeting, { isLoading: isCreatingMeeting }] = useCreateMeetingMutation()
  const [createAnnouncement, { isLoading: isCreatingNotice }] = useCreateAnnouncementMutation()
  const [updateAnnouncement, { isLoading: isUpdatingNotice }] = useUpdateAnnouncementMutation()
  const { data: announcementsPage } = useGetAnnouncementsQuery({ status: 'active', limit: 100 })
  const { data: teamNotices = [] } = useGetTeamNoticesQuery()
  const [createTeamNotice] = useCreateTeamNoticeMutation()
  const [deleteTeamNotice] = useDeleteTeamNoticeMutation()

  const [noticeCard, setNoticeCard] = useState<AdminCard | null>(null)
  const [noticeVersion, setNoticeVersion] = useState(0)

  const findCardNotice = (profileId: string) =>
    (announcementsPage?.items || []).find(
      (a) =>
        a.targetType === 'specific' &&
        a.status === 'active' &&
        a.meta?.source === 'card_notice' &&
        a.meta?.profileId === profileId
    )

  const resolveDirectoryCardNotice = (card: AdminCard) => {
    if (canAdminContactCard(card, ownerId)) {
      const existing = findCardNotice(card.id)
      return {
        text: existing?.body ?? null,
        type: (existing?.type as NoticeType | undefined) ?? null,
      }
    }
    const serverNotice = card.id ? noticeForCard(card.id, teamNotices) : null
    return {
      text: serverNotice?.text ?? null,
      type: serverNotice ? noticeTypeFromTeamNotice(serverNotice) : null,
    }
  }

  const collectOwnerEmails = (card: AdminCard): string[] => {
    const emails = [card.ownerEmail, card.companyUserEmail]
      .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter(Boolean)
    return [...new Set(emails)]
  }

  const openPanel = (card: AdminCard) => {
    setPanelCard(card)
    const existing = findCardNotice(card.id)
    setCardNoticeText(existing?.body || '')
    setCardNoticeType(existing?.type || 'info')
  }

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    variant?: 'danger' | 'default'
    onConfirm: () => void
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  const resetListState = () => {
    setSelectedCardIds([])
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCardIds(cards.map((c) => c.id))
    } else {
      setSelectedCardIds([])
    }
  }
  const toggleCardSelection = (id: string) => {
    setSelectedCardIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }
  const executeBatchDelete = async () => {
    setIsBatchDeleting(true)
    const ids = [...selectedCardIds]
    try {
      for (const id of ids) {
        await deleteProfile(id).unwrap()
      }
      setSelectedCardIds([])
      if (panelCard && ids.includes(panelCard.id)) setPanelCard(null)
      if (trendsCard && ids.includes(trendsCard.id)) setTrendsCard(null)
      notify.info('Selected cards deleted successfully.')
      void refreshListFromStart()
    } catch {
      notify.info('Error executing bulk delete.')
    } finally {
      setIsBatchDeleting(false)
      setConfirmState(null)
    }
  }
  const handleBatchDelete = () => {
    setConfirmState({
      open: true,
      title: 'Delete selected cards?',
      description: `Are you sure you want to delete ${selectedCardIds.length} selected cards? This cannot be undone.`,
      onConfirm: () => {
        void executeBatchDelete()
      },
    })
  }

  const openEmailForCard = (card: AdminCard) => {
    setSelectedCard(card)
    setEmailSubject(`vBiz update for ${personalField(card.personal, 'fullName') || 'your card'}`)
    setEmailBody('')
    setIsEmailSent(false)
    setIsEmailModalOpen(true)
  }

  const openCallForCard = (card: AdminCard) => {
    setSelectedCard(card)
    const phone = personalField(card.personal, 'phone') || personalField(card.personal, 'whatsapp')
    setCallDigits(phone.replace(/[^\d+]/g, '') || '')
    setIsCallPadOpen(true)
  }

  const openScheduleForCard = (card: AdminCard) => {
    setSelectedCard(card)
    setIsScheduleModalOpen(true)
  }

  const openNoticeForCard = (card: AdminCard) => {
    setPanelCard(null)
    // Admin portfolio / own cards: public TeamNotice (same as My Cards). Never backoffice Announcement.
    if (!canAdminContactCard(card, ownerId)) {
      setNoticeCard(card)
      return
    }
    setSelectedCard(card)
    const existing = findCardNotice(card.id)
    setCardNoticeText(existing?.body || '')
    setCardNoticeType(existing?.type || 'info')
    setIsNoticeModalOpen(true)
  }

  const handleDuplicateCard = async (card: AdminCard) => {
    if (!card.id || duplicatingCardId) return
    setDuplicatingCardId(card.id)
    try {
      const fullName = personalField(card.personal, 'fullName') || 'Member'
      const created = await duplicateProfile(card.id).unwrap()
      const newId = created?.id
      appendAuditLog({
        action: 'Duplicated Card Profile',
        details: `Admin duplicated ${fullName} as ${created.slug || newId}`,
        type: 'create',
      })
      if (lifecycleTab === 'draft') {
        void refreshListFromStart()
      }
      if (newId) {
        notify.success('Saved as a draft. Enter a unique email and date of birth before activating.', {
          title: 'Card duplicated',
          action: {
            label: 'View in Draft',
            onClick: () => {
              dispatch(setLifecycleTab('draft'))
              setHighlightedDuplicatedId(newId)
              setHighlightedActivatedId(null)
              setHighlightedPausedId(null)
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

  const exportFilterParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      profession: professionFilter !== 'All' ? professionFilter : undefined,
      lifecycle: lifecycleTab,
    }),
    [debouncedQ, statusFilter, professionFilter, lifecycleTab]
  )

  const handleFilteredExport = async () => {
    setIsExporting(true)
    try {
      await exportAdminProfilesCsv(exportFilterParams, () => token || undefined)
      notify.info('CSV export downloaded.')
    } catch {
      notify.info('Error exporting CSV data.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleBatchExport = () => {
    try {
      const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id))
      const headers = ['ID', 'Slug', 'Full Name', 'Email', 'Profession', 'Designation', 'Company', 'Status']
      const csvRows = [
        headers.join(','),
        ...selectedCards.map((c) =>
          [
            c.id || '',
            c.slug || '',
            `"${personalField(c.personal, 'fullName').replace(/"/g, '""')}"`,
            personalField(c.personal, 'email'),
            `"${personalField(c.personal, 'profession').replace(/"/g, '""')}"`,
            `"${personalField(c.personal, 'designation').replace(/"/g, '""')}"`,
            `"${personalField(c.personal, 'company').replace(/"/g, '""')}"`,
            c.status || 'active',
          ].join(',')
        ),
      ]
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', csvContent)
      downloadAnchor.setAttribute('download', `vcards-selected-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      setSelectedCardIds([])
    } catch {
      notify.info('Error exporting CSV data.')
    }
  }

  const handleToggleStatus = async (card: AdminCard, targetStatus: string) => {
    try {
      const prevStatus = String(card.status || 'active').toLowerCase()
      const nextPublic = targetStatus === 'active'
      const nextDraft = targetStatus === 'paused'
      await updateCorporateCardControls(card.id, {
        status: targetStatus as 'active' | 'inactive' | 'paused' | 'suspended',
        isPublic: nextPublic,
        isDraft: nextDraft,
      })
      setSelectedCard((prev) =>
        prev && prev.id === card.id ? { ...prev, status: targetStatus, isPublic: nextPublic, isDraft: nextDraft } : prev
      )
      setPanelCard((prev) =>
        prev && prev.id === card.id ? { ...prev, status: targetStatus, isPublic: nextPublic, isDraft: nextDraft } : prev
      )

      appendAuditLog({
        action: 'Card Status Override',
        details: `Modified ${personalField(card.personal, 'fullName')}'s account status to ${targetStatus.toUpperCase()}`,
        type: 'status',
      })

      const crossesLifecycle = targetStatus === 'paused' || (targetStatus === 'active' && prevStatus === 'paused')

      if (crossesLifecycle) {
        dispatch(api.util.invalidateTags([{ type: 'adminProfiles', id: 'LIST' }]))
        void refreshListFromStart()

        if (targetStatus === 'paused') {
          notify.success('Moved to draft and hidden from the public.', {
            title: 'Card paused',
            action: {
              label: 'View in Draft',
              onClick: () => {
                dispatch(setLifecycleTab('draft'))
                setHighlightedPausedId(card.id)
                setHighlightedDuplicatedId(null)
                setHighlightedActivatedId(null)
                setPanelCard(null)
              },
            },
          })
        } else {
          notify.success('Your card is now active.', {
            title: 'Card activated',
            action: {
              label: 'View in Active',
              onClick: () => {
                dispatch(setLifecycleTab('active'))
                setHighlightedActivatedId(card.id)
                setHighlightedDuplicatedId(null)
                setHighlightedPausedId(null)
                setPanelCard(null)
              },
            },
          })
        }
      } else {
        notify.info(`Card marked ${targetStatus}.`)
        void refreshListFromStart()
      }
    } catch {
      notify.info('Could not update card status.')
    }
  }

  const requestToggleStatus = (card: AdminCard, targetStatus: string) => {
    setPanelCard(null)
    setSelectedCard(card)
    const name = personalField(card.personal, 'fullName') || 'this card'
    const current = String(card.status || 'active').toLowerCase()

    const copy =
      targetStatus === 'suspended'
        ? {
            title: 'Suspend this card?',
            description: `${name} will be disabled and hidden from the public. The owner will not be able to edit, duplicate, or change visibility. The card still counts toward their package capacity.`,
            confirmLabel: 'Suspend',
            variant: 'danger' as const,
          }
        : targetStatus === 'paused'
          ? {
              title: 'Pause this card?',
              description: `${name} will be moved to draft and hidden from the public. The owner can still edit it, but cannot make it public until support re-enables it.`,
              confirmLabel: 'Pause',
              variant: 'default' as const,
            }
          : current === 'suspended'
            ? {
                title: 'Unsuspend this card?',
                description: `${name} will be public again. The owner will be able to edit, duplicate, and change visibility.`,
                confirmLabel: 'Unsuspend',
                variant: 'default' as const,
              }
            : {
                title: 'Resume this card?',
                description: `${name} will leave draft and become public again.`,
                confirmLabel: 'Resume',
                variant: 'default' as const,
              }

    setConfirmState({
      open: true,
      title: copy.title,
      description: copy.description,
      confirmLabel: copy.confirmLabel,
      variant: copy.variant,
      onConfirm: () => {
        setConfirmState(null)
        void handleToggleStatus(card, targetStatus)
      },
    })
  }

  const handleSaveCardNotice = async () => {
    if (!selectedCard || isCreatingNotice || isUpdatingNotice) return
    if (!canAdminContactCard(selectedCard, ownerId)) {
      notify.info('Use the public card notice for admin portfolio cards.')
      return
    }
    const ownerName = personalField(selectedCard.personal, 'fullName')
    const targetEmails = collectOwnerEmails(selectedCard)
    const trimmed = cardNoticeText.trim()
    const existing = findCardNotice(selectedCard.id)
    const noticeType = (
      ['info', 'warning', 'success'].includes(cardNoticeType) ? cardNoticeType : 'info'
    ) as AnnouncementType

    if (!trimmed) {
      if (existing) {
        try {
          await updateAnnouncement({ id: existing.id, body: { status: 'archived' } }).unwrap()
          notify.info('Card notice cleared.')
        } catch {
          notify.info('Could not clear card notice.')
          return
        }
      }
      setIsNoticeModalOpen(false)
      return
    }

    if (!targetEmails.length) {
      notify.info('No back-office owner email on this card. Cannot send a targeted notice.')
      return
    }

    try {
      await createAnnouncement({
        type: noticeType,
        title: `Card notice · ${ownerName || selectedCard.slug || 'vCard'}`,
        body: trimmed,
        status: 'active',
        targetType: 'specific',
        targetEmails,
        meta: { profileId: selectedCard.id, source: 'card_notice' },
      }).unwrap()

      setIsNoticeSaved(true)
      setTimeout(() => {
        setIsNoticeSaved(false)
        setIsNoticeModalOpen(false)
      }, 1500)

      appendAuditLog({
        action: 'Individual Backoffice Notice',
        details: `Dispatched customized notice banner to ${ownerName} (${selectedCard.id})`,
        type: 'settings',
      })
    } catch {
      notify.info('Could not publish card notice. Check announcements permission.')
    }
  }

  const handleSaveMeeting = async () => {
    if (!selectedCard || isCreatingMeeting) return
    const hostName = personalField(selectedCard.personal, 'fullName') || 'vCard Owner'
    try {
      const created = await createMeeting({
        host: hostName,
        type: meetingType,
        date: meetingDate,
        time: meetingTime,
        notes: meetingNotes.trim() || null,
        status: 'Scheduled',
        profileId: selectedCard.id || null,
      }).unwrap()

      setIsMeetingSaved(true)
      setTimeout(() => {
        setIsMeetingSaved(false)
        setIsScheduleModalOpen(false)
        setMeetingNotes('')
      }, 1500)

      const ownerAudience =
        selectedCard.ownerRole === 'corporate-owner' || selectedCard.companyUserRole === 'corporate-owner'
          ? 'corporate'
          : 'single'
      const meetSuffix = created.meetLink ? ` · Meet: ${created.meetLink}` : ''
      notifyCardOwner({
        ownerAudience,
        category: 'event',
        title: 'Card schedule booked',
        body: `${meetingType} with ${hostName} on ${meetingDate} at ${meetingTime}${meetSuffix}`,
        profileId: selectedCard.id,
        forceBrowser: true,
      })
    } catch {
      /* keep modal open */
    }
  }

  const handleSendEmail = async () => {
    if (!selectedCard || isSendingEmail || isEmailSent) return
    const subject = emailSubject.trim()
    const message = emailBody.trim()
    if (!subject || !message) {
      notify.warning('Add both a subject and message before sending.')
      return
    }

    try {
      const result = await sendAdminProfileEmail({ id: selectedCard.id, subject, message }).unwrap()
      setIsEmailSent(true)
      notify.success(`Email delivered to ${result.recipient}.`)

      appendAuditLog({
        action: 'Direct Email Dispatched',
        details: `Sent direct notification to ${result.recipient}: ${subject}`,
        type: 'update',
      })

      window.setTimeout(() => {
        setIsEmailSent(false)
        setIsEmailModalOpen(false)
        setEmailSubject('')
        setEmailBody('')
      }, 1200)
    } catch (error) {
      const data = (error as { data?: { message?: string; errorMessages?: Array<{ message?: string }> } })?.data
      const validationMessage = data?.errorMessages?.find((item) => item.message)?.message
      const message = data?.message === 'Validation Error' ? validationMessage || data.message : data?.message
      notify.error(message || 'Email could not be delivered.')
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
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-6 duration-500 md:p-10">
      <div ref={listTopRef} className="scroll-mt-4" aria-hidden />

      {/* Dynamic Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Contact className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Card Intelligence & Operations
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Displaying {cards.length} of {total} verified digital cards
            {isListFetching ? ' · refreshing…' : ''}.
          </p>
          <div className="mt-3">
            <CardLifecycleTabs
              value={lifecycleTab}
              onChange={(tab) => {
                dispatch(setLifecycleTab(tab))
                resetListState()
              }}
              activeCount={activeCount}
              draftCount={draftCount}
              countsLoading={showListSkeleton}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {showListSkeleton ? (
            <Skeleton className="h-11.5 w-35 rounded-2xl" />
          ) : (
            <button
              type="button"
              onClick={() => void handleFilteredExport()}
              disabled={isExporting || total === 0}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <Download className="h-4 w-4" /> {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
          <CreateCardLauncher requireOwnerAssignment>
            {(open) => (
              <button
                type="button"
                onClick={() => {
                  setCurrentEditingCardId(null)
                  open()
                }}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Create New Card
              </button>
            )}
          </CreateCardLauncher>
        </div>
      </div>

      {/* Filter and Query bar */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 md:flex-row dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-3 md:flex-1 dark:border-white/5 dark:bg-slate-800/50">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              dispatch(setSearchQuery(e.target.value))
              resetListState()
            }}
            placeholder="Query cards by name, designation, company, or email..."
            className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none dark:text-white"
          />
        </div>

        <div className="flex w-full items-center rounded-xl border border-slate-200/50 bg-slate-50 px-3 py-3 md:w-48 dark:border-white/5 dark:bg-slate-800/50">
          <select
            value={professionFilter}
            onChange={(e) => {
              dispatch(setProfessionFilter(e.target.value))
              resetListState()
            }}
            className="w-full cursor-pointer bg-transparent text-xs font-black text-slate-500 uppercase outline-none dark:text-slate-300"
          >
            <option value="All">All Professions</option>
            {(filterOptions?.professions || []).map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full items-center rounded-xl border border-slate-200/50 bg-slate-50 px-3 py-3 md:w-48 dark:border-white/5 dark:bg-slate-800/50">
          <select
            value={statusFilter}
            onChange={(e) => {
              dispatch(setStatusFilter(e.target.value))
              resetListState()
            }}
            className="w-full cursor-pointer bg-transparent text-xs font-black text-slate-500 uppercase outline-none dark:text-slate-300"
          >
            <option value="All">All Statuses</option>
            {(filterOptions?.statuses || [])
              .filter((s) => s.name.trim().toLowerCase() !== 'draft')
              .map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={() => {
            dispatch(clearFilters())
            resetListState()
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3 text-xs font-black text-slate-500 uppercase transition-all hover:bg-slate-100 md:w-auto dark:border-white/5 dark:hover:bg-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
        </button>
      </div>

      {selectedCardIds.length > 0 && (
        <div className="animate-in slide-in-from-bottom-2 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 duration-300 sm:flex-row sm:items-center dark:border-indigo-800/30 dark:bg-indigo-900/20">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-900 dark:bg-indigo-800/50 dark:text-indigo-200">
              {selectedCardIds.length} Selected
            </span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              Apply bulk operations to selected cards
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBatchExport}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black tracking-wider text-indigo-700 uppercase transition-all hover:bg-indigo-50 dark:border-indigo-800/30 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
            >
              <Download className="h-3.5 w-3.5" /> Export Selected
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black tracking-wider text-rose-700 uppercase transition-all hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800/30 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
            >
              <Trash2 className="h-3.5 w-3.5" /> {isBatchDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 pb-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedCardIds.length === cards.length && cards.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Select All Cards</span>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase select-none">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => {
              dispatch(setShowAll(e.target.checked))
              resetListState()
            }}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          Show all cards
        </label>
      </div>

      {isListError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300">
          Could not load platform cards.{' '}
          <button type="button" className="underline" onClick={() => void refreshListFromStart()}>
            Retry
          </button>
        </div>
      )}

      {showListSkeleton ? (
        <VCardDirectoryListSkeleton gridClassName="pt-2" />
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <CreateCardLauncher requireOwnerAssignment>
            {(open) => (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCurrentEditingCardId(null)
                  open()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentEditingCardId(null)
                    open()
                  }
                }}
                className="group flex min-h-87.5 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-all hover:border-indigo-500/30 hover:bg-slate-100 dark:border-white/10 dark:bg-[#070a13] dark:hover:bg-white/2"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
                  <Plus className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Create New Card</h3>
                <p className="mt-1 max-w-50 text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  Add a dynamic digital business card to your directory.
                </p>
              </div>
            )}
          </CreateCardLauncher>

          {cards.map((card, i) => {
            const contactSaves = Number(card.saveCount || 0)
            const badge = resolveDirectoryBadge(card)
            const canContact = canAdminContactCard(card, ownerId)
            const directoryNotice = resolveDirectoryCardNotice(card)

            return (
              <VCardTeamCard
                key={card.id || i}
                card={card}
                badgeLabel={badge.label}
                badgeTone={badge.tone}
                contactSaves={contactSaves}
                showCheckbox
                selected={selectedCardIds.includes(card.id)}
                onToggleSelect={() => toggleCardSelection(card.id)}
                showDragHandle={false}
                showNotice
                onNotice={() => openNoticeForCard(card)}
                cardNoticeText={directoryNotice.text}
                cardNoticeType={directoryNotice.type}
                noticeVersion={noticeVersion}
                onCardClick={() => openPanel(card)}
                onTrends={() => setTrendsCard(card)}
                onEmail={canContact ? () => openEmailForCard(card) : undefined}
                onCall={canContact ? () => openCallForCard(card) : undefined}
                onSchedule={canContact ? () => openScheduleForCard(card) : undefined}
                onEdit={() => {
                  setCurrentEditingCardId(card.id || null)
                  router.push(buildEditorSectionPath('/vcards/edit', 'home', card.id))
                }}
                onSettings={() => {
                  setCurrentEditingCardId(card.id || null)
                  router.push(buildEditorSettingsPath('/vcards/edit', 'info', card.id))
                }}
                onView={() => window.open(`/v/${card.slug || 'profile'}`, '_blank')}
                onPanel={() => openPanel(card)}
                onQr={() =>
                  openQrModal(
                    `${window.location.origin}/v/${card.slug || 'profile'}`,
                    personalField(card.personal, 'fullName') || undefined
                  )
                }
                onDuplicate={() => void handleDuplicateCard(card)}
                isDuplicating={duplicatingCardId === card.id}
                isNewlyDuplicated={
                  highlightedDuplicatedId === card.id ||
                  highlightedActivatedId === card.id ||
                  highlightedPausedId === card.id
                }
                highlightLabel={
                  highlightedActivatedId === card.id
                    ? 'activated'
                    : highlightedPausedId === card.id
                      ? 'paused'
                      : 'duplicated'
                }
                onActivatedFromDraft={handleActivatedFromDraft}
                onDeleted={async (id) => {
                  setSelectedCardIds((prev) => prev.filter((x) => x !== id))
                  if (panelCard?.id === id) setPanelCard(null)
                  if (trendsCard?.id === id) setTrendsCard(null)
                  notify.info('Card deleted successfully.')
                  void refreshListFromStart()
                }}
              />
            )
          })}

          {!showListSkeleton && cards.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center dark:border-white/10">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {lifecycleTab === 'draft' ? 'No draft cards.' : 'No active cards match these filters.'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {lifecycleTab === 'draft'
                  ? 'Incomplete cards appear here until they are published.'
                  : 'Clear filters, check Draft, or create a new card.'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
        {!showListSkeleton && !isListError && total > 0 && (
          <span className="text-xs font-semibold text-slate-500">
            {showAll ? `Showing all ${total} matching cards` : `Showing ${cards.length} of ${total}`}
          </span>
        )}
        {hasMore && !isListError && (
          <button
            type="button"
            disabled={isLoadingMore || isListFetching}
            onClick={() => void handleShowMore()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {isLoadingMore ? 'Loading…' : 'Show more'}
          </button>
        )}
      </div>

      <VCardDetailSidebar
        card={panelCard}
        mode="admin"
        onClose={() => setPanelCard(null)}
        onEmail={panelCard && canAdminContactCard(panelCard, ownerId) ? openEmailForCard : undefined}
        onCall={panelCard && canAdminContactCard(panelCard, ownerId) ? openCallForCard : undefined}
        onSchedule={panelCard && canAdminContactCard(panelCard, ownerId) ? openScheduleForCard : undefined}
        onNotice={openNoticeForCard}
        activeNoticeText={panelCard ? resolveDirectoryCardNotice(panelCard).text : null}
        onDuplicate={handleDuplicateCard}
        isDuplicating={Boolean(panelCard?.id && duplicatingCardId === panelCard.id)}
        onToggleStatus={requestToggleStatus}
      />

      <VCardTrendsPopup card={trendsCard} onClose={() => setTrendsCard(null)} />

      <VCardQrModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={selectedVCardUrl}
        title={qrModalTitle}
      />

      {/* MODAL: CALL PAD */}
      {isCallPadOpen && selectedCard && (
        <ModalPortal>
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsCallPadOpen(false)}
            />
            <div className="animate-in zoom-in-95 relative w-full max-w-sm rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                    <Phone className="h-5 w-5 text-emerald-500" /> Call pad
                  </h2>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    {personalField(selectedCard.personal, 'fullName')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCallPadOpen(false)}
                  className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="mb-4 flex min-h-16 items-center justify-center rounded-2xl bg-slate-900 px-4 py-5 text-center font-mono text-xl tracking-wider text-white">
                {callDigits || 'Enter number'}
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCallDigits((prev) => `${prev}${d}`)}
                    className="rounded-2xl bg-slate-100 py-3.5 text-lg font-black text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCallDigits((prev) => prev.slice(0, -1))}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  title="Backspace"
                >
                  <Delete className="h-4 w-4" />
                </button>
                <a
                  href={callDigits ? `tel:${callDigits}` : undefined}
                  onClick={(e) => {
                    if (!callDigits) {
                      e.preventDefault()
                      return
                    }
                    appendAuditLog({
                      action: 'Admin Call Initiated',
                      details: `Called ${personalField(selectedCard.personal, 'fullName')} at ${callDigits}`,
                      type: 'update',
                    })
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black tracking-wider text-white uppercase',
                    callDigits
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'pointer-events-none bg-slate-300 dark:bg-slate-700'
                  )}
                >
                  <Phone className="h-4 w-4" /> Place call
                </a>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: EMAIL */}
      {isEmailModalOpen && selectedCard && (
        <ModalPortal>
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEmailModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Mail className="h-5 w-5 text-indigo-600" /> Email vCard Owner
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Dispatches direct instructions or growth analytics notifications to{' '}
                    {personalField(selectedCard.personal, 'fullName')}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="shrink-0 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Recipient</label>
                  <input
                    type="text"
                    readOnly
                    value={`${personalField(selectedCard.personal, 'fullName')} <${personalField(selectedCard.personal, 'email')}>`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-500 outline-none dark:border-white/5 dark:bg-slate-800"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Subject Title
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Tips to grow your vCard profile clicks"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Message Content
                  </label>
                  <textarea
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your email message or guidelines..."
                    className="min-h-35 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || isEmailSent || !emailSubject.trim() || !emailBody.trim()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingEmail ? (
                      <>Sending...</>
                    ) : isEmailSent ? (
                      <>Email sent</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Dispatch Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: BACKOFFICE SPECIFIC NOTICE BANNER */}
      {isNoticeModalOpen && selectedCard && (
        <ModalPortal>
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsNoticeModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <ShieldAlert className="h-5 w-5 text-indigo-600" /> Card Specific Backoffice Notice
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    This notice is specifically displayed in {personalField(selectedCard.personal, 'fullName')}&apos;s
                    user backoffice dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="shrink-0 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  {(['info', 'warning', 'success'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCardNoticeType(type)}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-black tracking-wider uppercase transition-all',
                        cardNoticeType === type
                          ? type === 'info'
                            ? 'border-indigo-600 bg-indigo-500 text-white'
                            : type === 'warning'
                              ? 'border-amber-600 bg-amber-500 text-white'
                              : 'border-emerald-600 bg-emerald-500 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Notice Message
                  </label>
                  <textarea
                    required
                    value={cardNoticeText}
                    onChange={(e) => setCardNoticeText(e.target.value)}
                    placeholder="e.g. Action required: Please update your corporate business address details."
                    className="min-h-25 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsNoticeModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveCardNotice()}
                    disabled={isCreatingNotice || isUpdatingNotice}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                  >
                    {isNoticeSaved ? <>Notice Posted ✓</> : <>Save & Lock Notice</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: SCHEDULE GROWTH CONSULTATION */}
      {isScheduleModalOpen && selectedCard && (
        <ModalPortal>
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsScheduleModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Calendar className="h-5 w-5 text-indigo-600" /> Schedule Growth Consultation
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Book a custom growth advisory meeting or call with{' '}
                    {personalField(selectedCard.personal, 'fullName')} to optimize conversions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="shrink-0 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Discussion Medium
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Meeting Date
                    </label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Description / Notes
                  </label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="e.g. Review QR dimensions and conversion goals..."
                    className="min-h-22.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveMeeting()}
                    disabled={isCreatingMeeting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                  >
                    {isMeetingSaved ? (
                      <>Meeting Scheduled ✓</>
                    ) : isCreatingMeeting ? (
                      <>Booking…</>
                    ) : (
                      <>Book Discussion</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel || 'Delete'}
          variant={confirmState.variant || 'danger'}
          overlayClassName="z-10000"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

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
              setNoticeCard(null)
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
            setNoticeCard(null)
            notify.success('Notice cleared.')
          })()
        }}
      />
    </div>
  )
}
