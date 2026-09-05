'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { Button, Input } from '@/components/ui'
import type { OneOnOneRequest } from '@/redux/features/oneOnOne/oneOnOne.api'
import { Calendar, Clock, Mail, Phone, Plus, Trash2, User, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export type ProposeSlotsPayload = {
  requestId: string
  title?: string
  description?: string
  timezone: string
  durationMinutes: number
  slots: Array<{ date: string; startTime: string }>
}

type Props = {
  open: boolean
  onClose: () => void
  request: OneOnOneRequest | null
  onSubmit: (payload: ProposeSlotsPayload) => Promise<void>
  isSubmitting?: boolean
}

type SlotDraft = { id: string; date: string; startTime: string }

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function newSlot(partial?: Partial<SlotDraft>): SlotDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: partial?.date || todayIso(),
    startTime: partial?.startTime || '10:00',
  }
}

function OneOnOneScheduleForm({
  request,
  onClose,
  onSubmit,
  isSubmitting = false,
}: {
  request: OneOnOneRequest
  onClose: () => void
  onSubmit: (payload: ProposeSlotsPayload) => Promise<void>
  isSubmitting?: boolean
}) {
  const [title, setTitle] = useState(`1-on-1 with ${request.guestName}`)
  const [description, setDescription] = useState(request.message?.trim() || '')
  const [timezone, setTimezone] = useState(detectTimezone())
  const [duration, setDuration] = useState(30)
  const [slots, setSlots] = useState<SlotDraft[]>([newSlot(), newSlot({ startTime: '14:00' })])
  const [error, setError] = useState<string | null>(null)

  const updateSlot = (id: string, patch: Partial<SlotDraft>) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const cleaned = slots
      .map((slot) => ({ date: slot.date.trim(), startTime: slot.startTime.trim() }))
      .filter((slot) => slot.date && slot.startTime)
    if (!cleaned.length) {
      setError('Add at least one date and time option for the guest')
      return
    }
    try {
      await onSubmit({
        requestId: request.id,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        timezone,
        durationMinutes: duration,
        slots: cleaned,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send time options')
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="animate-in zoom-in-95 relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-on-one-schedule-title"
    >
      <div className="shrink-0 border-b border-slate-100 bg-[linear-gradient(135deg,_rgba(13,148,136,0.1),_transparent_55%)] px-6 py-5 dark:border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
              <Calendar className="h-3.5 w-3.5" />
              Propose times
            </p>
            <h2
              id="one-on-one-schedule-title"
              className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
            >
              1-on-1 with {request.guestName}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Offer multiple date/time options. The guest picks one and the meeting confirms automatically — no second
              action needed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Guest</p>
          <div className="mt-3 grid gap-2.5 text-sm text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
              <span className="font-medium">{request.guestName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
              <span className="truncate">{request.guestEmail}</span>
            </div>
            {request.guestPhone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
                <span>{request.guestPhone}</span>
              </div>
            ) : null}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Meeting title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 30)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Time zone</span>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isSubmitting}
              placeholder="UTC"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Date & time options</p>
            <button
              type="button"
              onClick={() => setSlots((prev) => [...prev, newSlot()].slice(0, 12))}
              disabled={isSubmitting || slots.length >= 12}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-500/10 px-2 py-1 text-[10px] font-bold tracking-wide text-teal-700 uppercase disabled:opacity-50 dark:text-teal-300"
            >
              <Plus className="h-3 w-3" />
              Add option
            </button>
          </div>

          <div className="space-y-2">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400">Date {index + 1}</span>
                  <Input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(slot.id, { date: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                    <Clock className="h-3 w-3" />
                    Time
                  </span>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== slot.id)))}
                  disabled={isSubmitting || slots.length <= 1}
                  className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Message to guest</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            placeholder="Optional note with the proposed times"
          />
        </label>

        {error ? <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-white/5 dark:bg-white/[0.02]">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send options to guest'}
        </Button>
      </div>
    </form>
  )
}

export function OneOnOneScheduleModal({ open, onClose, request, onSubmit, isSubmitting = false }: Props) {
  if (!open || !request) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div className="relative z-10 w-full max-w-lg">
          <OneOnOneScheduleForm
            key={request.id}
            request={request}
            onClose={onClose}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </ModalPortal>
  )
}
