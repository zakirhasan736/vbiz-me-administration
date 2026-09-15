import {
  absoluteContactImageUrl,
  buildContactVcf,
  contactPhotoCandidateUrls,
  foldVcfLine,
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
    expect(vcf).toContain('ADR;TYPE=WORK:;;London\\, UK;;;;')
    expect(vcf).toContain('NOTE:First computer programmer\\nProfile: https://vbiz.me/v/ada')
    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(vcf).not.toContain('CHARSET=UTF-8')
    expect(vcf.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
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
})
