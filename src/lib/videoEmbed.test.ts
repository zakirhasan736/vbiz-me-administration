import { describe, expect, it } from 'vitest'

import { isDirectVideoFileUrl, resolvePlayableVideo, toVideoEmbedUrl } from './videoEmbed'

describe('videoEmbed', () => {
  it('detects direct video files and rejects host pages', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/clip.mp4')).toBe(true)
    expect(isDirectVideoFileUrl('https://res.cloudinary.com/demo/video/upload/sample.mp4')).toBe(true)
    expect(isDirectVideoFileUrl('https://www.youtube.com/watch?v=abc123')).toBe(false)
  })

  it('builds YouTube, Vimeo, and Google Drive embed URLs', () => {
    expect(toVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toContain(
      'youtube-nocookie.com/embed/dQw4w9WgXcQ'
    )
    expect(toVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toContain('embed/dQw4w9WgXcQ')
    expect(toVideoEmbedUrl('https://vimeo.com/123456789')).toContain('player.vimeo.com/video/123456789')
    expect(toVideoEmbedUrl('https://drive.google.com/file/d/1AbCDefGHij/view?usp=sharing')).toBe(
      'https://drive.google.com/file/d/1AbCDefGHij/preview'
    )
    expect(toVideoEmbedUrl('https://drive.google.com/open?id=1AbCDefGHij')).toBe(
      'https://drive.google.com/file/d/1AbCDefGHij/preview'
    )
  })

  it('prefers a featured file, then an embeddable link', () => {
    expect(
      resolvePlayableVideo({
        featuredImage: 'https://cdn.example.com/a.mp4',
        videoUrl: 'https://youtu.be/abc',
      })
    ).toEqual({ kind: 'file', src: 'https://cdn.example.com/a.mp4' })

    expect(
      resolvePlayableVideo({
        featuredImage: 'https://cdn.example.com/poster.jpg',
        videoUrl: 'https://youtu.be/abc123XYZ99',
      })
    ).toMatchObject({ kind: 'embed', pageUrl: 'https://youtu.be/abc123XYZ99' })

    expect(
      resolvePlayableVideo({
        featuredImage: '',
        videoUrl: 'https://drive.google.com/file/d/driveFile123/view',
      })
    ).toEqual({
      kind: 'embed',
      src: 'https://drive.google.com/file/d/driveFile123/preview',
      pageUrl: 'https://drive.google.com/file/d/driveFile123/view',
    })
  })
})
