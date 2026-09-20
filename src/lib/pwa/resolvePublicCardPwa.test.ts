import { buildPublicCardManifest } from '@/lib/pwa/resolvePublicCardPwa'
import { describe, expect, it } from 'vitest'

describe('public card PWA manifest', () => {
  it('keeps start_url inside scope so Chrome/Android can show Install', () => {
    const manifest = buildPublicCardManifest(null, 'ada-lovelace')
    expect(manifest.start_url).toBe('/vCard/ada-lovelace')
    expect(manifest.scope).toBe('/vCard/ada-lovelace')
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true)
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any')).toBe(true)
    expect(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any')).toBe(true)
  })
})
