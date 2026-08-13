'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { mapNavBarLinks } from '@/lib/api/navbar/mapNavBarLinks'
import { orderAndDedupeNavItems } from '@/lib/api/navbar/orderNavTabs'
import type { NavBarNavItem, ProfileNavContentKey } from '@/lib/vcardNavbar'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { publicApi } from '@/redux/api/publicApi'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { dynamicSectionApi } from '@/redux/features/dynamicSection/dynamicSection.api'
import { myCardApi } from '@/redux/features/myCard'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import { profileAiDataApi } from '@/redux/features/profileAiData/profileAiData.api'
import { profileSettingsApi } from '@/redux/features/profileSettings/profileSettings.api'
import { aboutMeApi } from '@/redux/features/sections/aboutMe.api'
import { clientsApi } from '@/redux/features/sections/clients.api'
import { galleryApi } from '@/redux/features/sections/gallery.api'
import { reviewsApi } from '@/redux/features/sections/reviews.api'
import { servicesApi } from '@/redux/features/sections/services.api'
import { videoExplainerApi } from '@/redux/features/sections/videoExplainer.api'
import { videosApi } from '@/redux/features/sections/videos.api'
import { useEffect, useMemo, useState } from 'react'

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

function isOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

function isCacheableRuntimeUrl(url: URL, cardPath: string): boolean {
  const pathname = url.pathname.toLowerCase()
  if (url.origin === window.location.origin) {
    return (
      pathname.startsWith('/_next/static/') ||
      pathname.startsWith('/_next/image') ||
      pathname.startsWith(`${cardPath.toLowerCase()}/`) ||
      pathname === cardPath.toLowerCase()
    )
  }
  return (
    pathname.includes('/api/v1/public/') ||
    /\.(?:avif|png|jpe?g|webp|gif|svg|ico|bmp|mp4|webm|mov|m4v|mp3|wav|ogg|woff2?|ttf|otf|css)$/i.test(pathname)
  )
}

function collectCacheUrls(slug: string): string[] {
  const path = `/v/${encodeURIComponent(slug.trim())}`
  const urls = new Set<string>([path, `${path}/manifest.webmanifest`, `${path}/icon/192`, `${path}/icon/512`])

  const addUrl = (raw: string | null | undefined) => {
    if (!raw?.trim()) return
    try {
      const parsed = new URL(raw, window.location.origin)
      if (isCacheableRuntimeUrl(parsed, path)) {
        urls.add(
          parsed.origin === window.location.origin
            ? `${parsed.pathname}${parsed.search}`
            : `${parsed.href.split('#')[0]}`
        )
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof performance !== 'undefined') {
    for (const entry of performance.getEntriesByType('resource')) {
      addUrl(entry.name)
    }
  }

  document
    .querySelectorAll<HTMLImageElement | HTMLScriptElement | HTMLLinkElement | HTMLMediaElement | HTMLSourceElement>(
      'script[src], link[rel="stylesheet"][href], link[rel="preload"][href], img[src], video[src], audio[src], source[src]'
    )
    .forEach((element) => {
      addUrl(element.getAttribute('src') ?? element.getAttribute('href'))
    })

  return [...urls]
}

const STATIC_DYNAMIC_SECTION_BY_CONTENT: Partial<Record<ProfileNavContentKey, string>> = {
  mission: PUBLIC_SECTION_NAMES.mission,
  additional: PUBLIC_SECTION_NAMES.additionalServices,
  post: PUBLIC_SECTION_NAMES.post,
  'why-choose-us': PUBLIC_SECTION_NAMES.whyChooseUs,
  certificates: PUBLIC_SECTION_NAMES.certificates,
  'join-my-team': PUBLIC_SECTION_NAMES.joinMyTeam,
  calendar: PUBLIC_SECTION_NAMES.calendar,
  events: PUBLIC_SECTION_NAMES.events,
  booking: PUBLIC_SECTION_NAMES.booking,
  menu: PUBLIC_SECTION_NAMES.menu,
  'see-products': PUBLIC_SECTION_NAMES.seeProducts,
  bbb: PUBLIC_SECTION_NAMES.bbb,
  dcp: PUBLIC_SECTION_NAMES.dcp,
  'home-solar': PUBLIC_SECTION_NAMES.homeSolar,
  'resiliency-products': PUBLIC_SECTION_NAMES.resiliencyProducts,
  'property-listing': PUBLIC_SECTION_NAMES.propertyListing,
  'media-press': PUBLIC_SECTION_NAMES.mediaPress,
  announcement: PUBLIC_SECTION_NAMES.announcement,
  breakfast: PUBLIC_SECTION_NAMES.breakfast,
  dinner: PUBLIC_SECTION_NAMES.dinner,
  lunch: PUBLIC_SECTION_NAMES.lunch,
  inventory: PUBLIC_SECTION_NAMES.inventory,
}

function dynamicSectionNameForNavItem(item: NavBarNavItem): string | null {
  const contentKey = item.profileContent
  if (contentKey === 'empty') return item.apiSectionName?.trim() || item.displayLabel?.trim() || item.label.trim()

  if (
    contentKey === 'blog' ||
    contentKey === 'faq' ||
    contentKey === 'video-links' ||
    contentKey === 'licensing' ||
    contentKey === 'insurance-license' ||
    contentKey === 'meet-team' ||
    contentKey === 'sales-person'
  ) {
    return item.apiSectionName?.trim() || item.displayLabel?.trim() || item.label.trim()
  }

  return STATIC_DYNAMIC_SECTION_BY_CONTENT[contentKey] ?? null
}

type PublicCardPwaRuntimeProps = {
  slug: string
  profileId?: string
  template?: ProfileTemplateId
  initialNavBarLinks?: NavBarLinksData | null
}

/** Standalone chrome + cache the live public card; refetch latest when back online. Works for v1/v2/v3. */
export function PublicCardPwaRuntime({
  slug,
  profileId,
  template = 'v3',
  initialNavBarLinks = null,
}: PublicCardPwaRuntimeProps) {
  const dispatch = useAppDispatch()
  const trimmed = slug.trim()
  const normalizedProfileId = profileId?.trim() ?? ''
  const navItems = useMemo(() => orderAndDedupeNavItems(mapNavBarLinks(initialNavBarLinks)), [initialNavBarLinks])
  const [connectionState, setConnectionState] = useState<'online' | 'offline' | 'syncing'>(() =>
    isOnline() ? 'online' : 'offline'
  )

  useEffect(() => {
    if (!trimmed) return

    const markStandalone = () => {
      if (isStandaloneDisplay()) {
        document.documentElement.dataset.pwaStandalone = 'true'
      } else {
        delete document.documentElement.dataset.pwaStandalone
      }
    }

    markStandalone()
    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayMode = () => markStandalone()
    media.addEventListener?.('change', onDisplayMode)

    const cacheShell = () => {
      const controller = navigator.serviceWorker?.controller
      if (!controller) return
      controller.postMessage({ type: 'CACHE_PUBLIC_CARD', urls: collectCacheUrls(trimmed) })
    }

    const serviceWorker = 'serviceWorker' in navigator ? navigator.serviceWorker : null
    serviceWorker?.addEventListener?.('controllerchange', cacheShell)
    void serviceWorker?.ready
      .then(() => {
        cacheShell()
        window.setTimeout(cacheShell, 500)
      })
      .catch(() => undefined)

    const prefetchSectionData = (forceRefetch = false) => {
      if (!navigator.onLine || !normalizedProfileId) return

      void dispatch(
        navBarLinksApi.endpoints.getNavBarLinks.initiate(normalizedProfileId, {
          forceRefetch,
          subscribe: false,
        })
      )
      void dispatch(
        profileSettingsApi.endpoints.getProfileSettings.initiate(
          { profileId: normalizedProfileId, template },
          { forceRefetch, subscribe: false }
        )
      )

      let needsProfileAiData = false
      const dynamicSectionNames = new Set<string>()

      for (const item of navItems) {
        switch (item.profileContent) {
          case 'about':
            void dispatch(
              aboutMeApi.endpoints.getAboutMe.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'services':
            void dispatch(
              servicesApi.endpoints.getServices.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'gallery':
            void dispatch(
              galleryApi.endpoints.getGallery.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'videos':
            void dispatch(
              videosApi.endpoints.getVideos.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'explainer':
            void dispatch(
              videoExplainerApi.endpoints.getVideoExplainer.initiate(normalizedProfileId, {
                forceRefetch,
                subscribe: false,
              })
            )
            break
          case 'reviews':
            void dispatch(
              reviewsApi.endpoints.getReviews.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'clients':
            void dispatch(
              clientsApi.endpoints.getClients.initiate(normalizedProfileId, { forceRefetch, subscribe: false })
            )
            break
          case 'education':
          case 'skills':
          case 'work':
            needsProfileAiData = true
            break
          default: {
            const sectionName = dynamicSectionNameForNavItem(item)
            if (sectionName) dynamicSectionNames.add(sectionName)
            break
          }
        }
      }

      if (needsProfileAiData) {
        void dispatch(
          profileAiDataApi.endpoints.getProfileAiData.initiate(normalizedProfileId, {
            forceRefetch,
            subscribe: false,
          })
        )
      }

      for (const sectionName of dynamicSectionNames) {
        void dispatch(
          dynamicSectionApi.endpoints.getDynamicSection.initiate(
            { profileId: normalizedProfileId, sectionName },
            { forceRefetch, subscribe: false }
          )
        )
      }
    }

    const syncLatest = (forceRefetch = false) => {
      if (!navigator.onLine) return
      dispatch(publicApi.util.invalidateTags([{ type: 'MyCard', id: trimmed }, 'ProfileSettings', 'NavBarLinks']))
      void dispatch(
        myCardApi.endpoints.getMyCardBySlug.initiate(trimmed, {
          forceRefetch,
          subscribe: false,
        })
      )
      prefetchSectionData(forceRefetch)
    }

    const onOnline = () => {
      setConnectionState('syncing')
      syncLatest(true)
      window.setTimeout(cacheShell, 800)
      window.setTimeout(() => setConnectionState('online'), 2200)
    }

    const onOffline = () => {
      setConnectionState('offline')
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') syncLatest(true)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)

    syncLatest(false)
    const cacheTimer = window.setTimeout(cacheShell, 2500)
    const postPrefetchCacheTimer = window.setTimeout(cacheShell, 5000)

    return () => {
      media.removeEventListener?.('change', onDisplayMode)
      serviceWorker?.removeEventListener?.('controllerchange', cacheShell)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearTimeout(cacheTimer)
      window.clearTimeout(postPrefetchCacheTimer)
    }
  }, [dispatch, navItems, normalizedProfileId, template, trimmed])

  if (connectionState === 'online') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 z-300 w-[min(calc(100vw-1.5rem),34rem)] -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 text-center text-xs font-semibold text-zinc-700 shadow-xl shadow-zinc-950/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-200"
    >
      {connectionState === 'offline'
        ? 'Offline mode: showing saved card data. If a tab is missing, open this card once online so vBiz can cache that section.'
        : 'Back online. Syncing the latest card, tabs, actions, notifications, and media.'}
    </div>
  )
}
