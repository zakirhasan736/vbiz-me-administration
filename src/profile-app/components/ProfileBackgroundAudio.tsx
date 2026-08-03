'use client'

import { useAppSelector } from '@/hooks/redux'
import { BackgroundAudio } from '@/profile-app/components/BackgroundAudio'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'
import { selectProfileMediaBySlug } from '@/redux/features/myCard/myCard.selectors'

type Props = {
  profileSlug?: string
  shareSlug?: string
}

export function ProfileBackgroundAudio({ profileSlug, shareSlug }: Props) {
  const slug = (profileSlug ?? shareSlug ?? '').trim()
  const audio = useAppSelector((state) => (slug ? selectProfileMediaBySlug(state, slug)?.audio : null))
  const { design, embedded } = useProfileDisplay()
  const { introAllowed } = useProfileIntroContext()

  return <BackgroundAudio audio={audio} design={design} embedded={embedded} readyToPlay={introAllowed} />
}
