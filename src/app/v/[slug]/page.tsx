import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import PublicProfileSection from '@/views/PublicProfileSection'

/** `/v/{slug}` → home section */
export default function PublicVCardHomePage() {
  return <PublicProfileSection sectionId={DEFAULT_PROFILE_SECTION} />
}
