import {
  absoluteContactImageUrl,
  buildContactVcf,
  contactPhotoCandidateUrls,
  contactVcfApiUrl,
  foldVcfLine,
  looksLikeAppleDevice,
  serializeContactVcf,
} from '@/profile-app/lib/contactVcf'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('contact VCF photo', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('orders avatar before later fallbacks and skips videos', () => {
    expect(
      contactPhotoCandidateUrls({
        imageUrl: 'https://cdn.example.com/avatar.jpg',
        imageUrls: [
          'https://cdn.example.com/avatar.jpg',
          'https://cdn.example.com/about.png',
          'https://cdn.example.com/intro.mp4',
          'https://cdn.example.com/logo.png',
        ],
      })
    ).toEqual([
      'https://cdn.example.com/avatar.jpg',
      'https://cdn.example.com/about.png',
      'https://cdn.example.com/logo.png',
    ])
  })

  it('folds long PHOTO lines so phone contacts can parse the image', () => {
    const folded = foldVcfLine(`PHOTO;ENCODING=b;TYPE=JPEG:${'A'.repeat(120)}`)
    expect(folded.split('\r\n').every((line, index) => (index === 0 ? line.length <= 75 : line.length <= 75))).toBe(
      true
    )
    expect(folded.startsWith('PHOTO;ENCODING=b;TYPE=JPEG:')).toBe(true)
    expect(folded).toContain('\r\n ')
  })

  it('serializes Apple-safe vCard 3.0 fields without CHARSET params', () => {
    const vcf = serializeContactVcf(
      {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+15555550100',
        company: 'Analytical',
        profession: 'Mathematician',
        gender: '',
        website: 'https://analytical.example',
        slug: 'ada',
        profileUrl: 'https://vbiz.me/v/ada',
        imageUrl: '',
        address: 'London, UK',
        note: 'First computer programmer',
      },
      { base64: 'abc123', type: 'JPEG' }
    )

    expect(vcf).toContain('BEGIN:VCARD')
    expect(vcf).toContain('VERSION:3.0')
    expect(vcf).toContain('FN:Ada Lovelace')
    expect(vcf).toContain('ORG:Analytical')
    expect(vcf).toContain('TEL;TYPE=CELL:+15555550100')
    expect(vcf).toContain('EMAIL;TYPE=INTERNET:ada@example.com')
    expect(vcf).toContain('item1.URL:https://analytical.example')
    expect(vcf).toContain('item1.X-ABLabel:Website')
    expect(vcf).toContain('item2.URL:https://vbiz.me/v/ada')
    expect(vcf).toContain('item2.X-ABLabel:vCard URL')
    expect(vcf).not.toMatch(/^URL:/m)
    expect(vcf).toContain('ADR;TYPE=WORK:;;London\\, UK;;;;')
    expect(vcf).toContain('NOTE:First computer programmer\\nProfile: https://vbiz.me/v/ada')
    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(vcf).not.toContain('CHARSET=UTF-8')
    expect(vcf.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
  })

  it('labels the card link vCard URL and the site Website in an Android contact file', () => {
    const vcf = serializeContactVcf(
      {
        name: 'Ada Lovelace',
        email: '',
        phone: '',
        company: '',
        profession: '',
        gender: '',
        website: 'www.vbizme.com',
        slug: 'ada',
        profileUrl: 'https://app.vbizme.com/vCard/ada',
        imageUrl: '',
      },
      null,
      { platform: 'android' }
    )

    expect(vcf).toContain('URL:https://www.vbizme.com')
    expect(vcf).toContain(
      'X-ANDROID-CUSTOM:vnd.android.cursor.item/website;https://app.vbizme.com/vCard/ada;0;vCard URL'
    )
    expect(vcf).not.toContain('item1.URL:https://app.vbizme.com/vCard/ada')
    expect(vcf).not.toContain('X-ABLabel:Website')
  })

  it('embeds the first reachable still image into the vCard', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ base64: 'abc123', type: 'JPEG' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const vcf = await buildContactVcf({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550100',
      company: 'Analytical',
      profession: 'Mathematician',
      gender: '',
      website: 'https://analytical.example',
      slug: 'ada',
      profileUrl: 'https://vbiz.me/v/ada',
      imageUrl: 'https://app.vbizme.com/storage/avatar.jpg',
      imageUrls: ['https://app.vbizme.com/storage/avatar.jpg', 'https://app.vbizme.com/storage/about.jpg'],
      address: 'London, UK',
      note: 'First computer programmer',
    })

    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy-image?url=https%3A%2F%2Fapp.vbizme.com%2Fstorage%2Favatar.jpg',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    )
  })

  it('omits URI photo fallback (iOS will not fetch remote photos into Contacts)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 403 })))
    const vcf = await buildContactVcf({
      name: 'Ada Lovelace',
      email: '',
      phone: '',
      company: '',
      profession: '',
      gender: '',
      website: '',
      slug: 'ada',
      profileUrl: '',
      imageUrl: 'https://app.vbizme.com/storage/about.jpg',
    })
    expect(vcf).not.toContain('PHOTO;VALUE=URI:')
    expect(vcf).not.toContain('PHOTO;ENCODING=b')
  })

  it('absolutizes root-relative photo URLs', () => {
    expect(absoluteContactImageUrl('/storage/ecard/profileimages/1/a.jpg')).toMatch(
      /\/storage\/ecard\/profileimages\/1\/a\.jpg$/
    )
  })

  it('builds a same-origin VCF URL with visitor and optional lead fields', () => {
    window.localStorage.setItem('vbiz_guest_id', 'guest-test-id')
    const url = contactVcfApiUrl('profile-1', 'Ada Lovelace.vcf', {
      fullName: 'Visitor Name',
      phone: '+1555',
      email: 'v@example.com',
      cardSlug: 'ada',
    })
    expect(url.startsWith('/api/save-contact-vcf/profile-1?')).toBe(true)
    expect(url).toContain('visitor_id=guest-test-id')
    expect(url).toContain('filename=Ada+Lovelace.vcf')
    expect(url).toContain('full_name=Visitor+Name')
    expect(url).toContain('card_slug=ada')
  })

  it('treats iPhone and Mac Safari as Apple devices for .vcf navigation', () => {
    const original = globalThis.navigator
    const stub = (ua: string, extras: { platform?: string; maxTouchPoints?: number } = {}) => {
      vi.stubGlobal('navigator', {
        ...original,
        userAgent: ua,
        platform: extras.platform ?? 'Win32',
        maxTouchPoints: extras.maxTouchPoints ?? 0,
      })
    }

    stub(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    )
    expect(looksLikeAppleDevice()).toBe(true)

    stub(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      { platform: 'MacIntel' }
    )
    expect(looksLikeAppleDevice()).toBe(true)

    stub(
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    )
    expect(looksLikeAppleDevice()).toBe(false)
  })
})
