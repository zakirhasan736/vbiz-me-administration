import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'
import {
  MAX_AI_SECTION_ITEMS,
  mapBlogsFromPayload,
  mapFaqsFromPayload,
  mapReviewsFromPayload,
  mergeSectionPayload,
} from './applyCardDraft'

describe('AI section payloads match editor fields', () => {
  it('caps blogs at five and preserves editor URL and image fields', () => {
    const payload = {
      blogs: Array.from({ length: 7 }, (_, index) => ({
        title: `Post ${index}`,
        description: `Description ${index}`,
        category: 'Guide',
        url: `https://example.com/${index}`,
        imageUrl: `https://example.com/${index}.jpg`,
      })),
    }
    const mapped = mapBlogsFromPayload(payload)
    expect(mapped).toHaveLength(MAX_AI_SECTION_ITEMS)
    expect(mapped[0]).toMatchObject({
      category: 'Guide',
      customUrl: 'https://example.com/0',
      featuredImage: 'https://example.com/0.jpg',
      active: true,
    })
  })

  it('maps only real reviews into the exact review editor fields', () => {
    const mapped = mapReviewsFromPayload({
      reviews: [
        { author: 'Real client', text: 'Excellent service', rating: 4, imageUrl: '/client.jpg', url: '/source' },
        { author: 'Example guest', text: 'Friendly staff and a smooth visit', rating: 5, isSample: true },
        { author: 'Sample review', text: 'Draft / sample', rating: 5, isSample: true },
      ],
    })
    expect(mapped).toHaveLength(2)
    expect(mapped[0]).toMatchObject({
      author: 'Real client',
      text: 'Excellent service',
      rating: 4,
      imageUrl: '/client.jpg',
      url: '/source',
    })
    expect(mapped[1]).toMatchObject({
      author: 'Example guest',
      text: 'Friendly staff and a smooth visit',
      rating: 5,
    })
  })

  it('maps FAQs into the exact FAQ editor fields and caps at five', () => {
    const mapped = mapFaqsFromPayload({
      faqs: Array.from({ length: 7 }, (_, index) => ({
        question: `Question ${index}`,
        answer: `Answer ${index}`,
        imageUrl: `/faq-${index}.jpg`,
        url: `/faq-${index}`,
      })),
    })
    expect(mapped).toHaveLength(MAX_AI_SECTION_ITEMS)
    expect(mapped[0]).toMatchObject({
      question: 'Question 0',
      answer: 'Answer 0',
      featuredImage: '/faq-0.jpg',
      url: '/faq-0',
      active: true,
    })
  })

  it('caps FAQs and skills at five while preserving their editor shapes', () => {
    const draft = createDefaultVCardData()
    const withFaqs = mergeSectionPayload(draft, 'faqs', {
      faqs: Array.from({ length: 7 }, (_, index) => ({
        question: `Question ${index}`,
        answer: `Answer ${index}`,
        imageUrl: `/faq-${index}.jpg`,
        url: `/faq-${index}`,
      })),
    })
    expect(withFaqs.faqs).toHaveLength(5)
    expect(withFaqs.faqs?.[0]).toMatchObject({ featuredImage: '/faq-0.jpg', url: '/faq-0', active: true })

    const withSkills = mergeSectionPayload(withFaqs, 'skills', {
      skills: [{ type: 'Core', skills: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'] }],
    })
    expect(withSkills.skills).toEqual([
      expect.objectContaining({ type: 'Core', skills: ['One', 'Two', 'Three', 'Four', 'Five'] }),
    ])
  })

  it('appends FAQs, blogs, and reviews up to five without replacing existing items', () => {
    const draft = createDefaultVCardData()
    draft.faqs = [{ id: 'faq_1', question: 'Existing Q', answer: 'Existing A', active: true }]
    draft.reviews = [{ id: 'rev_1', author: 'Pat', text: 'Kept review', rating: 5 }]
    draft.generalPosts = [
      {
        id: 'blog_1',
        category: 'News',
        title: 'Existing post',
        description: 'Kept',
        customUrl: '',
        featuredImage: '',
        date: '2026-01-01',
        active: true,
      },
    ]
    const merged = mergeSectionPayload(draft, 'faqs', {
      faqs: [
        { question: 'Existing Q', answer: 'Existing A' },
        { question: 'New Q', answer: 'New A' },
      ],
    })
    expect(merged.faqs?.map((item) => item.question)).toEqual(['Existing Q', 'New Q'])

    const withReviews = mergeSectionPayload(merged, 'reviews', {
      reviews: [
        { author: 'Pat', text: 'Kept review', rating: 5 },
        { author: 'Alex', text: 'New example', rating: 4, isSample: true },
      ],
    })
    expect(withReviews.reviews?.map((item) => item.author)).toEqual(['Pat', 'Alex'])
  })
})
