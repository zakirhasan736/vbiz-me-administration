'use client'

import { cn } from '@/utils/cn'
import { Sparkles, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

export type ParsedEntry = {
  title: string
  description: string
}

/** Split pasted/dropped text into title + description blocks */
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

type Props = {
  onParsed: (entries: ParsedEntry[]) => void
  accent?: string
  hint?: string
}

/** Drop a .txt/.md file or paste text to auto-fill list entries */
export function AiDropFillZone({
  onParsed,
  accent = 'indigo',
  hint = 'Drop a document or paste text — AI arranges titles & details into entries',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')

  const apply = (text: string) => {
    const entries = parseEntriesFromText(text)
    if (!entries.length) {
      setMsg('Couldn’t find entries. Use blank lines or --- between items.')
      return
    }
    onParsed(entries)
    setMsg(`Filled ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} from your text.`)
    setPaste('')
    setPasteOpen(false)
  }

  const readFile = async (file: File) => {
    setBusy(true)
    setMsg('')
    try {
      const text = await file.text()
      apply(text)
    } catch {
      setMsg('Could not read that file. Try .txt or .md')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 space-y-2" data-tour="ai-autofill">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) readFile(file)
          else {
            const text = e.dataTransfer.getData('text/plain')
            if (text) apply(text)
          }
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed px-4 py-5 transition-all',
          dragOver
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/15'
            : 'border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/2',
          accent === 'violet' && !dragOver && 'border-violet-200/80 dark:border-violet-500/20'
        )}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900 dark:text-white">AI Auto-fill</p>
              <p className="mt-0.5 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                {hint}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-200"
            >
              <Upload className="h-3.5 w-3.5" />
              {busy ? 'Reading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => setPasteOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              Paste text
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void readFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {pasteOpen && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={5}
            placeholder={'Title one\nDescription…\n\n---\n\nTitle two\nDescription…'}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="rounded-xl px-3 py-2 text-[12px] font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => apply(paste)}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-bold text-white"
            >
              Fill entries
            </button>
          </div>
        </div>
      )}

      {msg ? <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{msg}</p> : null}
    </div>
  )
}
