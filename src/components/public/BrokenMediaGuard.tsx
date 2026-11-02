'use client'

import { applyBrokenMediaFallback, findAlreadyBrokenImages, isGuardableMedia } from '@/lib/media/brokenMedia'
import { useEffect } from 'react'

/**
 * Public card only: if any image/video fails to load (e.g. a missing S3 file that
 * answers with AccessDenied), show a neutral placeholder instead of a broken icon.
 * Media `error` events do not bubble, so we listen in the capture phase.
 */
export function BrokenMediaGuard() {
  useEffect(() => {
    const onError = (event: Event) => {
      if (isGuardableMedia(event.target)) applyBrokenMediaFallback(event.target)
    }
    document.addEventListener('error', onError, true)
    for (const img of findAlreadyBrokenImages(document)) applyBrokenMediaFallback(img)
    return () => document.removeEventListener('error', onError, true)
  }, [])
  return null
}
