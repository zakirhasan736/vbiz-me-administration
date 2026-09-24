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

function cardsLabel(lead: CrmLeadRow): string {
  const cards = lead.cards?.filter((card) => card.profileId) ?? []
  if (cards.length > 1) {
    return cards.map((card) => card.name || card.slug || 'Card').join(' · ')
  }
  if (cards.length === 1) return cards[0].name || cards[0].slug || 'Card'
  return lead.vCardName || lead.vCardSlug || 'Card'
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
    <div className="space-y-3 sm:space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <MetricCard label="All leads" value={dashboard?.metrics.openLeads} />
        <MetricCard label="New week" value={dashboard?.metrics.newLeads} />
        <MetricCard label="By you" value={dashboard?.metrics.externalLeads} />
      </div>

      <div className="sticky top-14 z-10 -mx-3 space-y-2.5 border-b border-slate-200/70 bg-[#f4f6f9]/95 px-3 py-2.5 backdrop-blur-md sm:static sm:mx-0 sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-white/5 dark:bg-[#070a12]/95 sm:dark:bg-transparent">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm sm:gap-3 sm:px-4 sm:shadow-none dark:border-white/10 dark:bg-[#0d121c]">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setSkip(0)
                setAccum([])
              }}
              placeholder="Search leads…"
              className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-[12px] font-black tracking-wider text-white uppercase shadow-lg shadow-slate-950/15 active:scale-[0.98] sm:w-auto sm:py-3 sm:shadow-none dark:bg-indigo-500 dark:shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" /> Add lead
          </button>
        </div>
      </div>

      <div className="sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-slate-200/80 sm:bg-white dark:sm:border-white/10 dark:sm:bg-[#0b0f15]">
        {isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-12 text-center sm:rounded-none sm:border-0 sm:bg-transparent dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
              {error && typeof error === 'object' && 'data' in error
                ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load CRM leads.')
                : 'Couldn’t load CRM leads.'}
            </p>
          </div>
        ) : isLoading && skip === 0 ? (
          <div className="space-y-3 sm:p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full rounded-3xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center sm:rounded-none sm:border-0 dark:border-white/10 dark:bg-[#0b0f15]">
            <UserPlus className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              No leads yet. Add someone here — external leads stay in CRM and won’t appear on your card dashboard.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'max-w-full min-w-0 space-y-3 overflow-x-hidden sm:space-y-3 sm:p-4',
              isFetching && 'opacity-70'
            )}
          >
            {rows.map((lead) => {
              const phone = digitsPhone(lead.phoneNumber || '')
              const email = lead.email?.trim()
              const notesOpen = notesLeadId === lead.id
              const schedulesOpen = schedulesLeadId === lead.id
              const eventsOpen = eventsLeadId === lead.id
              const detailsOpen = detailsLeadId === lead.id
              const multiCards = (lead.cards?.length ?? 0) > 1
              const preview = lead.guestMessage?.trim() || lead.lastReply?.trim() || lead.privateNotes?.trim() || ''
              const anyOpen = notesOpen || schedulesOpen || eventsOpen || detailsOpen
              return (
                <article
                  key={lead.id}
                  className={cn(
                    'max-w-full min-w-0 overflow-hidden rounded-3xl border bg-white shadow-[0_8px_30px_-18px_rgba(15,23,42,0.35)] transition-all duration-200 dark:bg-[#0d121c]',
                    anyOpen
                      ? 'border-teal-300/80 ring-1 ring-teal-500/20 dark:border-teal-500/40'
                      : 'border-slate-200/80 dark:border-white/10'
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-3.5 p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-[13px] font-black text-white shadow-md shadow-teal-600/25">
                        {initials(lead.fullName)}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-[15px] font-black tracking-tight text-slate-900 dark:text-white">
                              {lead.fullName}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                                  lead.consent
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                )}
                              >
                                {lead.consent ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" /> Active
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3" /> No consent
                                  </>
                                )}
                              </span>
                              {lead.origin === 'crm_external' ? (
                                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase dark:bg-indigo-500/15 dark:text-indigo-300">
                                  Added by you
                                </span>
                              ) : (
                                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-sky-700 uppercase dark:bg-sky-500/15 dark:text-sky-300">
                                  Card save
                                </span>
                              )}
                              {multiCards ? (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                                  {lead.cards!.length} cards
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[10px] font-semibold whitespace-nowrap text-slate-400">
                              {formatWhen(lead.submittedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteLead(lead)}
                              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:hover:bg-rose-500/10"
                              title="Delete lead"
                              aria-label="Delete lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2">
                          <IconAction
                            href={phone ? `tel:${phone}` : undefined}
                            label="Call"
                            icon={Phone}
                            tone="emerald"
                          />
                          <IconAction
                            href={phone ? `sms:${phone}` : undefined}
                            label="Text"
                            icon={MessageSquare}
                            tone="sky"
                          />
                          <IconAction
                            href={email ? `mailto:${email}` : undefined}
                            label="Email"
                            icon={Mail}
                            tone="indigo"
                          />
                          <span className="ml-1 truncate text-[11px] font-semibold text-slate-400">
                            {phone ? lead.phoneNumber : email || 'No contact'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {preview ? (
                      <p className="line-clamp-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed font-medium text-slate-500 dark:bg-white/4 dark:text-slate-400">
                        {preview}
                      </p>
                    ) : null}

                    <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{multiCards ? `Cards · ${cardsLabel(lead)}` : cardsLabel(lead)}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100/90 p-1 dark:bg-white/5">
                      <LeadTab
                        active={notesOpen}
                        count={lead.notesCount}
                        icon={StickyNote}
                        label="Notes"
                        tone="amber"
                        onClick={() => {
                          if (notesOpen) {
                            setNotesLeadId(null)
                            return
                          }
                          closeAccordions()
                          setNotesLeadId(lead.id)
                        }}
                      />
                      <LeadTab
                        active={schedulesOpen}
                        count={lead.schedulesCount}
                        icon={Calendar}
                        label="Schedule"
                        tone="teal"
                        onClick={() => {
                          if (schedulesOpen) {
                            setSchedulesLeadId(null)
                            return
                          }
                          closeAccordions()
                          setSchedulesLeadId(lead.id)
                        }}
                      />
                      <LeadTab
                        active={eventsOpen}
                        count={lead.eventsCount}
                        icon={CalendarHeart}
                        label="Wishes"
                        tone="rose"
                        onClick={() => {
                          if (eventsOpen) {
                            setEventsLeadId(null)
                            return
                          }
                          closeAccordions()
                          setEventsLeadId(lead.id)
                        }}
                      />
                      <LeadTab
                        active={detailsOpen}
                        icon={detailsOpen ? ChevronUp : ChevronDown}
                        label="Details"
                        tone="emerald"
                        onClick={() => {
                          if (detailsOpen) {
                            setDetailsLeadId(null)
                            return
                          }
                          closeAccordions()
                          setDetailsLeadId(lead.id)
                        }}
                      />
                    </div>
                  </div>

                  {detailsOpen ? (
                    <div
                      ref={expandedPanelRef}
                      className="animate-in fade-in slide-in-from-top-2 min-w-0 space-y-3 overflow-x-hidden border-t border-emerald-100/70 bg-emerald-50/40 px-4 pt-0 pb-4 sm:space-y-4 sm:px-5 sm:pb-5 dark:border-emerald-500/15 dark:bg-emerald-500/5"
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
                      className="animate-in fade-in slide-in-from-top-2 origin-top border-t border-amber-100/80 px-4 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5 dark:border-amber-500/15"
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
                      className="animate-in fade-in slide-in-from-top-2 origin-top border-t border-teal-100/80 px-4 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5 dark:border-teal-500/15"
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
                      className="animate-in fade-in slide-in-from-top-2 origin-top border-t border-rose-100/80 px-4 pb-4 duration-300 ease-in-out sm:px-5 sm:pb-5 dark:border-rose-500/15"
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
          <div className="p-1 pt-3 sm:border-t sm:border-slate-100 sm:p-4 dark:sm:border-white/5">
            <button
              type="button"
              onClick={loadMore}
              disabled={isFetching}
              className="w-full rounded-2xl bg-white py-3.5 text-[11px] font-black tracking-wider text-slate-600 uppercase shadow-sm ring-1 ring-slate-200/80 active:scale-[0.99] sm:bg-slate-100 sm:shadow-none sm:ring-0 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
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
    <div className="rounded-2xl border border-slate-200/80 bg-white px-2.5 py-3 shadow-sm sm:p-4 sm:shadow-none dark:border-white/10 dark:bg-[#0b0f19]">
      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase sm:text-[10px]">{label}</p>
      <p className="mt-1.5 text-xl font-black text-slate-900 sm:mt-2 sm:text-2xl dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : '—'}
      </p>
    </div>
  )
}

function IconAction({
  href,
  label,
  icon: Icon,
  tone,
}: {
  href?: string
  label: string
  icon: typeof Phone
  tone: 'emerald' | 'sky' | 'indigo'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
      : tone === 'sky'
        ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300'
        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
  const className = cn(
    'inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95',
    href ? toneClass : 'cursor-not-allowed bg-slate-50 text-slate-300 dark:bg-white/5 dark:text-slate-600'
  )
  if (!href) {
    return (
      <span className={className} aria-disabled aria-label={label}>
        <Icon className="h-3.5 w-3.5" />
      </span>
    )
  }
  return (
    <a href={href} className={className} aria-label={label}>
      <Icon className="h-3.5 w-3.5" />
    </a>
  )
}

function LeadTab({
  active,
  count,
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  active: boolean
  count?: number
  icon: ElementType
  label: string
  tone: 'amber' | 'teal' | 'rose' | 'emerald'
  onClick: () => void
}) {
  const activeTone =
    tone === 'amber'
      ? 'bg-white text-amber-800 shadow-sm dark:bg-amber-500/25 dark:text-amber-100'
      : tone === 'teal'
        ? 'bg-white text-teal-800 shadow-sm dark:bg-teal-500/25 dark:text-teal-100'
        : tone === 'rose'
          ? 'bg-white text-rose-800 shadow-sm dark:bg-rose-500/25 dark:text-rose-100'
          : 'bg-white text-emerald-800 shadow-sm dark:bg-emerald-500/25 dark:text-emerald-100'
  const idleTone =
    tone === 'amber'
      ? 'text-amber-700/80 dark:text-amber-300/80'
      : tone === 'teal'
        ? 'text-teal-700/80 dark:text-teal-300/80'
        : tone === 'rose'
          ? 'text-rose-700/80 dark:text-rose-300/80'
          : 'text-emerald-700/80 dark:text-emerald-300/80'
  const badgeTone =
    tone === 'amber'
      ? 'bg-amber-600 dark:bg-amber-400 dark:text-amber-950'
      : tone === 'teal'
        ? 'bg-teal-600 dark:bg-teal-400 dark:text-teal-950'
        : tone === 'rose'
          ? 'bg-rose-600 dark:bg-rose-400 dark:text-rose-950'
          : 'bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label={active ? `Collapse ${label.toLowerCase()}` : `Expand ${label.toLowerCase()}`}
      className={cn(
        'relative inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-black tracking-wider uppercase transition active:scale-[0.97]',
        active ? activeTone : idleTone
      )}
    >
      {(count ?? 0) > 0 ? (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] leading-none font-black text-white',
            badgeTone
          )}
        >
          {(count ?? 0) > 99 ? '99+' : count}
        </span>
      ) : null}
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function MetaChip({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-white/4">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
        <Icon className="h-3 w-3 shrink-0" /> {label}
      </p>
      <p className="text-sm leading-snug font-bold break-all text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  )
}
