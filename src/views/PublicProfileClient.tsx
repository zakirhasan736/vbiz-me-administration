'use client'

import { parseProfileSegments } from '@/lib/profileRoutes'
import PublicProfileLayout from '@/views/PublicProfileLayout'
import PublicProfileSection from '@/views/PublicProfileSection'

type Props = {
  slug: string
  segments?: string[]
}

/** Full public profile (layout + section) for standalone / legacy imports. */
export default function PublicProfileClient({ slug, segments }: Props) {
  const { sectionId } = parseProfileSegments(segments)
  return (
    <PublicProfileLayout slug={slug}>
      <PublicProfileSection sectionId={sectionId} />
    </PublicProfileLayout>
  )
}
