import type { ReviewItem } from '@/interfaces/api/reviews.interface'
import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { fetchPublicCardBootstrap } from '@/lib/api/myCard/fetchPublicCardBootstrap'
import { resolveProfileTemplateFromMyCard } from '@/lib/api/myCard/resolveProfileTemplate'
import { mapProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { buildReviewsQueryResult } from '@/lib/api/reviews/mapReviews'
import { resolveLiveAgentPromptFromProfileId } from '@/lib/liveAgent/resolveLiveAgentPrompt'
import { buildProfileIconPath, buildProfilePath } from '@/lib/profileRoutes'
import { buildPwaManifestUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import {
  buildPublicCardJsonLd,
  buildPublicCardSeoMetadata,
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

function reviewsFromBootstrapSection(section: unknown) {
  if (!section || typeof section !== 'object') return null
  const payload = section as { items?: ReviewItem[]; postType?: { title?: string } }
  if (!Array.isArray(payload.items)) return null
  return buildReviewsQueryResult(payload.items, payload.postType?.title?.trim() || 'Reviews')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trimmed = slug?.trim()
  if (!trimmed) return {}

  const bootstrap = await fetchPublicCardBootstrap(trimmed)
  const myCard = bootstrap?.myCard ?? null
  const name = resolvePwaDisplayName(myCard?.profile?.name?.trim() || myCard?.profile?.company_name, trimmed)
  const headerStore = await headers()
  const requestOrigin = resolveRequestOrigin(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
  const icon192 = buildProfileIconPath(trimmed, 192)
  const icon512 = buildProfileIconPath(trimmed, 512)
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

  const seo = buildPublicCardSeoMetadata({
    slug: trimmed,
    origin: requestOrigin,
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

/** `/vCard/{slug}` — public vcard (Node `/api/v1/public`, template-services parity). */
export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params
  const trimmed = slug?.trim()

  if (!trimmed) {
    notFound()
  }

  const bootstrap = await fetchPublicCardBootstrap(trimmed)
  if (!bootstrap?.myCard) {
    notFound()
  }

  const myCard = bootstrap.myCard
  const profileId = myCard.profile.id
  const template = resolveProfileTemplateFromMyCard(myCard)
  const liveAgentEnabled = isAiAssistanceEnabled(
    myCard.settings?.[AI_ASSISTANCE_SETTING_KEY] ?? myCard.features?.aiAssistance,
    trimmed
  )
  const headerStore = await headers()
  const origin = resolveRequestOrigin(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
  const cardPath = buildProfilePath(trimmed)

  const navBarLinks = bootstrap.postTypes ?? null
  const profileSettings = mapProfileSettings(bootstrap.settings, template)
  const reviews = reviewsFromBootstrapSection(bootstrap.sections?.reviews)

  const liveAgent = liveAgentEnabled ? await resolveLiveAgentPromptFromProfileId(profileId).catch(() => null) : null
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
