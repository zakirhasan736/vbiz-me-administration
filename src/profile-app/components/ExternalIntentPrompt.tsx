'use client'

import { VBIZ_EXTERNAL_INTENT_EVENT, type ExternalIntentDetail } from '@/profile-app/lib/openExternalIntent'
import { ExternalLink, Mail, MessageSquare, Phone, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

function IntentIcon({ kind }: { kind: ExternalIntentDetail['kind'] }) {
  const className = 'h-6 w-6 shrink-0'
  if (kind === 'call') return <Phone className={className} strokeWidth={2.25} />
  if (kind === 'email') return <Mail className={className} strokeWidth={2.25} />
  if (kind === 'sms') return <MessageSquare className={className} strokeWidth={2.25} />
  return <ExternalLink className={className} strokeWidth={2.25} />
}

function ctaLabel(kind: ExternalIntentDetail['kind'], label: string): string {
  if (kind === 'call') return 'Open Phone Dialer'
  if (kind === 'email') return 'Open Email App'
  if (kind === 'sms') return 'Open Messages / SMS'
  return label
}

/**
 * Hard confirm UI for call / email / SMS.
 * Auto-open is attempted first; if the browser blocks it (common for async AI tools),
 * this modal gives a real user-gesture `<a href>` that reliably launches the default app.
 */
export function ExternalIntentPrompt() {
  const [intent, setIntent] = useState<ExternalIntentDetail | null>(null)
  const linkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const onIntent = (event: Event) => {
      const detail = (event as CustomEvent<ExternalIntentDetail>).detail
      if (!detail?.href || !detail.label) return
      setIntent(detail)
    }
    window.addEventListener(VBIZ_EXTERNAL_INTENT_EVENT, onIntent)
    return () => window.removeEventListener(VBIZ_EXTERNAL_INTENT_EVENT, onIntent)
  }, [])

  useEffect(() => {
    if (!intent) return
    const timer = window.setTimeout(() => setIntent(null), 45000)
    // Focus CTA so keyboard / accessibility users can activate quickly.
    const focusTimer = window.setTimeout(() => linkRef.current?.focus(), 120)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(focusTimer)
    }
  }, [intent])

  const handleOpen = () => {
    if (!intent) return
    // Reinforce navigation inside the real user gesture from this tap.
    if (/^(tel:|mailto:|sms:)/i.test(intent.href)) {
      try {
        window.location.href = intent.href
      } catch {
        /* <a href> still handles it */
      }
    }
    setIntent(null)
  }

  return (
    <AnimatePresence>
      {intent ? (
        <motion.div
          key={intent.href + intent.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-300 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vbiz-external-intent-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIntent(null)}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex items-center gap-3 pr-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                <IntentIcon kind={intent.kind} />
              </div>
              <div className="min-w-0">
                <h2 id="vbiz-external-intent-title" className="text-lg font-bold text-white">
                  {ctaLabel(intent.kind, intent.label)}
                </h2>
                <p className="text-sm text-zinc-400">
                  {intent.description
                    ? intent.description
                    : 'Tap once to open your default app. Browsers often block automatic open from voice commands.'}
                </p>
              </div>
            </div>

            <a
              ref={linkRef}
              href={intent.href}
              target={/^https?:/i.test(intent.href) ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={handleOpen}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-base font-bold text-zinc-950 transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              <IntentIcon kind={intent.kind} />
              {ctaLabel(intent.kind, intent.label)}
            </a>

            <p className="mt-3 text-center text-[11px] text-zinc-500">
              If nothing opens, check that a Phone / Mail / Messages app is installed and set as default.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
