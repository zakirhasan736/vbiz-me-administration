import { TRANSLATION_EARLY_BOOTSTRAP_SCRIPT } from '@/lib/i18n/translationPersistence'
import Script from 'next/script'

/** Restores googtrans cookie from localStorage before React hydrates (per-card language memory). */
export function TranslationEarlyBootstrap() {
  return (
    <Script id="vbiz-translation-early-bootstrap" strategy="beforeInteractive">
      {TRANSLATION_EARLY_BOOTSTRAP_SCRIPT}
    </Script>
  )
}
