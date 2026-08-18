'use client'

import { useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme: 'auto'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    }
  ) => string
  reset: (widgetId?: string) => void
  remove?: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const TURNSTILE_SCRIPT_ID = 'vbizme-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export const isTurnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())

let scriptLoadPromise: Promise<void> | null = null

const loadTurnstileScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Turnstile requires a browser'))
  if (window.turnstile) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')

    const handleLoad = () => {
      if (window.turnstile) {
        resolve()
      } else {
        reject(new Error('Turnstile loaded without its browser API'))
      }
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true })

    if (!existingScript) {
      script.id = TURNSTILE_SCRIPT_ID
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  scriptLoadPromise = promise.catch((error) => {
    scriptLoadPromise = null
    throw error
  })

  return scriptLoadPromise
}

type TurnstileWidgetProps = {
  resetSignal?: number
  onToken: (token: string | null) => void
  onError?: () => void
}

const TurnstileWidget = ({ resetSignal = 0, onToken, onError }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const lastResetSignalRef = useRef(resetSignal)
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)
  const [loadError, setLoadError] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''

  useEffect(() => {
    onTokenRef.current = onToken
    onErrorRef.current = onError
  }, [onError, onToken])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let cancelled = false

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => {
            onTokenRef.current(null)
            onErrorRef.current?.()
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true)
          onErrorRef.current?.()
        }
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove?.(widgetIdRef.current)
      }
      widgetIdRef.current = null
    }
  }, [siteKey])

  useEffect(() => {
    if (lastResetSignalRef.current === resetSignal) return
    lastResetSignalRef.current = resetSignal
    setLoadError(false)
    onTokenRef.current(null)
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  if (!siteKey) return null

  return (
    <div ref={containerRef} className="min-h-[65px]" data-testid="turnstile-widget">
      {loadError ? (
        <p className="text-left text-xs text-red-500" role="alert">
          Security verification is unavailable. Please try again.
        </p>
      ) : null}
    </div>
  )
}

export default TurnstileWidget
