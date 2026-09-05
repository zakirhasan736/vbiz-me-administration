'use client'

import { useGetGuestOneOnOneMeetingQuery } from '@/redux/features/oneOnOne/oneOnOne.api'
import { Calendar, Clock, Link2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export function RequestOneOnOneGuestView() {
  const { requestId } = useParams<{ requestId: string }>()
  const id = typeof requestId === 'string' ? requestId : ''
  const { data, isLoading, isError } = useGetGuestOneOnOneMeetingQuery(id, { skip: !id })

  if (isLoading) {
    return <div className="mx-auto max-w-md p-6 text-sm text-slate-500">Loading meeting details…</div>
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-slate-500">This meeting details page is not available.</div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b1018]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
              1-on-1
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">1-on-1 with {data.guestName}</h1>
          </div>
          <Link
            href="/"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

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

        <p className="mt-4 text-xs text-slate-400">
          Your request stays linked to the original 1-on-1. You do not need a Zoho account to join.
        </p>
      </div>
    </div>
  )
}
