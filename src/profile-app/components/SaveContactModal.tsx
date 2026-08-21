'use client'

import { notify } from '@/lib/toast/toast'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { downloadProfileContactVcf, vcfFilenameFromName } from '@/profile-app/lib/contactVcf'
import { saveGuestUser, SaveGuestUserError } from '@/profile-app/lib/saveGuestUser'
import { Check, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

type SaveContactFormData = {
  fullName: string
  phone: string
  email: string
}

const EMPTY_FORM: SaveContactFormData = { fullName: '', phone: '', email: '' }

type SaveContactModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Profile owner id sent to `POST /save-guest-user` and `GET /save-contact/{id}`. */
  profileId?: string
  /** Public card slug — stored in guest meta as which vCard the lead came from. */
  cardSlug?: string
  /** Card owner display name — used in the intro copy. */
  ownerName?: string
}

export const SaveContactModal = ({
  isOpen,
  onClose,
  onSuccess,
  profileId,
  cardSlug,
  ownerName,
}: SaveContactModalProps) => {
  const [formData, setFormData] = useState<SaveContactFormData>(EMPTY_FORM)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const resetTransientState = () => {
    setShowSuccess(false)
    setSubmitError(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    resetTransientState()
    onClose()
  }

  const finishSuccess = () => {
    if (onSuccess) {
      resetTransientState()
      onSuccess()
      return
    }

    setShowSuccess(true)
    setTimeout(() => {
      resetTransientState()
      onClose()
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    const trimmedId = profileId?.trim()

    try {
      if (!trimmedId || trimmedId === 'preview') {
        await new Promise((resolve) => setTimeout(resolve, 400))
      } else {
        await saveGuestUser({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          profileId: trimmedId,
          cardSlug,
        })
        await downloadProfileContactVcf(trimmedId, vcfFilenameFromName(ownerName))
      }

      notify.success('Contact saved — your card is downloading.')
      finishSuccess()
    } catch (error) {
      // Duplicate email isn't a real failure: the visitor already exists, so just
      // hand them the contact file again and continue the flow with a friendly note.
      if (error instanceof SaveGuestUserError && error.isDuplicate) {
        notify.info('You have already saved this contact.')
        try {
          if (trimmedId && trimmedId !== 'preview') {
            await downloadProfileContactVcf(trimmedId, vcfFilenameFromName(ownerName))
          }
        } catch {
          /* ignore secondary download errors */
        }
        finishSuccess()
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to save contact. Please try again.'
      setSubmitError(message)
      notify.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const trimmedOwnerName = ownerName?.trim()
  const contactOwnerLabel = trimmedOwnerName || 'this contact'

  return (
    <ProfileModalShell isOpen={isOpen} onClose={handleClose} panelClassName="sm:max-w-sm">
      <div className="relative z-10 p-6">
        <button
          type="button"
          onClick={handleClose}
          className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close download contact dialog"
        >
          <X size={16} />
        </button>

        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-1 pr-8">
              <h3 className="vbiz-title text-xl font-bold tracking-tight">Download Contact Info</h3>
              <p className="vbiz-description mt-2 text-sm leading-relaxed">
                You&apos;re about to receive {contactOwnerLabel}&apos;s contact file. First, tell us who you are — your
                full name, phone number, and email — so we know who&apos;s saving this contact.
              </p>
            </div>
            <input
              type="text"
              placeholder="Your full name"
              aria-label="Your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              disabled={submitting}
              autoComplete="name"
              className="vbiz-modal-input w-full rounded-xl border p-3 text-sm focus:outline-none disabled:opacity-60"
            />
            <input
              type="tel"
              placeholder="Your phone number"
              aria-label="Your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              disabled={submitting}
              autoComplete="tel"
              className="vbiz-modal-input w-full rounded-xl border p-3 text-sm focus:outline-none disabled:opacity-60"
            />
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Your email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={submitting}
              autoComplete="email"
              className="vbiz-modal-input w-full rounded-xl border p-3 text-sm focus:outline-none disabled:opacity-60"
            />
            {submitError ? (
              <p className="text-center text-xs text-red-400" role="alert">
                {submitError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="vbiz-btn vbiz-modal-btn-primary w-full rounded-full py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Preparing download…' : 'Download Contact File'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-500"
            >
              <Check size={36} strokeWidth={3} />
            </motion.div>
            <h3 className="vbiz-title mb-2 text-xl font-bold">Contact file ready!</h3>
            <p className="vbiz-description text-sm">{contactOwnerLabel}&apos;s contact info is downloading now.</p>
          </div>
        )}
      </div>
    </ProfileModalShell>
  )
}
