'use client'

import { hasSeenProfileIntro, markProfileIntroSeen } from '@/profile-app/lib/profileIntroSession'
import { useCallback, useEffect, useState } from 'react'

type Options = {
  embedded?: boolean
  profileSlug?: string
  shareSlug?: string
  explainerVideoUrl?: string | null
}

type IntroState = {
  showPreloader: boolean
  introAllowed: boolean
}

function resolveIntroState(embedded: boolean, slug: string, isClient: boolean): IntroState {
  if (embedded) {
    return { showPreloader: false, introAllowed: true }
  }
  if (!isClient) {
    return { showPreloader: false, introAllowed: false }
  }
  if (!slug) {
    return { showPreloader: true, introAllowed: false }
  }
  if (hasSeenProfileIntro(slug)) {
    return { showPreloader: false, introAllowed: true }
  }
  return { showPreloader: true, introAllowed: false }
}

/**
 * Intro / preloader runs once per profile per browser tab (not on every section route).
 */
export function useProfileIntro({ embedded = false, profileSlug, shareSlug, explainerVideoUrl }: Options) {
  const slug = profileSlug?.trim() || shareSlug?.trim() || ''
  const hasVideo = Boolean(explainerVideoUrl?.trim())
  const isClient = typeof window !== 'undefined'
  const syncKey = `${embedded}\0${slug}`

  const [introState, setIntroState] = useState<IntroState>(() => resolveIntroState(embedded, slug, isClient))
  const [clientReady, setClientReady] = useState(isClient)
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey)

  if (!clientReady && isClient) {
    setClientReady(true)
    setIntroState(resolveIntroState(embedded, slug, true))
  }

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey)
    setIntroState(resolveIntroState(embedded, slug, isClient))
  }

  const endPreloader = useCallback(() => {
    setIntroState({ showPreloader: false, introAllowed: true })
    markProfileIntroSeen(slug)
  }, [slug])

  useEffect(() => {
    if (embedded || !slug || hasSeenProfileIntro(slug) || hasVideo) return
    const t = window.setTimeout(() => endPreloader(), 900)
    return () => window.clearTimeout(t)
  }, [embedded, slug, hasVideo, endPreloader])

  return {
    showPreloader: clientReady && introState.showPreloader,
    introAllowed: embedded || introState.introAllowed,
    endPreloader,
    hasVideo,
  }
}
