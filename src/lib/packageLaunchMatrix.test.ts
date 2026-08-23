import { homePathForSession, resolvePostLoginPath } from '@/lib/auth/sessionPolicy'
import { corporateCardCreateBlockedReason } from '@/lib/corporateCardCapacity'
import {
  FEATURE_LIMIT_REACHED,
  FEATURE_NOT_INCLUDED,
  PACKAGE_FEATURE_LOCKED,
  PACKAGE_LIMIT_REACHED,
  catalogFeatureAllowed,
  displayMediaAccess,
  isFeatureLimitCode,
  isFeatureLockCode,
  musicFileAllowed,
} from '@/lib/packageAccess'
import { describe, expect, it } from 'vitest'

const paidAccess = {
  allow_ai_assistance: true,
  allow_canva: true,
  allow_push_notification: true,
  allow_email_notification: true,
  allow_support_ticket: true,
  allow_auto_card_builder: true,
  allow_seo: true,
}

describe('package launch matrix', () => {
  it('keeps unpaid Corporate on Corporate home even when paid flags are off', () => {
    expect(homePathForSession({ role: 'vcard-owner', ownerMode: 'corporate' })).toBe('/teamvcard')
    expect(resolvePostLoginPath({ role: 'vcard-owner', ownerMode: 'corporate' }, '/vcards')).toBe('/teamvcard')
    expect(
      catalogFeatureAllowed(
        { access: paidAccess, features: [{ featureKey: 'allow_canva', featureValue: '1' }], subscriptionActive: false },
        'allow_canva'
      )
    ).toBe(false)
  })

  it('treats FEATURE_NOT_INCLUDED and PACKAGE_FEATURE_LOCKED as the same lock', () => {
    expect(isFeatureLockCode(FEATURE_NOT_INCLUDED)).toBe(true)
    expect(isFeatureLockCode(PACKAGE_FEATURE_LOCKED)).toBe(true)
    expect(isFeatureLockCode('UNAUTHORIZED')).toBe(false)
    expect(isFeatureLimitCode(FEATURE_LIMIT_REACHED)).toBe(true)
    expect(isFeatureLimitCode(PACKAGE_LIMIT_REACHED)).toBe(true)
    expect(isFeatureLimitCode('CORPORATE_CARD_LIMIT_REACHED')).toBe(true)
  })

  it('locks intro, music, and background video independently', () => {
    const can = (key: string) =>
      key !== 'allow_intro_video_upload' && key !== 'allow_bg_music_upload' && key !== 'allow_background_video_upload'
    expect(displayMediaAccess('Intro vCard Video', can).locked).toBe(true)
    expect(musicFileAllowed(can)).toBe(false)
    expect(displayMediaAccess('Background Video/Image', can)).toEqual({
      locked: false,
      allowVideo: false,
      allowAudio: false,
      sourceMode: 'image',
    })
  })

  it('does not tell Corporate owners to delete cards when they are over the cap', () => {
    const copy = corporateCardCreateBlockedReason({
      canMutateVcards: true,
      pausedMessage: 'paused',
      limit: 10,
      used: 12,
      remaining: 0,
    })
    expect(copy).toContain('Existing cards were not removed')
    expect(copy.toLowerCase()).not.toContain('delete')
  })
})
