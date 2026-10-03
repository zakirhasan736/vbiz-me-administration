import { describe, expect, it } from 'vitest'

import { extractLeaveReviewUrlFromList, isLeaveReviewEntry, withoutLeaveReviewEntries } from './vcardReviews'

describe('vcardReviews leave-review CTA helpers', () => {
  it('detects titled and URL-only leave-review entries', () => {
    expect(
      isLeaveReviewEntry({
        id: '1',
        author: 'Leave a Review',
        rating: 5,
        text: '',
        imageUrl: '',
        url: 'https://g.page/r/example/review',
      })
    ).toBe(true)

    expect(
      isLeaveReviewEntry({
        id: '2',
        author: '',
        rating: 5,
        text: '',
        imageUrl: '',
        url: 'https://reviews.example.com/new',
      })
    ).toBe(true)

    expect(
      isLeaveReviewEntry({
        id: '3',
        author: 'Ada',
        rating: 5,
        text: 'Great work.',
        imageUrl: '',
        url: 'https://reviews.example.com/ada',
      })
    ).toBe(false)
  })

  it('extracts the first leave-review URL and strips CTA rows', () => {
    const reviews = [
      {
        id: 'cta',
        author: 'Leave a Review',
        rating: 1,
        text: '',
        imageUrl: '',
        url: 'https://g.page/r/example/review',
      },
      {
        id: 'real',
        author: 'Customer',
        rating: 5,
        text: 'Loved it.',
        imageUrl: '',
        url: 'https://reviews.example.com/customer',
      },
    ]

    expect(extractLeaveReviewUrlFromList(reviews)).toBe('https://g.page/r/example/review')
    expect(withoutLeaveReviewEntries(reviews).map((r) => r.id)).toEqual(['real'])
  })
})
