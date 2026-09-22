import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test'
import { MOCK_API } from './publicCardVisitor'

type Envelope = {
  success?: boolean
  statusCode?: number
  message?: string
  data?: unknown
}

type CatalogCall = {
  name: string
  method: 'GET' | 'POST'
  path: string
  status: number
  success: boolean
  body?: unknown
}

const SLUG = 'e2e-public-card'
const PROFILE_ID = 'public-card-1'

function catalog(project: string): CatalogCall[] {
  const endpoint = `https://push.example/catalog-${project}`
  const visitorId = `e2e-catalog-${project}`
  return [
    { name: 'health', method: 'GET', path: '/api/v1/health', status: 200, success: true },
    {
      name: 'google wallet',
      method: 'GET',
      path: `/api/v1/public/profiles/${SLUG}/google-wallet`,
      status: 200,
      success: true,
    },
    {
      name: 'apple wallet',
      method: 'GET',
      path: `/api/v1/public/profiles/${SLUG}/apple-wallet`,
      status: 200,
      success: true,
    },
    {
      name: 'profile live token',
      method: 'POST',
      path: `/api/v1/public/profiles/${PROFILE_ID}/assistant/live-token`,
      status: 200,
      success: true,
      body: {},
    },
    {
      name: 'profile live token is POST only',
      method: 'GET',
      path: `/api/v1/public/profiles/${PROFILE_ID}/assistant/live-token`,
      status: 404,
      success: false,
    },
    {
      name: 'landing live token',
      method: 'POST',
      path: '/api/v1/public/landing/assistant/live-token',
      status: 200,
      success: true,
      body: {},
    },
    {
      name: 'track event',
      method: 'POST',
      path: '/api/v1/public/track-event',
      status: 200,
      success: true,
      body: { eventType: 'profile_view', guestId: visitorId, profileId: PROFILE_ID, slug: SLUG },
    },
    { name: 'public card', method: 'GET', path: `/api/v1/public/v/${SLUG}`, status: 200, success: true },
    {
      name: 'bootstrap',
      method: 'GET',
      path: `/api/v1/public/v/${SLUG}/bootstrap`,
      status: 200,
      success: true,
    },
    {
      name: 'cards bootstrap',
      method: 'GET',
      path: `/api/v1/public/cards/${SLUG}/bootstrap`,
      status: 200,
      success: true,
    },
    {
      name: 'missing card',
      method: 'GET',
      path: '/api/v1/public/v/e2e-missing-card/bootstrap',
      status: 404,
      success: false,
    },
    { name: 'post types', method: 'GET', path: '/api/v1/public/post-types', status: 200, success: true },
    {
      name: 'settings',
      method: 'GET',
      path: `/api/v1/public/profiles/${PROFILE_ID}/settings`,
      status: 200,
      success: true,
    },
    {
      name: 'announcement',
      method: 'GET',
      path: `/api/v1/public/profiles/${PROFILE_ID}/announcement`,
      status: 200,
      success: true,
    },
    {
      name: 'dismiss announcement',
      method: 'POST',
      path: `/api/v1/public/profiles/${PROFILE_ID}/announcement/dismiss`,
      status: 200,
      success: true,
      body: { visitor_id: visitorId },
    },
    {
      name: 'team notices',
      method: 'GET',
      path: `/api/v1/public/profiles/${PROFILE_ID}/team-notices/active`,
      status: 200,
      success: true,
    },
    {
      name: 'dismiss team notice',
      method: 'POST',
      path: `/api/v1/public/profiles/${PROFILE_ID}/team-notices/notice-1/dismiss`,
      status: 200,
      success: true,
      body: { visitor_id: visitorId },
    },
    {
      name: 'ai data',
      method: 'GET',
      path: `/api/v1/public/profile-ai-data/${PROFILE_ID}`,
      status: 200,
      success: true,
    },
    {
      name: 'faq section',
      method: 'GET',
      path: `/api/v1/public/dynamic-section/Faq?profile_id=${PROFILE_ID}`,
      status: 200,
      success: true,
    },
    { name: 'public cards', method: 'GET', path: '/api/v1/public/public-cards', status: 200, success: true },
    { name: 'demo cards', method: 'GET', path: '/api/v1/public/landing/demo-cards', status: 200, success: true },
    {
      name: 'save guest',
      method: 'POST',
      path: '/api/v1/public/save-guest-user',
      status: 200,
      success: true,
      body: { profile_id: PROFILE_ID, full_name: `${project} catalog`, phone: '+15551230000' },
    },
    {
      name: 'save note',
      method: 'POST',
      path: '/api/v1/public/save-note',
      status: 200,
      success: true,
      body: { profile_id: PROFILE_ID, content: `catalog ${project}`, visitor_id: visitorId },
    },
    {
      name: 'notes',
      method: 'GET',
      path: `/api/v1/public/notes?profile_id=${PROFILE_ID}&visitor_id=${visitorId}`,
      status: 200,
      success: true,
    },
    {
      name: 'notes require a visitor',
      method: 'GET',
      path: `/api/v1/public/notes?profile_id=${PROFILE_ID}`,
      status: 400,
      success: false,
    },
    {
      name: 'save contact',
      method: 'GET',
      path: `/api/v1/public/save-contact/${PROFILE_ID}`,
      status: 200,
      success: true,
    },
    {
      name: 'push status',
      method: 'GET',
      path: `/api/v1/public/push/subscription-status/${SLUG}?endpoint=${encodeURIComponent(endpoint)}`,
      status: 200,
      success: true,
    },
    { name: 'vapid key', method: 'GET', path: '/api/v1/public/push/vapid-public-key', status: 200, success: true },
    {
      name: 'push subscribe',
      method: 'POST',
      path: '/api/v1/public/push/subscribe',
      status: 200,
      success: true,
      body: { profile_slug: SLUG, endpoint, keys: { p256dh: 'dGVzdA', auth: 'dGVzdA' } },
    },
    {
      name: 'push preferences',
      method: 'POST',
      path: '/api/v1/public/push/preferences',
      status: 200,
      success: true,
      body: { profile_slug: SLUG, endpoint, preferences: { announcement_updates: true } },
    },
    {
      name: 'push test',
      method: 'POST',
      path: '/api/v1/public/push/test',
      status: 200,
      success: true,
      body: { profile_slug: SLUG, endpoint },
    },
    {
      name: 'push unsubscribe',
      method: 'POST',
      path: '/api/v1/public/push/unsubscribe',
      status: 200,
      success: true,
      body: { profile_slug: SLUG, endpoint },
    },
  ]
}

async function call(api: APIRequestContext, userAgent: string, entry: CatalogCall): Promise<APIResponse> {
  const url = `${MOCK_API}${entry.path}`
  const headers = { 'User-Agent': userAgent, 'Content-Type': 'application/json' }
  if (entry.method === 'GET') return api.get(url, { headers })
  return api.post(url, { headers, data: entry.body ?? {} })
}

test.describe('iPhone public API catalog', () => {
  test('every public route returns the expected envelope for this iPhone', async ({ page }) => {
    const project = test.info().project.name
    const userAgent = await page.evaluate(() => navigator.userAgent)
    expect(userAgent).toMatch(/iPhone/)
    test.info().annotations.push({ type: 'user-agent', description: userAgent })

    const api = page.request
    for (const entry of catalog(project)) {
      await test.step(entry.name, async () => {
        const response = await call(api, userAgent, entry)
        const text = await response.text()
        expect(response.status(), `${entry.name} ${text.slice(0, 300)}`).toBe(entry.status)
        expect(response.headers()['content-type'] || '').toMatch(/json/i)
        const body = JSON.parse(text) as Envelope
        expect(body.success, entry.name).toBe(entry.success)
        if (entry.name.includes('live token') && entry.success) {
          const token = String((body.data as { token?: string } | null)?.token || '')
          expect(token).toBe('e2e-ephemeral-token')
          expect(token).not.toMatch(/AIza|GEMINI_API_KEY/)
        }
        if (entry.name === 'faq section') {
          const html = ((body.data as { items?: Array<{ description?: string }> }).items || [])[0]?.description || ''
          expect(html).toContain('<h1>Heading One</h1>')
          expect(html).toContain('<strong>bold</strong>')
        }
      })
    }
  })
})
