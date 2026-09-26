'use client'

import { sentryReasonToMessage, shouldIgnoreSentryMessage } from '@/lib/sentry/ignore'
import { reportSentryEvent } from '@/lib/sentry/report'
import { useEffect } from 'react'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export function SentryBootstrap() {
  useEffect(() => {
    if (!dsn) return

    const onError = (event: ErrorEvent) => {
      const message = event.message || 'window.error'
      if (shouldIgnoreSentryMessage(message)) return
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
      if (shouldIgnoreSentryMessage(message)) return
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
