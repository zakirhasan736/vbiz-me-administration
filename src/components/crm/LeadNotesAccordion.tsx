'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { CrmAudioRecorder } from '@/components/crm/CrmAudioRecorder'
import { CrmDictationBar } from '@/components/crm/CrmDictationBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { notify } from '@/lib/toast/toast'
import {
  type CreateLeadNoteBody,
  type LeadNoteKind,
  type LeadNoteRow,
  useCreateCrmLeadNoteMutation,
  useDeleteCrmLeadNoteMutation,
  useGetCrmLeadNotesQuery,
} from '@/redux/features/crm/crm.api'
import { cn } from '@/utils/cn'
import { ChevronDown, Keyboard, Loader2, Mic, StickyNote, Trash2, Type } from 'lucide-react'
import { useCallback, useState } from 'react'

type AddMode = LeadNoteKind | null

function fromDatetimeLocalValue(value: string) {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function kindLabel(kind: LeadNoteKind) {
  if (kind === 'voice') return 'Voice'
  if (kind === 'voice_to_text') return 'Voice → text'
  return 'Text'
}

export function LeadNotesAccordion({
  leadId,
  profileId,
  onCollapse,
}: {
  leadId: string
  profileId?: string | null
  onCollapse?: () => void
}) {
  const { data: notes = [], isLoading, isError, error } = useGetCrmLeadNotesQuery(leadId)
  const [createNote, { isLoading: creating }] = useCreateCrmLeadNoteMutation()
  const [deleteNote, { isLoading: deleting }] = useDeleteCrmLeadNoteMutation()

  const [addMode, setAddMode] = useState<AddMode>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioFileName, setAudioFileName] = useState<string | null>(null)
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [listening, setListening] = useState(false)
  const [dictationKey, setDictationKey] = useState(0)

  const resetForm = () => {
    setContent('')
    setStartsAt('')
    setDueAt('')
    setAudioUrl(null)
    setAudioFileName(null)
    setAudioMimeType(null)
    setRecording(false)
    setUploading(false)
    setListening(false)
  }

  const closeAdd = () => {
    resetForm()
    setDictationKey((key) => key + 1)
    setAddMode(null)
  }

  const handleVoiceRecorded = useCallback(
    async (file: File) => {
      setUploading(true)
      setAudioUrl(null)
      setAudioFileName(null)
      setAudioMimeType(null)
      try {
        const result = await uploadMediaWithProgress({
          file,
          profileId: profileId ?? null,
          attachmentType: 'crm_lead_note',
        })
        setAudioUrl(result.url)
        setAudioFileName(file.name)
        setAudioMimeType(file.type || null)
      } catch (err) {
        const message =
          err instanceof MediaUploadError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Couldn’t upload voice note.'
        notify.error(message)
      } finally {
        setUploading(false)
      }
    },
    [profileId]
  )

  const handleTranscript = useCallback((chunk: string) => {
    setContent((prev) => {
      const base = prev.trim()
      return base ? `${base} ${chunk}` : chunk
    })
  }, [])

  const handleDictationError = useCallback((message: string) => {
    notify.error(message)
  }, [])

  const handleSave = async () => {
    if (creating || uploading || recording || listening) return
    const startIso = fromDatetimeLocalValue(startsAt)
    const dueIso = fromDatetimeLocalValue(dueAt)
    if (!startIso || !dueIso) {
      notify.error('Start and due dates are required.')
      return
    }
    const body: CreateLeadNoteBody = {
      kind: addMode || 'text',
      startsAt: startIso,
      dueAt: dueIso,
    }
    if (addMode === 'voice') {
      if (!audioUrl) {
        notify.error('Record and upload a voice note first.')
        return
      }
      body.audioUrl = audioUrl
      body.audioFileName = audioFileName || undefined
      body.audioMimeType = audioMimeType || undefined
      if (content.trim()) body.content = content.trim()
    } else {
      if (!content.trim()) {
        notify.error('Write a note before saving.')
        return
      }
      body.content = content.trim()
    }

    try {
      await createNote({ leadId, body }).unwrap()
      notify.info('Note saved for this lead.')
      closeAdd()
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { message?: string } }).data?.message || '')
          : ''
      notify.error(message || 'Couldn’t save this note.')
    }
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await deleteNote({ leadId, noteId: pendingDeleteId }).unwrap()
      notify.info('Note deleted.')
      setPendingDeleteId(null)
    } catch {
      notify.error('Couldn’t delete this note.')
    }
  }

  const pendingDeleteNote = pendingDeleteId ? notes.find((note) => note.id === pendingDeleteId) : null

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2">
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse notes"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl px-1 py-0.5 text-left transition duration-300 hover:bg-white/70 dark:hover:bg-white/5"
          >
            <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
            <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Lead notes</p>
            <span className="truncate text-[10px] font-semibold text-slate-400">Stay on this lead only</span>
            <ChevronDown
              className="ml-auto h-4 w-4 shrink-0 origin-center rotate-180 text-slate-400 transition-transform duration-300 ease-in-out will-change-transform"
              aria-hidden
            />
          </button>
        ) : (
          <>
            <StickyNote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
            <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Lead notes</p>
            <span className="text-[10px] font-semibold text-slate-400">Stay on this lead only</span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
          {error && typeof error === 'object' && 'data' in error
            ? String((error as { data?: { message?: string } }).data?.message || 'Couldn’t load notes.')
            : 'Couldn’t load notes.'}
        </p>
      ) : notes.length === 0 && !addMode ? (
        <p className="text-xs font-semibold text-slate-400">No notes yet for this lead.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <LeadNoteCard
              key={note.id}
              note={note}
              deleting={deleting && pendingDeleteId === note.id}
              onDelete={() => setPendingDeleteId(note.id)}
            />
          ))}
        </ul>
      )}

      {!addMode ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Add note</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ModeButton
              icon={Type}
              label="Write text"
              onClick={() => {
                resetForm()
                setAddMode('text')
              }}
            />
            <ModeButton
              icon={Mic}
              label="Voice"
              onClick={() => {
                resetForm()
                setAddMode('voice')
              }}
            />
            <ModeButton
              icon={Keyboard}
              label="Voice to text"
              onClick={() => {
                resetForm()
                setDictationKey((key) => key + 1)
                setAddMode('voice_to_text')
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-300">
              New {kindLabel(addMode)} note
            </p>
            <button
              type="button"
              onClick={closeAdd}
              className="text-[10px] font-black tracking-wider text-slate-400 uppercase"
            >
              Cancel
            </button>
          </div>

          {addMode === 'voice' ? (
            <div className="space-y-2">
              <CrmAudioRecorder
                busy={uploading}
                onRecorded={handleVoiceRecorded}
                onRecordingChange={setRecording}
                startLabel={audioUrl ? 'Re-record' : 'Start recording'}
              />
              {uploading ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                </span>
              ) : null}
              {audioUrl ? <audio controls src={audioUrl} className="w-full" /> : null}
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Caption (optional)
                </span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="h-16 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              {addMode === 'voice_to_text' ? (
                <CrmDictationBar
                  key={dictationKey}
                  onTranscript={handleTranscript}
                  onListeningChange={setListening}
                  onError={handleDictationError}
                  startLabel="Start dictation"
                />
              ) : null}
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Note</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={addMode === 'voice_to_text' ? 'Dictated text appears here…' : 'Write your note…'}
                  className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Start</span>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Due</span>
              <input
                type="datetime-local"
                required
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={creating || uploading || recording || listening || !startsAt.trim() || !dueAt.trim()}
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-2.5 text-[11px] font-black tracking-wider text-white uppercase disabled:bg-slate-300 dark:bg-indigo-500"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save note
          </button>
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDeleteId)}
        title="Delete this note?"
        description={
          pendingDeleteNote?.kind === 'voice'
            ? 'Permanently delete this voice note? This cannot be undone.'
            : pendingDeleteNote?.content
              ? `Permanently delete “${pendingDeleteNote.content.slice(0, 80)}${pendingDeleteNote.content.length > 80 ? '…' : ''}”? This cannot be undone.`
              : 'Permanently delete this lead note? This cannot be undone.'
        }
        confirmLabel="Delete"
        variant="danger"
        icon={Trash2}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

function ModeButton({ icon: Icon, label, onClick }: { icon: typeof Type; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-[10px] font-black tracking-wider text-slate-700 uppercase ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}

function LeadNoteCard({ note, deleting, onDelete }: { note: LeadNoteRow; deleting: boolean; onDelete: () => void }) {
  return (
    <li className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-[#0b1018]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                note.kind === 'voice'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  : note.kind === 'voice_to_text'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
              )}
            >
              {kindLabel(note.kind)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">{formatWhen(note.createdAt)}</span>
            {note.createdByName ? (
              <span className="truncate text-[10px] font-semibold text-slate-400">· {note.createdByName}</span>
            ) : null}
          </div>
          {note.kind === 'voice' && note.audioUrl ? (
            <audio controls src={note.audioUrl} className="mt-2 w-full" />
          ) : null}
          {note.content ? (
            <p className="mt-2 text-sm font-semibold whitespace-pre-wrap text-slate-800 dark:text-slate-100">
              {note.content}
            </p>
          ) : null}
          {(note.startsAt || note.dueAt) && (
            <p className="mt-2 text-[10px] font-semibold text-slate-400">
              {[
                note.startsAt ? `Start ${formatWhen(note.startsAt)}` : null,
                note.dueAt ? `Due ${formatWhen(note.dueAt)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          aria-label="Delete note"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}
