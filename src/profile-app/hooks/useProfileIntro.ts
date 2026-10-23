'use client'

import { isProfileExperienceSettled, PROFILE_EXPERIENCE_SETTLED_EVENT } from '@/lib/push/notificationExperience'
import { publishHomeMediaSoundPreference } from '@/profile-app/lib/homeMediaSound'
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
  if (hasSeenProfileIntro(slug) || isProfileExperienceSettled()) {
    return { showPreloader: false, introAllowed: true }
  }
  return { showPreloader: true, introAllowed: false }
}

/**
 * Intro plays on every full page reload. Within the same tab session, it runs once
 * per profile (section navigation does not replay it).
 */
export function useProfileIntro({ embedded = false, profileSlug, shareSlug, explainerVideoUrl }: Options) {
  const slug = profileSlug?.trim() || shareSlug?.trim() || ''
  const rawVideo = explainerVideoUrl?.trim() || ''
  /** Uploaded file or YouTube URL — both play inline in the intro overlay. */
  const hasVideo = Boolean(rawVideo)
  const isClient = typeof window !== 'undefined'
  const syncKey = `${embedded}\0${slug}`

  const [introState, setIntroState] = useState<IntroState>(() => resolveIntroState(embedded, slug, isClient))
  const [clientReady, setClientReady] = useState(isClient)
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey)
  /** Visitor unmuted the intro — unlock sound on home profile video after intro (background wallpaper stays muted). */
  const [homeMediaSoundUnlocked, setHomeMediaSoundUnlocked] = useState(false)

  if (!clientReady && isClient) {
    setClientReady(true)
    setIntroState(resolveIntroState(embedded, slug, true))
  }

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey)
    setIntroState(resolveIntroState(embedded, slug, isClient))
    setHomeMediaSoundUnlocked(false)
  }

  const endPreloader = useCallback(() => {
    setIntroState({ showPreloader: false, introAllowed: true })
    markProfileIntroSeen(slug)
  }, [slug])

  const unlockHomeMediaSound = useCallback((unlocked: boolean) => {
    setHomeMediaSoundUnlocked(unlocked)
    // Fire synchronously so the home bg <video> can unmute/play in this user gesture.
    publishHomeMediaSoundPreference(unlocked)
  }, [])

  useEffect(() => {
    if (embedded || !slug || hasVideo) return
    if (!introState.showPreloader) return

    const onSettled = () => endPreloader()
    window.addEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
    const failsafe = window.setTimeout(onSettled, 4000)
    return () => {
      window.removeEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
      window.clearTimeout(failsafe)
    }
  }, [embedded, slug, hasVideo, introState.showPreloader, endPreloader])

  return {
    showPreloader: clientReady && introState.showPreloader,
    introAllowed: embedded || introState.introAllowed,
    endPreloader,
    hasVideo,
    homeMediaSoundUnlocked,
    unlockHomeMediaSound,
  }
}
