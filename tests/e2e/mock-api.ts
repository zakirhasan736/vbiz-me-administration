import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const PORT = 5101
const ACCESS_TOKEN = 'e2e-access-token'

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
}

const baseProfile = (): Profile => ({
  id: 'card-1',
  slug: 'existing-card',
  name: 'Existing Card',
  email: 'owner@example.com',
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

function envelope<T>(data: T, message = 'OK', statusCode = 200) {
  return { success: statusCode < 400, statusCode, message, data }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3101',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  })
  res.end(payload)
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
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
    if (path === '/api/v1/public/v/e2e-public-card' && method === 'GET') {
      sendJson(res, 200, envelope(publicCard()))
      return
    }
    if (path === '/api/v1/public/post-types' && method === 'GET') {
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
