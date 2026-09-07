import { getHomeMediaUrls, getPageColors, HOME_PAGE_FIELDS, HOME_PAGE_URL_FIELDS } from '@/lib/vcardDisplaySettings'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { describe, expect, it } from 'vitest'

describe('HOME_PAGE_FIELDS catalog', () => {
  it('keeps only meaningful home media/music/header controls', () => {
    expect([...HOME_PAGE_FIELDS]).toEqual([
      'Intro vCard Video',
      'Intro YouTube vCard Video Link',
      'Background Music',
      'YouTube Background Music Link',
      'Background Video/Image',
      'Profile Image/Video',
      'vCard Header Color',
      'Repeat Background Music',
    ])
    expect(HOME_PAGE_FIELDS).not.toContain('Info Box Style')
    expect(HOME_PAGE_FIELDS).not.toContain('Save Contact')
    expect(HOME_PAGE_FIELDS).not.toContain('Skills')
  })

  it('marks only media/URL fields as URL inputs', () => {
    expect(HOME_PAGE_URL_FIELDS.has('Intro vCard Video')).toBe(true)
    expect(HOME_PAGE_URL_FIELDS.has('Repeat Background Music')).toBe(false)
    expect(HOME_PAGE_URL_FIELDS.has('vCard Header Color')).toBe(false)
  })
})

describe('getHomeMediaUrls visibility', () => {
  const withMedia = (overrides: VCardDisplaySettings['fields'] = {}): VCardDisplaySettings => ({
    globalEnabled: true,
    fields: {
      'Intro vCard Video': { visible: true, customValue: 'https://cdn.example/intro.mp4' },
      'Intro YouTube vCard Video Link': {
        visible: true,
        customValue: 'https://youtube.com/watch?v=abc',
      },
      'Background Video/Image': { visible: true, customValue: 'https://cdn.example/bg.jpg' },
      'Profile Image/Video': { visible: true, customValue: 'https://cdn.example/avatar.jpg' },
      ...overrides,
    },
  })

  it('returns media URLs when fields are visible', () => {
    expect(getHomeMediaUrls(withMedia())).toEqual({
      introVideo: 'https://cdn.example/intro.mp4',
      introYoutube: 'https://youtube.com/watch?v=abc',
      bgMedia: 'https://cdn.example/bg.jpg',
      profileMedia: 'https://cdn.example/avatar.jpg',
    })
  })

  it('hides media URLs when the matching field toggle is off', () => {
    expect(
      getHomeMediaUrls(
        withMedia({
          'Intro vCard Video': { visible: false, customValue: 'https://cdn.example/intro.mp4' },
          'Background Video/Image': { visible: false, customValue: 'https://cdn.example/bg.jpg' },
          'Profile Image/Video': { visible: false, customValue: 'https://cdn.example/avatar.jpg' },
          'Intro YouTube vCard Video Link': {
            visible: false,
            customValue: 'https://youtube.com/watch?v=abc',
          },
        })
      )
    ).toEqual({
      introVideo: '',
      introYoutube: '',
      bgMedia: '',
      profileMedia: '',
    })
  })

  it('hides all home media when globalEnabled is false', () => {
    expect(getHomeMediaUrls({ ...withMedia(), globalEnabled: false })).toEqual({
      introVideo: '',
      introYoutube: '',
      bgMedia: '',
      profileMedia: '',
    })
  })

  it('excludes YouTube URLs from introVideo even when the file field is visible', () => {
    expect(
      getHomeMediaUrls(
        withMedia({
          'Intro vCard Video': {
            visible: true,
            customValue: 'https://youtu.be/abc',
          },
        })
      ).introVideo
    ).toBe('')
  })
})

describe('getPageColors header visibility', () => {
  it('returns header color only when vCard Header Color is visible', () => {
    const visible: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'vCard Header Color': { visible: true, backgroundColor: '#112233' },
      },
    }
    const hidden: VCardDisplaySettings = {
      globalEnabled: true,
      fields: {
        'vCard Header Color': { visible: false, backgroundColor: '#112233' },
      },
    }

    expect(getPageColors(visible).headerColor).toBe('#112233')
    expect(getPageColors(hidden).headerColor).toBeUndefined()
  })
})
