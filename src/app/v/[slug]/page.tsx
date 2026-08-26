import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolveProfileTemplateFromMyCard } from '@/lib/api/myCard/resolveProfileTemplate'
import { fetchNavBarLinks } from '@/lib/api/navbar/fetchNavBarLinks'
import { resolveProfileSettingsTheme } from '@/lib/api/profileSettings/fetchProfileSettings'
import { fetchPublicReviews } from '@/lib/api/reviews/fetchPublicReviews'
import { resolveLiveAgentPromptFromProfileId } from '@/lib/liveAgent/resolveLiveAgentPrompt'
import { buildProfilePath } from '@/lib/profileRoutes'
import { buildPwaManifestUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import {
  buildPublicCardJsonLd,
  buildPublicCardSeoMetadata,
  resolvePublicOrigin,
  resolveRequestOrigin,
  serializeJsonLd,
} from '@/lib/seo/publicCardSeo'
import PublicProfileLayout from '@/views/PublicProfileLayout'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

async function publicCardOrigin() {
  const headerStore = await headers()
  return resolvePublicOrigin(
    process.env.NEXT_PUBLIC_APP_URL,
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trimmed = slug?.trim()
  if (!trimmed) return {}

  const myCard = await fetchMyCardBySlug(trimmed)
  const name = resolvePwaDisplayName(myCard?.profile?.name?.trim() || myCard?.profile?.company_name, trimmed)
  const headerStore = await headers()
  const requestOrigin = resolveRequestOrigin(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
  const icon192 = `/v/${encodeURIComponent(trimmed)}/icon/192`
  const icon512 = `/v/${encodeURIComponent(trimmed)}/icon/512`
  const pwaMeta: Metadata = {
    metadataBase: new URL(requestOrigin),
    applicationName: name,
    appleWebApp: {
      capable: true,
      title: name,
      statusBarStyle: 'black-translucent',
    },
    icons: {
      apple: icon192,
      icon: [
        { url: icon192, sizes: '192x192', type: 'image/png' },
        { url: icon512, sizes: '512x512', type: 'image/png' },
      ],
    },
    manifest: buildPwaManifestUrl(trimmed),
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }

  if (!myCard) {
    return { title: name, description: `${name}'s digital business card`, ...pwaMeta }
  }

  const origin = await publicCardOrigin()
  const seo = buildPublicCardSeoMetadata({
    slug: trimmed,
    origin,
    cardPath: buildProfilePath(trimmed),
    myCard,
  })

  return {
    ...seo,
    ...pwaMeta,
    applicationName: name,
    appleWebApp: {
      capable: true,
      title: name,
      statusBarStyle: 'black-translucent',
    },
  }
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
    myCard.settings?.[AI_ASSISTANCE_SETTING_KEY] ?? myCard.features?.aiAssistance,
    trimmed
  )
  const origin = await publicCardOrigin()
  const cardPath = buildProfilePath(trimmed)

  const settled = await Promise.allSettled([
    fetchNavBarLinks(profileId),
    liveAgentEnabled ? resolveLiveAgentPromptFromProfileId(profileId) : Promise.resolve(null),
    resolveProfileSettingsTheme(profileId, template),
    fetchPublicReviews(String(profileId)),
  ])
  const [navBarLinks, liveAgent, profileSettings, reviews] = settled.map((result) =>
    result.status === 'fulfilled' ? result.value : null
  ) as [
    Awaited<ReturnType<typeof fetchNavBarLinks>>,
    Awaited<ReturnType<typeof resolveLiveAgentPromptFromProfileId>> | null,
    Awaited<ReturnType<typeof resolveProfileSettingsTheme>>,
    Awaited<ReturnType<typeof fetchPublicReviews>>,
  ]

  const agent = liveAgentEnabled ? liveAgent : null
  const jsonLd = buildPublicCardJsonLd({
    slug: trimmed,
    origin,
    cardPath,
    myCard,
    reviews,
  })

  return (
    <>
      <link rel="manifest" href={buildPwaManifestUrl(trimmed)} />
      <link rel="apple-touch-icon" href={`${cardPath}/icon/192`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <PublicProfileLayout
        slug={trimmed}
        initialMyCard={myCard}
        initialNavBarLinks={navBarLinks}
        initialProfileSettings={profileSettings}
        liveAgentCardData={agent?.cardData}
        liveAgentSystemPrompt={agent?.systemPrompt}
      />
    </>
  )
}
