import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import {
  patchThemeConfigWallpaper,
  resolveWallpaperImageOverlayBackground,
  resolveWallpaperStyle,
  wallpaperImageOverlayEnabled,
} from '@/lib/theme/wallpaper'
import { describe, expect, it } from 'vitest'

describe('resolveWallpaperStyle', () => {
  it('promotes stored image style to video when cover media is an mp4', () => {
    const themeConfig = patchThemeConfigWallpaper(getDefaultThemeConfig('v3'), { style: 'image' }, 'v3')
    expect(
      resolveWallpaperStyle(themeConfig, 'https://cdn.example.com/vbizme/1786827491745-Animation-Vertical-2.mp4')
    ).toBe('video')
  })

  it('keeps fill/gradient paint modes even when media exists', () => {
    const themeConfig = patchThemeConfigWallpaper(getDefaultThemeConfig('v3'), { style: 'gradient' }, 'v3')
    expect(resolveWallpaperStyle(themeConfig, 'https://cdn.example.com/cover.mp4')).toBe('gradient')
  })
})

describe('wallpaper image overlay', () => {
  it('defaults to enabled with accent-based wash', () => {
    const themeConfig = patchThemeConfigWallpaper(getDefaultThemeConfig('v3'), { style: 'image' }, 'v3')
    const wallpaper = themeConfig.wallpaper!
    expect(wallpaperImageOverlayEnabled(wallpaper)).toBe(true)
    expect(resolveWallpaperImageOverlayBackground(wallpaper, '#eab308')).toContain('#eab308')
  })

  it('returns null when overlay is switched off', () => {
    const themeConfig = patchThemeConfigWallpaper(
      getDefaultThemeConfig('v3'),
      { style: 'image', imageOverlayEnabled: false },
      'v3'
    )
    expect(wallpaperImageOverlayEnabled(themeConfig.wallpaper!)).toBe(false)
    expect(resolveWallpaperImageOverlayBackground(themeConfig.wallpaper!, '#eab308')).toBeNull()
  })

  it('uses custom overlay color when source is custom', () => {
    const themeConfig = patchThemeConfigWallpaper(
      getDefaultThemeConfig('v3'),
      {
        style: 'image',
        imageOverlayEnabled: true,
        imageOverlaySource: 'custom',
        imageOverlayColor: '#112233',
        imageOverlayOpacity: 50,
      },
      'v3'
    )
    const bg = resolveWallpaperImageOverlayBackground(themeConfig.wallpaper!, '#eab308')
    expect(bg).toContain('#112233')
    expect(bg).toContain('50%')
  })
})
