'use client'

import { importCanvaDesignApi, listCanvaDesignsApi } from '@/lib/canva/backendClient'
import type { CanvaExportFormat, CanvaLibraryItem } from '@/lib/canva/types'
import { cn } from '@/utils/cn'
import { Image as ImageIcon, Loader2, Palette, Search, Video, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export type CanvaPickedFile = {
  id: string
  name: string
  file: File
  kind: 'image' | 'video'
  thumb?: string
}

type CanvaLibraryPickerProps = {
  mode: 'image' | 'video' | 'both'
  onClose: () => void
  onPicked: (picked: CanvaPickedFile) => void
}

function preferredFormat(mode: CanvaLibraryPickerProps['mode']): CanvaExportFormat {
  return mode === 'video' ? 'mp4' : 'png'
}

function kindFromFormat(format: CanvaExportFormat): 'image' | 'video' {
  return format === 'mp4' ? 'video' : 'image'
}

export function CanvaLibraryPicker({ mode, onClose, onPicked }: CanvaLibraryPickerProps) {
  const [items, setItems] = useState<CanvaLibraryItem[]>([])
  const [continuation, setContinuation] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<CanvaExportFormat>(() => preferredFormat(mode))

  const load = useCallback(async (opts?: { append?: boolean; continuation?: string; search?: string }) => {
    const append = opts?.append === true
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const result = await listCanvaDesignsApi({
        query: opts?.search,
        continuation: opts?.continuation,
      })
      setItems((prev) => (append ? [...prev, ...result.items] : result.items))
      setContinuation(result.continuation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Canva designs')
      if (!append) setItems([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void load()
    }, 0)
    return () => clearTimeout(t)
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void load({ search: query })
  }

  const handlePick = async (item: CanvaLibraryItem) => {
    setImportingId(item.id)
    setError(null)

    try {
      const { blob, filename: exportedName } = await importCanvaDesignApi({
        designId: item.id,
        designName: item.name,
        format,
      })

      const file = new File([blob], exportedName, {
        type: blob.type || (format === 'mp4' ? 'video/mp4' : 'image/png'),
      })

      onPicked({
        id: item.id,
        name: item.name,
        file,
        kind: kindFromFormat(format),
        thumb: item.thumb,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import design')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md duration-200 dark:bg-black/60">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-slate-200/50 bg-white shadow-2xl dark:border-white/5 dark:bg-[#0b0f19]">
        <div className="flex items-center justify-between border-b border-slate-200/50 p-5 sm:p-6 dark:border-white/5">
          <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white">
            <span className="rounded-xl bg-[#00C4CC]/10 p-2">
              <Palette className="h-5 w-5 text-[#00C4CC]" />
            </span>
            Your Canva designs
          </h3>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2.5 dark:bg-white/5">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/5">
          <form onSubmit={handleSearch} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-[13px] font-medium outline-none focus:border-[#00C4CC] dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
            />
          </form>
          {mode === 'both' ? (
            <div className="flex rounded-xl border border-slate-200 p-0.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold',
                  format === 'png' ? 'bg-[#00C4CC]/15 text-[#00C4CC]' : 'text-slate-500'
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </button>
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold',
                  format === 'mp4' ? 'bg-[#00C4CC]/15 text-[#00C4CC]' : 'text-slate-500'
                )}
              >
                <Video className="h-3.5 w-3.5" />
                Video
              </button>
            </div>
          ) : (
            <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
              Export as {format === 'mp4' ? 'MP4' : 'PNG'}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-16 text-[#00C4CC]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No designs found</p>
              <p className="mt-2 text-[13px] text-slate-500">
                Create a design in Canva, then come back here and pick it.
              </p>
              <a
                href="https://www.canva.com"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-[13px] font-bold text-[#00C4CC] hover:underline"
              >
                Open Canva
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => {
                const busy = importingId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={Boolean(importingId)}
                    onClick={() => void handlePick(item)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-[#00C4CC] disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800">
                      {item.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#00C4CC]">
                          <Palette className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      {busy && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <Loader2 className="h-7 w-7 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {busy ? 'Exporting & saving…' : 'Tap to use on card'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {continuation && !loading && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={loadingMore || Boolean(importingId)}
                onClick={() => void load({ append: true, continuation, search: query || undefined })}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-rose-200/60 bg-rose-50 px-5 py-3 text-[12px] font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
