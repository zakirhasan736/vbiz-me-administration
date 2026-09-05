'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { Button, Input } from '@/components/ui'
import { readSavedGuestContact } from '@/profile-app/lib/contactSaveState'
import { useCreatePublicOneOnOneRequestMutation } from '@/redux/features/oneOnOne/oneOnOne.api'
import { X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  profileId: string
  cardName?: string
  onSuccess?: () => void
}

type FormProps = {
  onClose: () => void
  profileId: string
  cardName?: string
  onSuccess?: () => void
}

function RequestOneOnOneForm({ onClose, profileId, cardName, onSuccess }: FormProps) {
  const saved = readSavedGuestContact(profileId)
  const [guestName, setGuestName] = useState(saved?.fullName ?? '')
  const [guestEmail, setGuestEmail] = useState(saved?.email ?? '')
  const [guestPhone, setGuestPhone] = useState(saved?.phone ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockName = Boolean(saved?.lockName)
  const lockEmail = Boolean(saved?.lockEmail)
  const lockPhone = Boolean(saved?.lockPhone)
  const [createPublicRequest] = useCreatePublicOneOnOneRequestMutation()

  const allIdentityLocked = lockName && lockEmail && lockPhone
  const hasLockedIdentity = lockName || lockEmail || lockPhone

  const handleSubmit = async () => {
    setError(null)
    if (!guestName.trim() || !guestEmail.trim()) {
      setError('Guest name and email are required')
      return
    }
    setIsSubmitting(true)
    try {
      await createPublicRequest({
        profileId,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim() || null,
        message: message.trim() || null,
      }).unwrap()
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1018]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
            1-on-1
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Request a 1-on-1</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {cardName ? `With ${cardName}` : 'Request a meeting with the card owner'}
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

      {hasLockedIdentity ? (
        <p className="mt-3 rounded-xl border border-teal-200/70 bg-teal-50 px-3 py-2 text-[11px] font-medium text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200">
          {allIdentityLocked
            ? 'Using your saved contact details. Only the message can be edited.'
            : 'Using your saved contact details. Locked fields can’t be changed.'}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Your name
          <Input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1"
            disabled={isSubmitting || lockName}
            readOnly={lockName}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Your email
          <Input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="mt-1"
            disabled={isSubmitting || lockEmail}
            readOnly={lockEmail}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Phone
          <Input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="mt-1"
            disabled={isSubmitting || lockPhone}
            readOnly={lockPhone}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            placeholder="What would you like to discuss?"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send request'}
        </Button>
      </div>
    </div>
  )
}

export function RequestOneOnOneModal({ open, onClose, profileId, cardName, onSuccess }: Props) {
  if (!open) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
        <div className="absolute inset-0" onClick={onClose} aria-hidden />
        <div className="relative z-10 w-full max-w-md">
          <RequestOneOnOneForm
            key={profileId}
            onClose={onClose}
            profileId={profileId}
            cardName={cardName}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </ModalPortal>
  )
}
