'use client'

import type { ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import type { ScheduleMeetingSubmitPayload } from '@/components/admin/ScheduleMeetingModal'
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { AddCrmLeadModal } from '@/components/crm/AddCrmLeadModal'
import { CreateCrmEventModal, type CreateCrmEventSubmitPayload } from '@/components/crm/CreateCrmEventModal'
import { LeadEventsAccordion } from '@/components/crm/LeadEventsAccordion'
import { LeadNotesAccordion } from '@/components/crm/LeadNotesAccordion'
import { LeadSchedulesAccordion } from '@/components/crm/LeadSchedulesAccordion'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildCreateCrmEventPayload } from '@/lib/buildCreateCrmEventPayload'
import { isIdentitySearchReady } from '@/lib/identitySearch'
import { submitScheduleMeeting } from '@/lib/submitScheduleMeeting'
import { notify } from '@/lib/toast/toast'
import {
  useCreateCrmEventMutation,
  useCreateCrmLeadMutation,
  useDeleteCrmLeadMutation,
  useGetCrmDashboardQuery,
  useGetCrmLeadsQuery,
  type CrmLeadRow,
  type LeadEventRow,
  type LeadScheduleRow,
} from '@/redux/features/crm/crm.api'
import { useCreateMeetingMutation } from '@/redux/features/meetings/meetings.api'
import { cn } from '@/utils/cn'
import { getVCardPublicPath } from '@/utils/vcard'
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarHeart,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  IdCard,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Plus,
  Search,
  StickyNote,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'

const PAGE_SIZE = 50

function appendUnique(prev: CrmLeadRow[], next: CrmLeadRow[]) {
  if (!next.length) return prev
  const seen = new Set(prev.map((row) => row.id))
  const fresh = next.filter((row) => !seen.has(row.id))
  return fresh.length ? [...prev, ...fresh] : prev
}

function digitsPhone(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function initials(name: string) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '?'
  )
}

function ownerFromLead(lead: CrmLeadRow): ProfileOwnerSelection {
  return {
    profileId: lead.vCardId,
    hostName: lead.vCardName || lead.ownerName || 'vCard Owner',
    ownerEmails: [],
    identity: [lead.vCardSlug && `/${lead.vCardSlug}`, lead.ownerName].filter(Boolean).join(' · '),
  }
}

/** Event mail goes to the lead/guest when they have an email; card remains the profile scope. */
function eventRecipientFromLead(lead: CrmLeadRow): ProfileOwnerSelection {
  const guestEmail = lead.email?.trim().toLowerCase()
  return {
    profileId: lead.vCardId,
    hostName: lead.fullName?.trim() || lead.vCardName || lead.ownerName || 'Guest',
    ownerEmails: guestEmail ? [guestEmail] : [],
    identity: [lead.vCardName || lead.vCardSlug, guestEmail || lead.phoneNumber].filter(Boolean).join(' · '),
  }
}

export function CrmLeadsPanel({
  onOpenScheduleItem,
  onOpenEventItem,
}: {
  onOpenScheduleItem?: (item: LeadScheduleRow) => void
  onOpenEventItem?: (item: LeadEventRow) => void
} = {}) {
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState('')
  const [accum, setAccum] = useState<CrmLeadRow[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [scheduleLead, setScheduleLead] = useState<CrmLeadRow | null>(null)
  const [eventLead, setEventLead] = useState<CrmLeadRow | null>(null)
  const [notesLeadId, setNotesLeadId] = useState<string | null>(null)
  const [schedulesLeadId, setSchedulesLeadId] = useState<string | null>(null)
  const [eventsLeadId, setEventsLeadId] = useState<string | null>(null)
  const [detailsLeadId, setDetailsLeadId] = useState<string | null>(null)
  const [pendingDeleteLead, setPendingDeleteLead] = useState<CrmLeadRow | null>(null)
  const expandedPanelRef = useRef<HTMLDivElement>(null)

  const listQuery = useMemo(
    () => ({
      skip,
      limit: PAGE_SIZE,
      ...(isIdentitySearchReady(search) ? { q: search.trim() } : {}),
    }),
    [skip, search]
  )

  const { data: dashboard } = useGetCrmDashboardQuery()
  const { data: page, isLoading, isFetching, isError, error } = useGetCrmLeadsQuery(listQuery)
  const [createLead, { isLoading: isCreating }] = useCreateCrmLeadMutation()
  const [deleteLead, { isLoading: isDeleting }] = useDeleteCrmLeadMutation()
  const [createMeeting, { isLoading: isScheduling }] = useCreateMeetingMutation()
  const [createCrmEvent, { isLoading: isCreatingEvent }] = useCreateCrmEventMutation()

  const expandedLeadId = notesLeadId || schedulesLeadId || eventsLeadId || detailsLeadId

  useEffect(() => {
    if (!expandedLeadId) return

    const scrollExpandedIntoView = () => {
      expandedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
    }

    // After layout paint, then once more in case async accordion content grows.
    const frame = window.requestAnimationFrame(() => {
      scrollExpandedIntoView()
    })
    const retry = window.setTimeout(scrollExpandedIntoView, 180)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [expandedLeadId])

  const rows = useMemo(() => {
    const items = page?.items ?? []
    if (skip === 0) return items
    return appendUnique(accum, items)
  }, [skip, accum, page?.items])

  const total = page?.total ?? dashboard?.metrics.openLeads ?? rows.length
  const hasMore = Boolean(page?.hasMore ?? rows.length < total)

  const loadMore = () => {
    if (page?.items?.length) {
      setAccum((prev) => (skip === 0 ? page.items : appendUnique(prev, page.items)))
    }
    setSkip((prev) => prev + PAGE_SIZE)
  }

  const handleCreate = async (payload: {
    fullName: string
    email?: string
    phone?: string
    notes?: string
    profileId: string
  }) => {
    try {
      await createLead(payload).unwrap()
      notify.info('Lead saved. It stays in CRM only — not on your card dashboard.')
      setSkip(0)
      setAccum([])
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? String((error as { data?: { message?: string } }).data?.message || '')
          : ''
      notify.error(message || 'Couldn’t save this lead. Please try again.')
      throw error
    }
  }

  const handleSchedule = async (payload: ScheduleMeetingSubmitPayload) => {
    const created = await submitScheduleMeeting(createMeeting, {
      ...payload,
      guestUserDataId: scheduleLead?.id ?? payload.guestUserDataId ?? null,
    })
    notify.info('You’re booked. A meeting link will be included when it’s ready.')
    setScheduleLead(null)
    return created
  }

  const handleCreateEvent = async (payload: CreateCrmEventSubmitPayload) => {
    try {
      const body = buildCreateCrmEventPayload({
        ...payload,
        guestUserDataId: eventLead?.id ?? payload.guestUserDataId ?? null,
      })
      const created = await createCrmEvent(body).unwrap()
      notify.info('Event created. It will show on Schedules and Wish & Outreach.')
      setEventLead(null)
      return created
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? String((error as { data?: { message?: string } }).data?.message || '')
          : ''
      notify.error(message || 'Couldn’t create this event.')
      throw error
    }
  }

  const closeAccordions = () => {
    setNotesLeadId(null)
    setSchedulesLeadId(null)
    setEventsLeadId(null)
    setDetailsLeadId(null)
  }

  const handleDeleteLead = async () => {
    if (!pendingDeleteLead) return
    try {
      await deleteLead(pendingDeleteLead.id).unwrap()
      notify.info('Lead deleted.')
      if (detailsLeadId === pendingDeleteLead.id) setDetailsLeadId(null)
      if (notesLeadId === pendingDeleteLead.id) setNotesLeadId(null)
      if (schedulesLeadId === pendingDeleteLead.id) setSchedulesLeadId(null)
      if (eventsLeadId === pendingDeleteLead.id) setEventsLeadId(null)
      setPendingDeleteLead(null)
      setSkip(0)
      setAccum([])
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? String((error as { data?: { message?: string } }).data?.message || '')
          : ''
      notify.error(message || 'Couldn’t delete this lead.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="All leads" value={dashboard?.metrics.openLeads} />
        <MetricCard label="New this week" value={dashboard?.metrics.newLeads} />
        <MetricCard label="Added by you" value={dashboard?.metrics.externalLeads} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0d121c]">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setSkip(0)
              setAccum([])
            }}
            placeholder="Search name, email, phone, or card…"
            className="w-full bg-transparent text-sm font-medium outline-none dark:text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black tracking-wider text-white uppercase dark:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f15]">
        {isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
              {error && typeof error === 'object' && 'data' in error
                ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load CRM leads.')
                : 'Couldn’t load CRM leads.'}
            </p>
          </div>
        ) : isLoading && skip === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              No leads yet. Add someone here — external leads stay in CRM and won’t appear on your card dashboard.
            </p>
          </div>
        ) : (
          <div className="max-w-full min-w-0 space-y-3 overflow-x-hidden p-3 sm:p-4">
            {rows.map((lead) => {
              const phone = digitsPhone(lead.phoneNumber || '')
              const email = lead.email?.trim()
              const notesOpen = notesLeadId === lead.id
              const schedulesOpen = schedulesLeadId === lead.id
              const eventsOpen = eventsLeadId === lead.id
              const detailsOpen = detailsLeadId === lead.id
              return (
                <article
                  key={lead.id}
                  className={cn(
                    'max-w-full min-w-0 overflow-hidden rounded-2xl border transition-all duration-200',
                    detailsOpen
                      ? 'border-emerald-300/70 bg-emerald-50/30 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/6'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/2 dark:hover:border-white/20'
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-3 p-3.5 sm:p-5">
                    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3 lg:max-w-[min(100%,22rem)] lg:flex-none">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-sm shadow-emerald-600/20 sm:h-12 sm:w-12">
                          {initials(lead.fullName)}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                            <h4 className="max-w-full text-[14px] font-black tracking-tight wrap-break-word text-slate-900 sm:text-[15px] dark:text-white">
                              {lead.fullName}
                            </h4>
                            <span
                              className={cn(
                                'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                                lead.consent
                                  ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : 'border-amber-200/70 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                              )}
                            >
                              {lead.consent ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" /> Consented
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3" /> No consent
                                </>
                              )}
                            </span>
                            {lead.origin === 'crm_external' ? (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase dark:bg-indigo-500/15 dark:text-indigo-300">
                                Added by you
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            {email ? (
                              <a
                                href={`mailto:${email}`}
                                className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-indigo-600 sm:text-[12.5px] dark:text-slate-300 dark:hover:text-indigo-400"
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                <span className="truncate">{email}</span>
                              </a>
                            ) : (
                              <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-400 sm:text-[12.5px]">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                <span className="truncate">No email</span>
                              </span>
                            )}
                            {phone ? (
                              <a
                                href={`tel:${phone}`}
                                className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-emerald-600 sm:text-[12.5px] dark:text-slate-300 dark:hover:text-emerald-400"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span className="whitespace-nowrap">{lead.phoneNumber}</span>
                              </a>
                            ) : (
                              <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-slate-400 sm:text-[12.5px]">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span className="whitespace-nowrap">No phone</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.vCardName || lead.vCardSlug || 'vCard'}</span>
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatWhen(lead.submittedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-start lg:min-w-0 lg:flex-1 lg:justify-end">
                        <ActionLink href={phone ? `tel:${phone}` : undefined} label="Call" icon={Phone} />
                        <ActionLink href={email ? `mailto:${email}` : undefined} label="Email" icon={Mail} />
                        <ActionLink href={phone ? `sms:${phone}` : undefined} label="Text" icon={MessageSquare} />
                        <button
                          type="button"
                          onClick={() => {
                            if (schedulesOpen) {
                              setSchedulesLeadId(null)
                              return
                            }
                            closeAccordions()
                            setSchedulesLeadId(lead.id)
                          }}
                          aria-expanded={schedulesOpen}
                          aria-label={
                            schedulesOpen
                              ? 'Collapse schedules'
                              : `Expand schedules${(lead.schedulesCount ?? 0) > 0 ? `, ${lead.schedulesCount} schedules` : ''}`
                          }
                          className={cn(
                            'relative inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black tracking-wider uppercase transition',
                            schedulesOpen
                              ? 'bg-teal-100 text-teal-900 dark:bg-teal-500/25 dark:text-teal-100'
                              : 'bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200'
                          )}
                        >
                          {(lead.schedulesCount ?? 0) > 0 ? (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[9px] leading-none font-black text-white dark:bg-teal-400 dark:text-teal-950">
                              {(lead.schedulesCount ?? 0) > 99 ? '99+' : lead.schedulesCount}
                            </span>
                          ) : null}
                          <Calendar className="h-3.5 w-3.5" /> Schedule
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 origin-center transition-transform duration-300 ease-in-out will-change-transform',
                              schedulesOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (eventsOpen) {
                              setEventsLeadId(null)
                              return
                            }
                            closeAccordions()
                            setEventsLeadId(lead.id)
                          }}
                          aria-expanded={eventsOpen}
                          aria-label={
                            eventsOpen
                              ? 'Collapse wish and outreach'
                              : `Expand wish and outreach${(lead.eventsCount ?? 0) > 0 ? `, ${lead.eventsCount} items` : ''}`
                          }
                          className={cn(
                            'relative inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black tracking-wider uppercase transition',
                            eventsOpen
                              ? 'bg-rose-100 text-rose-900 dark:bg-rose-500/25 dark:text-rose-100'
                              : 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
                          )}
                        >
                          {(lead.eventsCount ?? 0) > 0 ? (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] leading-none font-black text-white dark:bg-rose-400 dark:text-rose-950">
                              {(lead.eventsCount ?? 0) > 99 ? '99+' : lead.eventsCount}
                            </span>
                          ) : null}
                          <CalendarHeart className="h-3.5 w-3.5 shrink-0" /> Wish & Outreach
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 origin-center transition-transform duration-300 ease-in-out will-change-transform',
                              eventsOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (notesOpen) {
                              setNotesLeadId(null)
                              return
                            }
                            closeAccordions()
                            setNotesLeadId(lead.id)
                          }}
                          aria-expanded={notesOpen}
                          aria-label={
                            notesOpen
                              ? 'Collapse notes'
                              : `Expand notes${(lead.notesCount ?? 0) > 0 ? `, ${lead.notesCount} notes` : ''}`
                          }
                          className={cn(
                            'relative inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black tracking-wider uppercase transition',
                            notesOpen
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                          )}
                        >
                          {(lead.notesCount ?? 0) > 0 ? (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[9px] leading-none font-black text-white dark:bg-amber-400 dark:text-amber-950">
                              {(lead.notesCount ?? 0) > 99 ? '99+' : lead.notesCount}
                            </span>
                          ) : null}
                          <StickyNote className="h-3.5 w-3.5" /> Notes
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 origin-center transition-transform duration-300 ease-in-out will-change-transform',
                              notesOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid w-full min-w-0 grid-cols-[1fr_auto] gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (detailsOpen) {
                            setDetailsLeadId(null)
                            return
                          }
                          closeAccordions()
                          setDetailsLeadId(lead.id)
                        }}
                        aria-expanded={detailsOpen}
                        aria-label={detailsOpen ? 'Hide lead details' : 'Show lead details'}
                        className={cn(
                          'inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-xl px-2.5 py-2.5 text-[10px] font-black tracking-wider uppercase transition-colors sm:text-[11px]',
                          detailsOpen
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                        )}
                      >
                        {detailsOpen ? (
                          <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        {detailsOpen ? 'Hide' : 'Details'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteLead(lead)}
                        className="shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                        title="Delete lead"
                        aria-label="Delete lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {detailsOpen ? (
                    <div
                      ref={expandedPanelRef}
                      className="animate-in fade-in slide-in-from-top-2 min-w-0 space-y-3 overflow-x-hidden border-t border-emerald-100/60 bg-white/60 px-3.5 pt-0 pb-4 sm:space-y-4 sm:px-5 sm:pb-5 dark:border-emerald-500/15 dark:bg-black/10"
                    >
                      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-2.5">
                        <MetaChip icon={Mail} label="Email" value={lead.email} />
                        <MetaChip icon={Phone} label="Phone" value={lead.phoneNumber} />
                        <MetaChip icon={IdCard} label="Source card" value={lead.vCardName || lead.vCardSlug} />
                        <MetaChip icon={Calendar} label="Saved at" value={formatWhen(lead.submittedAt)} />
                        <MetaChip
                          icon={Monitor}
                          label="Device"
                          value={`${lead.metadata?.device || '—'} · ${lead.metadata?.browser || '—'}`}
                        />
                        <MetaChip icon={MapPin} label="Location" value={lead.metadata?.approximateLocation || '—'} />
                        <MetaChip icon={Globe} label="Referrer" value={lead.metadata?.referrer || 'Direct'} />
                        <MetaChip icon={User} label="Owner" value={lead.ownerName || lead.ownerId} />
                      </div>
                      {lead.vCardSlug ? (
                        <a
                          href={getVCardPublicPath(lead.vCardSlug)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400"
                        >
                          Open source card <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  {notesOpen ? (
                    <div
                      ref={expandedPanelRef}
                      className="animate-in fade-in slide-in-from-top-2 origin-top px-3.5 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5"
                    >
                      <LeadNotesAccordion
                        leadId={lead.id}
                        profileId={lead.vCardId}
                        onCollapse={() => setNotesLeadId(null)}
                      />
                    </div>
                  ) : null}

                  {schedulesOpen ? (
                    <div
                      ref={expandedPanelRef}
                      className="animate-in fade-in slide-in-from-top-2 origin-top px-3.5 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5"
                    >
                      <LeadSchedulesAccordion
                        leadId={lead.id}
                        onCollapse={() => setSchedulesLeadId(null)}
                        onCreate={() => setScheduleLead(lead)}
                        onOpenItem={(item) => onOpenScheduleItem?.(item)}
                      />
                    </div>
                  ) : null}

                  {eventsOpen ? (
                    <div
                      ref={expandedPanelRef}
                      className="animate-in fade-in slide-in-from-top-2 origin-top px-3.5 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5"
                    >
                      <LeadEventsAccordion
                        leadId={lead.id}
                        onCollapse={() => setEventsLeadId(null)}
                        onCreate={() => setEventLead(lead)}
                        onOpenItem={(item) => onOpenEventItem?.(item)}
                      />
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
        {hasMore ? (
          <div className="border-t border-slate-100 p-4 dark:border-white/5">
            <button
              type="button"
              onClick={loadMore}
              disabled={isFetching}
              className="w-full rounded-2xl bg-slate-100 py-2.5 text-[11px] font-black tracking-wider text-slate-600 uppercase dark:bg-white/5 dark:text-slate-300"
            >
              {isFetching ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </div>

      <AddCrmLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        isSubmitting={isCreating}
        onSubmit={handleCreate}
      />

      <ScheduleMeetingModal
        open={Boolean(scheduleLead)}
        onClose={() => setScheduleLead(null)}
        isSubmitting={isScheduling}
        lockOwner
        initialOwner={scheduleLead ? ownerFromLead(scheduleLead) : null}
        allowedScopes={['one_to_one']}
        defaultScope="one_to_one"
        initialNotes={scheduleLead ? `Follow-up with ${scheduleLead.fullName}` : ''}
        title="Book a time"
        subtitle="We’ll add this to the calendar and include a meeting link."
        onSubmit={async (payload) => {
          try {
            return await handleSchedule(payload)
          } catch {
            return undefined
          }
        }}
      />

      <CreateCrmEventModal
        open={Boolean(eventLead)}
        onClose={() => setEventLead(null)}
        isSubmitting={isCreatingEvent}
        lockOwner
        initialOwner={eventLead ? eventRecipientFromLead(eventLead) : null}
        allowedScopes={['one_to_one']}
        defaultScope="one_to_one"
        initialType="Follow-up Message"
        title="Create event"
        subtitle="Wish or outreach for this lead — attachments optional."
        onSubmit={async (payload) => {
          try {
            return await handleCreateEvent(payload)
          } catch {
            return undefined
          }
        }}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteLead)}
        title="Delete this lead?"
        description={
          pendingDeleteLead
            ? `Permanently delete “${pendingDeleteLead.fullName}”? This cannot be undone.`
            : 'Permanently delete this lead? This cannot be undone.'
        }
        confirmLabel="Delete"
        variant="danger"
        icon={Trash2}
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteLead()}
        onCancel={() => {
          if (!isDeleting) setPendingDeleteLead(null)
        }}
      />
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
      <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : '—'}
      </p>
    </div>
  )
}

function ActionLink({ href, label, icon: Icon }: { href?: string; label: string; icon: typeof Phone }) {
  const className = cn(
    'inline-flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black tracking-wider uppercase',
    href
      ? 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200'
      : 'cursor-not-allowed bg-slate-50 text-slate-300 dark:bg-white/5 dark:text-slate-600'
  )
  if (!href) {
    return (
      <span className={className} aria-disabled>
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
    )
  }
  return (
    <a href={href} className={className}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  )
}

function MetaChip({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/4">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
        <Icon className="h-3 w-3 shrink-0" /> {label}
      </p>
      <p className="text-sm leading-snug font-bold break-all text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}
