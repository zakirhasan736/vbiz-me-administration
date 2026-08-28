import { describe, expect, it } from 'vitest'

import {
  NAV_BAR_FIELDS,
  NAV_BAR_NAV_ITEMS,
  resolvePublicPreviewSectionId,
  selectEnabledNavItems,
} from '@/lib/vcardNavbar'
import { createDefaultDisplaySettings } from '@/types/vcardDisplaySettings'

describe('selectEnabledNavItems', () => {
  it('keeps only active tabs and the saved public order', () => {
    const settings = createDefaultDisplaySettings([...NAV_BAR_FIELDS])
    settings.fields.Reviews = { visible: false }
    settings.fields.Services = { visible: true }
    settings.editorNavOrder = ['home', 'reviews', 'services', 'public-cards', 'my-info']

    const ids = selectEnabledNavItems(NAV_BAR_NAV_ITEMS, settings).map((item) => item.id)
    expect(ids.includes('reviews')).toBe(false)
    expect(ids.filter((id) => id === 'home' || id === 'services' || id === 'public-cards' || id === 'my-info')).toEqual(
      ['home', 'services', 'public-cards', 'my-info']
    )
  })
})

describe('resolvePublicPreviewSectionId', () => {
  it('stays on a public tab and maps Global Connection to Public Cards', () => {
    const visible = ['home', 'about', 'public-cards', 'my-info']
    expect(resolvePublicPreviewSectionId('services', visible)).toBe('home')
    expect(resolvePublicPreviewSectionId('about', visible)).toBe('about')
    expect(resolvePublicPreviewSectionId('global-connection', visible)).toBe('public-cards')
    expect(resolvePublicPreviewSectionId('settings', visible)).toBe('home')
  })
})
