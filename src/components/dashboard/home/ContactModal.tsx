'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { PACKAGE_FEATURE_LOCKED_MESSAGE } from '@/lib/packageAccess'
import { type AiChatMessage, getAiReply, type TicketType } from '@/lib/supportFeedback'
import { useCreateSupportTicketMutation } from '@/redux/features/adminSupport/adminSupport.api'
import { cn } from '@/utils/cn'
import { Bot, LifeBuoy, Mail, MessageSquareHeart, Send, Sparkles, Star, X } from 'lucide-react'
import { useState } from 'react'

export type OwnerFeedbackMode = 'feedback' | 'support'

type ContactModalProps = {
  onClose: () => void
  mode?: OwnerFeedbackMode
  fromRole?: 'single' | 'corporate'
  fromName?: string
  fromEmail?: string
}

const FEEDBACK_TYPES: { id: TicketType; label: string }[] = [
  { id: 'issue', label: 'Issue / bug' },
  { id: 'feature', label: 'Feature request' },
  { id: 'satisfaction', label: 'Satisfaction' },
  { id: 'system_update', label: 'System update report' },
]

const OWNER_AI_KEY = 'vbiz_owner_ai_chat'

function loadOwnerAiChat(): AiChatMessage[] {
  try {
    const raw = localStorage.getItem(OWNER_AI_KEY)
    if (!raw) {
      const welcome: AiChatMessage = {
        id: 'owner_ai_welcome',
        role: 'assistant',
        text: 'Hi — I’m the vBiz help agent. Ask about vCards, leads, billing, or notifications. Need a human? Switch to Message Admin.',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(OWNER_AI_KEY, JSON.stringify([welcome]))
      return [welcome]
    }
    return JSON.parse(raw) as AiChatMessage[]
  } catch {
    return []
  }
}

function sendOwnerAiMessage(text: string): AiChatMessage[] {
  const trimmed = text.trim()
  if (!trimmed) return loadOwnerAiChat()
  const messages = loadOwnerAiChat()
  const userMsg: AiChatMessage = {
    id: `oai_u_${Date.now()}`,
    role: 'user',
    text: trimmed,
    createdAt: new Date().toISOString(),
  }
  const reply: AiChatMessage = {
    id: `oai_a_${Date.now() + 1}`,
    role: 'assistant',
    text: getAiReply(trimmed),
    createdAt: new Date().toISOString(),
  }
  const next = [...messages, userMsg, reply].slice(-80)
  localStorage.setItem(OWNER_AI_KEY, JSON.stringify(next))
  return next
}

export function ContactModal({
  onClose,
  mode = 'support',
  fromRole = 'single',
  fromName = 'Owner',
  fromEmail,
}: ContactModalProps) {
  const lockedMode = mode
  const [supportPath, setSupportPath] = useState<'ai' | 'email'>('ai')
  const [type, setType] = useState<TicketType>('satisfaction')
  const [rating, setRating] = useState(4)
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>(() => loadOwnerAiChat())
  const [aiInput, setAiInput] = useState('')
  const [createSupportTicket] = useCreateSupportTicketMutation()
  const { allow_support_ticket: canUseSupportTicket } = usePackageAccess()

  const isFeedback = lockedMode === 'feedback'

  const handleClose = () => {
    setSent(false)
    setSending(false)
    setSubmitError(null)
    onClose()
  }

  const handleSubmitFeedbackOrAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !details.trim()) return
    if (!canUseSupportTicket) {
      setSubmitError(PACKAGE_FEATURE_LOCKED_MESSAGE)
      return
    }
    setSending(true)
    setSubmitError(null)

    try {
      if (isFeedback) {
        await createSupportTicket({
          channel: 'feedback',
          type,
          subject: subject.trim(),
          details: details.trim(),
          rating: type === 'satisfaction' ? rating : undefined,
          fromRole,
          fromName,
          fromEmail,
        }).unwrap()
      } else {
        await createSupportTicket({
          channel: 'email',
          type: 'help',
          subject: subject.trim(),
          details: details.trim(),
          fromRole,
          fromName,
          fromEmail,
          meta: { to: 'support@vbiz.me', route: 'email_support' },
        }).unwrap()
      }
      setSent(true)
    } catch (err) {
      const apiMessage = (err as { data?: { message?: string } })?.data?.message
      setSubmitError(apiMessage || 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    setAiMessages(sendOwnerAiMessage(aiInput))
    setAiInput('')
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-420 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        onClick={handleClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:rounded-4xl dark:border-white/10 dark:bg-[#0b0f19]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <div>
              <p className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                {isFeedback ? (
                  <MessageSquareHeart className="h-5 w-5 text-emerald-500" />
                ) : (
                  <LifeBuoy className="h-5 w-5 text-indigo-500" />
                )}
                {isFeedback ? 'Send Feedback' : 'Contact Support'}
              </p>
              <p className="text-[11px] font-semibold text-slate-400">
                {isFeedback
                  ? 'Report issues, ideas, satisfaction, or system updates to admin'
                  : 'AI agent help or email support — both notify admin when needed'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isFeedback && (
            <div className="flex gap-2 px-5 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSupportPath('ai')
                  setSent(false)
                }}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black tracking-wider uppercase',
                  supportPath === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5'
                )}
              >
                <Bot className="h-3.5 w-3.5" /> AI agent
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupportPath('email')
                  setSent(false)
                }}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black tracking-wider uppercase',
                  supportPath === 'email' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5'
                )}
              >
                <Mail className="h-3.5 w-3.5" /> Email support
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5">
            {sent ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                  <MessageSquareHeart className="h-7 w-7" />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {isFeedback ? 'Feedback submitted' : 'Email support queued'}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs font-semibold text-slate-400">
                  {isFeedback
                    ? 'Admin was notified in Support Tickets.'
                    : 'Queued to support@vbiz.me — admin will see it in Support Tickets.'}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                >
                  Done
                </button>
              </div>
            ) : isFeedback ? (
              <form onSubmit={handleSubmitFeedbackOrAdmin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Type</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {FEEDBACK_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold',
                          type === t.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {type === 'satisfaction' && (
                  <div>
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Satisfaction (1–5)
                    </label>
                    <div className="mt-2 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className="p-1.5"
                          aria-label={`${n} stars`}
                        >
                          <Star
                            className={cn(
                              'h-6 w-6',
                              n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/20'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Short summary..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Details</label>
                  <textarea
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={5}
                    placeholder="Describe the issue, idea, or update..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black tracking-wider text-white uppercase hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Submit feedback to admin'}
                </button>
                {submitError && <p className="text-[11px] font-semibold text-rose-500">{submitError}</p>}
              </form>
            ) : supportPath === 'ai' ? (
              <div className="flex min-h-90 flex-col">
                <div className="mb-3 max-h-80 flex-1 space-y-3 overflow-y-auto">
                  {aiMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-semibold',
                        m.role === 'assistant'
                          ? 'bg-indigo-50 text-slate-800 dark:bg-indigo-500/10 dark:text-slate-100'
                          : 'ml-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      )}
                    >
                      {m.role === 'assistant' && (
                        <span className="mb-1 inline-flex items-center gap-1 text-[9px] font-black tracking-wider text-indigo-500 uppercase">
                          <Sparkles className="h-3 w-3" /> AI agent
                        </span>
                      )}
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAiSend} className="flex gap-2">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask the help agent..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    <Send className="h-3.5 w-3.5" /> Ask
                  </button>
                </form>
                <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
                  Still stuck? Use{' '}
                  <button
                    type="button"
                    className="font-black text-emerald-600 underline"
                    onClick={() => setSupportPath('email')}
                  >
                    Email support
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedbackOrAdmin} className="space-y-4">
                <div className="flex gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[11px] leading-relaxed font-semibold text-emerald-800 dark:text-emerald-200">
                    Email support to <span className="font-black">support@vbiz.me</span> — queued for admin in Support
                    Tickets (demo).
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Subject</label>
                  <input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help?"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Message</label>
                  <textarea
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={5}
                    placeholder="Describe your issue or question..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black tracking-wider text-white uppercase hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send email support'}
                </button>
                {submitError && <p className="text-[11px] font-semibold text-rose-500">{submitError}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
