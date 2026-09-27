import { describe, expect, it } from 'vitest'

import { latestProfileMediaAttachmentUrl } from '@/lib/api/myCard/hydrateDisplaySettingsFromProfile'

describe('latestProfileMediaAttachmentUrl', () => {
  it('returns the first Profile Image/Video attachment URL', () => {
    expect(
      latestProfileMediaAttachmentUrl([
        { url: 'https://cdn.example.com/office.jpg', attachmentType: { name: 'Background Video/Image' } },
        { url: 'https://cdn.example.com/mila.jpg', attachmentType: { name: 'Profile Picture' } },
      ])
    ).toBe('https://cdn.example.com/mila.jpg')
  })

  it('ignores non-profile attachments', () => {
    expect(
      latestProfileMediaAttachmentUrl([
        { url: 'https://cdn.example.com/intro.mp4', attachmentType: { name: 'Intro vCard Video' } },
      ])
    ).toBe('')
  })
})
