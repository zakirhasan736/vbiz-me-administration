'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { Button, Input } from '@/components/ui'
import type { OneOnOneRequest } from '@/redux/features/oneOnOne/oneOnOne.api'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  request: OneOnOneRequest | null
  onSubmit: (payload: {
    requestId: string
    date: string
    startTime: string
    durationMinutes: number
    timezone: string
    description?: string
  }) => Promise<void>
  isSubmitting?: boolean
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function defaultStartTime() {
  return '10:00 AM'
}

export function OneOnOneScheduleModal({ open, onClose, request, onSubmit, isSubmitting = false }: Props) {
  const [date, setDate] = useState(todayIso())
  const [startTime, setStartTime] = useState(defaultStartTime())
  const [duration, setDuration] = useState(30)
  const [timezone, setTimezone] = useState('UTC')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => {
    if (!request) return 'Schedule meeting'
    return `1-on-1 with ${request.guestName}`
  }, [request])

  if (!open || !request) return null

  const handleSubmit = async () => {
    setError(null)
    try {
      await onSubmit({
        requestId: request.id,
        date,
        startTime,
        durationMinutes: duration,
        timezone,
        description: description.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting')
    }
  }

  if (!open || !request) return null

  return (
    <ModalPortal>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#0b1018]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
              Schedule meeting
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {request.guestEmail} · {request.guestName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Meeting title
            <Input defaultValue={`1-on-1 with ${request.guestName}`} className="mt-1" disabled={isSubmitting} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Date
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Start time
              <Input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Duration (minutes)
              <Input
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 30)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Time zone
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              placeholder="Meeting details"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Meeting'}
          </Button>
        </div>
      </div>
    </ModalPortal>
  )
}
