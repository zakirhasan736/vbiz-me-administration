import { SAFE_DOM_UNMOUNT_BOOTSTRAP } from '@/lib/dom/safeDomUnmount'
import Script from 'next/script'

/* Same beforeInteractive pattern as StaleChunkReloadBootstrap in the root layout. */
/* eslint-disable @next/next/no-before-interactive-script-outside-document -- root layout bootstrap */

/** Patch removeChild/insertBefore before React hydrates (Sentry JAVASCRIPT-NEXTJS-3). */
export function SafeDomUnmountBootstrap() {
  return (
    <Script
      id="vbiz-safe-dom-unmount"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: SAFE_DOM_UNMOUNT_BOOTSTRAP,
      }}
    />
  )
}
