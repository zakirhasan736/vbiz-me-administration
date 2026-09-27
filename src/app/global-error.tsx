'use client'

import { isStaleChunkLoadError, reloadForStaleChunk, shouldReloadForStaleChunk } from '@/lib/staleChunkReload'
import { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (!isStaleChunkLoadError(error)) return
    if (shouldReloadForStaleChunk(Date.now(), window.sessionStorage)) {
      reloadForStaleChunk()
    }
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: 420, padding: '2rem 1.25rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 650, margin: '0 0 0.75rem' }}>This page needs a fresh load.</h1>
          <p style={{ margin: '0 0 1.5rem', lineHeight: 1.5, color: '#cbd5e1' }}>
            A newer version of the app is available. Refresh to continue.
          </p>
          <button
            type="button"
            onClick={() => reset()}
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
            Refresh
          </button>
        </main>
      </body>
    </html>
  )
}
