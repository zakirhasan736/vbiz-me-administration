import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'
import { describe, expect, it } from 'vitest'

import { resolveVideoLinkUrl } from './resolveVideoLinkUrl'

function videoItem(overrides: Partial<DynamicPostListItem> = {}): DynamicPostListItem {
  return {
    id: 1,
    title: 'Video',
    description: '',
    featuredImage: '',
    generalInfoUrl: '',
    date: '',
    issuer: '',
    year: '',
    attachments: [],
    ...overrides,
  }
}

describe('resolveVideoLinkUrl', () => {
  it('uses the direct API video link first', () => {
    expect(resolveVideoLinkUrl(videoItem({ generalInfoUrl: 'https://example.com/watch/1' }))).toBe(
      'https://example.com/watch/1'
    )
  })

  it('recovers a legacy link from rich-text content', () => {
    expect(resolveVideoLinkUrl(videoItem({ description: '<a href="https://youtu.be/abc123DEF45">Watch</a>' }))).toBe(
      'https://youtu.be/abc123DEF45'
    )
  })

  it('uses an uploaded video attachment but not an ordinary image', () => {
    expect(
      resolveVideoLinkUrl(
        videoItem({
          featuredImage: 'https://cdn.example.com/poster.jpg',
          attachments: [
            {
              id: 1,
              doc_name: 'video',
              attachment_type_id: 1,
              url: 'https://cdn.example.com/video.mp4?version=2',
            },
          ],
        })
      )
    ).toBe('https://cdn.example.com/video.mp4?version=2')
  })

  it('reconstructs a YouTube watch link from a legacy thumbnail', () => {
    expect(resolveVideoLinkUrl(videoItem({ featuredImage: 'https://i.ytimg.com/vi/abc123DEF45/hqdefault.jpg' }))).toBe(
      'https://www.youtube.com/watch?v=abc123DEF45'
    )
  })

  it('rejects unsafe links and does not open a plain thumbnail', () => {
    expect(
      resolveVideoLinkUrl(
        videoItem({ generalInfoUrl: 'javascript:alert(1)', featuredImage: 'https://example.com/poster.jpg' })
      )
    ).toBe('')
  })
})
