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
      const message = event.message || 'window.error'
      if (recoverStaleChunk(event.error || message)) return
      if (!dsn || shouldIgnoreSentryMessage(message)) return
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
      if (!dsn || shouldIgnoreSentryMessage(message)) return
      void reportSentryEvent({
        dsn,
        message,
        extra: { kind: 'unhandledrejection', userAgent: navigator.userAgent },
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
