import { loadPublicCardVideoPage } from '@/lib/seo/loadPublicCardVideoPage'
import {
  resolveRequestOrigin,
  serializeJsonLd,
  VBIZ_ME_ORGANIZATION_ID,
  VBIZ_ME_ORGANIZATION_NAME,
  VBIZ_ME_ORGANIZATION_URL,
} from '@/lib/seo/publicCardSeo'
import { buildPublicCardVideoObject } from '@/lib/seo/publicCardVideo'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

async function requestOrigin(): Promise<string> {
  const headerStore = await headers()
  return resolveRequestOrigin(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trimmed = slug?.trim()
  if (!trimmed) return {}
  const result = await loadPublicCardVideoPage(trimmed, await requestOrigin()).catch(() => null)
  if (!result || result.status !== 'ok') return {}
  const { page } = result

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.watchUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'video.other',
      url: page.watchUrl,
      title: page.title,
      description: page.description,
      images: [{ url: page.thumbnailUrl, alt: page.title }],
      ...(page.video.kind === 'file' ? { videos: [{ url: page.video.contentUrl }] } : {}),
    },
    twitter: {
      card: page.video.kind === 'youtube' ? 'player' : 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [page.thumbnailUrl],
    },
  }
}

/**
 * Intro-video watch page: the video is the main content, so Google can list it in video
 * results (a full card is a profile page, not a watch page).
 */
export default async function PublicCardVideoPage({ params }: Props) {
  const { slug } = await params
  const trimmed = slug?.trim()
  if (!trimmed) notFound()

  const result = await loadPublicCardVideoPage(trimmed, await requestOrigin())
  if (result.status === 'missing') notFound()
  // Temporary: the owner may add an intro video later.
  if (result.status === 'no-video') redirect(`/vCard/${encodeURIComponent(trimmed)}`)
  const { page } = result

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${page.watchUrl}#page`,
        url: page.watchUrl,
        name: page.title,
        description: page.description,
        inLanguage: 'en-US',
        primaryImageOfPage: page.thumbnailUrl,
        mainEntity: { '@id': `${page.watchUrl}#video` },
        about: { '@id': page.personId },
        publisher: { '@id': VBIZ_ME_ORGANIZATION_ID },
        breadcrumb: { '@id': `${page.watchUrl}#breadcrumb` },
      },
      buildPublicCardVideoObject({
        video: page.video,
        watchPageUrl: page.watchUrl,
        cardUrl: page.cardUrl,
        name: page.title,
        description: page.description,
        thumbnailUrl: page.thumbnailUrl,
        uploadDate: page.uploadDate,
        personId: page.personId,
      }),
      {
        '@type': 'BreadcrumbList',
        '@id': `${page.watchUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: VBIZ_ME_ORGANIZATION_NAME, item: VBIZ_ME_ORGANIZATION_URL },
          { '@type': 'ListItem', position: 2, name: page.name, item: page.cardUrl },
          { '@type': 'ListItem', position: 3, name: 'Intro video', item: page.watchUrl },
        ],
      },
    ],
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <a href={VBIZ_ME_ORGANIZATION_URL} className="hover:underline">
          {VBIZ_ME_ORGANIZATION_NAME}
        </a>
        <span aria-hidden="true"> › </span>
        <a href={page.cardPath} className="hover:underline">
          {page.name}
        </a>
        <span aria-hidden="true"> › </span>
        <span>Intro video</span>
      </nav>

      <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{page.title}</h1>

      <div className="overflow-hidden rounded-2xl bg-black">
        {page.video.kind === 'file' ? (
          <video
            className="mx-auto max-h-[80vh] w-full object-contain"
            src={page.video.contentUrl}
            poster={page.thumbnailUrl}
            controls
            playsInline
            preload="metadata"
          >
            <a href={page.video.contentUrl}>Download {page.name}&apos;s intro video</a>
          </video>
        ) : (
          <div className="relative aspect-video w-full">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={page.video.embedUrl}
              title={page.title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </div>

      <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{page.description}</p>

      <a
        href={page.cardPath}
        className="self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        View {page.name}&apos;s full vBiz Me card
      </a>
    </main>
  )
}
