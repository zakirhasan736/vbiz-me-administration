'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { OneOnOneScheduleModal } from '@/components/admin/OneOnOneScheduleModal'
import type { OneOnOneRequest, Propose1On1SlotsPayload } from '@/redux/features/oneOnOne/oneOnOne.api'
import {
  useCancelOneOnOneMeetingMutation,
  useCompleteOneOnOneMeetingMutation,
  useListOpenOneOnOneRequestsQuery,
  useScheduleOneOnOneMeetingMutation,
} from '@/redux/features/oneOnOne/oneOnOne.api'
import { cn } from '@/utils/cn'
import { Clock } from 'lucide-react'
import { useState } from 'react'

type Props = {
  className?: string
}

function formatWhen(startAt: string, timezone: string) {
  try {
    const d = new Date(startAt)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
    })
  } catch {
    return startAt
  }
}

function statusLabel(request: OneOnOneRequest) {
  if (request.meeting) return formatWhen(request.meeting.startAt, request.meeting.timezone)
  if (request.status === 'awaiting_guest') {
    const count = request.slots?.length ?? 0
    return count > 0 ? `Awaiting guest · ${count} option${count === 1 ? '' : 's'} sent` : 'Awaiting guest pick'
  }
  if (request.status === 'open') return 'Awaiting proposed times'
  return request.status
}

export function OneOnOneRequestsPanel({ className }: Props) {
  const { data, isLoading } = useListOpenOneOnOneRequestsQuery(undefined, { refetchOnMountOrArgChange: true })
  const [scheduleRequest, setScheduleRequest] = useState<OneOnOneRequest | null>(null)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const [, setBusyId] = useState<string | null>(null)

  const [scheduleMeeting] = useScheduleOneOnOneMeetingMutation()
  const [cancelMeeting] = useCancelOneOnOneMeetingMutation()
  const [completeMeeting] = useCompleteOneOnOneMeetingMutation()

  const items = data?.items ?? []

  const handleSchedule = async (payload: Propose1On1SlotsPayload) => {
    await scheduleMeeting(payload).unwrap()
  }

  const handleCancel = async (requestId: string) => {
    setBusyId(requestId)
    try {
      await cancelMeeting({ requestId }).unwrap()
    } finally {
      setBusyId(null)
    }
  }

  const handleComplete = async (requestId: string) => {
    setBusyId(requestId)
    try {
      await completeMeeting({ requestId }).unwrap()
    } finally {
      setBusyId(null)
    }
  }

  const actions = (request: OneOnOneRequest) => {
    if (request.status === 'open' || request.status === 'awaiting_guest') {
      return (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setScheduleRequest(request)}
            className="rounded-lg bg-teal-500/10 px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-teal-700 uppercase dark:text-teal-300"
          >
            {request.status === 'awaiting_guest' ? 'Update times' : 'Propose times'}
          </button>
        </div>
      )
    }

    if (request.status === 'scheduled' && request.meeting) {
      return (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() =>
              setConfirmState({
                open: true,
                title: 'Cancel meeting?',
                description: `Cancel the scheduled meeting with ${request.guestName}?`,
                onConfirm: () => void handleCancel(request.id),
              })
            }
            className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-rose-700 uppercase dark:text-rose-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmState({
                open: true,
                title: 'Mark completed?',
                description: `Mark the meeting with ${request.guestName} as completed?`,
                onConfirm: () => void handleComplete(request.id),
              })
            }
            className="rounded-lg bg-slate-500/10 px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300"
          >
            Complete
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b1018]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-teal-700 uppercase dark:text-teal-300">
            1-on-1
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Open requests</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Propose multiple times. Guest confirms one — meeting is created automatically.
          </p>
        </div>
        {isLoading ? <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" /> : null}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm font-medium text-slate-400">No open 1-on-1 requests.</p>
        ) : (
          items.map((request) => (
            <article key={request.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    1-on-1 with {request.guestName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{request.guestEmail}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    {statusLabel(request)}
                  </p>
                </div>
                {actions(request)}
              </div>
            </article>
          ))
        )}
      </div>

      {scheduleRequest ? (
        <OneOnOneScheduleModal
          open
          onClose={() => setScheduleRequest(null)}
          request={scheduleRequest}
          onSubmit={async (payload) => {
            await handleSchedule(payload)
          }}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(confirmState?.open)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </section>
  )
}
