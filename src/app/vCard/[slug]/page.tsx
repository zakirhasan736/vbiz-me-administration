import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { fetchPublicCardBootstrap } from '@/lib/api/myCard/fetchPublicCardBootstrap'
import { resolveProfileTemplateFromMyCard } from '@/lib/api/myCard/resolveProfileTemplate'
import { mapProfileSettings } from '@/lib/api/profileSettings/mapProfileSettings'
import { resolveLiveAgentPromptFromProfileId } from '@/lib/liveAgent/resolveLiveAgentPrompt'
import { buildProfileIconPath, buildProfilePath } from '@/lib/profileRoutes'
import { buildPwaManifestUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { buildPublicCardSeoMetadata, resolveRequestOrigin } from '@/lib/seo/publicCardSeo'
import { resolvePublicCardFaviconUrl } from '@/lib/seo/resolvePublicCardSeo'
import PublicProfileLayout from '@/views/PublicProfileLayout'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
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
  const tabIcon = resolvePublicCardFaviconUrl(myCard, requestOrigin)
  const pwaMeta: Metadata = {
    metadataBase: new URL(requestOrigin),
    applicationName: name,
    appleWebApp: {
      capable: true,
      title: name,
      statusBarStyle: 'black-translucent',
    },
    icons: {
      apple: [{ url: icon192, sizes: '192x192', type: 'image/png' }],
      icon: [
        { url: icon192, sizes: '192x192', type: 'image/png' },
        { url: icon512, sizes: '512x512', type: 'image/png' },
        { url: tabIcon },
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

  // Keep SEO title/description/OG first — PWA chrome must not overwrite share preview tags.
  return {
    ...pwaMeta,
    ...seo,
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

  const navBarLinks = bootstrap.postTypes ?? null
  const profileSettings = mapProfileSettings(bootstrap.settings, template)
  const liveAgent = liveAgentEnabled ? await resolveLiveAgentPromptFromProfileId(profileId).catch(() => null) : null
  const agent = liveAgentEnabled ? liveAgent : null
  const tabIcon = resolvePublicCardFaviconUrl(myCard, origin)
  const icon192 = buildProfileIconPath(trimmed, 192)
  const icon512 = buildProfileIconPath(trimmed, 512)

  return (
    <>
      <link rel="manifest" href={buildPwaManifestUrl(trimmed)} />
      <link rel="apple-touch-icon" href={icon192} sizes="192x192" />
      <link rel="icon" type="image/png" href={icon192} sizes="192x192" />
      <link rel="icon" type="image/png" href={icon512} sizes="512x512" />
      <link rel="icon" href={tabIcon} />
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
