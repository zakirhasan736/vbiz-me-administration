const DEFAULT_ICON = '/favicon.ico'
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

function slugFromUrl(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url
    const segment = path.replace(/^\/+|\/+$/g, '').split('/')[0]
    return segment || ''
  } catch {
    return ''
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
  // Always open the card on this origin (works in local + production).
  const url = raw.url || (slug ? `/${slug}` : '/')

  const avatarImageUrl = firstNonEmpty(
    raw.logo,
    raw.company_logo,
    raw.companyLogo,
    raw.company_icon,
    raw.companyIcon,
    raw.avatarImageUrl,
    raw.avatar_image_url,
    raw.profile_image,
    raw.profileImage,
    raw.image,
    isStaticImageUrl(raw.icon) ? raw.icon : ''
  )
  const avatarUrl = firstNonEmpty(raw.avatarUrl, raw.avatar_url, avatarImageUrl)
  const avatarVideoUrl = firstNonEmpty(raw.avatarVideoUrl, raw.avatar_video_url, raw.video)
  const icon = firstNonEmpty(avatarImageUrl, avatarUrl)

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
    displayLink = isLocalDevHost() ? `${PUBLIC_CARD_HOST}/${payload.slug}` : `${self.location.host}/${payload.slug}`
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

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
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
      const openUrl = toAbsoluteUrl(payload.url || (payload.slug ? `/${payload.slug}` : '/'))

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

      const iconSource = firstNonEmpty(payload.avatarImageUrl, payload.avatarUrl, payload.icon)
      const icon = toAbsoluteUrl(isStaticImageUrl(iconSource) ? iconSource : DEFAULT_ICON)
      const hasCardImage = isStaticImageUrl(iconSource)

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
        icon,
        badge: icon,
        ...(hasCardImage ? { image: icon } : {}),
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
  let targetUrl = '/'
  try {
    targetUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, self.location.origin).href
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
