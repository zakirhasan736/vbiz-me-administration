'use client'

import { enrichPushPayloadWithCardMedia, readCardPushMediaSync } from '@/lib/push/cardPushMediaCache'
import { isPushSupported, registerServiceWorker } from '@/lib/push/config'
import type { PlatformUpdateDetail } from '@/lib/push/types'
import { useEffect } from 'react'

function dispatchPlatformUpdate(detail: PlatformUpdateDetail) {
  window.dispatchEvent(new CustomEvent('vbiz_platform_update', { detail }))
}

/** Registers the service worker once for the whole app. */
export function PushNotificationRegistrar() {
  useEffect(() => {
    if (!isPushSupported()) return
    void registerServiceWorker()

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        payload?: PlatformUpdateDetail
        url?: string
        requestId?: string
        slug?: string
      }

      // Service worker asks for the card owner logo/avatar for the OS notification icon.
      if (data?.type === 'vbiz_push_media_request' && data.requestId && navigator.serviceWorker.controller) {
        const media = readCardPushMediaSync(data.slug || null)
        navigator.serviceWorker.controller.postMessage({
          type: 'vbiz_push_media_response',
          requestId: data.requestId,
          media,
        })
        return
      }

      if (data?.type === 'vbiz_navigate' && typeof data.url === 'string' && data.url) {
        window.location.href = data.url
        return
      }
      if (data?.type !== 'vbiz_push' || !data.payload) return

      const enriched = enrichPushPayloadWithCardMedia(
        data.payload as PlatformUpdateDetail & Record<string, unknown>
      ) as PlatformUpdateDetail

      dispatchPlatformUpdate(enriched)
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }, [])

  return null
}
