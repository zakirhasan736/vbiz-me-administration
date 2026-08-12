'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { notifyOwners } from '@/lib/notifications'
import {
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
  useUpdateMeetingMutation,
} from '@/redux/features/meetings/meetings.api'
import { MEETING_TYPES, type Meeting, type MeetingStatus, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import { Calendar, CheckCircle2, Clock, ExternalLink, Plus, Search, Trash2, X, XCircle } from 'lucide-react'
import React, { useMemo, useState } from 'react'

function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AdminSchedule() {
  const { data, isLoading, isError } = useGetMeetingsQuery({ limit: 100 })
  const [createMeeting, { isLoading: isCreating }] = useCreateMeetingMutation()
  const [updateMeeting] = useUpdateMeetingMutation()
  const [deleteMeeting] = useDeleteMeetingMutation()

  const [searchQuery, setSearchQuery] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [owner, setOwner] = useState<ProfileOwnerSelection | null>(null)
  const [meetType, setMeetType] = useState<MeetingType>('Growth Meeting')
  const [meetDate, setMeetDate] = useState(todayIsoDate())
  const [meetTime, setMeetTime] = useState('10:00 AM')
  const [meetNotes, setMeetNotes] = useState('')
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const handleUpdateStatus = async (id: string, nextStatus: MeetingStatus) => {
    try {
      await updateMeeting({ id, body: { status: nextStatus } }).unwrap()
    } catch {
      /* RTK surfaces error via cache; keep UI quiet */
    }
  }

  const handleDeleteMeeting = (meeting: Meeting) => {
    setConfirmState({
      open: true,
      title: 'Cancel scheduled discussion?',
      description: `Cancel and remove scheduled discussion with ${meeting.host}?`,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteMeeting(meeting.id).unwrap()
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!owner || isCreating) return

    try {
      const created = await createMeeting({
        host: owner.hostName,
        type: meetType,
        date: meetDate,
        time: meetTime,
        notes: meetNotes.trim() || 'Advisory consultation session.',
        status: 'Scheduled',
        profileId: owner.profileId,
      }).unwrap()

      setIsAddOpen(false)
      setOwner(null)
      setMeetNotes('')

      const meetSuffix = created.meetLink ? ` · Meet: ${created.meetLink}` : ''
      notifyOwners({
        category: 'event',
        title: 'New admin event scheduled',
        body: `${meetType} with ${owner.hostName} on ${meetDate} at ${meetTime}${meetSuffix}`,
        forceBrowser: true,
      })
    } catch {
      /* keep modal open on failure */
    }
  }

  const filteredMeetings = useMemo(() => {
    const meetings = data?.items ?? []
    const q = searchQuery.toLowerCase()
    return meetings.filter(
      (m) =>
        m.host.toLowerCase().includes(q) ||
        String(m.type).toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q)
    )
  }, [data?.items, searchQuery])

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Calendar className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Schedules & Meetings Manager
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Track planned onboarding, telephone discussions, and conversion growth advisory sessions.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 self-start rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-[0.98] md:self-auto"
        >
          <Plus className="h-4 w-4" /> Book New Discussion
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 md:flex-row dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-3 md:flex-1 dark:border-white/5 dark:bg-slate-800/50">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter scheduled discussions by card owner name or meeting medium..."
            className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none dark:text-white"
          />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-indigo-500" /> Scheduled Portfolio Growth Sessions
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Dispatched timeline tracking calendar interactions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm font-semibold text-slate-400">Loading schedules…</div>
        ) : isError ? (
          <div className="py-16 text-center text-sm font-semibold text-rose-500">Failed to load schedules.</div>
        ) : filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className={cn(
                  'flex flex-col justify-between space-y-4 rounded-3xl border p-5',
                  mtg.status === 'Completed'
                    ? 'border-slate-200/50 bg-slate-50/50 dark:border-white/5 dark:bg-[#0e1424]/40'
                    : 'border-indigo-500/15 bg-indigo-500/5 dark:bg-indigo-500/10'
                )}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                        {mtg.type}
                      </span>
                      <h4 className="mt-1 text-base font-black text-slate-900 dark:text-white">
                        Discussion with {mtg.host}
                      </h4>
                    </div>

                    <span
                      className={cn(
                        'rounded-lg border px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                        mtg.status === 'Completed'
                          ? 'border-emerald-500/10 bg-emerald-500/15 text-emerald-600'
                          : mtg.status === 'Cancelled'
                            ? 'border-rose-500/10 bg-rose-500/15 text-rose-600'
                            : 'animate-pulse border-indigo-500/10 bg-indigo-500/15 text-indigo-600'
                      )}
                    >
                      {mtg.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" /> {mtg.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-slate-400" /> {mtg.time}
                    </span>
                    {mtg.meetLink ? (
                      <a
                        href={mtg.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Google Meet
                      </a>
                    ) : null}
                  </div>

                  {mtg.notes ? (
                    <p className="mt-3 text-xs leading-relaxed font-semibold text-slate-400">{mtg.notes}</p>
                  ) : null}
                </div>

                <div className="flex gap-2 border-t border-slate-200/40 pt-4 dark:border-white/5">
                  {mtg.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => void handleUpdateStatus(mtg.id, 'Completed')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[10px] font-black tracking-wider text-white uppercase hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
                      </button>
                      <button
                        onClick={() => void handleUpdateStatus(mtg.id, 'Cancelled')}
                        className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        title="Cancel Meeting"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteMeeting(mtg)}
                    className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-100"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm font-semibold text-slate-400">
            No scheduled discussions match the filters.
          </div>
        )}
      </div>

      {isAddOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />

            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Calendar className="h-5 w-5 shrink-0 text-indigo-600" /> Book Growth Discussion
                  </h2>
                  <p className="mt-1 font-sans text-xs font-semibold text-slate-400">
                    Schedule a phone call, growth meeting, or dynamic digital onboarding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleAddSubmit(e)} className="mt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Discussion Medium
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as MeetingType)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <ProfileOwnerPicker value={owner} onChange={setOwner} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Date</label>
                    <input
                      type="date"
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      required
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Discussion Notes / Targets
                  </label>
                  <textarea
                    value={meetNotes}
                    onChange={(e) => setMeetNotes(e.target.value)}
                    placeholder="e.g. Reviewing custom QR display dimensions..."
                    className="min-h-22.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !owner}
                    className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                  >
                    {isCreating ? 'Saving…' : 'Save Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
