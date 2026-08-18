import type { ReviewItem, ReviewsSectionResponse } from '@/interfaces/api/reviews.interface'
import { describe, expect, it } from 'vitest'

import { mapReviewItemToListItem, normalizeReviewsResponse } from './mapReviews'

function response(items: ReviewItem[]): ReviewsSectionResponse {
  return {
    success: true,
    data: {
      items,
      postType: { name: 'reviews', title: 'Customer Reviews' },
    },
  }
}

describe('review response mapping', () => {
  it('maps current raw fields and retains each testimonial own media and URL', () => {
    const result = normalizeReviewsResponse(
      response([
        {
          id: 'raw-review',
          author: 'Ada Lovelace',
          text: 'Excellent work.',
          rating: 4,
          imageUrl: 'https://cdn.example.com/ada.jpg',
          reviewUrl: 'https://reviews.example.com/ada',
          status: 'published',
          sortOrder: 2,
        },
        {
          id: 'google-review',
          author: 'Google Reviews',
          text: 'Independent testimonial.',
          rating: 5,
          status: 1,
          sortOrder: 1,
        },
      ])
    )

    expect(result.slides.map((item) => item.id)).toEqual(['google-review', 'raw-review'])
    expect(result.slides[0].image).toBe('')
    expect(result.slides[1]).toMatchObject({
      title: 'Ada Lovelace',
      plainDescription: 'Excellent work.',
      image: 'https://cdn.example.com/ada.jpg',
      linkUrl: 'https://reviews.example.com/ada',
      rating: 4,
    })
  })

  it('uses a CTA only for leaveReviewUrl and excludes it from counts and ratings', () => {
    const result = normalizeReviewsResponse(
      response([
        {
          id: 'cta',
          author: '  LEAVE   A   REVIEW ',
          reviewUrl: 'https://reviews.example.com/new',
          rating: 1,
          status: 1,
        },
        {
          id: 'testimonial',
          author: 'Customer',
          text: 'Five stars.',
          rating: 5,
          status: 1,
        },
      ])
    )

    expect(result.leaveReviewUrl).toBe('https://reviews.example.com/new')
    expect(result.slides.map((item) => item.id)).toEqual(['testimonial'])
    expect(result.reviewCount).toBe(1)
    expect(result.averageRating).toBe(5)
  })

  it('recognizes a URL-only record as the CTA', () => {
    const result = normalizeReviewsResponse(
      response([{ id: 'cta', reviewUrl: 'https://reviews.example.com/new', status: 1 }])
    )

    expect(result.leaveReviewUrl).toBe('https://reviews.example.com/new')
    expect(result.slides).toEqual([])
    expect(result.reviewCount).toBe(0)
  })

  it('rejects unsafe review links without discarding a normal testimonial', () => {
    const result = normalizeReviewsResponse(
      response([
        {
          id: 'unsafe',
          author: 'Customer',
          text: 'Real testimonial.',
          reviewUrl: 'javascript:alert(1)',
          status: 1,
        },
        {
          id: 'unsafe-cta',
          author: 'Leave a Review',
          reviewUrl: 'data:text/html,bad',
          status: 1,
        },
      ])
    )

    expect(result.slides).toHaveLength(1)
    expect(result.slides[0].linkUrl).toBeNull()
    expect(result.leaveReviewUrl).toBeNull()
  })

  it('keeps legacy per-review fields and never invents a missing image', () => {
    const mapped = mapReviewItemToListItem({
      id: 'legacy',
      title: 'Legacy Customer',
      description: '<p>Still supported.</p>',
      featured_image: null,
      review_link: { url: 'https://legacy.example.com/review', has_link: true },
      status: 1,
    })

    expect(mapped).toMatchObject({
      title: 'Legacy Customer',
      plainDescription: 'Still supported.',
      image: '',
      linkUrl: 'https://legacy.example.com/review',
      isLinkCard: false,
    })
  })
})
