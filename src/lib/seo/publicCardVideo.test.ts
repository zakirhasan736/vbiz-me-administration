import { describe, expect, it } from 'vitest'
import {
  buildPublicCardVideoObject,
  buildPublicCardVideoPath,
  buildPublicCardVideoTitle,
  resolveIntroVideo,
  stripMediaFragment,
  uploadDateFromMediaUrl,
} from './publicCardVideo'

const S3 = 'https://aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com/vbizme'

describe('publicCardVideo', () => {
  it('builds the watch page path from the card path', () => {
    expect(buildPublicCardVideoPath('/vCard/monica-caballero')).toBe('/vCard/monica-caballero/video')
    expect(buildPublicCardVideoPath('/vCard/monica-caballero/')).toBe('/vCard/monica-caballero/video')
  })

  it('strips the Safari #t= hint from file URLs', () => {
    expect(stripMediaFragment(`${S3}/1786827601866-intro.mp4#t=0.001`)).toBe(`${S3}/1786827601866-intro.mp4`)
  })

  it('classifies uploaded files and YouTube links', () => {
    expect(resolveIntroVideo(`${S3}/1786827601866-intro.mp4#t=0.001`)).toEqual({
      kind: 'file',
      contentUrl: `${S3}/1786827601866-intro.mp4`,
    })
    const yt = resolveIntroVideo('https://www.youtube-nocookie.com/embed/GghZCyc_fnU?autoplay=1&mute=1')
    expect(yt).toMatchObject({
      kind: 'youtube',
      youtubeId: 'GghZCyc_fnU',
      thumbnailUrl: 'https://i.ytimg.com/vi/GghZCyc_fnU/hqdefault.jpg',
    })
    expect(resolveIntroVideo('')).toBeNull()
    expect(resolveIntroVideo('blob:abc')).toBeNull()
  })

  it('reads the upload date from the epoch-millis filename prefix', () => {
    expect(uploadDateFromMediaUrl(`${S3}/1786827601866-Untitled-design-74.mp4#t=0.001`)).toBe(
      new Date(1786827601866).toISOString()
    )
    expect(uploadDateFromMediaUrl(`${S3}/intro.mp4`)).toBeNull()
    // Far-future or pre-2020 numbers are not trusted as dates.
    expect(uploadDateFromMediaUrl(`${S3}/9999999999999-x.mp4`, Date.UTC(2026, 10, 11))).toBeNull()
    expect(uploadDateFromMediaUrl(`${S3}/1000000000000-x.mp4`)).toBeNull()
  })

  it('builds a VideoObject with the fields Google requires', () => {
    const video = resolveIntroVideo(`${S3}/1786827601866-intro.mp4`)!
    const schema = buildPublicCardVideoObject({
      video,
      watchPageUrl: 'https://app.vbizme.com/vCard/a/video',
      cardUrl: 'https://app.vbizme.com/vCard/a',
      name: buildPublicCardVideoTitle('Monica Caballero', 'CEO & Founder at Explorando Con Hijos'),
      description: 'Intro',
      thumbnailUrl: 'https://example.com/t.jpg',
      uploadDate: '2026-08-15T00:00:00.000Z',
    })
    expect(schema).toMatchObject({
      '@type': 'VideoObject',
      name: 'Meet Monica Caballero – CEO & Founder at Explorando Con Hijos',
      thumbnailUrl: ['https://example.com/t.jpg'],
      uploadDate: '2026-08-15T00:00:00.000Z',
      contentUrl: `${S3}/1786827601866-intro.mp4`,
    })
    expect(schema).not.toHaveProperty('embedUrl')
  })
})
