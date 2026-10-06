'use client'

import { sentryReasonToMessage, shouldIgnoreSentryMessage } from '@/lib/sentry/ignore'
import { reportSentryEvent } from '@/lib/sentry/report'
import { isStaleChunkLoadError, reloadForStaleChunk, shouldReloadForStaleChunk } from '@/lib/staleChunkReload'
import { useEffect } from 'react'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

function recoverStaleChunk(reason: unknown) {
  if (!isStaleChunkLoadError(reason)) return false
  if (shouldReloadForStaleChunk(Date.now(), window.sessionStorage)) {
    reloadForStaleChunk()
  }
  return true
}

export function SentryBootstrap() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const fromError = sentryReasonToMessage(event.error)
      const raw = (event.message || '').trim()
      const message = raw && !shouldIgnoreSentryMessage(raw) ? raw : fromError || raw
      if (recoverStaleChunk(event.error || message)) return
      if (!message || shouldIgnoreSentryMessage(message)) {
        event.preventDefault()
        return
      }
      if (!dsn) return
      void reportSentryEvent({
        dsn,
        message,
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
        },
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = sentryReasonToMessage(event.reason)
      if (recoverStaleChunk(event.reason || message)) return
      if (!message || shouldIgnoreSentryMessage(message)) {
        event.preventDefault()
        return
      }
      if (!dsn) return
      void reportSentryEvent({
        dsn,
        message,
        extra: { kind: 'unhandledrejection', userAgent: navigator.userAgent },
      })
    }

    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
