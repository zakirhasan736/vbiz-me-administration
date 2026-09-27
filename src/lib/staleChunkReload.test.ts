import { isStaleChunkLoadError, shouldReloadForStaleChunk, STALE_CHUNK_RELOAD_BOOTSTRAP } from '@/lib/staleChunkReload'
import { describe, expect, it } from 'vitest'

describe('isStaleChunkLoadError', () => {
  it('matches Next / Safari stale-deploy chunk failures', () => {
    expect(
      isStaleChunkLoadError(
        'ChunkLoadError: Failed to load chunk /_next/static/chunks/0m0ly~zyp_cgo.js from module 435657'
      )
    ).toBe(true)
    expect(isStaleChunkLoadError('Failed to load chunk /_next/static/chunks/app.js from module 12')).toBe(true)
    expect(isStaleChunkLoadError('Loading chunk 435657 failed.')).toBe(true)
    expect(
      isStaleChunkLoadError('Failed to fetch dynamically imported module: https://app.vbizme.com/_next/static/x.js')
    ).toBe(true)
    expect(isStaleChunkLoadError('Importing a module script failed.')).toBe(true)
    expect(
      isStaleChunkLoadError(
        'Uncaught ChunkLoadError: Failed to load chunk /_next/static/chunks/0ogktlug8zgmb.js from module 964893'
      )
    ).toBe(true)
    expect(
      isStaleChunkLoadError({
        name: 'ChunkLoadError',
        message: 'Failed to load chunk /_next/static/chunks/0ogktlug8zgmb.js from module 964893',
      })
    ).toBe(true)
  })

  it('does not treat real app errors as chunk misses', () => {
    expect(isStaleChunkLoadError('Upload failed (500)')).toBe(false)
    expect(isStaleChunkLoadError("Cannot read properties of undefined (reading 'id')")).toBe(false)
  })

  it('embeds recovery in the early browser bootstrap', () => {
    expect(STALE_CHUNK_RELOAD_BOOTSTRAP).toContain('failed to load chunk')
    expect(STALE_CHUNK_RELOAD_BOOTSTRAP).toContain('chunkloaderror')
    expect(STALE_CHUNK_RELOAD_BOOTSTRAP).toContain('location.reload')
  })
})

describe('shouldReloadForStaleChunk', () => {
  it('reloads once, then cools down', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    expect(shouldReloadForStaleChunk(1_000, storage)).toBe(true)
    expect(shouldReloadForStaleChunk(5_000, storage)).toBe(false)
    expect(shouldReloadForStaleChunk(20_000, storage)).toBe(true)
  })
})
