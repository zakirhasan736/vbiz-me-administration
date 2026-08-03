'use client'

import PublicProfileLayout from '@/views/PublicProfileLayout'

type Props = {
  slug: string
  /** @deprecated Sections are client-state only (template-services parity). */
  segments?: string[]
}

/** Full public profile for standalone / legacy imports. */
export default function PublicProfileClient({ slug }: Props) {
  return <PublicProfileLayout slug={slug} />
}
