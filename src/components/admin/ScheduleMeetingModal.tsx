'use client'

import { ModalPortal } from '@/components/ModalPortal'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { MEETING_TYPES, type Meeting, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import { Calendar, Loader2, X } from 'lucide-react'
import { useState } from 'react'

export type ScheduleMeetingModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: {
    owner: ProfileOwnerSelection
    type: MeetingType | string
    date: string
    time: string
    notes: string
  }) => Promise<Meeting | void>
  isSubmitting?: boolean
  initialOwner?: ProfileOwnerSelection | null
  lockOwner?: boolean
  initialDate?: string
  initialTime?: string
  initialType?: MeetingType | string
  initialNotes?: string
  title?: string
  subtitle?: string
}

function todayIsoDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type ScheduleMeetingModalContentProps = Omit<ScheduleMeetingModalProps, 'open'>

function ScheduleMeetingModalContent({
  onClose,
  onSubmit,
  isSubmitting = false,
  initialOwner = null,
  lockOwner = false,
  initialDate,
  initialTime = '10:00 AM',
  initialType = 'Growth Meeting',
  initialNotes = '',
  title = 'Book session',
  subtitle = 'Creates a calendar event with a Zoho Meeting link, owner notification, email, and push.',
}: ScheduleMeetingModalContentProps) {
  const [owner, setOwner] = useState<ProfileOwnerSelection | null>(initialOwner)
  const [meetType, setMeetType] = useState<MeetingType | string>(initialType)
  const [meetDate, setMeetDate] = useState(initialDate || todayIsoDate())
  const [meetTime, setMeetTime] = useState(initialTime)
  const [meetNotes, setMeetNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!owner || isSubmitting) return
    const created = await onSubmit({
      owner,
      type: meetType,
      date: meetDate,
      time: meetTime,
      notes: meetNotes.trim() || 'Advisory consultation session.',
    })
    if (created) {
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1200)
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]"
        >
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,_rgba(13,148,136,0.08),_transparent_50%)] px-6 py-5 dark:border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
                  <Calendar className="h-3.5 w-3.5" /> Schedule
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
                {subtitle ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            {lockOwner && owner ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Card owner</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{owner.hostName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{owner.identity}</p>
              </div>
            ) : (
              <ProfileOwnerPicker
                value={owner}
                onChange={setOwner}
                label="Owner / host"
                listClassName="max-h-40"
                required
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Session type</label>
                <select
                  value={meetType}
                  onChange={(e) => setMeetType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:border-white/10 dark:bg-[#101826] dark:text-white"
                >
                  {MEETING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={meetDate}
                  onChange={(e) => setMeetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:border-white/10 dark:bg-[#101826] dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Time</label>
                <input
                  type="text"
                  required
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:border-white/10 dark:bg-[#101826] dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Notes</label>
              <textarea
                value={meetNotes}
                onChange={(e) => setMeetNotes(e.target.value)}
                placeholder="Agenda, goals, or context for this session…"
                className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-[#101826] dark:text-white"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              A Zoho Calendar event and meeting link are created automatically. The owner receives push, email, and
              backoffice notice.
            </p>
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:border-white/10 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !owner}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-semibold tracking-wide text-white uppercase disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950'
              )}
            >
              {saved ? (
                'Scheduled ✓'
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                </>
              ) : (
                'Book session'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  )
}

export function ScheduleMeetingModal({ open, ...rest }: ScheduleMeetingModalProps) {
  if (!open) return null

  const formKey = [
    rest.initialOwner?.profileId ?? '',
    rest.initialDate ?? '',
    rest.initialTime ?? '',
    rest.initialType ?? '',
    rest.initialNotes ?? '',
  ].join('|')

  return <ScheduleMeetingModalContent key={formKey} {...rest} />
}
