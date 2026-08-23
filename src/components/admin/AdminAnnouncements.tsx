'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import {
  AnnouncementsLiveStatusSkeleton,
  AnnouncementsPreviewSkeleton,
  EventsCountSkeleton,
  RecentPublishesListSkeleton,
  UpcomingEventsListSkeleton,
  WarningsCountSkeleton,
  WarningsNoticesListSkeleton,
} from '@/components/admin/AdminAnnouncementsSkeleton'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { notifyOwners } from '@/lib/notifications'
import {
  useClearLiveAnnouncementMutation,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementsQuery,
  useUpdateAnnouncementMutation,
} from '@/redux/features/adminAnnouncements/adminAnnouncements.api'
import {
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
} from '@/redux/features/meetings/meetings.api'
import type { Announcement, AnnouncementType } from '@/types/announcement'
import { cn } from '@/utils/cn'
import { AlertTriangle, Bell, Calendar, Check, CheckCircle2, Clock, Info, Megaphone, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

function defaultTitle(type: AnnouncementType): string {
  if (type === 'warning') return 'Warning notice'
  if (type === 'success') return 'Success notice'
  return 'Info announcement'
}

type BannerDraft = {
  text: string
  type: AnnouncementType
  targetType: 'all' | 'specific'
}

const EMPTY_BANNER_DRAFT: BannerDraft = {
  text: '',
  type: 'info',
  targetType: 'all',
}

export default function AdminAnnouncements() {
  const [tab, setTab] = useState<'banner' | 'warnings' | 'events'>('banner')
  const { data: announcementsPage, isLoading: announcementsLoading } = useGetAnnouncementsQuery({
    limit: 100,
  })
  const [createAnnouncement, { isLoading: isPublishing }] = useCreateAnnouncementMutation()
  const [updateAnnouncement] = useUpdateAnnouncementMutation()
  const [deleteAnnouncement] = useDeleteAnnouncementMutation()
  const [clearLiveAnnouncement, { isLoading: isClearing }] = useClearLiveAnnouncementMutation()

  const { data: meetingsPage, isLoading: meetingsLoading } = useGetMeetingsQuery({ limit: 100 })
  const [createMeeting] = useCreateMeetingMutation()
  const [deleteMeeting] = useDeleteMeetingMutation()
  const meetings = useMemo(() => meetingsPage?.items ?? [], [meetingsPage?.items])

  const history = useMemo(() => announcementsPage?.items ?? [], [announcementsPage?.items])
  const liveAnnouncement = useMemo(() => history.find((n) => n.status === 'active') ?? null, [history])

  const [bannerDraft, setBannerDraft] = useState<BannerDraft | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [onlyBackoffice, setOnlyBackoffice] = useState(false)
  const [bannerOwner, setBannerOwner] = useState<ProfileOwnerSelection | null>(null)

  const announcementText = bannerDraft?.text ?? liveAnnouncement?.body ?? ''
  const announcementType = bannerDraft?.type ?? liveAnnouncement?.type ?? 'info'
  const announcementTargetType = bannerDraft?.targetType ?? liveAnnouncement?.targetType ?? 'all'

  const patchBannerDraft = (patch: Partial<BannerDraft>) => {
    setBannerDraft({
      text: bannerDraft?.text ?? liveAnnouncement?.body ?? '',
      type: bannerDraft?.type ?? liveAnnouncement?.type ?? 'info',
      targetType: bannerDraft?.targetType ?? liveAnnouncement?.targetType ?? 'all',
      ...patch,
    })
  }

  const [eventTitle, setEventTitle] = useState('')
  const [eventOwner, setEventOwner] = useState<ProfileOwnerSelection | null>(null)
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('10:00 AM')
  const [eventNotes, setEventNotes] = useState('')
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const warnings = useMemo(
    () =>
      history
        .filter((n) => n.kind === 'warning' || n.type === 'warning')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [history]
  )

  const noticeFeed = useMemo(
    () => [...history].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [history]
  )

  const upcomingMeetings = useMemo(
    () => meetings.filter((m) => m.status === 'Scheduled').sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [meetings]
  )

  const handlePushBanner = async () => {
    setFormError(null)
    const body = announcementText.trim()
    if (!body) {
      try {
        await clearLiveAnnouncement().unwrap()
        setBannerDraft(EMPTY_BANNER_DRAFT)
        setBannerOwner(null)
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      } catch {
        setFormError('Failed to clear the live banner.')
      }
      return
    }

    if (announcementTargetType === 'specific') {
      if (!bannerOwner) {
        setFormError('Select the card owner who should receive this announcement.')
        return
      }
      if (!bannerOwner.ownerEmails.length) {
        setFormError('This card does not have a linked owner login email.')
        return
      }
    }

    try {
      const created = await createAnnouncement({
        type: announcementType,
        kind: announcementType === 'warning' ? 'warning' : 'announcement',
        title: defaultTitle(announcementType),
        body,
        status: 'active',
        targetType: announcementTargetType,
        targetEmails: announcementTargetType === 'specific' ? bannerOwner?.ownerEmails || [] : [],
        meta: {
          ...(onlyBackoffice ? {} : { showPublic: '1', sendPush: '1' }),
          ...(announcementTargetType === 'specific' && bannerOwner ? { profileId: bannerOwner.profileId } : {}),
        },
      }).unwrap()

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)

      notifyOwners({
        category: 'system',
        title: announcementType === 'warning' ? 'Admin warning notice' : 'Admin announcement',
        body: `[${announcementType.toUpperCase()}] ${created.body.slice(0, 140)}`,
        forceBrowser: true,
      })
    } catch {
      setFormError('Failed to publish announcement. Please try again.')
    }
  }

  const handleClearBanner = async () => {
    setFormError(null)
    try {
      await clearLiveAnnouncement().unwrap()
      setBannerDraft(EMPTY_BANNER_DRAFT)
      setBannerOwner(null)
    } catch {
      setFormError('Failed to clear the live banner.')
    }
  }

  const handleArchiveNotice = async (id: string) => {
    try {
      await updateAnnouncement({ id, body: { status: 'archived' } }).unwrap()
    } catch {
      /* ignore */
    }
  }

  const handleDeleteNotice = (notice: Announcement) => {
    setConfirmState({
      open: true,
      title: 'Delete notice?',
      description: `Permanently delete “${notice.title}”?`,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteAnnouncement(notice.id).unwrap()
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!eventOwner || !eventDate || !eventType.trim() || !eventTitle.trim()) return

    try {
      const created = await createMeeting({
        host: eventOwner.hostName,
        type: eventType.trim(),
        date: eventDate,
        time: eventTime,
        notes: eventNotes || eventTitle.trim() || 'Upcoming admin event',
        status: 'Scheduled',
        profileId: eventOwner.profileId,
      }).unwrap()

      const meetSuffix = created.meetLink ? ` · Meet: ${created.meetLink}` : ''
      notifyOwners({
        category: 'event',
        title: eventTitle.trim(),
        body: `${eventType.trim()} with ${eventOwner.hostName} on ${eventDate} at ${eventTime}${meetSuffix}`,
        forceBrowser: true,
      })

      setEventTitle('')
      setEventOwner(null)
      setEventType('')
      setEventNotes('')
    } catch {
      /* keep form values */
    }
  }

  const handleCancelMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id)
    if (!target) return
    setConfirmState({
      open: true,
      title: 'Cancel event?',
      description: `Cancel event with ${target.host}?`,
      onConfirm: () => {
        void (async () => {
          try {
            await deleteMeeting(id).unwrap()
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const hasLiveBanner = Boolean(liveAnnouncement)

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-4 duration-300 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-end dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <Megaphone className="h-7 w-7 text-indigo-500" />
            Global Announcements
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Manage live banners, warning notices, and upcoming events for single and corporate owners.
          </p>
        </div>
        {announcementsLoading ? (
          <AnnouncementsLiveStatusSkeleton />
        ) : hasLiveBanner ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-300">
            <Bell className="h-3.5 w-3.5" /> Banner live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:bg-white/10">
            No live banner
          </span>
        )}
      </div>

      <div className="flex w-full gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
        {(
          [
            { id: 'banner' as const, label: 'Live Banner', icon: Megaphone },
            { id: 'warnings' as const, label: 'Warnings & Notices', icon: AlertTriangle },
            { id: 'events' as const, label: 'Upcoming Events', icon: Calendar },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-[11px] font-black tracking-wider uppercase transition-all md:flex-row md:gap-2 md:px-4',
              tab === t.id
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-500'
            )}
          >
            <t.icon className="h-4 w-4 shrink-0" />
            <span className="text-center leading-tight md:text-left">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'banner' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-7 dark:border-white/10 dark:bg-[#0b0f19]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Push global banner</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                Shown on single and corporate owner dashboards. Owners also get an inbox notification.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Banner type</label>
              <div className="flex gap-2">
                {(['info', 'warning', 'success'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => patchBannerDraft({ type })}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[10px] font-black tracking-wider uppercase transition-all',
                      announcementType === type
                        ? type === 'info'
                          ? 'border-indigo-600 bg-indigo-500 text-white'
                          : type === 'warning'
                            ? 'border-amber-600 bg-amber-500 text-white'
                            : 'border-emerald-600 bg-emerald-500 text-white'
                        : 'border-slate-200/60 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-slate-900'
                    )}
                  >
                    {type === 'info' && <Info className="h-3.5 w-3.5" />}
                    {type === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
                    {type === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Target audience</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patchBannerDraft({ targetType: 'all' })}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-[10px] font-black tracking-wider uppercase',
                    announcementTargetType === 'all'
                      ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200/60 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-slate-900'
                  )}
                >
                  All users
                </button>
                <button
                  type="button"
                  onClick={() => patchBannerDraft({ targetType: 'specific' })}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-[10px] font-black tracking-wider uppercase',
                    announcementTargetType === 'specific'
                      ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200/60 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-slate-900'
                  )}
                >
                  Specific card owner
                </button>
              </div>
              {announcementTargetType === 'specific' && (
                <ProfileOwnerPicker
                  value={bannerOwner}
                  onChange={(owner) => {
                    setBannerOwner(owner)
                    setFormError(null)
                  }}
                  label="Select card owner"
                  listClassName="max-h-56"
                  includeDrafts
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Announcement text</label>
              <textarea
                value={announcementText}
                onChange={(e) => patchBannerDraft({ text: e.target.value })}
                placeholder="Platform upgrade notice, warning, or promotional banner…"
                className="min-h-30 w-full resize-none rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:border-white/5 dark:bg-slate-900"
              />
            </div>

            <div className="flex gap-3">
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={onlyBackoffice} onChange={(e) => setOnlyBackoffice(e.target.checked)} />
                <span className="text-[11px] font-semibold">Only backoffice</span>
              </label>
            </div>

            {formError && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formError}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPublishing || isClearing}
                onClick={() => void handlePushBanner()}
                className="flex min-w-40 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-[10px] font-black tracking-wider text-white uppercase hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Published
                  </>
                ) : isPublishing ? (
                  'Publishing…'
                ) : (
                  'Save & push live'
                )}
              </button>
              <button
                type="button"
                disabled={isClearing || isPublishing}
                onClick={() => void handleClearBanner()}
                className="rounded-xl bg-slate-100 px-4 py-3 text-[10px] font-black tracking-wider text-slate-600 uppercase disabled:opacity-60 dark:bg-white/10 dark:text-slate-300"
              >
                {isClearing ? 'Clearing…' : 'Clear banner'}
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div
              className={cn(
                'rounded-[28px] border p-5',
                announcementType === 'warning'
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                  : announcementType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10'
              )}
            >
              <p className="mb-2 text-[10px] font-black tracking-wider text-slate-500 uppercase">Preview</p>
              {announcementsLoading ? (
                <AnnouncementsPreviewSkeleton />
              ) : (
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {announcementText.trim() || 'Your banner preview will appear here…'}
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
              <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">Recent publishes</h3>
              <div className="max-h-70 space-y-2 overflow-y-auto">
                {announcementsLoading ? (
                  <RecentPublishesListSkeleton />
                ) : noticeFeed.length === 0 ? (
                  <p className="py-6 text-center text-xs font-semibold text-slate-400">No notices published yet</p>
                ) : (
                  noticeFeed.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                            n.type === 'warning' && 'bg-amber-500/15 text-amber-600',
                            n.type === 'info' && 'bg-indigo-500/15 text-indigo-600',
                            n.type === 'success' && 'bg-emerald-500/15 text-emerald-600'
                          )}
                        >
                          {n.type}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {n.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'warnings' && (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-white/5">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                Warnings & notice history
              </h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                Archived and active warning/info publishes from the live banner.
              </p>
            </div>
            {announcementsLoading ? (
              <WarningsCountSkeleton />
            ) : (
              <span className="inline-flex shrink-0 items-center self-start rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] leading-none font-black tracking-wider whitespace-nowrap text-amber-600 uppercase">
                {warnings.length} warnings
              </span>
            )}
          </div>
          {announcementsLoading ? (
            <WarningsNoticesListSkeleton />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {noticeFeed.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-slate-400">
                  No warnings or notices yet — publish from Live Banner.
                </p>
              ) : (
                noticeFeed.map((n) => (
                  <div key={n.id} className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                            n.type === 'warning' && 'bg-amber-500/15 text-amber-600',
                            n.type === 'info' && 'bg-indigo-500/15 text-indigo-600',
                            n.type === 'success' && 'bg-emerald-500/15 text-emerald-600'
                          )}
                        >
                          {n.type}
                        </span>
                        <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                          {n.status}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{n.body}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {n.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => void handleArchiveNotice(n.id)}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black tracking-wider text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(n)}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        aria-label="Delete notice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={(e) => void handleCreateEvent(e)}
            className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-5 dark:border-white/10 dark:bg-[#0b0f19]"
          >
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Plus className="h-4 w-4 text-indigo-500" />
                Create upcoming event
              </h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                Notifies single and corporate owners when published.
              </p>
            </div>
            <input
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/5 dark:bg-slate-900"
            />
            <ProfileOwnerPicker
              value={eventOwner}
              onChange={setEventOwner}
              label="Host / owner"
              listClassName="max-h-40"
            />
            <input
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="Event type"
              className="w-full rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/5 dark:bg-slate-900"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/5 dark:bg-slate-900"
              />
              <input
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/5 dark:bg-slate-900"
              />
            </div>
            <textarea
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              placeholder="Notes for owners…"
              className="min-h-20 w-full resize-none rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-xs font-semibold outline-none dark:border-white/5 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={!eventOwner}
              className="w-full rounded-xl bg-indigo-600 py-3 text-[10px] font-black tracking-wider text-white uppercase hover:bg-indigo-700 disabled:opacity-60"
            >
              Publish upcoming event
            </button>
          </form>

          <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-7 dark:border-white/10 dark:bg-[#0b0f19]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Clock className="h-4 w-4 shrink-0 text-indigo-500" />
                Upcoming events
              </h2>
              {meetingsLoading ? (
                <EventsCountSkeleton />
              ) : (
                <span className="inline-flex shrink-0 items-center self-start rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] leading-none font-black tracking-wider whitespace-nowrap text-indigo-600 uppercase">
                  {upcomingMeetings.length} scheduled
                </span>
              )}
            </div>
            <div className="space-y-3 overflow-y-auto">
              {meetingsLoading ? (
                <UpcomingEventsListSkeleton />
              ) : upcomingMeetings.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-slate-400">No upcoming events scheduled</p>
              ) : (
                upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4 sm:flex-row sm:items-center dark:bg-indigo-500/10"
                  >
                    <div>
                      <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                        {m.type}
                      </p>
                      <p className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">{m.host}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {m.date} · {m.time}
                        {m.notes ? ` · ${m.notes}` : ''}
                        {m.meetLink ? (
                          <>
                            {' · '}
                            <a
                              href={m.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              Google Meet
                            </a>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelMeeting(m.id)}
                      className="self-start rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black tracking-wider text-rose-600 uppercase dark:bg-rose-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.title.includes('Delete') ? 'Delete' : 'Cancel event'}
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
