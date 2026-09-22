import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const PORT = 5101
const ACCESS_TOKEN = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjQxMDAwMDAwMDB9.e2e-signature'

type Profile = Record<string, unknown> & {
  id: string
  slug: string
  name: string
  email: string
}

const adminUser = {
  id: 'e2e-admin',
  name: 'E2E Admin',
  email: 'admin@example.com',
  role: 'admin',
  staffRole: 'admin',
  allowedModules: [
    'dashboard',
    'mycards',
    'vcards',
    'users',
    'leads',
    'support',
    'announcements',
    'templates',
    'packages',
    'schedule',
    'team',
    'audit',
    'settings',
  ],
  accountStatus: 'ACTIVE',
  isActive: true,
  isVerified: true,
  completedTours: ['dashboard', 'create_card'],
}

const baseProfile = (): Profile => ({
  id: 'card-1',
  slug: 'existing-card',
  name: 'Existing Card',
  email: 'owner@example.com',
  dob: '1990-07-18T00:00:00.000Z',
  phone: '+15550001111',
  whatsapp: '+15550001111',
  website: 'https://example.com',
  companyName: 'Example Co',
  designation: 'Founder',
  about: 'A stable fixture card for browser tests.',
  address: '1 Test Street',
  avatar: null,
  isPublic: true,
  isDraft: false,
  viewCount: 12,
  clickCount: 4,
  saveCount: 2,
  shareCount: 3,
  template: 'v2',
  status: { id: 'active', name: 'Active' },
  education: [],
  experiences: [],
  services: [],
  portfolios: [],
  galleries: [],
  reviews: [],
  skillTags: [],
  socialLinks: [],
  settings: [],
  attachments: [],
})

const profiles = new Map<string, Profile>([['card-1', baseProfile()]])

type MockPublicNote = {
  id: string
  profile_id: string
  content: string
  author_name: string
  visitor_id: string
  created_at: string
  updated_at: string
  reply: string | null
  reply_at: string | null
}

const publicNotes: MockPublicNote[] = []

/** Counts bootstrap + legacy profile GETs so e2e can measure duplicate SSR fetches. */
const publicVHits: Record<string, number> = {}

type GuestLead = {
  profile_id: string
  full_name: string
  phone: string
  email: string
  meta?: unknown
}

const guestLeads: GuestLead[] = []
const pushSubscriptions: Array<{ profile_slug: string; endpoint: string }> = []

/** 65-byte uncompressed EC point (0x04…) as URL-safe base64 — valid enough for VAPID decode. */
const E2E_VAPID_PUBLIC_KEY = Buffer.concat([Buffer.from([0x04]), Buffer.alloc(64, 0x11)]).toString('base64url')

function publicBootstrapPayload(myCard: ReturnType<typeof publicCard>) {
  return {
    myCard,
    postTypes: { StaticLink: [], post_types: [] },
    settings: {
      appearance: { profileTemplate: 'v2', layoutStyle: 'classic', buttonStyle: 'solid', cornerStyle: 'round' },
      theme_config: null,
    },
    sections: {},
  }
}

const publicCard = () => ({
  profile: {
    id: 'public-card-1',
    name: 'Public Test Card',
    slug: 'e2e-public-card',
    email: 'public@example.com',
    phone: '+15550002222',
    address: '2 Public Street',
    country: 'US',
    website: 'https://example.com',
    company_name: 'Public Co',
    designation: 'Product Designer',
    description: 'A public card used by the browser contract test.',
    profession: 'Designer',
    gender: null,
    marital_status: null,
    facebook: null,
    instagram: null,
    twitter: null,
    tiktok: null,
    youtube: null,
    rumble: null,
    truth: null,
    linkedin: null,
    pinterest: null,
    whatsapp: '+15550002222',
  },
  settings: {
    name_checkbox: '1',
    profession_checkbox: '1',
    company_name_checkbox: '1',
    navHome_checkbox: '1',
    aboutMeNav_checkbox: '1',
    pCardsNav_checkbox: '1',
    contactNav_checkbox: '1',
    seo_meta_title: 'Public Test Card | Virtual Card',
    seo_meta_description: 'Explore the Public Test Card digital business profile.',
    seo_meta_keywords_json: JSON.stringify([
      'vbizme',
      'vbiz me',
      'virtual card',
      'digital business card',
      'online business card',
      'public test card',
    ]),
    profile_video_checkbox: '1',
  },
  features: { is_public: true, is_draft: false },
  template: 'v2',
  background_media: {},
  intro_video: {},
  profile_media: {},
  action_buttons: {
    view_counter: { enabled: true, count: 12 },
    share: { enabled: true },
    save_contact: { enabled: true },
    my_info: { enabled: true },
    language: { enabled: true },
  },
  my_info: { actions: { showCall: true, showText: true, showEmail: true }, additional_fields: [] },
})

const introPublicCard = () => ({
  ...publicCard(),
  profile: {
    ...publicCard().profile,
    slug: 'e2e-intro-card',
    name: 'Intro Test Card',
  },
  intro_video: { url: '/e2e/intro.mp4', regular_video: { url: '/e2e/intro.mp4' } },
})

const RICH_TEXT_DESCRIPTION = [
  '<h1>Heading One</h1>',
  '<h2>Heading Two</h2>',
  '<h3>Heading Three</h3>',
  '<h4>Heading Four</h4>',
  '<h5>Heading Five</h5>',
  '<h6>Heading Six</h6>',
  '<p>A <strong>bold</strong> <em>italic</em> <u>underline</u> line.</p>',
  '<ul><li>Bullet item</li></ul>',
  '<ol><li>Numbered item</li></ol>',
  '<p><a href="https://example.com/rich">Rich link</a> and <code>inlineCode</code></p>',
  '<pre><code>code block</code></pre>',
].join('')

function envelope<T>(data: T, message = 'OK', statusCode = 200) {
  return { success: statusCode < 400, statusCode, message, data }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown, extraHeaders?: Record<string, string>) {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3101',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    ...extraHeaders,
  })
  res.end(payload)
}

async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

function parseMultipartFields(raw: string, contentType: string): Record<string, unknown> {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  const boundary = (boundaryMatch?.[1] || boundaryMatch?.[2] || '').trim()
  if (!boundary) return {}

  const fields: Record<string, unknown> = {}
  for (const part of raw.split(`--${boundary}`)) {
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd < 0) continue
    const headers = part.slice(0, headerEnd)
    const nameMatch = headers.match(/name="([^"]+)"/i)
    if (!nameMatch || /filename=/i.test(headers)) continue
    let value = part.slice(headerEnd + 4)
    if (value.endsWith('\r\n')) value = value.slice(0, -2)
    if (value === '--') continue
    fields[nameMatch[1]] = value
  }
  return fields
}

async function readRequestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const contentType = String(req.headers['content-type'] || '')
  const raw = await readRawBody(req)
  if (!raw.trim()) return {}

  if (contentType.includes('multipart/form-data')) {
    return parseMultipartFields(raw, contentType)
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw))
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return readRequestBody(req)
}

function isAuthenticated(req: IncomingMessage) {
  return req.headers.authorization === `Bearer ${ACCESS_TOKEN}`
}

function dashboardSummary() {
  return {
    stats: {
      totalViews: 12,
      totalClicks: 4,
      totalSaves: 2,
      totalShares: 3,
      uniqueViews: 9,
      profileCount: profiles.size,
    },
    recentEngagement: { items: [], total: 0, skip: 0, limit: 10 },
    contactsPreview: [],
    socialClicks: [],
    socialClicksByCard: [],
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`)
  const path = requestUrl.pathname
  const method = req.method || 'GET'

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:3101',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    })
    res.end()
    return
  }

  if (path === '/api/v1/health') {
    sendJson(res, 200, envelope({ status: 'healthy', uptime: 1 }))
    return
  }

  if (path === '/__e2e/public-v-hits' && method === 'GET') {
    sendJson(res, 200, { hits: { ...publicVHits } })
    return
  }

  if (path === '/__e2e/public-v-hits' && (method === 'DELETE' || method === 'POST')) {
    for (const key of Object.keys(publicVHits)) delete publicVHits[key]
    sendJson(res, 200, { ok: true })
    return
  }

  if (path === '/__e2e/guest-leads' && method === 'GET') {
    sendJson(res, 200, { leads: guestLeads.slice() })
    return
  }

  if (path === '/__e2e/guest-leads' && (method === 'DELETE' || method === 'POST')) {
    guestLeads.length = 0
    sendJson(res, 200, { ok: true })
    return
  }

  if (path === '/api/v1/auth/login' && method === 'POST') {
    await readJson(req)
    sendJson(res, 200, envelope({ profile: adminUser, accessToken: ACCESS_TOKEN }, 'Login successful'))
    return
  }

  if (path === '/api/v1/auth/author' && method === 'GET') {
    sendJson(
      res,
      isAuthenticated(req) ? 200 : 403,
      isAuthenticated(req) ? envelope(adminUser) : envelope(null, 'Unauthorized', 403)
    )
    return
  }

  if (path === '/api/v1/auth/tours' && method === 'PATCH') {
    if (!isAuthenticated(req)) {
      sendJson(res, 403, envelope(null, 'Unauthorized', 403))
      return
    }
    const body = (await readJson(req)) as { keys?: string[] }
    const keys = Array.isArray(body.keys) ? body.keys : []
    adminUser.completedTours = [...new Set([...(adminUser.completedTours ?? []), ...keys])]
    sendJson(res, 200, envelope({ completedTours: adminUser.completedTours }, 'Tours saved'))
    return
  }

  if (path === '/api/v1/auth/refresh-token' && method === 'POST') {
    sendJson(
      res,
      isAuthenticated(req) ? 200 : 403,
      isAuthenticated(req) ? envelope({ accessToken: ACCESS_TOKEN }) : envelope(null, 'Unauthorized', 403)
    )
    return
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    sendJson(res, 200, envelope(null, 'Logged out'))
    return
  }

  if (path.startsWith('/api/v1/public/')) {
    const publicBootstrapMatch = path.match(/^\/api\/v1\/public\/v\/([^/]+)\/bootstrap$/)
    if (publicBootstrapMatch && method === 'GET') {
      const slug = decodeURIComponent(publicBootstrapMatch[1])
      publicVHits[slug] = (publicVHits[slug] || 0) + 1
      const requestId = `e2e-${slug}`
      const failHeaders = { 'x-vbiz-request-id': requestId }

      if (slug === 'e2e-public-card') {
        sendJson(res, 200, envelope(publicBootstrapPayload(publicCard())))
        return
      }
      if (slug === 'e2e-intro-card') {
        sendJson(res, 200, envelope(publicBootstrapPayload(introPublicCard())))
        return
      }
      if (slug === 'e2e-missing-card') {
        sendJson(res, 404, envelope(null, 'Profile not found', 404), failHeaders)
        return
      }
      if (slug === 'e2e-fail-500') {
        sendJson(res, 500, envelope(null, 'Internal error', 500), failHeaders)
        return
      }
      if (slug === 'e2e-fail-503') {
        sendJson(res, 503, envelope(null, 'Unavailable', 503), failHeaders)
        return
      }
      if (slug === 'e2e-fail-429') {
        sendJson(res, 429, envelope(null, 'Too many requests', 429), failHeaders)
        return
      }
      if (slug === 'e2e-success-false') {
        sendJson(res, 200, { success: false, data: null, error: 'unexpected' }, failHeaders)
        return
      }
      if (slug === 'e2e-malformed-json') {
        const payload = '{not-json'
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
          'x-vbiz-request-id': requestId,
          'Access-Control-Allow-Origin': 'http://127.0.0.1:3101',
        })
        res.end(payload)
        return
      }

      sendJson(res, 404, envelope(null, 'Profile not found', 404), failHeaders)
      return
    }

    const publicVMatch = path.match(/^\/api\/v1\/public\/v\/([^/]+)$/)
    if (publicVMatch && method === 'GET') {
      const slug = decodeURIComponent(publicVMatch[1])
      publicVHits[slug] = (publicVHits[slug] || 0) + 1
      const requestId = `e2e-${slug}`
      const failHeaders = { 'x-vbiz-request-id': requestId }

      if (slug === 'e2e-public-card') {
        sendJson(res, 200, envelope(publicCard()))
        return
      }
      if (slug === 'e2e-intro-card') {
        sendJson(res, 200, envelope(introPublicCard()))
        return
      }
      if (slug === 'e2e-missing-card') {
        sendJson(res, 404, envelope(null, 'Profile not found', 404), failHeaders)
        return
      }
      if (slug === 'e2e-fail-500') {
        sendJson(res, 500, envelope(null, 'Internal error', 500), failHeaders)
        return
      }
      if (slug === 'e2e-fail-503') {
        sendJson(res, 503, envelope(null, 'Unavailable', 503), failHeaders)
        return
      }
      if (slug === 'e2e-fail-429') {
        sendJson(res, 429, envelope(null, 'Too many requests', 429), failHeaders)
        return
      }
      if (slug === 'e2e-success-false') {
        sendJson(res, 200, { success: false, data: null, error: 'unexpected' }, failHeaders)
        return
      }
      if (slug === 'e2e-malformed-json') {
        const payload = '{not-json'
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
          'x-vbiz-request-id': requestId,
          'Access-Control-Allow-Origin': 'http://127.0.0.1:3101',
        })
        res.end(payload)
        return
      }

      sendJson(res, 404, envelope(null, 'Profile not found', 404), failHeaders)
      return
    }

    const cardsBootstrapMatch = path.match(/^\/api\/v1\/public\/cards\/([^/]+)\/bootstrap$/)
    if (cardsBootstrapMatch && method === 'GET') {
      const slug = decodeURIComponent(cardsBootstrapMatch[1])
      if (slug === 'e2e-public-card') {
        sendJson(res, 200, envelope(publicBootstrapPayload(publicCard())))
        return
      }
      if (slug === 'e2e-intro-card') {
        sendJson(res, 200, envelope(publicBootstrapPayload(introPublicCard())))
        return
      }
      sendJson(res, 404, envelope(null, 'Profile not found', 404))
      return
    }

    if (path === '/api/v1/public/track-event' && method === 'POST') {
      sendJson(res, 200, envelope({ recorded: true }))
      return
    }

    if (path === '/api/v1/public/public-cards' && method === 'GET') {
      sendJson(res, 200, envelope({ items: [publicCard()], total: 1 }))
      return
    }

    if (path === '/api/v1/public/landing/demo-cards' && method === 'GET') {
      sendJson(res, 200, envelope({ items: [publicCard()], total: 1 }))
      return
    }

    const walletMatch = path.match(/^\/api\/v1\/public\/profiles\/([^/]+)\/(google-wallet|apple-wallet)$/)
    if (walletMatch && method === 'GET') {
      sendJson(
        res,
        200,
        envelope({
          provider: walletMatch[2],
          slug: decodeURIComponent(walletMatch[1]),
          url: `https://example.com/${walletMatch[2]}`,
        })
      )
      return
    }

    const teamNoticeMatch = path.match(/^\/api\/v1\/public\/profiles\/([^/]+)\/team-notices\/active$/)
    if (teamNoticeMatch && method === 'GET') {
      sendJson(res, 200, envelope(null))
      return
    }

    const aiDataMatch = path.match(/^\/api\/v1\/public\/profile-ai-data\/([^/]+)$/)
    if (aiDataMatch && method === 'GET') {
      sendJson(res, 200, envelope({ profile_id: decodeURIComponent(aiDataMatch[1]), fields: [] }))
      return
    }

    const dynamicSectionMatch = path.match(/^\/api\/v1\/public\/dynamic-section\/([^/]+)$/)
    if (dynamicSectionMatch && method === 'GET') {
      const sectionName = decodeURIComponent(dynamicSectionMatch[1])
      const isRich = /^faqs?$/i.test(sectionName) || /about/i.test(sectionName)
      sendJson(
        res,
        200,
        envelope({
          name: sectionName,
          postType: { name: sectionName, title: isRich ? 'Rich text' : sectionName },
          items: isRich
            ? [
                {
                  id: 'rich-faq-1',
                  title: 'Rich text sample',
                  description: RICH_TEXT_DESCRIPTION,
                  status: '1',
                },
              ]
            : [],
        })
      )
      return
    }

    const dismissAnnouncementMatch = path.match(/^\/api\/v1\/public\/profiles\/([^/]+)\/announcement\/dismiss$/)
    if (dismissAnnouncementMatch && method === 'POST') {
      sendJson(res, 200, envelope({ dismissed: true }))
      return
    }

    if (path === '/api/v1/public/notes' && method === 'GET') {
      const profileId = requestUrl.searchParams.get('profile_id') || ''
      const visitorId = requestUrl.searchParams.get('visitor_id') || ''
      if (!profileId || !visitorId) {
        sendJson(res, 400, envelope(null, 'profile_id and visitor_id are required', 400))
        return
      }
      sendJson(
        res,
        200,
        envelope(publicNotes.filter((note) => note.profile_id === profileId && note.visitor_id === visitorId))
      )
      return
    }
    if (path === '/api/v1/public/save-note' && method === 'POST') {
      const body = await readJson(req)
      const profileId = requestUrl.searchParams.get('profile_id') || String(body.profile_id || '')
      const content = requestUrl.searchParams.get('content') || String(body.content || '')
      const authorName = requestUrl.searchParams.get('author_name') || String(body.author_name || 'Guest')
      const visitorId = requestUrl.searchParams.get('visitor_id') || String(body.visitor_id || '')
      if (!profileId || !content) {
        sendJson(res, 400, envelope(null, 'profile_id and content are required', 400))
        return
      }
      const now = new Date().toISOString()
      const note: MockPublicNote = {
        id: `mock-note-${publicNotes.length + 1}`,
        profile_id: profileId,
        content,
        author_name: authorName,
        visitor_id: visitorId,
        created_at: now,
        updated_at: now,
        reply: null,
        reply_at: null,
      }
      publicNotes.unshift(note)
      sendJson(res, 200, envelope(note))
      return
    }
    if (path === '/api/v1/public/post-types' && method === 'GET') {
      const profileId = requestUrl.searchParams.get('profile_id') || ''
      if (profileId === 'public-card-1') {
        sendJson(
          res,
          200,
          envelope({
            StaticLink: [],
            post_types: [
              { id: 'home', key: 'home', name: 'Home', title: 'Home', status: '1', type_id: 'home' },
              { id: 'faq', key: 'faq', name: 'Faq', title: 'FAQs', status: '1', type_id: 'faq' },
            ],
          })
        )
        return
      }
      sendJson(res, 200, envelope([]))
      return
    }
    if (path.includes('/profiles/public-card-1/settings')) {
      sendJson(res, 200, envelope({ success: true, data: null }))
      return
    }
    if (path.includes('/profiles/public-card-1/announcement')) {
      sendJson(res, 200, envelope(null))
      return
    }

    const saveContactMatch = path.match(/^\/api\/v1\/public\/save-contact\/([^/]+)$/)
    if (saveContactMatch && method === 'GET') {
      const card = publicCard()
      sendJson(
        res,
        200,
        envelope({
          action_buttons: {
            save_contact: {
              enabled: true,
              label: 'Save Contact',
              icon: 'fa-download',
              data: {
                name: card.profile.name,
                email: card.profile.email,
                phone: card.profile.phone,
                company: card.profile.company_name,
                profession: card.profile.profession,
                gender: '',
                website: card.profile.website,
                slug: card.profile.slug,
                profileUrl: `http://127.0.0.1:3101/vCard/${card.profile.slug}`,
                imageUrl: '',
                imageUrls: [],
                note: card.profile.description,
                address: card.profile.address,
              },
              background_color: '',
              text_color: '',
            },
          },
        })
      )
      return
    }

    if (path === '/api/v1/public/save-guest-user' && method === 'POST') {
      const body = await readJson(req)
      const profileId = String(body.profile_id || '').trim()
      if (!profileId) {
        sendJson(res, 400, envelope(null, 'profile_id is required', 400))
        return
      }
      const lead: GuestLead = {
        profile_id: profileId,
        full_name: String(body.full_name || body.name || 'Visitor').trim() || 'Visitor',
        phone: String(body.phone || '').trim(),
        email: String(body.email || '').trim(),
        meta: body.meta,
      }
      guestLeads.unshift(lead)
      sendJson(res, 200, envelope(lead, 'Guest saved'))
      return
    }

    if (path === '/api/v1/public/push/vapid-public-key' && method === 'GET') {
      sendJson(res, 200, envelope({ publicKey: E2E_VAPID_PUBLIC_KEY }))
      return
    }

    const pushStatusMatch = path.match(/^\/api\/v1\/public\/push\/subscription-status\/([^/]+)$/)
    if (pushStatusMatch && method === 'GET') {
      const slug = decodeURIComponent(pushStatusMatch[1])
      const endpoint = requestUrl.searchParams.get('endpoint') || ''
      const subscribed = pushSubscriptions.some(
        (row) => row.profile_slug === slug && (!endpoint || row.endpoint === endpoint)
      )
      sendJson(res, 200, envelope({ subscribed, preferences: null }))
      return
    }

    if (path === '/api/v1/public/push/subscribe' && method === 'POST') {
      const body = await readJson(req)
      const profileSlug = String(body.profile_slug || body.cardSlug || '').trim()
      const endpoint = String(body.endpoint || '').trim()
      if (!profileSlug || !endpoint) {
        sendJson(res, 400, envelope(null, 'profile_slug and endpoint are required', 400))
        return
      }
      pushSubscriptions.push({ profile_slug: profileSlug, endpoint })
      sendJson(res, 200, envelope({ subscribed: true, preferences: body.preferences || null }))
      return
    }

    if (path === '/api/v1/public/push/preferences' && method === 'POST') {
      const body = await readJson(req)
      sendJson(res, 200, envelope({ success: true, preferences: body.preferences || null }))
      return
    }

    if (path === '/api/v1/public/push/unsubscribe' && method === 'POST') {
      const body = await readJson(req)
      const endpoint = String(body.endpoint || '')
      for (let i = pushSubscriptions.length - 1; i >= 0; i -= 1) {
        if (pushSubscriptions[i].endpoint === endpoint) pushSubscriptions.splice(i, 1)
      }
      sendJson(res, 200, envelope({ ok: true }))
      return
    }

    if (path === '/api/v1/public/push/test' && method === 'POST') {
      sendJson(res, 200, envelope({ ok: true }))
      return
    }

    sendJson(res, 200, envelope([]))
    return
  }

  if (!isAuthenticated(req)) {
    sendJson(res, 403, envelope(null, 'Unauthorized', 403))
    return
  }

  if (path === '/api/v1/profiles/check-slug' && method === 'GET') {
    const slug = requestUrl.searchParams.get('slug') || ''
    sendJson(res, 200, envelope({ slug, available: true, suggestion: slug }))
    return
  }

  if (path === '/api/v1/profiles' && method === 'GET') {
    sendJson(
      res,
      200,
      envelope({
        items: Array.from(profiles.values()),
        total: profiles.size,
        capacity: { limit: 20, used: profiles.size, canCreate: true },
      })
    )
    return
  }

  if (path === '/api/v1/profiles' && method === 'POST') {
    const body = await readJson(req)
    const id = `created-${profiles.size + 1}`
    const profile: Profile = {
      ...baseProfile(),
      ...body,
      id,
      slug: String(body.slug || `created-card-${profiles.size + 1}`),
      name: String(body.name || ''),
      email: String(body.email || ''),
      settings: Array.isArray(body.settings) ? body.settings : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      isDraft: body.isDraft !== false,
      isPublic: body.isPublic === true,
    }
    profiles.set(id, profile)
    sendJson(res, 201, envelope(profile, 'Profile created', 201))
    return
  }

  const duplicateProfileMatch = path.match(/^\/api\/v1\/profiles\/([^/]+)\/duplicate$/)
  if (duplicateProfileMatch && method === 'POST') {
    const source = profiles.get(duplicateProfileMatch[1])
    if (!source) {
      sendJson(res, 404, envelope(null, 'Profile not found', 404))
      return
    }
    const id = `created-${profiles.size + 1}`
    const duplicate = {
      ...source,
      id,
      name: '',
      lastName: null,
      slug: '',
      dob: null,
      email: '',
      phone: null,
      whatsapp: null,
      countryCode: null,
      gender: null,
      maritalStatus: null,
      isDraft: true,
      isPublic: false,
      status: { id: 'draft', name: 'Draft' },
    }
    profiles.set(id, duplicate)
    sendJson(res, 201, envelope(duplicate, 'Profile duplicated as draft', 201))
    return
  }

  const profileMatch = path.match(/^\/api\/v1\/profiles\/([^/]+)$/)
  if (profileMatch && method === 'GET') {
    const profile = profiles.get(profileMatch[1])
    if (!profile) {
      sendJson(res, 404, envelope(null, 'Profile not found', 404))
      return
    }
    sendJson(res, 200, envelope(profile, 'Profile fetched'))
    return
  }

  if (profileMatch && method === 'PATCH') {
    const existing = profiles.get(profileMatch[1]) || baseProfile()
    const body = await readJson(req)
    const updated = {
      ...existing,
      ...body,
      id: profileMatch[1],
      settings: Array.isArray(body.settings)
        ? body.settings
        : Array.isArray(existing.settings)
          ? existing.settings
          : [],
      attachments: Array.isArray(body.attachments)
        ? body.attachments
        : Array.isArray(existing.attachments)
          ? existing.attachments
          : [],
    } as Profile
    profiles.set(profileMatch[1], updated)
    sendJson(res, 200, envelope(updated, 'Profile updated'))
    return
  }

  if (path === '/api/v1/profiles/dashboard/summary' || path === '/api/v1/profiles/dashboard/stats') {
    sendJson(res, 200, envelope(dashboardSummary()))
    return
  }

  if (path === '/api/v1/profiles/dashboard/weekly-engagement') {
    sendJson(res, 200, envelope({ days: [], totals: { views: 0, clicks: 0, avgCtr: 0 }, profileName: 'E2E Admin' }))
    return
  }

  if (path === '/api/v1/meetings') {
    sendJson(res, 200, envelope({ items: [], total: 0, skip: 0, limit: 100 }))
    return
  }

  if (path.startsWith('/api/v1/admin/profiles')) {
    const item = profiles.get('card-1')!
    sendJson(res, 200, envelope({ items: [item], total: 1, skip: 0, limit: 20, showAll: false }))
    return
  }

  if (path === '/api/v1/admin/leads/notes' && method === 'GET') {
    sendJson(res, 200, envelope(publicNotes))
    return
  }

  const adminNoteMatch = path.match(/^\/api\/v1\/admin\/leads\/notes\/([^/]+)$/)
  if (adminNoteMatch && method === 'PATCH') {
    const body = await readJson(req)
    const note = publicNotes.find((item) => item.id === adminNoteMatch[1])
    if (!note) {
      sendJson(res, 404, envelope(null, 'Note not found', 404))
      return
    }
    if (typeof body.lastReply === 'string') {
      note.reply = body.lastReply
      note.reply_at = new Date().toISOString()
      note.updated_at = note.reply_at
    }
    sendJson(res, 200, envelope(note, 'Lead note updated'))
    return
  }

  if (path.startsWith('/api/v1/admin/')) {
    sendJson(res, 200, envelope({ items: [], total: 0, skip: 0, limit: 20 }))
    return
  }

  sendJson(res, 200, envelope([]))
}

createServer((req, res) => {
  void handle(req, res).catch((error: unknown) => {
    sendJson(res, 500, envelope(null, error instanceof Error ? error.message : 'Mock API failure', 500))
  })
}).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`E2E mock API listening on ${PORT}\n`)
})
