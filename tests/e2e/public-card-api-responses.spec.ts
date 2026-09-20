import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test'
import { MOCK_API, openReadyPublicCard, prepareVisitor } from './publicCardVisitor'

type Envelope = {
  success?: boolean
  statusCode?: number
  message?: string
  data?: unknown
  error?: string
}

async function readEnvelope(res: APIResponse): Promise<Envelope> {
  const text = await res.text()
  expect(res.ok(), `${res.status()} ${res.url()} ${text.slice(0, 400)}`).toBeTruthy()
  const body = JSON.parse(text) as Envelope
  expect(body.success, text.slice(0, 400)).toBe(true)
  return body
}

async function getJson(api: APIRequestContext, url: string) {
  return readEnvelope(await api.get(url))
}

test.describe('Public card API responses across devices', () => {
  test.describe.configure({ timeout: 60_000 })

  test('backend public endpoints return a success envelope for this device UA', async ({ page }) => {
    const api = page.request
    const ua = await page.evaluate(() => navigator.userAgent)
    const project = test.info().project.name
    test.info().annotations.push({ type: 'user-agent', description: ua })
    test.info().annotations.push({ type: 'project', description: project })

    const health = await getJson(api, `${MOCK_API}/api/v1/health`)
    expect((health.data as { status?: string }).status).toBe('healthy')

    const bootstrap = await getJson(api, `${MOCK_API}/api/v1/public/v/e2e-public-card/bootstrap`)
    const bootCard = bootstrap.data as {
      myCard?: { profile?: { id?: string; slug?: string; phone?: string; name?: string }; intro_video?: unknown }
    }
    expect(bootCard.myCard?.profile).toMatchObject({
      id: 'public-card-1',
      slug: 'e2e-public-card',
      name: 'Public Test Card',
      phone: '+15550002222',
    })

    const cardsBootstrap = await getJson(api, `${MOCK_API}/api/v1/public/cards/e2e-public-card/bootstrap`)
    expect((cardsBootstrap.data as { myCard?: { profile?: { slug?: string } } }).myCard?.profile?.slug).toBe(
      'e2e-public-card'
    )

    const card = await getJson(api, `${MOCK_API}/api/v1/public/v/e2e-public-card`)
    expect((card.data as { profile?: { slug?: string } }).profile?.slug).toBe('e2e-public-card')

    const intro = await getJson(api, `${MOCK_API}/api/v1/public/v/e2e-intro-card/bootstrap`)
    const introUrl = (intro.data as { myCard?: { intro_video?: { url?: string } } }).myCard?.intro_video?.url
    expect(introUrl).toContain('/e2e/intro.mp4')

    await getJson(api, `${MOCK_API}/api/v1/public/post-types`)
    await getJson(api, `${MOCK_API}/api/v1/public/profiles/public-card-1/settings`)
    await getJson(api, `${MOCK_API}/api/v1/public/profiles/public-card-1/announcement`)
    await getJson(api, `${MOCK_API}/api/v1/public/profiles/public-card-1/team-notices/active`)
    await getJson(api, `${MOCK_API}/api/v1/public/profile-ai-data/public-card-1`)
    await getJson(api, `${MOCK_API}/api/v1/public/dynamic-section/about`)
    await getJson(api, `${MOCK_API}/api/v1/public/public-cards`)
    await getJson(api, `${MOCK_API}/api/v1/public/landing/demo-cards`)

    const googleWallet = await getJson(api, `${MOCK_API}/api/v1/public/profiles/e2e-public-card/google-wallet`)
    expect((googleWallet.data as { provider?: string }).provider).toBe('google-wallet')
    const appleWallet = await getJson(api, `${MOCK_API}/api/v1/public/profiles/e2e-public-card/apple-wallet`)
    expect((appleWallet.data as { provider?: string }).provider).toBe('apple-wallet')

    const contact = await getJson(api, `${MOCK_API}/api/v1/public/save-contact/public-card-1`)
    const saveContact = (
      contact.data as { action_buttons?: { save_contact?: { data?: { name?: string; phone?: string } } } }
    ).action_buttons?.save_contact?.data
    expect(saveContact).toMatchObject({ name: 'Public Test Card', phone: '+15550002222' })

    const notes = await getJson(
      api,
      `${MOCK_API}/api/v1/public/notes?profile_id=public-card-1&visitor_id=e2e-${project}`
    )
    expect(Array.isArray(notes.data)).toBe(true)

    const vapid = await getJson(api, `${MOCK_API}/api/v1/public/push/vapid-public-key`)
    expect(String((vapid.data as { publicKey?: string }).publicKey || '')).toMatch(/^[A-Za-z0-9_-]+$/)

    const status = await getJson(
      api,
      `${MOCK_API}/api/v1/public/push/subscription-status/e2e-public-card?endpoint=https://push.example/${project}`
    )
    expect((status.data as { subscribed?: boolean }).subscribed).toBe(false)

    const missing = await api.get(`${MOCK_API}/api/v1/public/v/e2e-missing-card/bootstrap`)
    expect(missing.status()).toBe(404)
    const missingBody = (await missing.json()) as Envelope
    expect(missingBody.success).toBe(false)

    const notesMissing = await api.get(`${MOCK_API}/api/v1/public/notes?profile_id=public-card-1`)
    expect(notesMissing.status()).toBe(400)
  })

  test('backend public POST endpoints accept this device payload', async ({ page }) => {
    const api = page.request
    const project = test.info().project.name
    const endpoint = `https://push.example/e2e-${project}`

    const guest = await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/save-guest-user`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          profile_id: 'public-card-1',
          full_name: `${project} visitor`,
          phone: '+15551230000',
          email: `${project}@example.com`,
          meta: { source: 'playwright', project },
        },
      })
    )
    expect(guest.data).toMatchObject({
      profile_id: 'public-card-1',
      full_name: `${project} visitor`,
      email: `${project}@example.com`,
    })

    const note = await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/save-note`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          profile_id: 'public-card-1',
          content: `Hello from ${project}`,
          author_name: `${project} visitor`,
          visitor_id: `e2e-${project}`,
        },
      })
    )
    expect(note.data).toMatchObject({
      profile_id: 'public-card-1',
      content: `Hello from ${project}`,
    })

    await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/track-event`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          eventType: 'profile_view',
          guestId: `e2e-${project}`,
          profileId: 'public-card-1',
          slug: 'e2e-public-card',
        },
      })
    )

    await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/profiles/public-card-1/announcement/dismiss`, {
        headers: { 'Content-Type': 'application/json' },
        data: { visitor_id: `e2e-${project}` },
      })
    )

    const subscribe = await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/push/subscribe`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          profile_slug: 'e2e-public-card',
          endpoint,
          keys: { p256dh: 'dGVzdA', auth: 'dGVzdA' },
        },
      })
    )
    expect((subscribe.data as { subscribed?: boolean }).subscribed).toBe(true)

    await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/push/preferences`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          profile_slug: 'e2e-public-card',
          endpoint,
          preferences: { announcement_updates: true },
        },
      })
    )
    await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/push/test`, {
        headers: { 'Content-Type': 'application/json' },
        data: { profile_slug: 'e2e-public-card', endpoint },
      })
    )
    await readEnvelope(
      await api.post(`${MOCK_API}/api/v1/public/push/unsubscribe`, {
        headers: { 'Content-Type': 'application/json' },
        data: { profile_slug: 'e2e-public-card', endpoint },
      })
    )
  })

  test('same-origin Next proxies match backend and VCF matches this device', async ({ page }) => {
    const api = page.request
    const project = test.info().project.name

    const backendVapid = await getJson(api, `${MOCK_API}/api/v1/public/push/vapid-public-key`)
    const nextVapid = await getJson(api, '/api/push/vapid-public-key')
    expect(nextVapid.data).toEqual(backendVapid.data)

    const nextStatus = await getJson(api, '/api/push/subscription-status/e2e-public-card')
    expect((nextStatus.data as { subscribed?: boolean }).subscribed).toBe(false)

    const guest = await readEnvelope(
      await api.post('/api/save-guest-user', {
        multipart: {
          profile_id: 'public-card-1',
          full_name: `${project} proxy`,
          phone: '+15551239999',
          email: `${project}-proxy@example.com`,
        },
      })
    )
    expect(guest.data).toMatchObject({
      profile_id: 'public-card-1',
      full_name: `${project} proxy`,
    })

    const vcf = await api.get(
      '/api/save-contact-vcf/public-card-1?full_name=Device%20Visitor&phone=%2B15551230000&email=device%40example.com&card_slug=e2e-public-card'
    )
    expect(vcf.ok(), `${vcf.status()} ${await vcf.text()}`).toBeTruthy()
    const contentType = vcf.headers()['content-type'] || ''
    const disposition = vcf.headers()['content-disposition'] || ''
    const body = await vcf.text()
    expect(contentType).toMatch(/vcard|x-vcard/i)
    expect(body).toContain('BEGIN:VCARD')
    expect(body).toContain('VERSION:3.0')
    expect(body).toContain('FN:Public Test Card')
    expect(body).toContain('TEL;TYPE=CELL:+15550002222')
    if (project === 'iphone') {
      expect(disposition).toMatch(/^inline/i)
    } else {
      expect(disposition).toMatch(/^attachment/i)
    }
  })

  test('public card page never gets a failed public API response', async ({ page }) => {
    const failures: string[] = []
    page.on('response', (response) => {
      const url = response.url()
      if (!/\/api\/v1\/public\/|\/api\/(save-contact-vcf|save-guest-user|push)\//.test(url)) return
      if (response.status() >= 400) {
        failures.push(`${response.status()} ${response.request().method()} ${url}`)
      }
    })

    await prepareVisitor(page)
    await openReadyPublicCard(page)
    await expect(page.getByRole('heading', { name: 'Public Test Card' })).toBeVisible()
    expect(failures, failures.join('\n')).toEqual([])
    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0)
  })
})
