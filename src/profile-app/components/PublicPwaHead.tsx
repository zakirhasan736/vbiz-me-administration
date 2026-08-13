'use client'

import { buildPwaManifestUrl } from '@/lib/pwa/resolvePublicCardPwa'
import { useEffect } from 'react'

type PublicPwaHeadProps = {
  slug: string
  ownerName?: string
}

async function ensurePublicCardServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  } catch {
    /* Chrome can still offer Install from the address bar once the manifest is valid */
  }
}

/** Injects per-card manifest + apple-touch-icon so Chrome / iOS can install this card. */
export function PublicPwaHead({ slug, ownerName }: PublicPwaHeadProps) {
  useEffect(() => {
    const trimmed = slug.trim()
    if (!trimmed) return

    const manifestHref = buildPwaManifestUrl(trimmed)
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }
    manifestLink.href = manifestHref
    manifestLink.dataset.pwaManifest = 'card'

    const iconHref = `/v/${encodeURIComponent(trimmed)}/icon/192`
    let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = iconHref
    appleLink.dataset.pwaAppleIcon = 'card'

    if (ownerName?.trim()) {
      document.title = ownerName.trim()
    }

    void ensurePublicCardServiceWorker()
  }, [slug, ownerName])

  return null
}
