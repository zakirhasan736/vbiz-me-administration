import { buildProfilePath, DEFAULT_PROFILE_SECTION, isValidProfileSection } from '@/lib/profileRoutes'
import PublicProfileSection from '@/views/PublicProfileSection'
import { notFound, redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string; section: string }>
}

/** `/v/{slug}/{section}` */
export default async function PublicVCardSectionPage({ params }: Props) {
  const { slug, section } = await params
  const trimmedSlug = slug?.trim()
  const sectionId = section?.trim()

  if (!trimmedSlug || !sectionId) {
    notFound()
  }

  if (!isValidProfileSection(sectionId)) {
    redirect(buildProfilePath(trimmedSlug, DEFAULT_PROFILE_SECTION))
  }

  return <PublicProfileSection sectionId={sectionId} />
}
