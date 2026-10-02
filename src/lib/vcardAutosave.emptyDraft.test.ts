import {
  emptyPostsSnapshot,
  isEmptyFaq,
  isEmptyGeneralPost,
  isEmptyReview,
  isEmptySectionPost,
  isEmptyService,
  isSaveWorthyChange,
  persistableSectionPosts,
  preferFilledList,
  resolveInitialPostSync,
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

describe('initial post sync on card create', () => {
  const filled = {
    generalPosts: [],
    faqs: [{ id: 'faq_1', question: 'Hours?', answer: '9 to 5', active: true }],
    sectionPosts: {},
  }

  it('writes a brand-new card against an empty baseline', () => {
    const resolved = resolveInitialPostSync({
      profileId: 'new-card',
      hydratedProfileId: null,
      createdProfileId: 'new-card',
      snapshot: filled,
    })
    expect(resolved.defer).toBe(false)
    expect(resolved.snapshot).toEqual(emptyPostsSnapshot())
  })

  it('waits to load server posts before writing an existing card', () => {
    const resolved = resolveInitialPostSync({
      profileId: 'existing',
      hydratedProfileId: null,
      createdProfileId: null,
      snapshot: emptyPostsSnapshot(),
    })
    expect(resolved.defer).toBe(true)
  })

  it('keeps the loaded snapshot once the editor has hydrated', () => {
    const resolved = resolveInitialPostSync({
      profileId: 'existing',
      hydratedProfileId: 'existing',
      createdProfileId: null,
      snapshot: filled,
    })
    expect(resolved.defer).toBe(false)
    expect(resolved.snapshot.faqs).toHaveLength(1)
  })
})

describe('editor hydrate keeps filled AI lists', () => {
  it('keeps the local FAQs when the server list is still empty', () => {
    const local = [{ id: 'faq_1', question: 'Hours?', answer: '9 to 5', active: true }]
    const choice = preferFilledList([], local, isEmptyFaq)
    expect(choice.keptLocal).toBe(true)
    expect(choice.items).toEqual(local)
  })

  it('uses the server list once it has rows', () => {
    const server = [
      {
        id: 'srv',
        type: 'Service',
        title: 'Restore',
        description: 'Body work',
        url: '',
        featuredImage: '',
        active: true,
      },
    ]
    const choice = preferFilledList(server, [], isEmptyService)
    expect(choice.keptLocal).toBe(false)
    expect(choice.items).toHaveLength(1)
  })
})
