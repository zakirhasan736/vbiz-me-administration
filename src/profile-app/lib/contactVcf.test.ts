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
    expect(vcf).toContain('TITLE:Mathematician')
    expect(vcf).toContain('ORG:Analytical')
    expect(vcf).not.toContain('X-ABLabel:Profession')
    expect(vcf).toContain('item1.TEL:+15555550100')
    expect(vcf).toContain('item1.X-ABLabel:Phone')
    expect(vcf).toContain('item2.EMAIL:ada@example.com')
    expect(vcf).toContain('item2.X-ABLabel:Email')
    expect(vcf).toContain('item3.ADR:;;London\\, UK;;;;')
    expect(vcf).toContain('item3.X-ABLabel:Address')
    expect(vcf).toContain('item4.URL:https://analytical.example')
    expect(vcf).toContain('item4.X-ABLabel:Website')
    expect(vcf).toContain('item5.URL:https://vbiz.me/v/ada')
    expect(vcf).toContain('item5.X-ABLabel:vCard URL')
    expect(vcf).not.toMatch(/^URL:/m)
    expect(vcf).not.toContain('NOTE:')
    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(vcf).not.toContain('CHARSET=UTF-8')
    expect(vcf.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
  })

  it('uses public-card labels and does not repeat designation when it is the profession', () => {
    const contact = {
      name: 'Mike Donnelly',
      email: 'mdonnelly@thepaddockcars.com',
      phone: '(860) 918-5253',
      company: 'The Paddock Classic Car Restoration',
      profession: 'President',
      designation: 'President',
      gender: '',
      website: 'www.thepaddockcars.com',
      slug: 'paddock',
      profileUrl: 'https://app.vbizme.com/vCard/paddock',
      imageUrl: '',
      address: '285 Columbus Boulevard, New Britain, Connecticut, 06051',
    }
    const apple = serializeContactVcf(contact, { base64: 'abc123', type: 'JPEG' })
    expect(apple).toContain('FN:Mike Donnelly')
    expect(apple).toContain('TITLE:President')
    expect(apple).not.toContain('President . President')
    expect(apple).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(apple).not.toContain('X-ABLabel:Profession')
    expect(apple).not.toContain('X-ABLabel:Designation')
    expect(apple).toContain('ORG:The Paddock Classic Car Restoration')
    expect(apple).toContain('item1.X-ABLabel:Phone')
    expect(apple).toContain('item1.TEL:(860) 918-5253')
    expect(apple).toContain('item2.X-ABLabel:Email')
    expect(apple).toContain('item2.EMAIL:mdonnelly@thepaddockcars.com')
    expect(apple).toContain('item3.X-ABLabel:Address')
    expect(apple).toContain('item3.ADR:;;285 Columbus Boulevard\\, New Britain\\, Connecticut\\, 06051;;;;')
    expect(apple).toContain('item4.X-ABLabel:Website')
    expect(apple).toContain('item4.URL:https://www.thepaddockcars.com')
    expect(apple).toContain('item5.X-ABLabel:vCard URL')
    expect(apple).toContain('item5.URL:https://app.vbizme.com/vCard/paddock')

    const android = serializeContactVcf(contact, null, { platform: 'android' })
    expect(android).toContain('TITLE:President')
    expect(android).not.toContain('Profession')
    expect(android).not.toContain('Designation')
    expect(android).toContain('X-ANDROID-CUSTOM:vnd.android.cursor.item/phone_v2;(860) 918-5253;0;Phone;;;;;;;;;;;;')
    expect(android).toContain(
      'X-ANDROID-CUSTOM:vnd.android.cursor.item/email_v2;mdonnelly@thepaddockcars.com;0;Email;;;;;;;;;;;;'
    )
    expect(android).toContain('ADR;TYPE=Address:;;285 Columbus Boulevard\\, New Britain\\, Connecticut\\, 06051;;;;')
    expect(android).toContain(
      'X-ANDROID-CUSTOM:vnd.android.cursor.item/website;https://www.thepaddockcars.com;0;Website;;;;;;;;;;;;'
    )
    expect(android).toContain(
      'X-ANDROID-CUSTOM:vnd.com.google.cursor.item/contact_user_defined_field;vCard URL;https://app.vbizme.com/vCard/paddock;;;;;;;;;;;;'
    )
    expect(android).not.toContain('X-ABLabel')
    expect(android).not.toMatch(/^(item\d+\.)?URL[:;]/m)
    expect(android).not.toContain('postal-address_v2')
  })

  it('keeps photo data out of the address on Android', () => {
    const vcf = serializeContactVcf(
      {
        name: 'Mike Donnelly',
        email: '',
        phone: '',
        company: '',
        profession: '',
        gender: '',
        website: '',
        slug: 'paddock',
        profileUrl: '',
        imageUrl: '',
        address: '285 Columbus Boulevard, New Britain, Connecticut, 06051',
      },
      { base64: `AAgAAYdpAAQA${'A'.repeat(180)}`, type: 'JPEG' },
      { platform: 'android' }
    )
    const adr = vcf.split(/\r?\n/).find((line) => line.startsWith('ADR'))
    expect(adr).toBe('ADR;TYPE=Address:;;285 Columbus Boulevard\\, New Britain\\, Connecticut\\, 06051;;;;')
    expect(adr).not.toContain('AAgAAYdpAAQA')
    const photoLines = vcf.split(/\r?\n/).filter((line) => line.startsWith('PHOTO') || line.startsWith(' '))
    expect(photoLines).toEqual([expect.stringMatching(/^PHOTO;ENCODING=BASE64;TYPE=JPEG:AAgAAYdpAAQA/)])
  })

  it('keeps designation when it is different from profession', () => {
    const vcf = serializeContactVcf({
      name: 'Ada Lovelace',
      email: '',
      phone: '',
      company: '',
      profession: 'Mathematician',
      designation: 'President',
      gender: '',
      website: '',
      slug: 'ada',
      profileUrl: '',
      imageUrl: '',
    })
    expect(vcf).toContain('FN:Ada Lovelace')
    expect(vcf).toContain('TITLE:Mathematician . President')
    expect(vcf).not.toContain('X-ABLabel:Profession')
    expect(vcf).not.toContain('X-ABLabel:Designation')
  })

  it('labels the site Website and the public card link vCard URL in an Android contact file', () => {
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

    expect(vcf).toContain(
      'X-ANDROID-CUSTOM:vnd.android.cursor.item/website;https://www.vbizme.com;0;Website;;;;;;;;;;;;'
    )
    expect(vcf).toContain(
      'X-ANDROID-CUSTOM:vnd.com.google.cursor.item/contact_user_defined_field;vCard URL;https://app.vbizme.com/vCard/ada;;;;;;;;;;;;'
    )
    expect(vcf).not.toContain('X-ABLabel')
    expect(vcf).not.toMatch(/^(item\d+\.)?URL[:;]/m)
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
