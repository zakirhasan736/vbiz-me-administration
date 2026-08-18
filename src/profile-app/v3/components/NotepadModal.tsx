'use client'

import type { SavedNote } from '@/interfaces/api/saveNote'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { fetchProfileNotes, getProfileVisitorId, saveProfileNote } from '@/profile-app/lib/saveProfileNote'
import { Check, MessageCircle, Save, StickyNote, X } from 'lucide-react'
import { motion } from 'motion/react'
import React, { useCallback, useEffect, useState } from 'react'

type Note = SavedNote

export const NotepadModal = ({
  isOpen,
  onClose,
  cardOwnerId = 'michaelangelo_casanova',
  ownerName,
}: {
  isOpen: boolean
  onClose: () => void
  cardOwnerId?: string
  /** Current card owner display name from profile API. */
  ownerName?: string
}) => {
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const displayOwnerName = ownerName?.trim() || 'the card owner'

  const fetchNotes = useCallback(async () => {
    const visitorId = getProfileVisitorId(cardOwnerId)
    if (!visitorId) {
      setNotes([])
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    try {
      setNotes(await fetchProfileNotes(cardOwnerId, visitorId))
    } catch (error) {
      console.error('Error fetching public notes:', error)
      setNotes([])
      setErrorMsg(error instanceof Error ? error.message : 'Unable to load your notes.')
    } finally {
      setIsLoading(false)
    }
  }, [cardOwnerId])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => void fetchNotes(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, fetchNotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !content.trim()) return

    setIsSaving(true)
    setErrorMsg('')

    try {
      const visitorId = getProfileVisitorId(cardOwnerId)
      if (!visitorId) throw new Error('This card is not connected to a public profile.')

      await saveProfileNote(cardOwnerId, content, { authorName, visitorId })
      await fetchNotes()

      setAuthorName('')
      setContent('')
      setSuccessMsg('Note added successfully!')

      // Dispatch custom event for platform updates
      window.dispatchEvent(
        new CustomEvent('vbiz_platform_update', {
          detail: { title: 'Note Posted', message: `New message left by ${authorName.trim()}` },
        })
      )

      setTimeout(() => {
        setSuccessMsg('')
      }, 2500)
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'Unable to post your note.')
    } finally {
      setIsSaving(false)
    }
  }

  const body = (
    <>
      {/* SKEUOMORPHIC HEADER: Binding Spiral Wire */}
      <div className="relative flex w-full shrink-0 items-center justify-between border-b border-[#e1cea0] bg-[#ebdcb7] px-6 py-4">
        {/* Horizontal spiral rings */}
        <div className="pointer-events-none absolute inset-x-8 top-[-8px] flex justify-between">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {/* Metal link looping over */}
              <div className="h-6 w-2.5 rounded-full border border-zinc-600/40 bg-linear-to-r from-zinc-400 via-zinc-200 to-zinc-500 shadow-inner" />
              {/* Punch Hole */}
              <div className="-mt-1 h-3 w-3 rounded-full bg-zinc-950/80 shadow-sm" />
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <StickyNote className="text-black" size={23} />
          <h3 className="font-heading text-[1.4375rem] font-bold tracking-tight text-black">Notepad Guestbook</h3>
        </div>

        <button onClick={onClose} className="mt-2 rounded-full p-1.5 text-black transition-colors hover:bg-black/10">
          <X size={18} />
        </button>
      </div>

      {/* SKEUOMORPHIC PAPER BODY */}
      <div className="no-scrollbar relative flex flex-1 flex-col overflow-y-auto bg-[#fffdf5] p-6 text-black sm:p-8">
        {/* Margin Line Down the Left Side */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-14 border-l-2 border-red-300/60 sm:left-18" />

        {/* Notebook lines background overlay (using linear gradient) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(#e5e7eb00 95%, #e1d3bc 95%)',
            backgroundSize: '100% 2.2rem',
            backgroundPosition: '0 1.5rem',
            opacity: 0.25,
          }}
        />

        <div className="relative flex-1 pl-10 text-black sm:pl-14">
          <p className="mb-6 font-sans text-[calc(0.75rem*1.15)] font-semibold tracking-wide text-black uppercase sm:text-[calc(0.875rem*1.15)]">
            Leave a handwritten note for {displayOwnerName}:
          </p>

          {/* Note creator input form */}
          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <div>
              <label className="mb-1 block text-[calc(11px*1.15)] font-bold tracking-wider text-black uppercase">
                Your Name
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Enter nickname or full name"
                className="w-full rounded-xl border border-[#ebdcb7] bg-[#fdfaf2] px-4 py-2 font-sans text-[calc(0.875rem*1.15)] text-black shadow-inner transition-all placeholder:text-zinc-500 focus:border-[#ca8a04] focus:ring-1 focus:ring-[#caca04] focus:outline-none"
              />
            </div>

            <div className="relative">
              <label className="mb-1 block text-[calc(11px*1.15)] font-bold tracking-wider text-black uppercase">
                Your Note
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder={`Say hello / comment on ${displayOwnerName}'s profile...`}
                className="font-notebook w-full resize-none rounded-xl border border-[#ebdcb7] bg-[#fdfaf2] px-4 py-3 text-[calc(1.125rem*1.15)] leading-relaxed text-black shadow-inner transition-all placeholder:text-zinc-500 focus:border-[#ca8a04] focus:ring-1 focus:ring-[#caca04] focus:outline-none"
                style={{ minHeight: '120px' }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="font-sans text-[calc(0.75rem*1.15)] text-red-600">
                {successMsg && (
                  <span className="flex items-center gap-1 font-bold text-green-800">
                    <Check size={14} /> {successMsg}
                  </span>
                )}
                {errorMsg && !successMsg && <span role="alert">{errorMsg}</span>}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#ca8a04] px-5 py-2.5 font-sans text-[calc(0.875rem*1.15)] font-bold text-white shadow-md transition-all hover:bg-[#a16e03] hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Posting...' : 'Attach Note'}
                <Save size={16} />
              </button>
            </div>
          </form>

          {/* Separator line */}
          <div className="my-8 border-t border-dashed border-[#e6dbb5]" />

          <h4 className="font-heading mb-4 flex shrink-0 items-center gap-1.5 text-[calc(1.125rem*1.15)] font-bold text-black">
            <MessageCircle size={20} className="text-black" />
            Recent Notes ({notes.length})
          </h4>

          {/* Notes List */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 font-sans text-[calc(0.75rem*1.15)] text-black">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#ca8a04]" />
              Unfolding notebook...
            </div>
          ) : notes.length === 0 ? (
            <p className="font-notebook text-md pb-8 text-[calc(0.875rem*1.15)] text-black italic">
              No notes left yet. Be the first to secure a line in the book!
            </p>
          ) : (
            <div className="space-y-6 pb-6">
              {notes.map((note) => (
                <motion.div
                  layout
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative rounded-2xl border border-amber-100 bg-[#fffdfe] p-5 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03)]"
                >
                  {/* Decorative Pin Tape Look at the top */}
                  <div className="absolute top-[-10px] left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 border border-yellow-300/30 bg-yellow-200/50 opacity-80" />

                  <p className="font-notebook pr-2 text-[calc(1.25rem*1.15)] leading-snug wrap-break-word text-black">
                    &ldquo;{note.content}&rdquo;
                  </p>

                  <div className="mt-3 flex shrink-0 items-center justify-between border-t border-[#faf5df]/80 pt-2 font-sans text-[calc(0.75rem*1.15)] text-black">
                    <span className="font-semibold text-black">— {note.author_name}</span>
                    <span className="text-black">
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>

                  {note.reply && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-black">
                      <p className="font-sans text-[calc(0.6875rem*1.15)] font-bold tracking-wider text-emerald-800 uppercase">
                        Reply from {displayOwnerName}
                      </p>
                      <p className="font-notebook mt-1 text-[calc(1.05rem*1.15)] leading-snug wrap-break-word text-emerald-950">
                        {note.reply}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <ProfileModalShell
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
      panelClassName="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-amber-200/50 bg-[#faf6ea] text-black shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] sm:max-w-xl sm:rounded-2xl"
    >
      {body}
    </ProfileModalShell>
  )
}
