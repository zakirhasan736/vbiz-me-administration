'use client'

import { useEffect, useRef } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

const AUTO_RETRY_KEY = 'vbiz_vcard_error_auto_retry'
const MAX_AUTO_RETRIES = 3

/** Last-resort UI — page soft-fails to client fetch first; this auto-retries briefly. */
export default function PublicCardError({ error: _error, reset }: Props) {
  const resetting = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || resetting.current) return
    let attempt = 0
    try {
      attempt = Number(window.sessionStorage.getItem(AUTO_RETRY_KEY) || '0') || 0
    } catch {
      attempt = 0
    }
    if (attempt >= MAX_AUTO_RETRIES) return

    resetting.current = true
    try {
      window.sessionStorage.setItem(AUTO_RETRY_KEY, String(attempt + 1))
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(
      () => {
        reset()
      },
      600 + attempt * 700
    )
    return () => window.clearTimeout(timer)
  }, [reset])

  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        background: '#0b0f19',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 650, margin: '0 0 0.75rem' }}>Loading your card…</h1>
        <p style={{ margin: '0 0 1.5rem', lineHeight: 1.5, color: '#cbd5e1' }}>
          Reconnecting. This usually resolves in a moment.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(AUTO_RETRY_KEY)
            } catch {
              /* ignore */
            }
            reset()
          }}
          style={{
            appearance: 'none',
            border: 0,
            borderRadius: 999,
            padding: '0.7rem 1.4rem',
            background: '#f8fafc',
            color: '#0b0f19',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    </main>
  )
}
