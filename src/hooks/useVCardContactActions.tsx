'use client'

import type { ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal'
import { ModalPortal } from '@/components/ModalPortal'
import { deriveOwnerAudience } from '@/lib/meetingScope'
import { submitScheduleMeeting } from '@/lib/submitScheduleMeeting'
import { notify } from '@/lib/toast/toast'
import { useSendAdminProfileEmailMutation } from '@/redux/features/adminProfiles/adminProfiles.api'
import { useCreateMeetingMutation } from '@/redux/features/meetings/meetings.api'
import { cn } from '@/utils/cn'
import { Delete, Mail, Phone, Send, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

export type VCardContactCard = {
  id: string
  slug?: string | null
  personal?: {
    fullName?: string
    email?: string
    phone?: string
    whatsapp?: string
  } | null
  ownerEmail?: string | null
  email?: string | null
  ownerRole?: string | null
  companyUserRole?: string | null
  companyUserId?: string | null
}

export type VCardContactHandlers = {
  onEmail: () => void
  onCall: () => void
  onSchedule: () => void
}

type Options = {
  /** Use admin API to send email; otherwise opens the user's mail client. */
  useAdminEmail?: boolean
}

function personalField(personal: VCardContactCard['personal'], key: string): string {
  if (!personal || typeof personal !== 'object') return ''
  const value = (personal as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim() : ''
}

function cardContactEmail(card: VCardContactCard): string {
  return personalField(card.personal, 'email') || card.ownerEmail?.trim() || card.email?.trim() || ''
}

function cardContactPhone(card: VCardContactCard): string {
  return personalField(card.personal, 'phone') || personalField(card.personal, 'whatsapp') || ''
}

function cardContactName(card: VCardContactCard): string {
  return personalField(card.personal, 'fullName') || card.slug?.trim() || 'vCard Owner'
}

function scheduleOwnerFromCard(card: VCardContactCard): ProfileOwnerSelection {
  const email = cardContactEmail(card)
  return {
    profileId: card.id,
    hostName: cardContactName(card),
    ownerEmails: email ? [email.toLowerCase()] : [],
    identity: card.slug?.trim() ? `/${card.slug.trim()}` : cardContactName(card),
  }
}

export function useVCardContactActions(options: Options = {}) {
  const { useAdminEmail = false } = options
  const [sendAdminProfileEmail, { isLoading: isSendingEmail }] = useSendAdminProfileEmailMutation()
  const [createMeeting, { isLoading: isCreatingMeeting }] = useCreateMeetingMutation()

  const [selectedCard, setSelectedCard] = useState<VCardContactCard | null>(null)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [callDigits, setCallDigits] = useState('')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [scheduleOwner, setScheduleOwner] = useState<ProfileOwnerSelection | null>(null)

  const openEmailForCard = useCallback((card: VCardContactCard) => {
    setSelectedCard(card)
    setEmailSubject(`vBiz update for ${cardContactName(card)}`)
    setEmailBody('')
    setIsEmailOpen(true)
  }, [])

  const openCallForCard = useCallback((card: VCardContactCard) => {
    setSelectedCard(card)
    setCallDigits(cardContactPhone(card).replace(/[^\d+]/g, '') || '')
    setIsCallOpen(true)
  }, [])

  const openScheduleForCard = useCallback((card: VCardContactCard) => {
    setSelectedCard(card)
    setScheduleOwner(scheduleOwnerFromCard(card))
    setIsScheduleOpen(true)
  }, [])

  const contactHandlersForCard = useCallback(
    (card: VCardContactCard): VCardContactHandlers => ({
      onEmail: () => openEmailForCard(card),
      onCall: () => openCallForCard(card),
      onSchedule: () => openScheduleForCard(card),
    }),
    [openCallForCard, openEmailForCard, openScheduleForCard]
  )

  const handleSendEmail = useCallback(async () => {
    if (!selectedCard) return
    const subject = emailSubject.trim()
    const message = emailBody.trim()
    if (!subject || !message) {
      notify.warning('Add both a subject and message before sending.')
      return
    }

    if (useAdminEmail) {
      try {
        const result = await sendAdminProfileEmail({ id: selectedCard.id, subject, message }).unwrap()
        notify.success(`Email delivered to ${result.recipient}.`)
        setIsEmailOpen(false)
        setEmailSubject('')
        setEmailBody('')
      } catch (error) {
        const data = (error as { data?: { message?: string; errorMessages?: Array<{ message?: string }> } })?.data
        const validationMessage = data?.errorMessages?.find((item) => item.message)?.message
        const errMessage = data?.message === 'Validation Error' ? validationMessage || data.message : data?.message
        notify.error(errMessage || 'Email could not be delivered.')
      }
      return
    }

    const recipient = cardContactEmail(selectedCard)
    if (!recipient) {
      notify.info('No email address on this card yet.')
      return
    }
    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.location.href = mailto
    setIsEmailOpen(false)
  }, [emailBody, emailSubject, selectedCard, sendAdminProfileEmail, useAdminEmail])

  const modals = useMemo(
    () => (
      <>
        {isCallOpen && selectedCard ? (
          <ModalPortal>
            <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCallOpen(false)} />
              <div className="animate-in zoom-in-95 relative w-full max-w-sm rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                      <Phone className="h-5 w-5 text-emerald-500" /> Call
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{cardContactName(selectedCard)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCallOpen(false)}
                    className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                <div className="mb-4 flex min-h-16 items-center justify-center rounded-2xl bg-slate-900 px-4 py-5 text-center font-mono text-xl tracking-wider text-white">
                  {callDigits || 'Enter number'}
                </div>
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCallDigits((prev) => `${prev}${d}`)}
                      className="rounded-2xl bg-slate-100 py-3.5 text-lg font-black text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCallDigits((prev) => prev.slice(0, -1))}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    title="Backspace"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                  <a
                    href={callDigits ? `tel:${callDigits}` : undefined}
                    onClick={(e) => {
                      if (!callDigits) e.preventDefault()
                    }}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black tracking-wider text-white uppercase',
                      callDigits
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'pointer-events-none bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    <Phone className="h-4 w-4" /> Place call
                  </a>
                </div>
              </div>
            </div>
          </ModalPortal>
        ) : null}

        {isEmailOpen && selectedCard ? (
          <ModalPortal>
            <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsEmailOpen(false)}
              />
              <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                      <Mail className="h-5 w-5 text-indigo-600" /> Email
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Message {cardContactName(selectedCard)}
                      {useAdminEmail ? ' through vBiz.' : ' via your mail app.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmailOpen(false)}
                    className="shrink-0 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Recipient</label>
                    <input
                      type="text"
                      readOnly
                      value={
                        cardContactEmail(selectedCard)
                          ? `${cardContactName(selectedCard)} <${cardContactEmail(selectedCard)}>`
                          : 'No email on file'
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-500 outline-none dark:border-white/5 dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Message</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-35 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsEmailOpen(false)}
                      className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendEmail()}
                      disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingEmail ? (
                        'Sending…'
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        ) : null}

        <ScheduleMeetingModal
          open={isScheduleOpen && Boolean(scheduleOwner)}
          onClose={() => {
            setIsScheduleOpen(false)
            setScheduleOwner(null)
          }}
          isSubmitting={isCreatingMeeting}
          initialOwner={scheduleOwner}
          lockOwner
          allowedScopes={['one_to_one', 'group']}
          defaultScope="one_to_one"
          groupCompanyUserId={selectedCard?.companyUserId ?? null}
          title="Schedule meeting"
          subtitle={selectedCard ? `Book a session with ${cardContactName(selectedCard)}.` : undefined}
          onSubmit={async (payload) => {
            if (!scheduleOwner) return
            try {
              const created = await submitScheduleMeeting(createMeeting, payload, {
                ownerAudience: deriveOwnerAudience(selectedCard?.ownerRole, selectedCard?.companyUserRole),
                ownerRole: selectedCard?.ownerRole,
                companyUserRole: selectedCard?.companyUserRole,
              })
              setIsScheduleOpen(false)
              setScheduleOwner(null)
              return created
            } catch {
              return undefined
            }
          }}
        />
      </>
    ),
    [
      callDigits,
      createMeeting,
      emailBody,
      emailSubject,
      handleSendEmail,
      isCallOpen,
      isCreatingMeeting,
      isEmailOpen,
      isScheduleOpen,
      isSendingEmail,
      scheduleOwner,
      selectedCard,
      useAdminEmail,
    ]
  )

  return {
    openEmailForCard,
    openCallForCard,
    openScheduleForCard,
    contactHandlersForCard,
    modals,
  }
}
