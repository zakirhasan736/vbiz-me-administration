'use client'

import { countFillPayloadEntries, type SectionFillPayload } from '@/lib/ai/applyCardDraft'
import { cardAgentForm } from '@/lib/ai/cardAgentClient'
import { fillAssistantSection, scopeAssistantSectionPayload } from '@/lib/assistantApi'
import { notify } from '@/lib/toast/toast'
import { cn } from '@/utils/cn'
import { Loader2, Sparkles, Upload } from 'lucide-react'
import { useRef, useState, type ClipboardEvent } from 'react'

export type ParsedEntry = {
  title: string
  description: string
}

export type AiDropFillSection =
  'services' | 'blogs' | 'portfolio' | 'reviews' | 'skills' | 'education' | 'experience' | 'faqs' | 'personal'

export type AiFillSource = 'ai' | 'local'

export type AiFilledResult = {
  section: AiDropFillSection
  payload: SectionFillPayload
  count: number
  source: AiFillSource
}

type BusyPhase = 'idle' | 'reading' | 'extracting' | 'filling'

/** Local fallback when the API is unavailable (paste-only). */
export function parseEntriesFromText(raw: string): ParsedEntry[] {
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  let blocks = text
    .split(/\n\s*---+\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  if (blocks.length < 2) {
    const byBlank = text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)
    if (byBlank.length >= 2) blocks = byBlank
  }

  if (blocks.length === 1 && /^\s*\d+[\).\]]\s+/m.test(text)) {
    blocks = text
      .split(/\n(?=\s*\d+[\).\]]\s+)/)
      .map((b) => b.replace(/^\s*\d+[\).\]]\s+/, '').trim())
      .filter(Boolean)
  }

  return blocks.map((block) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const title = lines[0]?.replace(/^[-*•]\s+/, '') || 'Untitled'
    const description = lines.slice(1).join(' ').trim()
    return { title, description }
  })
}

/** Build a minimal section-shaped payload from local title/description parse (paste fallback). */
export function localPayloadFromEntries(section: AiDropFillSection, entries: ParsedEntry[]): SectionFillPayload | null {
  if (!entries.length) return null
  switch (section) {
    case 'services':
      return {
        services: entries.map((e) => ({
          title: e.title,
          description: e.description,
          type: 'Other',
          url: '',
        })),
      }
    case 'portfolio':
      return {
        portfolio: entries.map((e) => ({
          title: e.title,
          description: e.description,
          url: '',
        })),
      }
    case 'reviews':
      return {
        reviews: entries.map((e) => ({
          author: e.title,
          text: e.description,
          rating: 5,
        })),
      }
    case 'blogs':
      return {
        blogs: entries.map((e) => ({
          title: e.title,
          description: e.description,
          category: 'News',
        })),
      }
    case 'faqs':
      return {
        faqs: entries.map((e) => ({
          question: e.title,
          answer: e.description,
        })),
      }
    case 'skills':
      return {
        skills: entries.map((e) => ({
          type: e.title,
          skills: e.description
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean),
        })),
      }
    case 'education':
      return {
        education: entries.map((e) => ({
          institute: e.title,
          degree: e.description,
          fromDate: '',
          toDate: '',
          tillNow: false,
        })),
      }
    case 'experience':
      return {
        experience: entries.map((e) => ({
          company: e.title,
          jobTitle: e.title,
          description: e.description,
          fromDate: '',
          toDate: '',
          tillNow: false,
        })),
      }
    default:
      return null
  }
}

function phaseLabel(phase: BusyPhase): string {
  switch (phase) {
    case 'reading':
      return 'Reading…'
    case 'extracting':
      return 'Extracting text…'
    case 'filling':
      return 'Filling section…'
    default:
      return 'Upload'
  }
}

function clarifyAiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Could not fill section'
  const lower = raw.toLowerCase()
  if (lower.includes('rate') || lower.includes('too many') || lower.includes('429')) {
    return 'AI is rate-limited right now. Wait a moment and try again.'
  }
  if (lower.includes('openai') || lower.includes('api key') || lower.includes('503')) {
    return 'AI is temporarily unavailable. Try again shortly.'
  }
  if (lower.includes('unsupported') || lower.includes('unreadable') || lower.includes('extract')) {
    return 'Could not read that file. Try a PDF, DOCX, TXT, or a clearer image.'
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error while contacting AI. Check your connection and retry.'
  }
  return raw
}

type Props = {
  /** Called with the section-shaped AI (or local fallback) payload. */
  onFilled: (result: AiFilledResult) => void
  /** @deprecated Use onFilled — kept for gradual migration if needed */
  onParsed?: (entries: ParsedEntry[]) => void
  section?: AiDropFillSection
  currentDraft?: unknown
  profileId?: string | null
  accent?: string
  hint?: string
}

/** Drop a doc/image or paste text — AI fills list entries via fill-section when `section` is set. */
export function AiDropFillZone({
  onFilled,
  onParsed,
  section = 'services',
  currentDraft,
  profileId,
  accent = 'indigo',
  hint = 'Drop a document or paste text — AI arranges titles & details into entries',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState<BusyPhase>('idle')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null)

  const busy = phase !== 'idle'

  const deliver = (payload: SectionFillPayload, source: AiFillSource, note?: string) => {
    const count = countFillPayloadEntries(section, payload)
    if (!count) {
      const emptyMsg =
        note || `AI found no ${section} entries in that material. Try a clearer document or more specific text.`
      setMsg({ tone: 'err', text: emptyMsg })
      notify.warning(emptyMsg, { title: 'Nothing to fill' })
      return
    }
    onFilled({ section, payload, count, source })
    if (onParsed) {
      // Best-effort legacy bridge for any remaining callers
      const listKey =
        section === 'reviews'
          ? 'reviews'
          : section === 'blogs'
            ? 'blogs'
            : section === 'portfolio'
              ? 'portfolio'
              : section === 'services'
                ? 'services'
                : section === 'faqs'
                  ? 'faqs'
                  : null
      if (listKey && Array.isArray(payload[listKey])) {
        onParsed(
          (payload[listKey] as Array<Record<string, unknown>>).map((row) => ({
            title: String(row.title || row.author || row.question || row.institute || 'Untitled'),
            description: String(row.description || row.text || row.answer || ''),
          }))
        )
      }
    }
    const success =
      source === 'local'
        ? `Filled ${count} entr${count === 1 ? 'y' : 'ies'} from your text (local parse).`
        : `AI filled ${count} entr${count === 1 ? 'y' : 'ies'}.`
    setMsg({ tone: 'ok', text: success })
    notify.success(success, { title: 'AI Auto-fill' })
    setPaste('')
    setPasteOpen(false)
  }

  const applyLocalPaste = (text: string, aiErrorNote?: string) => {
    const entries = parseEntriesFromText(text)
    const payload = localPayloadFromEntries(section, entries)
    if (!payload) {
      const fail = 'Couldn’t find entries. Use blank lines or --- between items.'
      setMsg({ tone: 'err', text: fail })
      notify.error(fail, { title: 'Auto-fill' })
      return
    }
    if (aiErrorNote) {
      notify.warning(aiErrorNote, { title: 'AI unavailable' })
    }
    deliver(payload, 'local')
  }

  const fillViaAgent = async (text: string, files: File[]) => {
    const hasFiles = files.length > 0
    const hasText = Boolean(text.trim())
    setMsg(null)
    setPhase(hasFiles ? 'reading' : 'filling')

    try {
      if (hasFiles) {
        // Brief phase so the user sees extraction before the network wait
        setPhase('extracting')
      }
      setPhase('filling')

      const json = profileId
        ? await fillAssistantSection<{
            payload?: SectionFillPayload
            data?: SectionFillPayload
            message?: string
            section?: string
          }>(profileId, section, text, files)
        : await (() => {
            const form = new FormData()
            form.set('section', section)
            if (hasText) form.set('text', text.trim())
            form.set('currentDraft', JSON.stringify(currentDraft || {}))
            for (const file of files) form.append('files', file)
            return cardAgentForm<{
              payload?: SectionFillPayload
              data?: SectionFillPayload
              message?: string
              section?: string
            }>('fill-section', form)
          })()

      const rawPayload =
        json.payload && typeof json.payload === 'object'
          ? json.payload
          : json.data && typeof json.data === 'object'
            ? json.data
            : (json as SectionFillPayload)
      const payload = scopeAssistantSectionPayload(section, rawPayload as Record<string, unknown>) as SectionFillPayload

      const count = countFillPayloadEntries(section, payload)
      if (!count) {
        // Paste-only: allow local heuristic fallback when AI returns empty
        if (hasText && !hasFiles) {
          applyLocalPaste(text)
          return
        }
        const emptyMsg =
          (typeof json.message === 'string' && json.message) ||
          `No ${section} found in this document. Try another file or paste the list as text.`
        setMsg({ tone: 'err', text: emptyMsg })
        notify.warning(emptyMsg, { title: 'Nothing to fill' })
        return
      }

      deliver(payload, 'ai', typeof json.message === 'string' ? json.message : undefined)
    } catch (err) {
      const clarified = clarifyAiError(err)
      // Local fallback only for paste (never invent structure from failed uploads)
      if (hasText && !hasFiles) {
        applyLocalPaste(text, clarified)
        return
      }
      setMsg({ tone: 'err', text: clarified })
      notify.error(clarified, { title: 'Auto-fill failed' })
    } finally {
      setPhase('idle')
    }
  }

  const readFiles = async (files: File[]) => {
    if (!files.length) return
    await fillViaAgent('', files)
  }

  const ingestClipboard = (e: ClipboardEvent) => {
    if (busy) return
    const dropped = Array.from(e.clipboardData.files || [])
    if (dropped.length) {
      e.preventDefault()
      void readFiles(dropped)
      return
    }
    const text = e.clipboardData.getData('text/plain')
    if (text.trim()) {
      e.preventDefault()
      setPaste(text)
      void fillViaAgent(text, [])
    }
  }

  return (
    <div className="mb-5 space-y-2" data-tour="ai-autofill">
      <div
        tabIndex={0}
        onPaste={ingestClipboard}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (busy) return
          const dropped = Array.from(e.dataTransfer.files || [])
          if (dropped.length) void readFiles(dropped)
          else {
            const text = e.dataTransfer.getData('text/plain')
            if (text) void fillViaAgent(text, [])
          }
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed px-4 py-5 transition-all',
          dragOver
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/15'
            : 'border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/2',
          accent === 'violet' && !dragOver && 'border-violet-200/80 dark:border-violet-500/20',
          accent === 'amber' && !dragOver && 'border-amber-200/80 dark:border-amber-500/20',
          busy && 'opacity-80'
        )}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900 dark:text-white">AI Auto-fill</p>
              <p className="mt-0.5 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                {busy ? phaseLabel(phase) : hint}
              </p>
              {!busy ? (
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  Images and scanned PDFs are OCR&apos;d first. AI then fills this section from that text. PDF, DOCX,
                  TXT, and MD are supported.
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-200"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {busy ? phaseLabel(phase) : 'Upload'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPasteOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Paste text
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,image/*,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) void readFiles(files)
            e.target.value = ''
          }}
        />
      </div>

      {pasteOpen && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            onPaste={(e) => {
              if (busy) return
              const text = e.clipboardData.getData('text/plain')
              if (!text.trim()) return
              e.preventDefault()
              setPaste(text)
              void fillViaAgent(text, [])
            }}
            rows={5}
            disabled={busy}
            placeholder={'Title one\nDescription…\n\n---\n\nTitle two\nDescription…'}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPasteOpen(false)}
              className="rounded-xl px-3 py-2 text-[12px] font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !paste.trim()}
              onClick={() => void fillViaAgent(paste, [])}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {busy ? phaseLabel(phase) : 'Fill entries'}
            </button>
          </div>
        </div>
      )}

      {msg ? (
        <p
          className={cn(
            'text-[11px] font-semibold',
            msg.tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
            msg.tone === 'err' && 'text-rose-600 dark:text-rose-400',
            msg.tone === 'info' && 'text-slate-500 dark:text-slate-400'
          )}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  )
}
