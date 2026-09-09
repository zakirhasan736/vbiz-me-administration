import { describe, expect, it } from 'vitest'

import {
  buildEditorSettingsPath,
  buildIntegrationSettingsPath,
  DEFAULT_SETTINGS_TAB,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'

describe('vCard editor settings routes', () => {
  it('opens General Settings when no settings tab is provided', () => {
    expect(DEFAULT_SETTINGS_TAB).toBe('general')
    expect(parseEditorSegments(['settings']).settingsTab).toBe('general')
    expect(parseEditorSegments(['settings', 'info']).settingsTab).toBe('general')
    expect(parseEditorSegments(['settings', 'icons']).settingsTab).toBe('general')
    expect(buildEditorSettingsPath('/vcards/edit')).toBe('/vcards/edit/settings')
  })

  it('maps Integration and legacy AI Assistance routes', () => {
    expect(parseEditorSegments(['settings', 'integration']).settingsTab).toBe('integration')
    expect(parseEditorSegments(['settings', 'ai-assistance']).settingsTab).toBe('integration')
    expect(buildEditorSettingsPath('/vcards/edit', 'integration')).toBe('/vcards/edit/settings/integration')
    expect(buildEditorSettingsPath('/vcards/edit', 'ai-assistance')).toBe('/vcards/edit/settings/integration')
    expect(
      buildIntegrationSettingsPath('/vcards/edit', {
        cardId: 'abc',
        query: { aiAssistance: 'success' },
      })
    ).toBe('/vcards/edit/settings/integration?cardId=abc&aiAssistance=success')
  })
})
