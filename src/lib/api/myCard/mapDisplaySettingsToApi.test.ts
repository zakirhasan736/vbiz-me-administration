import { describe, expect, it } from 'vitest'

import {
  EXTRA_FIELDS_SETTING_KEY,
  mapDisplaySettingsToApiSettings,
  mapExtraFieldsToApiSettings,
  omitUnchangedCorporateSharedSettings,
  parseExtraFieldsJson,
  TAB_LABEL_OVERRIDES_SETTING_KEY,
} from '@/lib/api/myCard/mapDisplaySettingsToApi'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'

describe('extra fields settings', () => {
  it('round-trips empty extra-field drafts so autosave cannot drop them', () => {
    const fields = [
      { id: 'extra_draft', icon: 'Link', name: '', value: '' },
      { id: 'extra_2', icon: 'Phone', name: 'Office', value: '' },
    ]
    const settings = mapExtraFieldsToApiSettings(fields)
    expect(settings[EXTRA_FIELDS_SETTING_KEY]).toBeTruthy()
    expect(parseExtraFieldsJson(settings[EXTRA_FIELDS_SETTING_KEY])).toEqual(fields)
  })

  it('keeps unlabeled rows and normalizes legacy icon names', () => {
    const parsed = parseExtraFieldsJson(
      JSON.stringify([
        { id: 'a', icon: 'fa-phone', name: 'Secret', value: '1234' },
        { key: 'Portfolio', value: 'https://example.com', css_class: 'fa-link' },
        { name: '', value: '' },
      ])
    )
    expect(parsed).toEqual([
      { id: 'a', icon: 'Phone', name: 'Secret', value: '1234' },
      { id: 'extra_1', icon: 'Link', name: 'Portfolio', value: 'https://example.com' },
      { id: 'extra_2', icon: 'Link', name: '', value: '' },
    ])
  })

  it('writes an empty JSON array when every extra field is removed', () => {
    expect(mapExtraFieldsToApiSettings([])).toEqual({ [EXTRA_FIELDS_SETTING_KEY]: '[]' })
  })
})

describe('mapDisplaySettingsToApiSettings YouTube clears', () => {
  it('persists empty intro / background-music YouTube URLs so Remove does not revive them', () => {
    const display: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Intro YouTube vCard Video Link': { visible: true, customValue: '' },
        'YouTube Background Music Link': { visible: true, customValue: '   ' },
        'Intro vCard Video': { visible: true, customValue: '' },
      },
    }
    const settings = mapDisplaySettingsToApiSettings(display)
    expect(settings.intro_youtube_url).toBe('')
    expect(settings.background_music_url).toBe('')
    // File media still omits empty clears (legacy attachments use /media/clear).
    expect(settings.intro_video_url).toBeUndefined()
  })

  it('still writes non-empty YouTube URLs', () => {
    const display: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'Intro YouTube vCard Video Link': {
          visible: true,
          customValue: 'https://www.youtube.com/watch?v=abc123',
        },
      },
    }
    const settings = mapDisplaySettingsToApiSettings(display)
    expect(settings.intro_youtube_url).toBe('https://www.youtube.com/watch?v=abc123')
  })
})

describe('omitUnchangedCorporateSharedSettings', () => {
  it('keeps a renamed tab label and drops unchanged shared override JSON only', () => {
    const current = {
      customTabs: [],
      tabLabelOverrides: { services: 'Our Services' },
      tabSectionMeta: {},
    }
    const saved = {
      customTabs: [],
      tabLabelOverrides: { services: 'Servicess' },
      tabSectionMeta: {},
    }
    const omitted = omitUnchangedCorporateSharedSettings(
      {
        [TAB_LABEL_OVERRIDES_SETTING_KEY]: JSON.stringify(current.tabLabelOverrides),
        [EXTRA_FIELDS_SETTING_KEY]: '[]',
      },
      current,
      saved
    )
    expect(omitted[TAB_LABEL_OVERRIDES_SETTING_KEY]).toBe(JSON.stringify({ services: 'Our Services' }))
    // Per-card settings (extra fields, SEO, games, display) are never stripped here.
    expect(omitted[EXTRA_FIELDS_SETTING_KEY]).toBe('[]')

    const unchanged = omitUnchangedCorporateSharedSettings(
      { [TAB_LABEL_OVERRIDES_SETTING_KEY]: JSON.stringify(saved.tabLabelOverrides) },
      saved,
      saved
    )
    expect(unchanged[TAB_LABEL_OVERRIDES_SETTING_KEY]).toBeUndefined()
  })
})
