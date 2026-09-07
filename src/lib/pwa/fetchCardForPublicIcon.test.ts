import type { MyCardData } from '@interfaces/api/myCard'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicCardApiError } from '../api/myCard/publicCardApiError'

const { fetchMyCardBySlugMock } = vi.hoisted(() => ({
  fetchMyCardBySlugMock: vi.fn(),
}))

vi.mock('@/lib/api/myCard/fetchMyCardBySlug', () => ({
  fetchMyCardBySlug: fetchMyCardBySlugMock,
}))

import { clearPublicIconCardCacheForTests, fetchCardForPublicIcon } from './fetchCardForPublicIcon'

const sampleCard = { profile: { name: 'Rifajul' } } as MyCardData

describe('fetchCardForPublicIcon', () => {
  beforeEach(() => {
    clearPublicIconCardCacheForTests()
    fetchMyCardBySlugMock.mockReset()
  })

  afterEach(() => {
    clearPublicIconCardCacheForTests()
    vi.restoreAllMocks()
  })

  it('dedupes concurrent fetches for the same slug', async () => {
    let resolveFetch!: (value: MyCardData) => void
    fetchMyCardBySlugMock.mockReturnValue(
      new Promise<MyCardData>((resolve) => {
        resolveFetch = resolve
      })
    )

    const a = fetchCardForPublicIcon('Rifajul')
    const b = fetchCardForPublicIcon('rifajul')
    expect(fetchMyCardBySlugMock).toHaveBeenCalledTimes(1)

    resolveFetch(sampleCard)
    await expect(Promise.all([a, b])).resolves.toEqual([sampleCard, sampleCard])
  })

  it('reuses a fresh cache hit without calling the API again', async () => {
    fetchMyCardBySlugMock.mockResolvedValue(sampleCard)
    await expect(fetchCardForPublicIcon('rifajul')).resolves.toBe(sampleCard)
    await expect(fetchCardForPublicIcon('rifajul')).resolves.toBe(sampleCard)
    expect(fetchMyCardBySlugMock).toHaveBeenCalledTimes(1)
  })

  it('serves stale cache when a later fetch is rate limited', async () => {
    let now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)

    fetchMyCardBySlugMock.mockResolvedValueOnce(sampleCard)
    await fetchCardForPublicIcon('rifajul')

    now += 61_000
    fetchMyCardBySlugMock.mockRejectedValueOnce(new PublicCardApiError('rate limited', 'RATE_LIMITED', 429, 'req-1'))

    await expect(fetchCardForPublicIcon('rifajul')).resolves.toBe(sampleCard)
  })

  it('rethrows rate limit when there is no stale cache', async () => {
    fetchMyCardBySlugMock.mockRejectedValue(new PublicCardApiError('rate limited', 'RATE_LIMITED', 429, 'req-1'))
    await expect(fetchCardForPublicIcon('rifajul')).rejects.toMatchObject({ kind: 'RATE_LIMITED' })
  })
})
