'use client'

import { GalleryLinkCard } from '@/components/media/GalleryLinkCard'
import type { GalleryLinkPreview } from '@/lib/media/linkPreview'
import { normalizePastedMediaUrl } from '@/lib/media/pastedMediaUrl'
import { Loader2, X } from 'lucide-react'
import { useState } from 'react'

type GalleryLinkFieldProps = {
  url: string
  preview: GalleryLinkPreview | null
  onChange: (next: { url: string; preview: GalleryLinkPreview | null }) => void
}

export function GalleryLinkField({ url, preview, onChange }: GalleryLinkFieldProps) {
  const [paste, setPaste] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apply = async () => {
    const next = normalizePastedMediaUrl(paste)
    if (!next) {
      setError('Paste a full gallery link that starts with https://')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(next)}`)
      const payload = (await response.json()) as GalleryLinkPreview & { error?: string }
      if (!response.ok) {
        setError(payload.error || 'Could not read that gallery page')
        return
      }
      onChange({
        url: payload.url || next,
        preview: {
          url: payload.url || next,
          title: payload.title || '',
          description: payload.description || '',
          image: payload.image || '',
          siteName: payload.siteName || '',
        },
      })
      setPaste('')
      if (!payload.image) {
        setError('This page did not include a preview image. The link will still open on your public card.')
      }
    } catch {
      setError('Could not read that gallery page. Check the link and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-200/70 pt-4 dark:border-white/10">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Photo gallery link
        </p>
        <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          Paste a gallery page (Pixieset, Google Photos, or any photo collection). The public card shows that page’s
          preview image, title, and link. Visitors tap the card to open the gallery.
        </p>
      </div>

      {url && preview ? (
        <div className="space-y-2">
          <GalleryLinkCard preview={preview} />
          <button
            type="button"
            onClick={() => {
              onChange({ url: '', preview: null })
              setError(null)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <X className="h-3.5 w-3.5" />
            Remove gallery link
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          value={paste}
          onChange={(event) => {
            setPaste(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void apply()
            }
          }}
          placeholder="Paste a gallery page URL"
          aria-label="Paste a gallery page URL"
          disabled={loading}
          className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
        />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={loading || !paste.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? 'Reading…' : 'Use gallery URL'}
        </button>
      </div>
      {error ? <p className="pl-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  )
}
