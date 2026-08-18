'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { buildProfilePath } from '@/lib/profileRoutes'
import { buildPwaManifestUrl } from '@/lib/pwa/resolvePublicCardPwa'
import { buildPublicCardCanonicalUrl, toAbsoluteUrl } from '@/lib/seo/publicCardSeo'
import type { VCardSeo } from '@/types/vcard'
import { useEffect } from 'react'

type PublicPwaHeadProps = {
  slug: string
  ownerName?: string
  seo?: VCardSeo
  imageUrl?: string
}

async function ensurePublicCardServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  } catch {
    /* Chrome can still offer Install from the address bar once the manifest is valid */
  }
}

function upsertNamedMeta(name: string, content: string) {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>(`meta[name="${name}"]`))
  if (!content) {
    metas.forEach((meta) => meta.remove())
    return
  }
  let meta = metas[0]
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
  meta.dataset.vbizSeo = 'card'
  metas.slice(1).forEach((duplicate) => duplicate.remove())
}

function upsertPropertyMeta(property: string, content: string) {
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>(`meta[property="${property}"]`))
  if (!content) {
    metas.forEach((meta) => meta.remove())
    return
  }
  let meta = metas[0]
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.content = content
  meta.dataset.vbizSeo = 'card'
  metas.slice(1).forEach((duplicate) => duplicate.remove())
}

/** Injects per-card manifest + apple-touch-icon so Chrome / iOS can install this card. */
export function PublicPwaHead({ slug, ownerName, seo, imageUrl }: PublicPwaHeadProps) {
  useEffect(() => {
    const trimmed = slug.trim()
    if (!trimmed) return

    const origin = window.location.origin
    const canonical = buildPublicCardCanonicalUrl(origin, buildProfilePath(trimmed))
    const title = seo?.metaTitle?.trim() || ownerName?.trim() || ''
    const description = seo?.metaDescription?.trim() || ''
    const keywords = seo?.metaKeywords?.join(', ') || ''
    const image = imageUrl?.trim() && !isVideoUrl(imageUrl) ? toAbsoluteUrl(origin, imageUrl) : ''

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

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.href = canonical
    canonicalLink.dataset.vbizSeo = 'card'

    if (title) document.title = title

    upsertNamedMeta('description', description)
    upsertNamedMeta('keywords', keywords)
    upsertNamedMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    upsertNamedMeta('twitter:title', title)
    upsertNamedMeta('twitter:description', description)
    upsertNamedMeta('twitter:image', image)
    upsertPropertyMeta('og:type', 'profile')
    upsertPropertyMeta('og:title', title)
    upsertPropertyMeta('og:description', description)
    upsertPropertyMeta('og:url', canonical)
    upsertPropertyMeta('og:image', image)

    void ensurePublicCardServiceWorker()
  }, [slug, ownerName, seo, imageUrl])

  return null
}
