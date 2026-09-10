'use client'

import { CreateCrmEventModal, type CreateCrmEventSubmitPayload } from '@/components/crm/CreateCrmEventModal'
import { ModalPortal } from '@/components/ModalPortal'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildCreateCrmEventPayload } from '@/lib/buildCreateCrmEventPayload'
import { isIdentitySearchReady } from '@/lib/identitySearch'
import { meetingScopeLabel } from '@/lib/meetingScope'
import { notify } from '@/lib/toast/toast'
import {
  useCreateCrmEventMutation,
  useDeleteCrmEventMutation,
  useGetCrmEventsQuery,
  useUpdateCrmEventMutation,
} from '@/redux/features/crm/crm.api'
import type { CrmEvent, CrmEventAttachment, CrmEventStatus } from '@/types/crmEvent'
import type { MeetingScope } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  CalendarHeart,
  Check,
  Clock,
  FileAudio,
  Image as ImageIcon,
  Maximize2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function statusTone(status: string) {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
  if (status === 'Cancelled') return 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
  return 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
}

function ImageAttachmentLightbox({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-200 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={fileName || 'Image preview'}
      >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{fileName || 'Image'}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close image preview"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-3 dark:bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={fileName} className="max-h-[min(75vh,720px)] w-auto max-w-full object-contain" />
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

function AttachmentPreview({ item }: { item: CrmEventAttachment }) {
  const [imageOpen, setImageOpen] = useState(false)
  const type =
    item.resourceType ||
    (item.mimeType?.startsWith('video/')
      ? 'video'
      : item.mimeType?.startsWith('audio/')
        ? 'audio'
        : item.mimeType?.startsWith('image/')
          ? 'image'
          : null)

  if (type === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setImageOpen(true)}
          className="relative block w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 text-left transition hover:opacity-95 dark:border-white/10"
          aria-label={`Preview ${item.fileName || 'image'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.fileName} className="h-28 w-full object-cover" />
          <span
            className="pointer-events-none absolute right-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950/70 text-white shadow-sm backdrop-blur-[1px]"
            aria-hidden
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </button>
        {imageOpen ? (
          <ImageAttachmentLightbox url={item.url} fileName={item.fileName} onClose={() => setImageOpen(false)} />
        ) : null}
      </>
    )
  }

  if (type === 'video') {
    return (
      <video
        controls
        className="h-36 w-full rounded-xl border border-slate-200 bg-black dark:border-white/10"
        src={item.url}
      >
        <track kind="captions" />
      </video>
    )
  }

  if (type === 'audio') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <p className="mb-2 flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <FileAudio className="h-3.5 w-3.5" /> {item.fileName}
        </p>
        <audio controls className="w-full" src={item.url}>
          <track kind="captions" />
        </audio>
      </div>
    )
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"
    >
      <ImageIcon className="h-3.5 w-3.5" /> {item.fileName}
    </a>
  )
}

export type CrmEventsBoardProps = {
  cardPicker?: 'admin' | 'own'
  personSearch?: boolean
  allowedScopes?: MeetingScope[]
  defaultScope?: MeetingScope
  focusEventId?: string | null
  onFocusConsumed?: () => void
}

export function CrmEventsBoard({
  cardPicker = 'admin',
  personSearch = true,
  allowedScopes,
  defaultScope = 'one_to_one',
  focusEventId = null,
  onFocusConsumed,
}: CrmEventsBoardProps) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const [appliedFocusEventId, setAppliedFocusEventId] = useState<string | null>(null)
  const { data, isLoading, isError, error } = useGetCrmEventsQuery({ limit: 100 })
  const [createEvent, { isLoading: isCreating }] = useCreateCrmEventMutation()
  const [updateEvent, { isLoading: isUpdating }] = useUpdateCrmEventMutation()
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteCrmEventMutation()

  if (focusEventId !== appliedFocusEventId) {
    setAppliedFocusEventId(focusEventId)
    if (focusEventId) setHighlightedEventId(focusEventId)
  }

  useEffect(() => {
    if (!focusEventId) return
    onFocusConsumed?.()
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`crm-event-${focusEventId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusEventId]) // eslint-disable-line react-hooks/exhaustive-deps -- consume once per focus id

  useEffect(() => {
    if (!highlightedEventId) return
    const timer = window.setTimeout(() => setHighlightedEventId(null), 4000)
    return () => window.clearTimeout(timer)
  }, [highlightedEventId])

  const items = useMemo(() => {
    const rows = data?.items ?? []
    if (!isIdentitySearchReady(search)) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const hay = [row.type, row.host, row.date, row.time, row.status, row.scope, row.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [data?.items, search])

  const handleCreate = async (payload: CreateCrmEventSubmitPayload) => {
    try {
      const body = buildCreateCrmEventPayload(payload)
      const created = await createEvent(body).unwrap()
      notify.info('Event created. It will show on the Schedules calendar too.')
      setCreateOpen(false)
      return created
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message || '')
          : ''
      notify.error(message || 'Couldn’t create this event.')
      throw err
    }
  }

  const setStatus = async (row: CrmEvent, status: CrmEventStatus) => {
    try {
      await updateEvent({ id: row.id, body: { status } }).unwrap()
      notify.info(`Event marked ${status.toLowerCase()}.`)
    } catch {
      notify.error('Couldn’t update this event.')
    }
  }

  const handleDelete = async (row: CrmEvent) => {
    if (!window.confirm(`Delete “${row.type}” with ${row.host}?`)) return
    try {
      await deleteEvent(row.id).unwrap()
      notify.info('Event deleted.')
    } catch {
      notify.error('Couldn’t delete this event.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-rose-500 uppercase">Wish & Outreach</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Wish & outreach</h2>
          <p className="mt-1 max-w-xl text-sm font-medium text-slate-500">
            Create birthday wishes, thank-yous, and follow-ups with media. Events also appear on the Schedules calendar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black tracking-wider text-white uppercase dark:bg-rose-500"
        >
          <Plus className="h-4 w-4" /> Create Wish & outreach
        </button>
      </div>

      <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0d121c]">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by host, type, date, or status…"
          className="w-full bg-transparent text-sm font-medium outline-none dark:text-white"
        />
      </label>

      {isError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
            {error && typeof error === 'object' && 'data' in error
              ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load events.')
              : 'Couldn’t load events.'}
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#0b0f15]">
          <CalendarHeart className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            No events yet. Create a wish or outreach message to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((row) => (
            <article
              id={`crm-event-${row.id}`}
              key={row.id}
              className={cn(
                'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f15]',
                highlightedEventId === row.id &&
                  'ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-[#0b0f15]'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-900 dark:text-white">{row.type}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{row.host}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase',
                    statusTone(row.status)
                  )}
                >
                  {row.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {row.date} {row.time}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase dark:bg-white/5">
                  {meetingScopeLabel(row.scope)}
                </span>
              </div>

              {row.description?.trim() ? (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {row.description.trim()}
                </p>
              ) : null}

              {row.attachments?.length ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Attachments ({row.attachments.length})
                  </p>
                  <div className="grid gap-2">
                    {row.attachments.map((item, index) => (
                      <AttachmentPreview key={`${item.url}-${index}`} item={item} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-[11px] font-medium text-slate-400">No attachments</p>
              )}

              {row.status === 'Scheduled' ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void setStatus(row, 'Completed')}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black tracking-wider text-emerald-800 uppercase dark:bg-emerald-500/15 dark:text-emerald-200"
                  >
                    <Check className="h-3.5 w-3.5" /> Complete
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void setStatus(row, 'Cancelled')}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black tracking-wider text-slate-600 uppercase dark:bg-white/5 dark:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(row)}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black tracking-wider text-rose-700 uppercase dark:bg-rose-500/15 dark:text-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(row)}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black tracking-wider text-rose-700 uppercase dark:bg-rose-500/15 dark:text-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <CreateCrmEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        isSubmitting={isCreating}
        cardPicker={cardPicker}
        personSearch={personSearch}
        allowedScopes={allowedScopes}
        defaultScope={defaultScope}
        onSubmit={async (payload) => {
          try {
            return await handleCreate(payload)
          } catch {
            return undefined
          }
        }}
      />
    </div>
  )
}
