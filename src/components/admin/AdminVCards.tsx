'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import VCardTeamCard from '@/components/admin/AdminDirectoryVCardTeamCard'
import VCardDetailSidebar, { VCardTrendsPopup } from '@/components/admin/AdminVCardDetailSidebar'
import VCardQrModal from '@/components/admin/AdminVCardQrModal'
import { CardLifecycleTabs } from '@/components/dashboard/vcard/CardLifecycleTabs'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import { useAppSelector } from '@/hooks/redux'
import { useVCard } from '@/lib/admin/AdminVCardListContext'
import { resolveDirectoryBadge } from '@/lib/admin/adminCardBadge'
import { type AdminCard } from '@/lib/admin/adminCardShape'
import { mapAdminProfileRowToCard } from '@/lib/admin/mapAdminProfileRow'
import { appendAuditLog } from '@/lib/mockStore'
import { notifyCardOwner } from '@/lib/notifications'
import { notify } from '@/lib/toast/toast'
import { buildEditorSectionPath, buildEditorSettingsPath } from '@/lib/vcardEditorRoutes'
import {
  exportAdminProfilesCsv,
  useGetAdminProfileFiltersQuery,
  useGetAdminProfilesQuery,
} from '@/redux/features/adminProfiles/adminProfiles.api'
import { useCreateMeetingMutation } from '@/redux/features/meetings/meetings.api'
import { useDeleteProfileMutation } from '@/redux/features/profiles/profiles.api'
import { MEETING_TYPES, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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

function uniqueSlugSuffix(): string {
  return String(Date.now()).slice(-4)
}

const PAGE_SIZE = 20

export default function AdminVCards() {
  const { updateCorporateCardControls, createCorporateCard, setCurrentEditingCardId } = useVCard()
  const router = useRouter()
  const token = useAppSelector((s) => s.user.token)
  const [deleteProfile] = useDeleteProfileMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [professionFilter, setProfessionFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [lifecycleTab, setLifecycleTab] = useState<'active' | 'draft'>('active')
  const [page, setPage] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const listTopRef = useRef<HTMLDivElement>(null)
  const skipPageScrollRef = useRef(true)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false
      return
    }
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      profession: professionFilter !== 'All' ? professionFilter : undefined,
      lifecycle: lifecycleTab,
      skip: showAll ? 0 : page * PAGE_SIZE,
      limit: PAGE_SIZE,
      showAll,
    }),
    [debouncedQ, statusFilter, professionFilter, lifecycleTab, page, showAll]
  )

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    refetch: refetchList,
  } = useGetAdminProfilesQuery(listQuery)

  const { data: filterOptions } = useGetAdminProfileFiltersQuery()
  const { data: activeMeta } = useGetAdminProfilesQuery({ lifecycle: 'active', limit: 1, skip: 0 })
  const { data: draftMeta } = useGetAdminProfilesQuery({ lifecycle: 'draft', limit: 1, skip: 0 })
  const activeCount = activeMeta?.total ?? 0
  const draftCount = draftMeta?.total ?? 0

  const cards = useMemo(() => {
    const mapped = (listData?.items || []).map(mapAdminProfileRowToCard)
    // Keep Active / Draft tabs mutually exclusive even if API cache is stale
    return mapped.filter((c) => (lifecycleTab === 'draft' ? Boolean(c.isDraft) : !c.isDraft))
  }, [listData?.items, lifecycleTab])

  const total = listData?.total ?? 0
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE))

  const [panelCard, setPanelCard] = useState<AdminCard | null>(null)
  const [selectedCard, setSelectedCard] = useState<AdminCard | null>(null)
  const [trendsCard, setTrendsCard] = useState<AdminCard | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')

  const openQrModal = (url: string, name?: string) => {
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const openPanel = (card: AdminCard) => {
    setPanelCard(card)
    setCardNoticeText(localStorage.getItem(`notice_${card.id}`) || '')
    setCardNoticeType(localStorage.getItem(`notice_type_${card.id}`) || 'info')
  }

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCallPadOpen, setIsCallPadOpen] = useState(false)
  const [callDigits, setCallDigits] = useState('')

  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const [cardNoticeText, setCardNoticeText] = useState('')
  const [cardNoticeType, setCardNoticeType] = useState('info')
  const [isNoticeSaved, setIsNoticeSaved] = useState(false)

  const [meetingType, setMeetingType] = useState<MeetingType>('Growth Meeting')
  const [meetingDate, setMeetingDate] = useState('2026-08-04')
  const [meetingTime, setMeetingTime] = useState('10:00 AM')
  const [isMeetingSaved, setIsMeetingSaved] = useState(false)
  const [createMeeting, { isLoading: isCreatingMeeting }] = useCreateMeetingMutation()

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  const resetListState = (opts?: { keepPage?: boolean }) => {
    if (!opts?.keepPage) setPage(0)
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
      void refetchList()
    } catch (err) {
      console.error('Batch delete failed:', err)
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
    setSelectedCard(card)
    setCardNoticeText(localStorage.getItem(`notice_${card.id}`) || '')
    setCardNoticeType(localStorage.getItem(`notice_type_${card.id}`) || 'info')
    setIsNoticeModalOpen(true)
  }

  const handleDuplicateCard = async (card: AdminCard) => {
    try {
      const uniqueSuffix = uniqueSlugSuffix()
      const fullName = personalField(card.personal, 'fullName') || 'Member'
      await createCorporateCard({
        slug: `${card.slug || 'card'}-${uniqueSuffix}`,
        personal: {
          ...card.personal,
          fullName: `${fullName} (Copy)`,
        },
        services: card.services,
        portfolio: card.portfolio,
        socials: card.socials,
      })
      appendAuditLog({
        action: 'Duplicated Card Profile',
        details: `Admin duplicated ${fullName} → ${card.slug}-${uniqueSuffix}`,
        type: 'create',
      })
      void refetchList()
    } catch (e) {
      console.error(e)
      notify.info('Error duplicating card.')
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
    } catch (err) {
      console.error('Export failed:', err)
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
    } catch (err) {
      console.error('Batch export failed:', err)
      notify.info('Error exporting CSV data.')
    }
  }

  const handleToggleStatus = async (card: AdminCard, targetStatus: string) => {
    await updateCorporateCardControls(card.id, {
      status: targetStatus as 'active' | 'inactive' | 'suspended',
    })
    setSelectedCard((prev) => (prev ? { ...prev, status: targetStatus } : null))
    setPanelCard((prev) => (prev && prev.id === card.id ? { ...prev, status: targetStatus } : prev))

    appendAuditLog({
      action: 'Card Status Override',
      details: `Modified ${personalField(card.personal, 'fullName')}'s account status to ${targetStatus.toUpperCase()}`,
      type: 'status',
    })
    void refetchList()
  }

  const handleSaveCardNotice = () => {
    if (!selectedCard) return
    const ownerName = personalField(selectedCard.personal, 'fullName')
    localStorage.setItem(`notice_${selectedCard.id}`, cardNoticeText)
    localStorage.setItem(`notice_type_${selectedCard.id}`, cardNoticeType)
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
    if (cardNoticeText.trim()) {
      const ownerAudience =
        selectedCard.ownerRole === 'corporate-owner' || selectedCard.companyUserRole === 'corporate-owner'
          ? 'corporate'
          : 'single'
      notifyCardOwner({
        ownerAudience,
        category: 'system',
        title: 'Card-specific announcement',
        body: `[${cardNoticeType.toUpperCase()}] ${ownerName}: ${cardNoticeText.trim().slice(0, 120)}`,
        profileId: selectedCard.id,
        forceBrowser: true,
      })
    }
  }

  const handleSaveMeeting = async () => {
    if (!selectedCard || isCreatingMeeting) return
    const hostName = personalField(selectedCard.personal, 'fullName') || 'vCard Owner'
    try {
      await createMeeting({
        host: hostName,
        type: meetingType,
        date: meetingDate,
        time: meetingTime,
        status: 'Scheduled',
        profileId: selectedCard.id || null,
      }).unwrap()

      setIsMeetingSaved(true)
      setTimeout(() => {
        setIsMeetingSaved(false)
        setIsScheduleModalOpen(false)
      }, 1500)

      const ownerAudience =
        selectedCard.ownerRole === 'corporate-owner' || selectedCard.companyUserRole === 'corporate-owner'
          ? 'corporate'
          : 'single'
      notifyCardOwner({
        ownerAudience,
        category: 'event',
        title: 'Card schedule booked',
        body: `${meetingType} with ${hostName} on ${meetingDate} at ${meetingTime}`,
        profileId: selectedCard.id,
        forceBrowser: true,
      })
    } catch {
      /* keep modal open */
    }
  }

  // Handle Email Mock Dispatch
  const handleSendEmail = () => {
    if (!selectedCard) return
    setIsEmailSent(true)
    setTimeout(() => {
      setIsEmailSent(false)
      setIsEmailModalOpen(false)
      setEmailSubject('')
      setEmailBody('')
    }, 1500)

    appendAuditLog({
      action: 'Direct Email Dispatched',
      details: `Sent direct notification of growth to ${personalField(selectedCard.personal, 'email')}: ${emailSubject}`,
      type: 'update',
    })
  }

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
                setLifecycleTab(tab)
                resetListState()
              }}
              activeCount={activeCount}
              draftCount={draftCount}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => void handleFilteredExport()}
            disabled={isExporting || total === 0}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <CreateCardLauncher>
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
              setSearchQuery(e.target.value)
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
              setProfessionFilter(e.target.value)
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
              setStatusFilter(e.target.value)
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
            setSearchQuery('')
            setProfessionFilter('All')
            setStatusFilter('All')
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

      <div className="flex items-center gap-3 px-2 pt-2 pb-2">
        <input
          type="checkbox"
          checked={selectedCardIds.length === cards.length && cards.length > 0}
          onChange={handleSelectAll}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
        />
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Select All Cards</span>
      </div>

      {isListError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-300">
          Could not load platform cards.{' '}
          <button type="button" className="underline" onClick={() => void refetchList()}>
            Retry
          </button>
        </div>
      )}

      {isListLoading ? (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="min-h-87.5 animate-pulse rounded-[28px] bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, i) => {
            const contactSaves = Number(card.saveCount || 0)
            const badge = resolveDirectoryBadge(card)

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
                onCardClick={() => openPanel(card)}
                onTrends={() => setTrendsCard(card)}
                onEmail={() => openEmailForCard(card)}
                onCall={() => openCallForCard(card)}
                onSchedule={() => openScheduleForCard(card)}
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
                onDuplicate={() => handleDuplicateCard(card)}
                onDeleted={async (id) => {
                  setSelectedCardIds((prev) => prev.filter((x) => x !== id))
                  if (panelCard?.id === id) setPanelCard(null)
                  if (trendsCard?.id === id) setTrendsCard(null)
                  notify.info('Card deleted successfully.')
                  void refetchList()
                }}
              />
            )
          })}

          {!isListLoading && cards.length === 0 && (
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

          <CreateCardLauncher>
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
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-2 sm:flex-row sm:items-center dark:border-white/5">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase select-none">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => {
              setShowAll(e.target.checked)
              resetListState()
            }}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          Show all cards
        </label>

        {!showAll && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Page {Math.min(page + 1, totalPages)} of {totalPages} · {total} total
            </span>
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => {
                setPage((p) => Math.max(0, p - 1))
                resetListState({ keepPage: true })
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                setPage((p) => p + 1)
                resetListState({ keepPage: true })
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {showAll && <span className="text-xs font-semibold text-slate-500">Showing all {total} matching cards</span>}
      </div>

      <VCardDetailSidebar
        card={panelCard}
        mode="admin"
        onClose={() => setPanelCard(null)}
        onEmail={openEmailForCard}
        onCall={openCallForCard}
        onSchedule={openScheduleForCard}
        onNotice={openNoticeForCard}
        onDuplicate={handleDuplicateCard}
        onToggleStatus={handleToggleStatus}
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
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
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
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEmailModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                <Mail className="h-5 w-5 text-indigo-600" /> Email vCard Owner
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Dispatches direct instructions or growth analytics notifications to{' '}
                {personalField(selectedCard.personal, 'fullName')}.
              </p>

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
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95"
                  >
                    {isEmailSent ? (
                      <>Email Dispatched ✓</>
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
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsNoticeModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                <ShieldAlert className="h-5 w-5 text-indigo-600" /> Card Specific Backoffice Notice
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                This notice is specifically displayed in {personalField(selectedCard.personal, 'fullName')}&apos;s user
                backoffice dashboard.
              </p>

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
                    onClick={handleSaveCardNotice}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95"
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
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsScheduleModalOpen(false)}
            ></div>

            <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                <Calendar className="h-5 w-5 text-indigo-600" /> Schedule Growth Consultation
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Book a custom growth advisory meeting or call with {personalField(selectedCard.personal, 'fullName')} to
                optimize conversions.
              </p>

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
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
