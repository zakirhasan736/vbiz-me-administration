'use client'

import { ModalPortal } from '@/components/ModalPortal'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { meetingScopeLabel } from '@/lib/meetingScope'
import { MEETING_SCOPES, MEETING_TYPES, type Meeting, type MeetingScope, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import { Calendar, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export type ScheduleMeetingSubmitPayload = {
  scope: MeetingScope
  owner: ProfileOwnerSelection | null
  groupProfileIds?: string[]
  companyUserId?: string | null
  type: MeetingType | string
  date: string
  time: string
  notes: string
  globalHost?: string
}

export type ScheduleMeetingModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ScheduleMeetingSubmitPayload) => Promise<Meeting | void>
  isSubmitting?: boolean
  initialOwner?: ProfileOwnerSelection | null
  lockOwner?: boolean
  allowedScopes?: MeetingScope[]
  defaultScope?: MeetingScope
  groupProfileIds?: string[]
  groupCompanyUserId?: string | null
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
  allowedScopes = ['global', 'one_to_one', 'group'],
  defaultScope,
  groupProfileIds = [],
  groupCompanyUserId = null,
  initialDate,
  initialTime = '10:00 AM',
  initialType = 'Growth Meeting',
  initialNotes = '',
  title = 'Book session',
  subtitle = 'Creates a calendar event with a meeting link, owner notification, email, and push.',
}: ScheduleMeetingModalContentProps) {
  const scopeOptions = useMemo(
    () => (lockOwner ? (['one_to_one'] as MeetingScope[]) : allowedScopes),
    [allowedScopes, lockOwner]
  )
  const initialScope = defaultScope ?? (lockOwner ? 'one_to_one' : (scopeOptions[0] ?? 'one_to_one'))

  const [scope, setScope] = useState<MeetingScope>(initialScope)
  const [owner, setOwner] = useState<ProfileOwnerSelection | null>(initialOwner)
  const [globalHost, setGlobalHost] = useState('vBiz Team')
  const [includeTeamGroup, setIncludeTeamGroup] = useState(Boolean(groupProfileIds.length || groupCompanyUserId))
  const [meetType, setMeetType] = useState<MeetingType | string>(initialType)
  const [meetDate, setMeetDate] = useState(initialDate || todayIsoDate())
  const [meetTime, setMeetTime] = useState(initialTime)
  const [meetNotes, setMeetNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)

  const handleScopeChange = (option: MeetingScope) => {
    setScope(option)
    if (option === 'one_to_one' && initialOwner) setOwner(initialOwner)
  }

  const canSubmit =
    scope === 'global'
      ? globalHost.trim().length > 0
      : scope === 'one_to_one'
        ? Boolean(owner)
        : Boolean(owner) || Boolean(groupProfileIds.length)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    const created = await onSubmit({
      scope,
      owner: scope === 'global' ? null : owner,
      groupProfileIds:
        scope === 'group'
          ? includeTeamGroup && groupCompanyUserId
            ? undefined
            : groupProfileIds.length
              ? groupProfileIds
              : owner
                ? [owner.profileId]
                : []
          : undefined,
      companyUserId: scope === 'group' && includeTeamGroup ? groupCompanyUserId || null : null,
      type: meetType,
      date: meetDate,
      time: meetTime,
      notes: meetNotes.trim() || 'Advisory consultation session.',
      globalHost: scope === 'global' ? globalHost.trim() : undefined,
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
          className="animate-in zoom-in-95 relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]"
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
            {scopeOptions.length > 1 ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Schedule type
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {scopeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleScopeChange(option)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition',
                        scope === option
                          ? 'border-teal-500 bg-teal-50 text-teal-800 dark:border-teal-400/40 dark:bg-teal-500/10 dark:text-teal-200'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                      )}
                    >
                      {meetingScopeLabel(option)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {scope === 'global' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Host label</label>
                <input
                  value={globalHost}
                  onChange={(e) => setGlobalHost(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none dark:border-white/10 dark:bg-[#101826] dark:text-white"
                />
                <p className="text-[11px] text-slate-400">Broadcasts to all card owners on the platform.</p>
              </div>
            ) : lockOwner && owner ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Card owner</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{owner.hostName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{owner.identity}</p>
              </div>
            ) : (
              <ProfileOwnerPicker
                value={owner}
                onChange={setOwner}
                label={scope === 'group' ? 'Primary card / team anchor' : 'Owner / host'}
                listClassName="max-h-40"
                required
              />
            )}

            {scope === 'group' && !lockOwner ? (
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <input
                  type="checkbox"
                  checked={includeTeamGroup}
                  onChange={(e) => setIncludeTeamGroup(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Include every card under the selected corporate account when a team anchor is chosen.
                </span>
              </label>
            ) : null}

            {scope === 'group' && groupProfileIds.length ? (
              <p className="text-[11px] text-slate-400">
                Group session covers {groupProfileIds.length} selected team card
                {groupProfileIds.length === 1 ? '' : 's'}.
              </p>
            ) : null}

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
              {scope === 'global'
                ? 'Global sessions notify every card owner. They are not tied to a single card.'
                : scope === 'group'
                  ? 'Group sessions notify only the cards included in the group.'
                  : 'One-to-one sessions notify only the selected card owner.'}
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
              disabled={isSubmitting || !canSubmit}
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
    rest.defaultScope ?? '',
    rest.initialDate ?? '',
    rest.initialTime ?? '',
    rest.initialType ?? '',
    rest.initialNotes ?? '',
    ...(rest.groupProfileIds ?? []),
  ].join('|')

  return <ScheduleMeetingModalContent key={formKey} {...rest} />
}

export { MEETING_SCOPES }
