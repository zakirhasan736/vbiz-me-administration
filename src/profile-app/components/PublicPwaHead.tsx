'use client'

import { buildPwaManifestUrl } from '@/lib/pwa/resolvePublicCardPwa'
import type { VCardSeo } from '@/types/vcard'
import { useEffect } from 'react'

type PublicPwaHeadProps = {
  slug: string
  ownerName?: string
  seo?: VCardSeo
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
export function PublicPwaHead({ slug, ownerName, seo }: PublicPwaHeadProps) {
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

    const title = seo?.metaTitle?.trim() || ownerName?.trim()
    if (title) document.title = title

    const updateMeta = (name: string, content: string) => {
      const metas = Array.from(document.querySelectorAll<HTMLMetaElement>(`meta[name="${name}"]`))
      if (!content) {
        metas.forEach((meta) => meta.remove())
        return
      }
      const meta = metas[0]
      if (!meta) {
        const created = document.createElement('meta')
        created.name = name
        document.head.appendChild(created)
        metas.push(created)
      }
      metas[0].content = content
      metas[0].dataset.vbizSeo = 'card'
      metas.slice(1).forEach((duplicate) => duplicate.remove())
    }

    updateMeta('description', seo?.metaDescription?.trim() || '')
    updateMeta('keywords', seo?.metaKeywords?.join(', ') || '')

    void ensurePublicCardServiceWorker()
  }, [slug, ownerName, seo])

  return null
}
