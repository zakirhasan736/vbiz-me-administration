import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'
import { MAX_AI_SECTION_ITEMS, mapBlogsFromPayload, mapReviewsFromPayload, mergeSectionPayload } from './applyCardDraft'

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
        { author: 'Sample review', text: 'Draft / sample', rating: 5, isSample: true },
      ],
    })
    expect(mapped).toHaveLength(1)
    expect(mapped[0]).toMatchObject({
      author: 'Real client',
      text: 'Excellent service',
      rating: 4,
      imageUrl: '/client.jpg',
      url: '/source',
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
})
