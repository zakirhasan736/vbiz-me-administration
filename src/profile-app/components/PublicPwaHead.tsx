'use client'

import { buildPwaManifestUrl } from '@/lib/pwa/resolvePublicCardPwa'
import { useEffect } from 'react'

type PublicPwaHeadProps = {
  slug: string
  ownerName?: string
}

/** Injects per-card manifest + apple-touch-icon so Save / Install uses avatar + name. */
export function PublicPwaHead({ slug, ownerName }: PublicPwaHeadProps) {
  useEffect(() => {
    const trimmed = slug.trim()
    if (!trimmed) return

    const manifestHref = buildPwaManifestUrl(trimmed)
    let manifestLink = document.querySelector<HTMLLinkElement>('link[data-pwa-manifest="card"]')
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      manifestLink.dataset.pwaManifest = 'card'
      document.head.appendChild(manifestLink)
    }
    manifestLink.href = manifestHref

    const iconHref = `/api/pwa/icon/${encodeURIComponent(trimmed)}?size=192`
    let appleLink = document.querySelector<HTMLLinkElement>('link[data-pwa-apple-icon="card"]')
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.dataset.pwaAppleIcon = 'card'
      document.head.appendChild(appleLink)
    }
    appleLink.href = iconHref

    if (ownerName?.trim()) {
      document.title = ownerName.trim()
    }

    return () => {
      /* keep manifest for the current card session */
    }
  }, [slug, ownerName])

  return null
}
