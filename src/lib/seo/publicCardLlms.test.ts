import type { MyCardData } from '@/interfaces/api/myCard'
import { buildLlmsIndex, buildPublicCardMarkdown, resolveAiSiteOrigin } from '@/lib/seo/publicCardLlms'
import { assemblePublicCardSource } from '@/lib/seo/publicCardSource'
import { describe, expect, it } from 'vitest'

function card(): MyCardData {
  return {
    profile: {
      id: 'card-1',
      name: 'Maya Chen',
      slug: 'maya',
      email: 'maya@studio.test',
      phone: '555-0100',
      address: '12 Market Street',
      city: 'Meriden',
      state: 'CT',
      zip_code: '06450',
      country: 'US',
      website: 'studio.test',
      company_name: 'Maya Design Studio',
      designation: 'Brand Designer',
      description: 'Brand systems for growing teams.',
      profession: 'Designer',
      gender: null,
      marital_status: null,
      facebook: null,
      instagram: null,
      twitter: null,
      tiktok: null,
      youtube: null,
      rumble: null,
      truth: null,
      linkedin: null,
      pinterest: null,
      whatsapp: null,
    },
    settings: {},
    features: {},
    template: 'v3',
    background_media: {},
    intro_video: {},
    profile_media: {},
    action_buttons: {},
    my_info: {},
  }
}

describe('public card AI text', () => {
  it('writes a markdown card and an index that points at /vCard/', () => {
    const source = assemblePublicCardSource({
      slug: 'maya',
      origin: 'https://app.vbizme.com',
      myCard: card(),
      sections: {
        Faq: { items: [{ title: 'Do you ship?', description: 'Yes, nationwide.', status: 1 }] },
      },
    })
    const markdown = buildPublicCardMarkdown(source)
    expect(markdown).toContain('# Maya Chen')
    expect(markdown).toContain('Brand Designer at Maya Design Studio')
    expect(markdown).toContain('### Do you ship?')
    expect(markdown).toContain('Public page: https://app.vbizme.com/vCard/maya')
    expect(source.markdownUrl).toBe('https://app.vbizme.com/vCard/maya/llms.txt')

    const index = buildLlmsIndex('https://app.vbizme.com', [
      {
        name: 'Maya Chen',
        url: source.canonical,
        markdownUrl: source.markdownUrl,
        summary: 'Brand Designer',
      },
    ])
    expect(index).toContain('[Maya Chen](https://app.vbizme.com/vCard/maya/llms.txt): Brand Designer')
    expect(index).toContain('https://app.vbizme.com/sitemap.xml')
  })

  it('uses the public host and never publishes a localhost card address', () => {
    expect(
      resolveAiSiteOrigin({ headers: new Headers({ host: 'app.vbizme.com', 'x-forwarded-proto': 'https' }) })
    ).toBe('https://app.vbizme.com')
    expect(resolveAiSiteOrigin({ headers: new Headers({ host: '127.0.0.1:3012' }) })).not.toMatch(
      /localhost|127\.0\.0\.1/
    )
  })
})
