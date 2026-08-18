import { describe, expect, it } from 'vitest'

import { mapDynamicPostItemToListItem } from './mapDynamicPosts'

describe('mapDynamicPostItemToListItem', () => {
  it('preserves a legacy top-level video URL alias', () => {
    const item = mapDynamicPostItemToListItem({ id: 1, title: 'Video', url: 'https://example.com/video' })

    expect(item.generalInfoUrl).toBe('https://example.com/video')
  })

  it('preserves a video URL stored in legacy metadata', () => {
    const item = mapDynamicPostItemToListItem({
      id: 1,
      title: 'Video',
      metas: { video_url: 'https://youtu.be/abc123DEF45' },
    })

    expect(item.generalInfoUrl).toBe('https://youtu.be/abc123DEF45')
  })
})
