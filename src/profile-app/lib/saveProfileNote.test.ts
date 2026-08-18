import { fetchProfileNotes, getProfileVisitorId, saveProfileNote } from '@/profile-app/lib/saveProfileNote'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const note = {
  id: 'note-1',
  profile_id: 'profile-1',
  content: 'Thanks for connecting.',
  author_name: 'Visitor',
  created_at: '2026-08-18T08:00:00.000Z',
  updated_at: '2026-08-18T08:00:00.000Z',
  reply: 'Thank you for reaching out.',
  reply_at: '2026-08-18T09:00:00.000Z',
}

describe('public note transport', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts visitor identity and unwraps the API envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: note }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      saveProfileNote(' profile-1 ', ' Thanks for connecting. ', {
        authorName: ' Visitor ',
        visitorId: 'visitor-1',
      })
    ).resolves.toEqual(note)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const params = new URL(url).searchParams
    expect(params.get('profile_id')).toBe('profile-1')
    expect(params.get('content')).toBe('Thanks for connecting.')
    expect(params.get('author_name')).toBe('Visitor')
    expect(params.get('visitor_id')).toBe('visitor-1')
    expect(init.method).toBe('POST')
  })

  it('loads only the visitor-scoped notes, including owner replies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [note] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchProfileNotes('profile-1', 'visitor-1')).resolves.toEqual([note])

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const params = new URL(url).searchParams
    expect(params.get('profile_id')).toBe('profile-1')
    expect(params.get('visitor_id')).toBe('visitor-1')
    expect(init.method).toBe('GET')
  })

  it('keeps one visitor identity per profile', () => {
    const first = getProfileVisitorId('profile-1')
    const second = getProfileVisitorId('profile-1')
    const otherProfile = getProfileVisitorId('profile-2')

    expect(first).toBeTruthy()
    expect(second).toBe(first)
    expect(otherProfile).toBeTruthy()
    expect(otherProfile).not.toBe(first)
  })
})
