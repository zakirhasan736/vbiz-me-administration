import { describe, expect, it } from 'vitest'

import {
  EXTRA_FIELDS_SETTING_KEY,
  mapExtraFieldsToApiSettings,
  parseExtraFieldsJson,
} from '@/lib/api/myCard/mapDisplaySettingsToApi'

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
