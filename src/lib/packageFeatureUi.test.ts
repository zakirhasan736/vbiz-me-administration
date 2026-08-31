import { describe, expect, it } from 'vitest'
import { catalogFeatureAllowed, displayMediaAccess, resolvePerFileUploadLimit } from './packageAccess'
import {
  compactFeatureOverrides,
  formatGlobalFeatureDefault,
  overridablePackageFeatures,
  setOverride,
} from './packageFeatureUi'

describe('corporate manage-access overrides', () => {
  it('lists Corporate package features except the per-account card cap', () => {
    const rows = overridablePackageFeatures([
      { featureKey: 'max_cards', featureValue: '25' },
      { featureKey: 'allow_2d_explainer', featureValue: '1' },
      { featureKey: 'max_file_size_mb', featureValue: '50' },
    ])
    expect(rows.map((row) => row.featureKey)).toEqual(['allow_2d_explainer', 'max_file_size_mb'])
  })

  it('stores only real overrides', () => {
    const withYes = setOverride([], 'allow_2d_explainer', '0')
    const inherit = setOverride(withYes, 'allow_2d_explainer', null)
    expect(compactFeatureOverrides(withYes)).toEqual([{ featureKey: 'allow_2d_explainer', featureValue: '0' }])
    expect(compactFeatureOverrides(inherit)).toEqual([])
    expect(formatGlobalFeatureDefault({ featureKey: 'allow_2d_explainer', featureValue: '1' })).toBe('Yes')
  })

  it('reads media flags from the entitlements feature catalog', () => {
    const access = {
      allow_ai_assistance: true,
      allow_canva: true,
      allow_push_notification: true,
      allow_email_notification: true,
      allow_support_ticket: true,
      allow_auto_card_builder: true,
      allow_seo: true,
      allow_crm: true,
    }
    expect(
      catalogFeatureAllowed(
        {
          access,
          features: [{ featureKey: 'allow_2d_explainer', featureValue: '0' }],
          subscriptionActive: true,
        },
        'allow_2d_explainer'
      )
    ).toBe(false)
  })

  it('keeps missing media flags allowed when the subscription is paid', () => {
    expect(
      catalogFeatureAllowed(
        {
          access: {
            allow_ai_assistance: true,
            allow_canva: true,
            allow_push_notification: true,
            allow_email_notification: true,
            allow_support_ticket: true,
            allow_auto_card_builder: true,
            allow_seo: true,
            allow_crm: true,
          },
          features: [],
          subscriptionActive: true,
        },
        'allow_background_video_upload'
      )
    ).toBe(true)
  })

  it('locks media flags when payment is still pending', () => {
    expect(
      catalogFeatureAllowed(
        {
          access: {
            allow_ai_assistance: false,
            allow_canva: false,
            allow_push_notification: false,
            allow_email_notification: false,
            allow_support_ticket: false,
            allow_auto_card_builder: false,
            allow_seo: false,
            allow_crm: false,
          },
          features: [{ featureKey: 'allow_2d_explainer', featureValue: '1' }],
          subscriptionActive: false,
        },
        'allow_2d_explainer'
      )
    ).toBe(false)
  })

  it('locks avatar video independently of still-image upload', () => {
    const deny = (key: string) => key !== 'allow_video_upload'
    expect(displayMediaAccess('Profile Image/Video', deny)).toEqual({
      locked: false,
      allowVideo: false,
      allowAudio: false,
      sourceMode: 'image',
    })
  })

  it('does not cap builder uploads by package file size', () => {
    expect(resolvePerFileUploadLimit(50)).toEqual({ unlimited: true })
    expect(resolvePerFileUploadLimit(null).unlimited).toBe(true)
    expect(resolvePerFileUploadLimit(50, true).unlimited).toBe(true)
  })
})
