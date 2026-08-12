import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolveProfileTemplateFromMyCard } from '@/lib/api/myCard/resolveProfileTemplate'
import { fetchNavBarLinks } from '@/lib/api/navbar/fetchNavBarLinks'
import { resolveProfileSettingsTheme } from '@/lib/api/profileSettings/fetchProfileSettings'
import { fallbackLiveAgentPrompt, resolveLiveAgentPromptFromProfileId } from '@/lib/liveAgent/resolveLiveAgentPrompt'
import PublicProfileLayout from '@/views/PublicProfileLayout'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

/** `/v/{slug}` — public vcard (Node `/api/v1/public`, template-services parity). */
export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params
  const trimmed = slug?.trim()

  if (!trimmed) {
    notFound()
  }

  const myCard = await fetchMyCardBySlug(trimmed)
  if (!myCard) {
    notFound()
  }

  const profileId = myCard.profile.id
  const template = resolveProfileTemplateFromMyCard(myCard)
  const liveAgentEnabled = isAiAssistanceEnabled(
    myCard.settings?.[AI_ASSISTANCE_SETTING_KEY] ?? myCard.features?.aiAssistance
  )

  const [navBarLinks, liveAgent, profileSettings] = await Promise.all([
    fetchNavBarLinks(profileId),
    liveAgentEnabled ? resolveLiveAgentPromptFromProfileId(profileId) : Promise.resolve(null),
    resolveProfileSettingsTheme(profileId, template),
  ])

  const agent = liveAgentEnabled ? (liveAgent ?? fallbackLiveAgentPrompt()) : null

  return (
    <PublicProfileLayout
      slug={trimmed}
      initialMyCard={myCard}
      initialNavBarLinks={navBarLinks}
      initialProfileSettings={profileSettings}
      liveAgentCardData={agent?.cardData}
      liveAgentSystemPrompt={agent?.systemPrompt}
    />
  )
}
