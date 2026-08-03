'use client'

import { notepadThemeFromDesign, resolveProfileDesign, type ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { saveProfileNote } from '@/profile-app/lib/saveProfileNote'
import { cn } from '@/utils/cn'
import { Bold, CheckCircle2, Cloud, Italic, List, Pin, Underline, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type LeaveMessagePayload = {
  visitorName: string
  message: string
}

type LeaveMessageModalProps = {
  isOpen: boolean
  onClose: () => void
  ownerName?: string
  design?: ResolvedProfileDesign | null
  /** Profile owner id sent to `POST /save-note`. */
  profileId?: string
  /** Editor phone preview — overlay covers the preview frame, not the whole page */
  embedded?: boolean
  /** Override default save-note API (e.g. tests). */
  onSubmit?: (payload: LeaveMessagePayload) => void | Promise<void>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'synced'

const MAX_NOTE_LENGTH = 2000
const PREVIEW_PHONE_SELECTOR = '.vbiz-preview-phone'

function draftStorageKey(profileId?: string) {
  return profileId ? `vbiz_visitor_note_draft_${profileId}` : 'vbiz_visitor_note_draft'
}

const FALLBACK_DESIGN = resolveProfileDesign(
  {
    vcardPrimaryColor: '#6366f1',
    vcardAccentColor: '#eab308',
    dashboardAccent: 'amber',
    fontFamily: 'inter',
    profileTemplate: 'v2',
    layoutStyle: 'classic',
    buttonStyle: 'solid',
    cornerStyle: 'round',
  },
  { darkMode: true }
)

function getPortalTarget(embedded: boolean): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (embedded) {
    return (document.querySelector(PREVIEW_PHONE_SELECTOR) as HTMLElement | null) ?? document.body
  }
  return document.body
}

function subscribePortalTarget(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

function useNoteModalPortal(embedded: boolean, isOpen: boolean) {
  const getSnapshot = useCallback(() => (isOpen ? getPortalTarget(embedded) : null), [embedded, isOpen])
  return useSyncExternalStore(subscribePortalTarget, getSnapshot, () => null)
}

export const LeaveMessageModal = ({ isOpen, embedded = false, ...props }: LeaveMessageModalProps) => {
  const portalTarget = useNoteModalPortal(embedded, isOpen)

  if (!portalTarget) return null

  return createPortal(
    <AnimatePresence>{isOpen ? <LeaveMessageModalPanel embedded={embedded} {...props} /> : null}</AnimatePresence>,
    portalTarget
  )
}

function LeaveMessageModalPanel({
  onClose,
  ownerName = 'the card owner',
  onSubmit,
  profileId,
  design,
  embedded = false,
}: Omit<LeaveMessageModalProps, 'isOpen'>) {
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftKey = draftStorageKey(profileId)

  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [charCount, setCharCount] = useState(0)
  const [isEmpty, setIsEmpty] = useState(true)

  const resolvedDesign = design ?? FALLBACK_DESIGN
  const noteThemeStyle = useMemo(() => notepadThemeFromDesign(resolvedDesign), [resolvedDesign])
  const isV1 = resolvedDesign.profileTemplate === 'v1'

  const overlayClass = embedded ? 'absolute inset-0' : 'fixed inset-0'

  const getPlainText = useCallback(() => editorRef.current?.innerText ?? '', [])

  const scheduleAutoSave = useCallback(() => {
    const text = getPlainText()
    const trimmed = text.trim()
    setCharCount(text.length)
    setIsEmpty(!trimmed)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)

    if (!trimmed) {
      setSaveStatus('idle')
      return
    }

    setSaveStatus('saving')

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, editorRef.current?.innerHTML ?? '')
      } catch {
        /* ignore quota errors in preview */
      }
      setSaveStatus('saved')

      syncTimerRef.current = setTimeout(() => {
        setSaveStatus('synced')
      }, 600)
    }, 450)
  }, [draftKey, getPlainText])

  useEffect(() => {
    if (embedded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [embedded])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        editor.innerHTML = draft
        setCharCount(editor.innerText.length)
        setIsEmpty(!editor.innerText.trim())
        if (editor.innerText.trim()) setSaveStatus('synced')
      }
    } catch {
      /* ignore */
    }

    editor.focus()
  }, [draftKey])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [])

  const execFormat = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
    scheduleAutoSave()
  }

  const handleInput = () => {
    const text = getPlainText()
    if (text.length > MAX_NOTE_LENGTH) {
      document.execCommand('undo')
      return
    }
    scheduleAutoSave()
  }

  const handlePinNote = async () => {
    const trimmed = getPlainText().trim()
    if (!trimmed) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: LeaveMessagePayload = {
        visitorName: '',
        message: trimmed,
      }
      if (onSubmit) {
        await onSubmit(payload)
      } else if (profileId && !embedded && profileId !== 'preview') {
        await saveProfileNote(profileId, trimmed)
      } else {
        await new Promise((r) => setTimeout(r, 400))
      }
      try {
        localStorage.removeItem(draftKey)
      } catch {
        /* ignore */
      }
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1600)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save note. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const saveStatusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved locally'
        : saveStatus === 'synced'
          ? 'Draft synced'
          : 'Start writing'

  return (
    <div
      className={`vbiz-notepad-overlay ${overlayClass} z-9999 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-note-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={cn(
          'vbiz-notepad relative z-10 w-full max-w-lg overflow-hidden rounded-2xl',
          isV1 ? 'vbiz-notepad--v1' : 'vbiz-notepad--v2'
        )}
        style={{ ...noteThemeStyle, colorScheme: 'light' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!showSuccess ? (
          <>
            <div
              className="vbiz-notepad-tape pointer-events-none absolute -top-3 left-1/2 z-20 h-7 w-24 -translate-x-1/2 rounded-sm shadow-md"
              aria-hidden
            />

            <div className="vbiz-notepad-paper relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="vbiz-notepad-header relative flex items-start justify-between gap-3 border-b px-4 pt-5 pb-2">
                <div className="min-w-0 flex-1">
                  <h3
                    id="leave-note-title"
                    className="vbiz-notepad-title text-[1.35rem] leading-tight font-semibold text-zinc-950"
                  >
                    Note for {ownerName}
                  </h3>
                  <p className="vbiz-notepad-muted mt-0.5 text-xs text-zinc-900">
                    Write freely — your note will reach them later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="vbiz-notepad-muted shrink-0 rounded-full bg-black/5 p-1.5 transition-colors hover:bg-black/10 hover:text-(--vbiz-note-text) focus:outline-none"
                  aria-label="Close notepad"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="vbiz-notepad-toolbar flex items-center gap-0.5 border-b px-4 py-1.5">
                {[
                  { icon: Bold, command: 'bold', label: 'Bold' },
                  { icon: Italic, command: 'italic', label: 'Italic' },
                  { icon: Underline, command: 'underline', label: 'Underline' },
                  { icon: List, command: 'insertUnorderedList', label: 'Bullet list' },
                ].map(({ icon: Icon, command, label }) => (
                  <button
                    key={command}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat(command)}
                    className="vbiz-notepad-toolbar-btn rounded p-1.5 transition-colors hover:bg-black/10 focus:outline-none"
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={15} strokeWidth={2.5} />
                  </button>
                ))}
              </div>

              <div className="vbiz-notepad-body relative max-h-[min(48vh,380px)] min-h-[260px] overflow-y-auto px-4 pt-2 pb-3">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Write your note"
                  data-placeholder="Start typing your note…"
                  onInput={handleInput}
                  className="vbiz-notepad-editor relative z-10 min-h-[220px] w-full text-[1.15rem] leading-[1.85rem] outline-none"
                />
              </div>

              <div className="vbiz-notepad-footer flex items-center justify-between gap-3 border-t px-4 py-2">
                <div className="vbiz-notepad-muted flex min-w-0 items-center gap-1.5 text-xs">
                  <Cloud size={13} className={`shrink-0 ${saveStatus === 'idle' ? 'opacity-50' : 'opacity-100'}`} />
                  <span className="truncate">{saveStatusLabel}</span>
                </div>

                <span className="vbiz-notepad-muted shrink-0 text-[11px] tabular-nums opacity-80">
                  {charCount}/{MAX_NOTE_LENGTH}
                </span>
              </div>

              <div className="vbiz-notepad-footer border-t px-4 py-3">
                {submitError ? (
                  <p className="vbiz-notepad-muted mb-2 text-center text-xs text-red-700" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handlePinNote}
                  disabled={submitting || isEmpty}
                  className="vbiz-notepad-pin flex w-full items-center justify-center gap-2 px-4 py-2.5 text-base font-semibold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Pin size={16} className={submitting ? 'animate-pulse' : ''} />
                  {submitting ? 'Pinning…' : 'Pin note'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="vbiz-notepad-paper flex flex-col items-center px-8 py-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e22] text-[#15803d]">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="vbiz-notepad-title text-2xl font-semibold">Note pinned!</h3>
            <p className="vbiz-notepad-muted mt-2 max-w-xs text-sm">
              {ownerName} will see your note in their dashboard.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
