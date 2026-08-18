import { describe, expect, it } from 'vitest'

import { buildEditorSettingsPath, DEFAULT_SETTINGS_TAB, parseEditorSegments } from '@/lib/vcardEditorRoutes'

describe('vCard editor settings routes', () => {
  it('opens General Settings when no settings tab is provided', () => {
    expect(DEFAULT_SETTINGS_TAB).toBe('general')
    expect(parseEditorSegments(['settings']).settingsTab).toBe('general')
    expect(parseEditorSegments(['settings', 'info']).settingsTab).toBe('general')
    expect(parseEditorSegments(['settings', 'icons']).settingsTab).toBe('general')
    expect(buildEditorSettingsPath('/vcards/edit')).toBe('/vcards/edit/settings')
  })
})
