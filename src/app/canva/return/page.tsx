'use client'

import {
  cancelCanvaImportSessionApi,
  fetchCanvaImportSessionApi,
  retryCanvaImportSessionApi,
} from '@/lib/canva/backendClient'
import { clearCanvaHandoff, readCanvaHandoff, rememberCanvaReadyImport } from '@/lib/canva/editHandoff'
import type { CanvaEditSession } from '@/lib/canva/types'
import { Loader2, Palette } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

function statusCopy(status: string | undefined, error?: string | null) {
  switch (status) {
    case 'importing':
      return 'Exporting design from Canva and uploading to vBiz Me…'
    case 'ready':
      return 'Ready to use — restoring your Card Builder field…'
    case 'failed':
      return error || 'Export failed'
    case 'expired':
      return 'Session expired — reconnect Canva and try again'
    case 'canceled':
      return 'Return canceled'
    case 'awaiting_return':
      return 'Waiting for Canva return…'
    default:
      return 'Processing Canva return…'
  }
}

function CanvaReturnInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId') || ''
  const canvaError = searchParams.get('canva_error')
  const [session, setSession] = useState<CanvaEditSession | null>(null)
  const [error, setError] = useState<string | null>(canvaError)
  const [busy, setBusy] = useState(false)

  // Derive missing-session messaging during render (no setState-in-effect).
  const missingSessionError =
    !sessionId && !canvaError && typeof window !== 'undefined' && !readCanvaHandoff()
      ? 'Missing Canva return session'
      : null
  const displayError = error || missingSessionError

  const redirectToField = useCallback(
    (s: CanvaEditSession) => {
      const base = s.builderRoute || '/'
      const url = new URL(base, window.location.origin)
      url.searchParams.set('canva_session', s.sessionId || s.id)
      url.searchParams.set('canva_field', s.fieldKey)
      if (s.itemKey) url.searchParams.set('canva_item', s.itemKey)
      url.searchParams.set('canva_return', 'ready')
      // Persist the uploaded URL so Featured Media can fill even if the field mounts after redirect.
      rememberCanvaReadyImport(s)
      clearCanvaHandoff()
      router.replace(`${url.pathname}${url.search}${url.hash}`)
    },
    [router]
  )

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const data = await fetchCanvaImportSessionApi(sessionId)
        if (cancelled) return
        setSession(data)
        setError(data.errorMessage || null)
        if (data.status === 'ready' && data.resultUrl) {
          redirectToField(data)
          return
        }
        if (data.status === 'failed' || data.status === 'expired' || data.status === 'canceled') {
          return
        }
        timer = setTimeout(() => void poll(), 1600)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load Canva import status')
        timer = setTimeout(() => void poll(), 2800)
      }
    }

    void poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sessionId, redirectToField])

  const onRetry = async () => {
    if (!sessionId) return
    setBusy(true)
    setError(null)
    try {
      const data = await retryCanvaImportSessionApi(sessionId)
      setSession(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setBusy(false)
    }
  }

  const onCancel = async () => {
    if (!sessionId) {
      router.replace('/')
      return
    }
    setBusy(true)
    try {
      await cancelCanvaImportSessionApi(sessionId)
    } catch {
      /* ignore */
    } finally {
      clearCanvaHandoff()
      setBusy(false)
      const route = session?.builderRoute || readCanvaHandoff()?.builderRoute || '/'
      router.replace(route)
    }
  }

  const status = session?.status
  const message = statusCopy(status, displayError)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#070a12]">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-tr from-[#00C4CC] to-[#7D2AE8] p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-[#0b0f19]">
            <Palette className="h-8 w-8 text-[#00C4CC]" />
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">Canva → vBiz Me</h1>
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>

        {(status === 'importing' ||
          status === 'awaiting_return' ||
          (!session && !displayError && Boolean(sessionId))) && (
          <Loader2 className="mx-auto mt-6 h-8 w-8 animate-spin text-[#7D2AE8]" />
        )}

        {displayError && status !== 'importing' && (
          <p className="mt-4 text-sm font-semibold text-rose-500">{displayError}</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {(status === 'failed' || status === 'expired') && sessionId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRetry()}
              className="rounded-2xl bg-linear-to-r from-[#00C4CC] to-[#7D2AE8] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Retrying…' : 'Retry export'}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void onCancel()}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200"
          >
            Back to Card Builder
          </button>
          {(status === 'expired' || /reconnect/i.test(displayError || '')) && (
            <Link href="/settings" className="text-sm font-bold text-[#00C4CC] underline">
              Reconnect Canva
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CanvaReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7D2AE8]" />
        </div>
      }
    >
      <CanvaReturnInner />
    </Suspense>
  )
}
