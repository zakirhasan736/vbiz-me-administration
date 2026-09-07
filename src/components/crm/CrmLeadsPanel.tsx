'use client'

import type { ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import type { ScheduleMeetingSubmitPayload } from '@/components/admin/ScheduleMeetingModal'
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal'
import { AddCrmLeadModal } from '@/components/crm/AddCrmLeadModal'
import { CreateCrmEventModal, type CreateCrmEventSubmitPayload } from '@/components/crm/CreateCrmEventModal'
import { LeadNotesAccordion } from '@/components/crm/LeadNotesAccordion'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildCreateCrmEventPayload } from '@/lib/buildCreateCrmEventPayload'
import { isIdentitySearchReady } from '@/lib/identitySearch'
import { submitScheduleMeeting } from '@/lib/submitScheduleMeeting'
import { notify } from '@/lib/toast/toast'
import {
  type CrmLeadRow,
  useCreateCrmEventMutation,
  useCreateCrmLeadMutation,
  useGetCrmDashboardQuery,
  useGetCrmLeadsQuery,
} from '@/redux/features/crm/crm.api'
import { useCreateMeetingMutation } from '@/redux/features/meetings/meetings.api'
import { cn } from '@/utils/cn'
import {
  Calendar,
  CalendarHeart,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  StickyNote,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'

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

export function CrmLeadsPanel() {
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState('')
  const [accum, setAccum] = useState<CrmLeadRow[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [scheduleLead, setScheduleLead] = useState<CrmLeadRow | null>(null)
  const [eventLead, setEventLead] = useState<CrmLeadRow | null>(null)
  const [notesLeadId, setNotesLeadId] = useState<string | null>(null)

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
  const [createMeeting, { isLoading: isScheduling }] = useCreateMeetingMutation()
  const [createCrmEvent, { isLoading: isCreatingEvent }] = useCreateCrmEventMutation()

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
    const created = await submitScheduleMeeting(createMeeting, payload)
    notify.info('You’re booked. A meeting link will be included when it’s ready.')
    setScheduleLead(null)
    return created
  }

  const handleCreateEvent = async (payload: CreateCrmEventSubmitPayload) => {
    try {
      const body = buildCreateCrmEventPayload(payload)
      const created = await createCrmEvent(body).unwrap()
      notify.info('Event created. It will show on Schedules and Events.')
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
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.map((lead) => {
              const phone = digitsPhone(lead.phoneNumber || '')
              const email = lead.email?.trim()
              const notesOpen = notesLeadId === lead.id
              return (
                <li key={lead.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{lead.fullName}</p>
                        {lead.origin === 'crm_external' ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase dark:bg-indigo-500/15 dark:text-indigo-300">
                            Added by you
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {lead.vCardName || lead.vCardSlug || 'Card'} · {formatWhen(lead.submittedAt)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                        {[lead.phoneNumber, lead.email].filter(Boolean).join(' · ') || 'No contact details'}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
                      <ActionLink href={phone ? `tel:${phone}` : undefined} label="Call" icon={Phone} />
                      <ActionLink href={email ? `mailto:${email}` : undefined} label="Email" icon={Mail} />
                      <ActionLink href={phone ? `sms:${phone}` : undefined} label="Text" icon={MessageSquare} />
                      <button
                        type="button"
                        onClick={() => setScheduleLead(lead)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-teal-50 px-2.5 py-2 text-[10px] font-black tracking-wider text-teal-800 uppercase dark:bg-teal-500/15 dark:text-teal-200"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventLead(lead)}
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-rose-50 px-2.5 py-2 text-[10px] font-black tracking-wider text-rose-800 uppercase dark:bg-rose-500/15 dark:text-rose-200"
                      >
                        <CalendarHeart className="h-3.5 w-3.5" /> Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotesLeadId(notesOpen ? null : lead.id)}
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
                  {notesOpen ? (
                    <div className="animate-in fade-in slide-in-from-top-2 origin-top duration-300 ease-in-out">
                      <LeadNotesAccordion
                        leadId={lead.id}
                        profileId={lead.vCardId}
                        onCollapse={() => setNotesLeadId(null)}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
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
