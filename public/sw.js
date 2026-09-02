const CARD_PUSH_MEDIA_CACHE = 'vbiz-card-push-media-v1'
const LAST_MEDIA_SLUG = '__last__'
const CLIENT_MEDIA_TIMEOUT_MS = 900
/** Friendly public host shown in notification text when running on localhost. */
const PUBLIC_CARD_HOST = 'vbiz.me'

const PUSH_TYPE_TO_CATEGORY = {
  profile_update: 'company',
  contact_update: 'contact',
  video_update: 'video',
  blog_update: 'blog',
  services_update: 'services',
  event_update: 'events',
  event_updates: 'events',
  announcement_update: 'announcements',
  announcement_updates: 'announcements',
  portfolio_update: 'video',
  service_updates: 'services',
  news: 'blog',
  business_hours: 'company',
}

const CATEGORY_ACTION = {
  contact: 'updated their contact info',
  video: 'added new photos or videos',
  blog: 'published a new post',
  services: 'updated their services',
  company: 'updated their profile',
  events: 'shared a new event',
  announcements: 'posted an announcement',
}

const PUBLIC_CARD_SEGMENT = 'vCard'
const LEGACY_PUBLIC_CARD_SEGMENT = 'v'

function isPublicCardRoot(segment) {
  return segment === PUBLIC_CARD_SEGMENT || segment === LEGACY_PUBLIC_CARD_SEGMENT
}

function slugFromUrl(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url
    const parts = path
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)
    if (isPublicCardRoot(parts[0]) && parts[1]) return decodeURIComponent(parts[1])
    if (parts[0] && !isPublicCardRoot(parts[0])) return parts[0]
    return ''
  } catch {
    return ''
  }
}

function cardPathFromSlug(slug) {
  const trimmed = String(slug || '').trim()
  return trimmed ? `/vCard/${encodeURIComponent(trimmed)}` : '/'
}

/** Prefer `/vCard/{slug}`; rewrite legacy `/v/{slug}` and bare slug URLs. */
function normalizeCardUrl(rawUrl, slug) {
  const fallback = cardPathFromSlug(slug)
  if (!rawUrl || typeof rawUrl !== 'string') return fallback
  try {
    const absolute = rawUrl.startsWith('http')
    const parsed = absolute ? new URL(rawUrl) : new URL(rawUrl, self.location.origin)
    const parts = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)
    if (isPublicCardRoot(parts[0]) && parts[1]) {
      if (parts[0] === LEGACY_PUBLIC_CARD_SEGMENT) {
        parsed.pathname = `/vCard/${parts.slice(1).join('/')}`
        return absolute ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
      return absolute ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    if (parts.length === 1 && parts[0]) {
      parsed.pathname = `/vCard/${parts[0]}`
      return absolute ? parsed.href : `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return absolute ? parsed.href : rawUrl.startsWith('/') ? rawUrl : fallback
  } catch {
    return fallback
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function toAbsoluteUrl(url) {
  if (!url) return ''
  try {
    return new URL(url, self.location.origin).href
  } catch {
    return url
  }
}

function isLocalDevHost() {
  const host = self.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
}

function isBadDefaultIcon(url) {
  const value = String(url || '').toLowerCase()
  return !value || value.includes('next.svg') || value.includes('vercel.svg') || value.includes('window.svg')
}

function isStaticImageUrl(url) {
  const value = String(url || '')
    .trim()
    .toLowerCase()
  if (!value || isBadDefaultIcon(value)) return false
  if (value.endsWith('.mp4') || value.endsWith('.webm') || value.includes('/video')) return false
  return true
}

function cardPushMediaCachePath(slug) {
  return `/__vbiz_push_media__/${encodeURIComponent(String(slug).trim().toLowerCase())}`
}

function cardPushMediaCacheUrl(slug) {
  return new URL(cardPushMediaCachePath(slug), self.location.origin).href
}

async function readCachedCardMedia(slug) {
  if (!slug || typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(CARD_PUSH_MEDIA_CACHE)
    const response = await cache.match(cardPushMediaCacheUrl(slug))
    if (!response) return null
    return await response.json()
  } catch {
    return null
  }
}

function normalizePushPayload(raw) {
  const slug = firstNonEmpty(raw.slug, raw.profile_slug, raw.cardSlug, slugFromUrl(raw.url))
  const category = raw.category || PUSH_TYPE_TO_CATEGORY[raw.type] || 'company'
  // Always open the card on this origin under `/v/{slug}` (works in local + production).
  const url = normalizeCardUrl(raw.url, slug)

  const avatarImageUrl = firstNonEmpty(
    raw.icon,
    raw.avatarUrl,
    raw.avatarImageUrl,
    raw.logo,
    raw.company_logo,
    raw.companyLogo,
    raw.company_icon,
    raw.companyIcon,
    raw.avatar_url,
    raw.avatar_image_url,
    raw.profile_image,
    raw.profileImage,
    raw.image,
    isStaticImageUrl(raw.icon) ? raw.icon : ''
  )
  const avatarUrl = firstNonEmpty(raw.avatarUrl, raw.avatar_url, avatarImageUrl)
  const avatarVideoUrl = firstNonEmpty(raw.avatarVideoUrl, raw.avatar_video_url, raw.video)
  const icon = firstNonEmpty(raw.icon, avatarImageUrl, avatarUrl)

  return {
    title: firstNonEmpty(raw.title, raw.notification_title),
    body: firstNonEmpty(raw.body, raw.message, raw.notification_body),
    url,
    slug,
    icon,
    businessName: firstNonEmpty(raw.businessName, raw.business_name, raw.name, raw.owner_name, slug) || 'vBiz Me',
    avatarUrl,
    avatarImageUrl,
    avatarVideoUrl,
    category,
    speakLine: raw.speakLine || '',
    profileId: raw.profile_id ?? raw.profileId ?? null,
    type: raw.type || '',
  }
}

/** Build a clearer OS notification title/body (owner + what changed + card link). */
function buildNotificationCopy(payload) {
  const name = firstNonEmpty(payload.businessName, payload.slug, 'vBiz Me')
  const action = CATEGORY_ACTION[payload.category] || 'has a new update'
  const rawTitle = firstNonEmpty(payload.title)
  const rawBody = firstNonEmpty(payload.body, payload.speakLine)

  // Title: card owner first, then short update type from backend when useful.
  let title = name
  if (rawTitle) {
    const titleLower = rawTitle.toLowerCase()
    const nameLower = name.toLowerCase()
    if (!titleLower.includes(nameLower)) {
      title = `${name} · ${rawTitle}`
    } else {
      title = rawTitle
    }
  } else {
    title = `${name} · Update`
  }

  // Body: what changed, then a friendly card link (never advertise localhost).
  const detail = rawBody || `${name} ${action}.`
  let displayLink = ''
  if (payload.slug) {
    displayLink = isLocalDevHost() ? `${PUBLIC_CARD_HOST}/v/${payload.slug}` : `${self.location.host}/v/${payload.slug}`
  }

  const body = displayLink ? `${detail}\nOpen card · ${displayLink}` : `${detail}\nTap to open card`

  return { title, body, displayLink }
}

function applyCachedMedia(payload, cached) {
  if (!cached) return payload
  const cachedIcon = firstNonEmpty(cached.icon, cached.avatarImageUrl, cached.avatarUrl)
  if (!isStaticImageUrl(cachedIcon) && !cached.avatarVideoUrl) return payload

  return {
    ...payload,
    businessName: firstNonEmpty(payload.businessName, cached.businessName) || payload.businessName,
    avatarImageUrl: firstNonEmpty(payload.avatarImageUrl, cached.avatarImageUrl, cachedIcon),
    avatarUrl: firstNonEmpty(payload.avatarUrl, cached.avatarUrl, cached.avatarImageUrl, cachedIcon),
    avatarVideoUrl: firstNonEmpty(payload.avatarVideoUrl, cached.avatarVideoUrl),
    icon: firstNonEmpty(payload.icon, cachedIcon),
    slug: firstNonEmpty(payload.slug, cached.slug),
  }
}

async function requestMediaFromClients(slug) {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  if (!clientsList.length) return null

  const requestId = `media-${Date.now()}-${Math.random().toString(36).slice(2)}`

  return new Promise((resolve) => {
    let settled = false

    const finish = (media) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      self.removeEventListener('message', onMessage)
      resolve(media || null)
    }

    const onMessage = (event) => {
      const data = event.data
      if (!data || data.type !== 'vbiz_push_media_response' || data.requestId !== requestId) return
      finish(data.media || null)
    }

    self.addEventListener('message', onMessage)

    for (const client of clientsList) {
      client.postMessage({
        type: 'vbiz_push_media_request',
        requestId,
        slug: slug || '',
      })
    }

    const timer = setTimeout(() => finish(null), CLIENT_MEDIA_TIMEOUT_MS)
  })
}

async function resolveCardMedia(payload) {
  let next = { ...payload }

  if (isStaticImageUrl(next.icon) || isStaticImageUrl(next.avatarImageUrl) || isStaticImageUrl(next.avatarUrl)) {
    return next
  }

  if (next.slug) {
    next = applyCachedMedia(next, await readCachedCardMedia(next.slug))
    if (isStaticImageUrl(next.icon) || isStaticImageUrl(next.avatarImageUrl)) return next
  }

  const fromClient = await requestMediaFromClients(next.slug)
  next = applyCachedMedia(next, fromClient)
  if (isStaticImageUrl(next.icon) || isStaticImageUrl(next.avatarImageUrl)) return next

  next = applyCachedMedia(next, await readCachedCardMedia(LAST_MEDIA_SLUG))
  return next
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

const CARD_SHELL_CACHE = 'vbiz-public-card-shell-v2'
const CARD_DATA_CACHE = 'vbiz-public-card-data-v2'
const CARD_ASSET_CACHE = 'vbiz-public-card-assets-v2'
const NEXT_STATIC_CACHE = 'vbiz-next-static-v2'
const MANAGED_CACHES = [CARD_SHELL_CACHE, CARD_DATA_CACHE, CARD_ASSET_CACHE, NEXT_STATIC_CACHE, CARD_PUSH_MEDIA_CACHE]

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set(MANAGED_CACHES)
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key.startsWith('vbiz-') && !keep.has(key)).map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

async function bustPublicCardDataCache(slug) {
  const cache = await caches.open(CARD_DATA_CACHE)
  const requests = await cache.keys()
  const needle = String(slug || '')
    .trim()
    .toLowerCase()
  await Promise.all(
    requests.map((request) => {
      if (!needle) return cache.delete(request)
      const href = String(request.url || '').toLowerCase()
      if (href.includes(encodeURIComponent(needle)) || href.includes(needle) || href.includes('/public/')) {
        return cache.delete(request)
      }
      return Promise.resolve(false)
    })
  )
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  if (event.data?.type === 'CACHE_PUBLIC_CARD' && Array.isArray(event.data.urls)) {
    event.waitUntil(cachePublicCardUrls(event.data.urls))
    return
  }
  if (event.data?.type === 'BUST_PUBLIC_CARD_CACHE') {
    event.waitUntil(bustPublicCardDataCache(event.data.slug))
  }
})

function isPublicCardPage(pathname) {
  const parts = String(pathname || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
  if (!isPublicCardRoot(parts[0]) || !parts[1]) return false
  if (!parts[2]) return true
  return parts[2] !== 'icon' && parts[2] !== 'manifest.webmanifest' && parts[2] !== 'wallet-art'
}

function isPublicCardMeta(pathname) {
  const lower = String(pathname || '').toLowerCase()
  return (
    (lower.startsWith('/vcard/') || lower.startsWith('/v/')) &&
    (lower.includes('/icon/') || lower.endsWith('manifest.webmanifest') || lower.includes('/wallet-art'))
  )
}

function isCacheableResponse(res) {
  return res && (res.ok || res.type === 'opaque')
}

function isBackofficePath(pathname) {
  const path = String(pathname || '').toLowerCase()
  if (path.startsWith('/vcard/') || path.startsWith('/v/')) return false
  if (path.startsWith('/_next/')) return false
  if (path.startsWith('/api/pwa/')) return false
  if (path.includes('/api/v1/public/')) return false
  if (path.startsWith('/api/v1/')) return true
  return (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/set-password') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/vcards') ||
    path.startsWith('/settings') ||
    path.startsWith('/team') ||
    path.startsWith('/billing')
  )
}

function isPublicCardDataRequest(url) {
  const pathname = String(url.pathname || '').toLowerCase()
  if (url.origin === self.location.origin && pathname.startsWith('/_next/data/'))
    return pathname.includes('/vcard/') || pathname.includes('/v/')
  if (url.origin === self.location.origin && pathname.startsWith('/api/pwa/')) return true
  return (
    pathname.includes('/api/v1/public/') ||
    pathname.includes('/public/dynamic-section/') ||
    pathname.includes('/public/profile-ai-data/') ||
    pathname.includes('/public/profiles/') ||
    pathname.includes('/public/post-types') ||
    pathname.includes('/public/v/') ||
    pathname.includes('/public/announcement')
  )
}

function isPublicCardAssetRequest(url) {
  const pathname = String(url.pathname || '').toLowerCase()
  if (url.origin !== self.location.origin) return false
  if (pathname.startsWith('/_next/static/')) return false
  if (pathname.startsWith('/_next/image')) return true
  if (pathname.startsWith('/vcard/') || pathname.startsWith('/v/')) return true
  return false
}

function shouldHandleFetch(url, request) {
  const pathname = String(url.pathname || '')
  if (isBackofficePath(pathname)) return false
  if (url.origin === self.location.origin && pathname.startsWith('/_next/webpack')) return false
  if (url.origin === self.location.origin && pathname.includes('hot-update')) return false
  if (url.origin === self.location.origin && pathname.startsWith('/_next/static/')) return true
  if (request.mode === 'navigate' && isPublicCardPage(pathname)) return true
  if (isPublicCardMeta(pathname)) return false
  if (isPublicCardDataRequest(url)) return true
  if (isPublicCardAssetRequest(url)) return true
  return false
}

function cacheNameForUrl(url) {
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) return NEXT_STATIC_CACHE
  if (isPublicCardDataRequest(url)) return CARD_DATA_CACHE
  if (isPublicCardAssetRequest(url)) return CARD_ASSET_CACHE
  return CARD_SHELL_CACHE
}

async function matchCachedRequest(cache, request) {
  const hit = await cache.match(request)
  if (hit) return hit

  try {
    const url = new URL(request.url)
    const byHref = await cache.match(url.href)
    if (byHref) return byHref
    if (url.origin === self.location.origin) {
      return (await cache.match(`${url.pathname}${url.search}`)) || (await cache.match(url.pathname))
    }
  } catch {
    /* fall through */
  }

  return null
}

function offlineCardDataResponse(request) {
  let path = ''
  try {
    path = new URL(request.url).pathname
  } catch {
    path = ''
  }

  return new Response(
    JSON.stringify({
      success: false,
      data: null,
      offline: true,
      path,
      message:
        'This tab is not saved for offline yet. Connect to the internet to continue, then keep the card open so vBiz can cache this section.',
    }),
    {
      status: 503,
      statusText: 'Offline',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-vBiz-Offline': '1',
      },
    }
  )
}

function offlineDocumentResponse(request) {
  let title = 'vBiz Card'
  let path = '/'
  try {
    const url = new URL(request.url)
    path = url.pathname
    const slug = slugFromUrl(url.pathname)
    if (slug) title = slug
  } catch {
    /* keep defaults */
  }

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b0f19"><title>${title}</title><style>html,body{height:100%;margin:0;background:#090d18;color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{display:flex;align-items:center;justify-content:center;padding:24px}.card{max-width:420px;border:1px solid rgba(255,255,255,.14);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.03));box-shadow:0 24px 80px rgba(0,0,0,.35);padding:28px;text-align:center}.icon{width:56px;height:56px;border-radius:18px;margin:0 auto 18px;background:#eab308;color:#111827;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px}.eyebrow{margin:0 0 8px;color:#facc15;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.title{margin:0;font-size:24px;line-height:1.1}.copy{margin:12px 0 0;color:#cbd5e1;font-size:14px;line-height:1.55}.small{margin-top:18px;color:#94a3b8;font-size:12px}.button{display:inline-flex;margin-top:20px;border-radius:999px;background:#f8fafc;color:#0f172a;text-decoration:none;font-size:13px;font-weight:900;padding:12px 16px}</style></head><body><main class="card"><div class="icon">N</div><p class="eyebrow">Offline card</p><h1 class="title">Connect to continue</h1><p class="copy">This installed card opened offline, but this page was not fully saved yet. Connect to the internet, open ${path} once, and wait a few seconds so home and saved tabs stay available offline.</p><a class="button" href="${path}">Try again</a><p class="small">Saved tabs still work offline. Unsaved tabs need an internet connection.</p></main></body></html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  )
}

async function cachePublicCardUrls(urls) {
  await Promise.all(
    urls.map(async (raw) => {
      try {
        const url = new URL(raw, self.location.origin)
        if (url.origin !== self.location.origin) return
        const request = new Request(url.href, {
          credentials: 'same-origin',
          mode: 'same-origin',
          cache: isPublicCardDataRequest(url) ? 'no-store' : 'default',
        })
        const res = await fetch(request)
        if (!isCacheableResponse(res)) return
        const cache = await caches.open(cacheNameForUrl(url))
        await cache.put(request, res.clone())
      } catch {
        /* skip failed URLs */
      }
    })
  )
}

async function networkFirst(request, cacheName, fallback, options) {
  const cache = await caches.open(cacheName)
  const bypassHttpCache = Boolean(options?.bypassHttpCache)
  try {
    const res = await fetch(request, bypassHttpCache ? { cache: 'no-store' } : undefined)
    if (isCacheableResponse(res)) await cache.put(request, res.clone())
    return res
  } catch {
    const hit = await matchCachedRequest(cache, request)
    if (hit) return hit
    return fallback ? fallback(request) : Response.error()
  }
}

async function publicCardNavigationFallback(request) {
  const cache = await caches.open(CARD_SHELL_CACHE)
  try {
    const url = new URL(request.url)
    const canonical = `${url.origin}${url.pathname}`
    return (await cache.match(canonical)) || (await cache.match(url.pathname)) || offlineDocumentResponse(request)
  } catch {
    return offlineDocumentResponse(request)
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await matchCachedRequest(cache, request)
  if (hit) return hit
  try {
    const res = await fetch(request)
    if (isCacheableResponse(res)) await cache.put(request, res.clone())
    return res
  } catch {
    return Response.error()
  }
}

/**
 * Public-card PWA only. Backoffice, auth, and private APIs pass through.
 * Online card data/settings always network-first; cache is offline fallback.
 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  let url
  try {
    url = new URL(event.request.url)
  } catch {
    return
  }
  if (!shouldHandleFetch(url, event.request)) return

  const sameOrigin = url.origin === self.location.origin

  if (sameOrigin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event.request, NEXT_STATIC_CACHE))
    return
  }

  if (sameOrigin && event.request.mode === 'navigate' && isPublicCardPage(url.pathname)) {
    event.respondWith(
      networkFirst(event.request, CARD_SHELL_CACHE, publicCardNavigationFallback, { bypassHttpCache: true })
    )
    return
  }

  if (isPublicCardDataRequest(url)) {
    event.respondWith(networkFirst(event.request, CARD_DATA_CACHE, offlineCardDataResponse, { bypassHttpCache: true }))
    return
  }

  if (isPublicCardAssetRequest(url)) {
    event.respondWith(networkFirst(event.request, CARD_ASSET_CACHE))
  }
})

self.addEventListener('push', (event) => {
  let payload = normalizePushPayload({})

  if (event.data) {
    try {
      payload = normalizePushPayload({ ...payload, ...event.data.json() })
    } catch {
      try {
        payload.body = event.data.text() || payload.body
      } catch {
        /* keep defaults */
      }
    }
  }

  event.waitUntil(
    (async () => {
      payload = await resolveCardMedia(payload)
      const copy = buildNotificationCopy(payload)
      const openUrl = toAbsoluteUrl(normalizeCardUrl(payload.url, payload.slug))

      const richPayload = {
        title: copy.title,
        message: copy.body,
        businessName: payload.businessName,
        avatarUrl: payload.avatarUrl,
        avatarImageUrl: payload.avatarImageUrl,
        avatarVideoUrl: payload.avatarVideoUrl,
        category: payload.category,
        speakLine: payload.speakLine,
        url: openUrl,
        slug: payload.slug,
        profileId: payload.profileId,
        type: payload.type,
        displayLink: copy.displayLink,
      }

      const iconSource = firstNonEmpty(payload.icon, payload.avatarUrl, payload.avatarImageUrl)
      const icon = isStaticImageUrl(iconSource)
        ? toAbsoluteUrl(iconSource)
        : payload.slug
          ? toAbsoluteUrl(`/vCard/${payload.slug}/icon/192`)
          : ''

      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const hasFocusedClient = clientList.some((client) => client.focused)

      for (const client of clientList) {
        client.postMessage({
          type: 'vbiz_push',
          payload: richPayload,
        })
      }

      await self.registration.showNotification(copy.title, {
        body: copy.body,
        ...(icon ? { icon, badge: icon, image: icon } : {}),
        data: richPayload,
        tag: payload.slug ? `vbiz-card-${payload.slug}` : 'vbiz-card-update',
        renotify: true,
        requireInteraction: false,
        silent: hasFocusedClient,
        actions: [{ action: 'open', title: 'Open card' }],
      })
    })()
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = event.notification.data?.url || '/'
  const slug = event.notification.data?.slug || slugFromUrl(rawUrl)
  let targetUrl = '/'
  try {
    targetUrl = toAbsoluteUrl(normalizeCardUrl(rawUrl, slug))
  } catch {
    targetUrl = self.location.origin + '/'
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url)
          const target = new URL(targetUrl)
          if (clientUrl.origin === target.origin) {
            if ('focus' in client) {
              return client.focus().then((focused) => {
                if (focused && 'navigate' in focused) {
                  return focused.navigate(targetUrl)
                }
                if (focused) {
                  focused.postMessage({ type: 'vbiz_navigate', url: targetUrl })
                }
                return focused
              })
            }
          }
        } catch {
          /* try next client */
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
