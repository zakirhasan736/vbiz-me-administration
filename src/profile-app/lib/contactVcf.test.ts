import {
  absoluteContactImageUrl,
  buildContactVcf,
  contactPhotoCandidateUrls,
  foldVcfLine,
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
      website: '',
      slug: 'ada',
      profileUrl: 'https://vbiz.me/v/ada',
      imageUrl: 'https://app.vbizme.com/storage/avatar.jpg',
      imageUrls: ['https://app.vbizme.com/storage/avatar.jpg', 'https://app.vbizme.com/storage/about.jpg'],
    })

    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:abc123')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy-image?url=https%3A%2F%2Fapp.vbizme.com%2Fstorage%2Favatar.jpg',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    )
  })

  it('writes a URI photo when the image cannot be inlined', async () => {
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
    expect(vcf).toContain('PHOTO;VALUE=URI:https://app.vbizme.com/storage/about.jpg')
  })

  it('absolutizes root-relative photo URLs', () => {
    expect(absoluteContactImageUrl('/storage/ecard/profileimages/1/a.jpg')).toMatch(
      /\/storage\/ecard\/profileimages\/1\/a\.jpg$/
    )
  })
})
