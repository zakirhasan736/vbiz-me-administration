import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { patchThemeConfigWallpaper, resolveWallpaperStyle } from '@/lib/theme/wallpaper'
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
