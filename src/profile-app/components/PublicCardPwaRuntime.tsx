'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { mapNavBarLinks } from '@/lib/api/navbar/mapNavBarLinks'
import { buildProfilePath } from '@/lib/profileRoutes'
import { subscribePublicCardSettingsSaved } from '@/lib/publicCardLiveSync'
import { isBackofficePath, isPublicCardDataPath } from '@/lib/pwa/publicCardCachePolicy'
import type { NavBarNavItem, ProfileNavContentKey } from '@/lib/vcardNavbar'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { publicApi } from '@/redux/api/publicApi'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { dynamicSectionApi } from '@/redux/features/dynamicSection/dynamicSection.api'
import { myCardApi } from '@/redux/features/myCard'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import { profileAiDataApi } from '@/redux/features/profileAiData/profileAiData.api'
import { profileSettingsApi } from '@/redux/features/profileSettings/profileSettings.api'
import { publicAnnouncementsApi } from '@/redux/features/publicAnnouncements/publicAnnouncements.api'
import { aboutMeApi } from '@/redux/features/sections/aboutMe.api'
import { clientsApi } from '@/redux/features/sections/clients.api'
import { galleryApi } from '@/redux/features/sections/gallery.api'
import { reviewsApi } from '@/redux/features/sections/reviews.api'
import { servicesApi } from '@/redux/features/sections/services.api'
import { videoExplainerApi } from '@/redux/features/sections/videoExplainer.api'
import { videosApi } from '@/redux/features/sections/videos.api'
import { Cloud, Home, Share2, UserPlus, WifiOff, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const CARD_SHELL_CACHE = 'vbiz-public-card-shell-v2'
const CARD_ASSET_CACHE = 'vbiz-public-card-assets-v2'
const CARD_DATA_CACHE = 'vbiz-public-card-data-v2'
const NEXT_STATIC_CACHE = 'vbiz-next-static-v2'

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

function runLaunchAction() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')?.trim().toLowerCase()
  if (!action) return

  const eventNameByAction: Record<string, string> = {
    contact: 'saveContactAction',
    share: 'openShareModal',
    notifications: 'openFollowModal',
    install: 'openPwaInstallModal',
  }
  const eventName = eventNameByAction[action]
  if (!eventName) return

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(eventName))
  }, 650)
}

function dispatchProfileAction(eventName: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(eventName))
}

function isCacheableRuntimeUrl(url: URL, cardPath: string): boolean {
  const pathname = url.pathname.toLowerCase()
  if (isBackofficePath(pathname)) return false
  if (url.origin !== window.location.origin) {
    return isPublicCardDataPath(pathname)
  }
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    isPublicCardDataPath(pathname) ||
    pathname.startsWith(`${cardPath.toLowerCase()}/`) ||
    pathname === cardPath.toLowerCase()
  )
}

function collectCacheUrls(slug: string): string[] {
  const path = buildProfilePath(slug.trim())
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
      'script[src], link[rel="stylesheet"][href], link[rel="preload"][href], link[rel="modulepreload"][href], img[src], video[src], audio[src], source[src]'
    )
    .forEach((element) => {
      addUrl(element.getAttribute('src') ?? element.getAttribute('href'))
    })

  return [...urls]
}

function cacheNameForRuntimeUrl(url: URL): string {
  const pathname = url.pathname.toLowerCase()
  if (pathname.startsWith('/_next/static/')) return NEXT_STATIC_CACHE
  if (pathname.startsWith('/_next/image')) return CARD_ASSET_CACHE
  if (isPublicCardDataPath(pathname) || pathname.includes('/public/')) return CARD_DATA_CACHE
  if (/\.(?:avif|png|jpe?g|webp|gif|svg|ico|bmp|mp4|webm|mov|m4v|mp3|wav|ogg|woff2?|ttf|otf|css)$/i.test(pathname)) {
    return CARD_ASSET_CACHE
  }
  return CARD_SHELL_CACHE
}

async function cacheUrlsInPage(urls: string[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return

  await Promise.allSettled(
    urls.map(async (raw) => {
      try {
        const url = new URL(raw, window.location.origin)
        const request = new Request(url.href, {
          credentials: url.origin === window.location.origin ? 'same-origin' : 'omit',
          mode: url.origin === window.location.origin ? 'same-origin' : 'cors',
          cache: isPublicCardDataPath(url.pathname) ? 'no-store' : 'default',
        })
        const response = await fetch(request)
        if (!response.ok && response.type !== 'opaque') return
        const cache = await caches.open(cacheNameForRuntimeUrl(url))
        await cache.put(request, response.clone())
      } catch {
        /* best effort warm cache */
      }
    })
  )
}

async function warmLazyProfileChunks(): Promise<void> {
  await Promise.allSettled([
    import('@/profile-app/VBizProfileApp'),
    import('@/profile-app/VBizProfileAppV1'),
    import('@/profile-app/VBizProfileAppV3'),
    import('@/profile-app/components/AboutSection'),
    import('@/profile-app/components/AdditionalServicesSection'),
    import('@/profile-app/components/AnnouncementSection'),
    import('@/profile-app/components/BbbAccreditationSection'),
    import('@/profile-app/components/BlogSection'),
    import('@/profile-app/components/BookingSection'),
    import('@/profile-app/components/BreakfastSection'),
    import('@/profile-app/components/CalendarSection'),
    import('@/profile-app/components/CertificationsLicensingSection'),
    import('@/profile-app/components/ClientsSection'),
    import('@/profile-app/components/DcpSection'),
    import('@/profile-app/components/DinnerSection'),
    import('@/profile-app/components/EducationSection'),
    import('@/profile-app/components/EventsSection'),
    import('@/profile-app/components/ExperienceSection'),
    import('@/profile-app/components/ExplainerSection'),
    import('@/profile-app/components/FAQSection'),
    import('@/profile-app/components/HomeSection'),
    import('@/profile-app/components/HomeSectionV2'),
    import('@/profile-app/components/HomeSolarSection'),
    import('@/profile-app/components/ImageGallerySection'),
    import('@/profile-app/components/InsuranceLicenseSection'),
    import('@/profile-app/components/InventorySection'),
    import('@/profile-app/components/JoinMyTeamSection'),
    import('@/profile-app/components/LicensingSection'),
    import('@/profile-app/components/LunchSection'),
    import('@/profile-app/components/MediaPressSection'),
    import('@/profile-app/components/MeetOurTeamSection'),
    import('@/profile-app/components/MenuSection'),
    import('@/profile-app/components/MissionSection'),
    import('@/profile-app/components/PostsSection'),
    import('@/profile-app/components/PropertyListingSection'),
    import('@/profile-app/components/PublicCardsSection'),
    import('@/profile-app/components/ResiliencyProductsSection'),
    import('@/profile-app/components/ReviewsSection'),
    import('@/profile-app/components/SalesPersonSection'),
    import('@/profile-app/components/SeeProductsSection'),
    import('@/profile-app/components/ServicesSection'),
    import('@/profile-app/components/SkillsSection'),
    import('@/profile-app/components/VideoLinksSection'),
    import('@/profile-app/components/VideosSection'),
    import('@/profile-app/components/WhyChooseUsSection'),
    import('@/profile-app/v3/components/HomeHero'),
  ])
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
  'contact-us': PUBLIC_SECTION_NAMES.contactUs,
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
  const navItems = useMemo(() => mapNavBarLinks(initialNavBarLinks), [initialNavBarLinks])
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
    runLaunchAction()
    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayMode = () => markStandalone()
    media.addEventListener?.('change', onDisplayMode)

    const cacheShell = () => {
      const urls = collectCacheUrls(trimmed)
      void cacheUrlsInPage(urls)
      const controller = navigator.serviceWorker?.controller
      if (!controller) return
      controller.postMessage({ type: 'CACHE_PUBLIC_CARD', urls })
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
      void dispatch(
        publicAnnouncementsApi.endpoints.getPublicProfileAnnouncement.initiate(
          { profileId: normalizedProfileId },
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
      dispatch(
        publicApi.util.invalidateTags([
          { type: 'MyCard', id: trimmed },
          'ProfileSettings',
          'NavBarLinks',
          'PublicAnnouncement',
        ])
      )
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

    const onSettingsSaved = () => syncLatest(true)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    const unsubscribeSettings = subscribePublicCardSettingsSaved(onSettingsSaved)

    void warmLazyProfileChunks().finally(cacheShell)
    syncLatest(false)
    const cacheTimer = window.setTimeout(cacheShell, 2500)
    const postPrefetchCacheTimer = window.setTimeout(cacheShell, 5000)

    return () => {
      media.removeEventListener?.('change', onDisplayMode)
      serviceWorker?.removeEventListener?.('controllerchange', cacheShell)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
      unsubscribeSettings()
      window.clearTimeout(cacheTimer)
      window.clearTimeout(postPrefetchCacheTimer)
    }
  }, [dispatch, navItems, normalizedProfileId, template, trimmed])

  if (connectionState === 'online') return null

  const isOffline = connectionState === 'offline'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 z-300 w-[min(calc(100vw-1.5rem),36rem)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-3 text-zinc-800 shadow-2xl shadow-zinc-950/15 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.18),transparent_34%)]" />
      <div className="relative flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
            isOffline ? 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950' : 'bg-emerald-500'
          }`}
        >
          {isOffline ? <WifiOff size={18} /> : <Cloud size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black tracking-tight">
            {isOffline ? 'Offline smart card' : 'Syncing latest card'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed font-semibold text-zinc-600 dark:text-zinc-300">
            {isOffline
              ? 'Showing saved card tabs. Connect to the internet to open a tab that is not saved yet.'
              : 'Refreshing tabs, settings, announcements, media, and offline cache.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PwaStatusAction icon={UserPlus} label="Contact" eventName="saveContactAction" />
            <PwaStatusAction icon={Share2} label="Share" eventName="openShareModal" />
            <PwaStatusAction icon={Home} label="Install" eventName="openPwaInstallModal" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PwaStatusAction({ icon: Icon, label, eventName }: { icon: LucideIcon; label: string; eventName: string }) {
  return (
    <button
      type="button"
      onClick={() => dispatchProfileAction(eventName)}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 text-[11px] font-black text-zinc-800 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
