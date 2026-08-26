'use client'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Infrastructure failures for `/v/[slug]` — never a fake 404. */
export default function PublicCardError({ error: _error, reset }: Props) {
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
        <h1 style={{ fontSize: '1.35rem', fontWeight: 650, margin: '0 0 0.75rem' }}>
          We&apos;re having trouble loading this card right now.
        </h1>
        <p style={{ margin: '0 0 1.5rem', lineHeight: 1.5, color: '#cbd5e1' }}>Please try again in a moment.</p>
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
          Try Again
        </button>
      </div>
    </main>
  )
}
