'use client'

import { PROFILE_EXPERIENCE_SETTLED_EVENT, isProfileExperienceSettled } from '@/lib/push/notificationExperience'
import { ProfileIntroPreloader } from '@/profile-app/components/ProfileIntroPreloader'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'
import { useEffect, useState } from 'react'

type Props = {
  explainerVideoUrl?: string | null
}

/**
 * Shared full-screen intro video for every template (v1 / v2 / v3).
 * Plays after the brand loader settles on every full page reload: loader -> intro video -> content.
 */
export function ProfileIntroOverlay({ explainerVideoUrl }: Props) {
  const { showPreloader, endPreloader, hasVideo } = useProfileIntroContext()
  const [settled, setSettled] = useState(() => isProfileExperienceSettled())

  useEffect(() => {
    if (settled) return
    const onSettled = () => setSettled(true)
    window.addEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
    return () => window.removeEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
  }, [settled])

  const src = explainerVideoUrl?.trim()
  if (!settled || !showPreloader || !hasVideo || !src) return null

  return <ProfileIntroPreloader videoUrl={src} onSkip={endPreloader} />
}
