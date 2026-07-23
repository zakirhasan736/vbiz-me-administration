'use client'

import { ProfileSectionOutlet } from '@/profile-app/components/ProfileSectionOutlet'

type Props = {
  sectionId: string
}

/** Route page slot: animated section content only (shell + cover live in layout). */
export default function PublicProfileSection({ sectionId }: Props) {
  return <ProfileSectionOutlet sectionId={sectionId} />
}
