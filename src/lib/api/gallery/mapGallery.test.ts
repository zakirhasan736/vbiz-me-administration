import { describe, expect, it } from 'vitest'
import { mapGalleryItemToListItem } from './mapGallery'

describe('mapGalleryItemToListItem', () => {
  it('marks video featured URLs as video', () => {
    const item = mapGalleryItemToListItem({
      id: 1,
      title: 'Clip',
      featured_image: { id: 1, doc_name: 'clip', url: 'https://cdn.example.com/clip.mp4' },
    })
    expect(item?.mediaKind).toBe('video')
    expect(item?.imageUrl).toContain('.mp4')
  })

  it('keeps YouTube-only rows via general_info_url', () => {
    const item = mapGalleryItemToListItem({
      id: 2,
      title: 'Talk',
      featured_image: null,
      general_info_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
    expect(item).not.toBeNull()
    expect(item?.mediaKind).toBe('video')
    expect(item?.imageUrl).toContain('youtube')
  })

  it('keeps text-only rows so the public card shows a photo placeholder', () => {
    const item = mapGalleryItemToListItem({
      id: 4,
      title: 'Kitchen deep clean',
      description: '<p>Before and after</p>',
      featured_image: null,
    })
    expect(item).not.toBeNull()
    expect(item?.imageUrl).toBe('')
    expect(item?.title).toBe('Kitchen deep clean')
    expect(item?.description).toBe('Before and after')
  })

  it('drops rows with no media, title, or description', () => {
    expect(mapGalleryItemToListItem({ id: 5, title: '', featured_image: null })).toBeNull()
  })

  it('maps link-only rows', () => {
    const item = mapGalleryItemToListItem({
      id: 3,
      title: 'Site',
      featured_image: null,
      general_info_url: 'https://example.com/project',
    })
    expect(item?.mediaKind).toBe('link')
    expect(item?.linkUrl).toBe('https://example.com/project')
  })
})
