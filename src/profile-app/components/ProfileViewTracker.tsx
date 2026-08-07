'use client'

import { trackProfileView } from '@/profile-app/lib/profileSocialLinks'
import { useEffect } from 'react'

/** Records one unique profile_view per anonymous guest (skipped in editor iframe). */
export function ProfileViewTracker(props: { profileId?: string; slug?: string; embedded?: boolean }) {
  const { profileId, slug, embedded } = props

  useEffect(() => {
    if (embedded) return
    trackProfileView({ profileId, slug })
  }, [profileId, slug, embedded])

  return null
}
