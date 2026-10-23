'use client'

import { useAppSelector } from '@/hooks/redux'
import { audioFromDisplaySettings } from '@/lib/backgroundAudio/audioFromDisplaySettings'
import { BackgroundAudio } from '@/profile-app/components/BackgroundAudio'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'
import { selectProfileMediaBySlug } from '@/redux/features/myCard/myCard.selectors'
import { useMemo } from 'react'

type Props = {
  profileSlug?: string
  shareSlug?: string
}

export function ProfileBackgroundAudio({ profileSlug, shareSlug }: Props) {
  const slug = (profileSlug ?? shareSlug ?? '').trim()
  const fromApi = useAppSelector((state) => (slug ? selectProfileMediaBySlug(state, slug)?.audio : null))
  const { design, embedded, previewActive, settings } = useProfileDisplay()
  const { introAllowed } = useProfileIntroContext()

  const fromDisplay = useMemo(() => audioFromDisplaySettings(settings), [settings])
  // Live editor + public card: prefer Home Media display fields so fresh uploads/YouTube links play immediately.
  // Fall back to API so published YouTube BG music still plays even if display snapshot lags.
  const audio = fromDisplay || fromApi || null

  return (
    <BackgroundAudio audio={audio} design={design} embedded={embedded} readyToPlay={introAllowed && previewActive} />
  )
}
