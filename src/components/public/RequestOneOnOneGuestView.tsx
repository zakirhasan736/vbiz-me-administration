'use client'

import {
  useConfirmGuestOneOnOneSlotMutation,
  useGetGuestOneOnOneMeetingQuery,
} from '@/redux/features/oneOnOne/oneOnOne.api'
import { Calendar, CheckCircle2, Clock, Link2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export function RequestOneOnOneGuestView() {
  const { requestId } = useParams<{ requestId: string }>()
  const id = typeof requestId === 'string' ? requestId : ''
  const { data, isLoading, isError, refetch } = useGetGuestOneOnOneMeetingQuery(id, { skip: !id })
  const [confirmSlot, { isLoading: confirming }] = useConfirmGuestOneOnOneSlotMutation()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return <div className="mx-auto max-w-md p-6 text-sm text-slate-500">Loading meeting details…</div>
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-slate-500">This meeting details page is not available.</div>
    )
  }

  const handleConfirm = async () => {
    if (!selectedSlotId) {
      setError('Select a date and time first')
      return
    }
    setError(null)
    try {
      await confirmSlot({ requestId: id, slotId: selectedSlotId }).unwrap()
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm this time')
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center p-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b1018]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
              1-on-1
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{data.title}</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">For {data.guestName}</p>
          </div>
          <Link
            href="/"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        {data.mode === 'pick_slot' ? (
          <>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Choose one of the proposed times. Confirming locks the meeting — no further action is needed from the card
              owner.
            </p>
            {data.description ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs whitespace-pre-wrap text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {data.description}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              {data.slots.map((slot) => {
                const active = selectedSlotId === slot.id
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-500/10'
                        : 'border-slate-200 bg-white hover:border-teal-300 dark:border-white/10 dark:bg-white/5'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10'
                      }`}
                    >
                      {active ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{slot.date}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} · {slot.durationMinutes} min · {slot.timezone}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={confirming || !selectedSlotId}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
            >
              {confirming ? 'Confirming…' : 'Confirm this time'}
            </button>
          </>
        ) : (
          <>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="h-4 w-4 text-teal-600" />
                {data.date}
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Clock className="h-4 w-4 text-teal-600" />
                {data.startTime} – {data.endTime} ({data.timezone})
              </p>
              {data.description ? (
                <p className="whitespace-pre-wrap text-slate-500 dark:text-slate-400">{data.description}</p>
              ) : null}
            </div>

            {data.joinUrl ? (
              <a
                href={data.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500"
              >
                <Link2 className="h-4 w-4" />
                Join Meeting
              </a>
            ) : (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                Check your email/calendar invitation for the meeting details and join link.
              </p>
            )}
          </>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Your request stays linked to the original 1-on-1. You do not need a Zoho account to join.
        </p>
      </div>
    </div>
  )
}
