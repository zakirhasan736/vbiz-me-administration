import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const SW_SOURCE = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8')

type Listener = (event: Record<string, unknown>) => void

/** Run public/sw.js in a sandbox with a fake ServiceWorkerGlobalScope. */
function loadWorker(options: { cacheOpenThrows?: boolean; meta?: Record<string, unknown> } = {}) {
  const listeners: Record<string, Listener> = {}
  const shown: { title: string; options: Record<string, unknown> }[] = []
  const deletedCaches: string[] = []
  const store = new Map<string, Map<string, string>>()
  if (options.meta) {
    store.set('vbiz-owner-push-meta', new Map([['/__vbiz_push_meta', JSON.stringify(options.meta)]]))
  }
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  const newSubscription = {
    endpoint: 'https://push.example/new-endpoint',
    toJSON: () => ({ endpoint: 'https://push.example/new-endpoint', keys: { p256dh: 'new-p256dh', auth: 'new-auth' } }),
  }

  const caches = {
    open: async (name: string) => {
      if (options.cacheOpenThrows) throw new Error('cache unavailable')
      if (!store.has(name)) store.set(name, new Map())
      const entries = store.get(name) as Map<string, string>
      return {
        match: async (key: string | { url: string }) => {
          const value = entries.get(typeof key === 'string' ? key : key.url)
          return value === undefined ? undefined : new Response(value)
        },
        put: async (key: string, res: Response) => {
          entries.set(key, await res.text())
        },
        keys: async () => [],
        delete: async () => true,
      }
    },
    keys: async () => [...store.keys(), 'vbiz-public-card-shell-v1'],
    delete: async (name: string) => {
      deletedCaches.push(name)
      store.delete(name)
      return true
    },
  }

  const self = {
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn
    },
    location: { origin: 'https://vbizme.com' },
    registration: {
      showNotification: async (title: string, opts: Record<string, unknown>) => {
        shown.push({ title, options: opts })
      },
      pushManager: { getSubscription: async () => newSubscription, subscribe: async () => newSubscription },
    },
    clients: { matchAll: async () => [], claim: async () => undefined, openWindow: async () => null },
    skipWaiting: async () => undefined,
  }

  const context = vm.createContext({
    self,
    caches,
    fetch: fetchMock,
    Response,
    Request,
    URL,
    console,
    atob,
    setTimeout,
    clearTimeout,
    navigator: {},
  })
  vm.runInContext(SW_SOURCE, context)

  const dispatch = async (type: string, event: Record<string, unknown>) => {
    let pending: Promise<unknown> = Promise.resolve()
    listeners[type]?.({ ...event, waitUntil: (p: Promise<unknown>) => (pending = p) })
    await pending
  }
  const push = (payload: Record<string, unknown>) =>
    dispatch('push', { data: { json: () => payload, text: () => JSON.stringify(payload) } })

  return { dispatch, push, shown, fetchMock, deletedCaches }
}

describe('service worker push delivery', () => {
  it('still shows the notification when card media lookup fails (never a silent push)', async () => {
    const sw = loadWorker({ cacheOpenThrows: true })
    await sw.push({
      title: 'New lead saved your contact',
      body: 'Jane saved your card',
      type: 'save_contact',
      slug: 'mike',
    })
    expect(sw.shown).toHaveLength(1)
    expect(sw.shown[0].title).toBeTruthy()
  })

  it('gives the same event the same tag (a repeat replaces, never stacks) and different leads different tags', async () => {
    const sw = loadWorker()
    const lead = {
      title: 'New lead',
      body: 'Jane saved your card',
      type: 'save_contact',
      slug: 'mike',
      eventId: 'save_contact:1',
    }
    await sw.push(lead)
    await sw.push(lead)
    await sw.push({ ...lead, body: 'Tom saved your card', eventId: 'save_contact:2' })
    const tags = sw.shown.map((n) => n.options.tag)
    expect(tags[0]).toBe(tags[1])
    expect(tags[2]).not.toBe(tags[0])
  })

  it('collapses identical owner alerts even without an event id', async () => {
    const sw = loadWorker()
    const alert = {
      title: "They're back",
      body: 'Mike is viewing your card again.',
      type: 'viewer_return',
      slug: 'mike',
    }
    await sw.push(alert)
    await sw.push(alert)
    expect(sw.shown[0].options.tag).toBe(sw.shown[1].options.tag)
  })
})

describe('service worker subscription renewal', () => {
  it('moves the device to the renewed endpoint on the server by itself (no back office needed)', async () => {
    const sw = loadWorker({
      meta: {
        publicKey: 'BAAA',
        rotateUrl: 'https://api.vbizme.com/api/v1/public/push/rotate',
        endpoint: 'https://push.example/old-endpoint',
      },
    })
    await sw.dispatch('pushsubscriptionchange', { oldSubscription: null, newSubscription: null })
    expect(sw.fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = sw.fetchMock.mock.calls[0] as unknown as [string, { body: string }]
    expect(url).toBe('https://api.vbizme.com/api/v1/public/push/rotate')
    expect(JSON.parse(init.body)).toEqual({
      old_endpoint: 'https://push.example/old-endpoint',
      endpoint: 'https://push.example/new-endpoint',
      keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
    })
  })

  it('keeps the push meta cache when a new worker activates (deploys must not break renewal)', async () => {
    const sw = loadWorker({ meta: { publicKey: 'BAAA' } })
    await sw.dispatch('activate', {})
    expect(sw.deletedCaches).not.toContain('vbiz-owner-push-meta')
  })
})
