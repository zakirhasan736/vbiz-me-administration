import {
  isEmptyFaq,
  isEmptyGeneralPost,
  isEmptyReview,
  isEmptySectionPost,
  isEmptyService,
  isSaveWorthyChange,
  persistableSectionPosts,
} from '@/lib/vcardAutosave'
import { certItemsToSectionPosts, createEmptyCert } from '@/lib/vcardCertificates'
import { createDefaultFaqEntry } from '@/lib/vcardFaq'
import { createDefaultGeneralPost } from '@/lib/vcardGeneralPosts'
import { createDefaultReviewEntry } from '@/lib/vcardReviews'
import { createDefaultSectionPostItem } from '@/lib/vcardSectionSchemas'
import { createDefaultServiceEntry } from '@/lib/vcardServices'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

describe('empty editor drafts stay local until the user types', () => {
  it('treats a brand-new certification (with empty documents meta) as empty', () => {
    const [post] = certItemsToSectionPosts([createEmptyCert()])
    expect(post).toBeTruthy()
    expect(isEmptySectionPost(post!)).toBe(true)
    expect(post!.metas?.documents).toBeUndefined()
  })

  it('still treats legacy empty documents JSON as empty', () => {
    expect(
      isEmptySectionPost({
        id: 'cert_legacy',
        title: '',
        description: '',
        url: '',
        featuredImage: '',
        date: '',
        rating: '',
        location: '',
        active: true,
        metas: { issuer: '', year: '', documents: '[]' },
      })
    ).toBe(true)
  })

  it('does not mark Add certification as save-worthy until content exists', () => {
    const prev = createDefaultVCardData()
    const next = {
      ...prev,
      sectionPosts: {
        ...(prev.sectionPosts || {}),
        'Certificates Licenses': certItemsToSectionPosts([createEmptyCert()]),
      },
    }
    expect(isSaveWorthyChange('sectionPosts', prev, next)).toBe(false)
    expect(persistableSectionPosts(next.sectionPosts)['Certificates Licenses']).toBeUndefined()
  })

  it('marks certification save-worthy after the user fills a title', () => {
    const prev = createDefaultVCardData()
    const filled = createEmptyCert()
    filled.name = 'CPR'
    const next = {
      ...prev,
      sectionPosts: {
        'Certificates Licenses': certItemsToSectionPosts([filled]),
      },
    }
    expect(isSaveWorthyChange('sectionPosts', prev, next)).toBe(true)
  })

  it('keeps other Add-new drafts local until typed', () => {
    expect(isEmptySectionPost(createDefaultSectionPostItem())).toBe(true)
    expect(isEmptyService(createDefaultServiceEntry())).toBe(true)
    expect(isEmptyGeneralPost(createDefaultGeneralPost())).toBe(true)
    expect(isEmptyFaq(createDefaultFaqEntry())).toBe(true)
    expect(isEmptyReview(createDefaultReviewEntry())).toBe(true)
  })
})
