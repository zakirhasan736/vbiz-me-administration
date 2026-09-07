import { attachmentTypeToDisplayField, sameMediaUrl, scoreAttachmentTypeName } from '@/lib/media/attachmentTypeMatch'
import { describe, expect, it } from 'vitest'

describe('attachmentTypeMatch', () => {
  it('classifies by type name only, ignoring filename keywords', () => {
    expect(attachmentTypeToDisplayField('Intro vCard Video')).toBe('Intro vCard Video')
    expect(attachmentTypeToDisplayField('Background Video/Image')).toBe('Background Video/Image')
    expect(attachmentTypeToDisplayField('intro video')).toBe('Intro vCard Video')
    expect(attachmentTypeToDisplayField('background video')).toBe('Background Video/Image')
  })

  it('does not classify intro types as background from short tokens', () => {
    expect(attachmentTypeToDisplayField('Intro vCard Video')).not.toBe('Background Video/Image')
    // Bare short names are intentionally unsupported.
    expect(attachmentTypeToDisplayField('intro')).toBeNull()
    expect(attachmentTypeToDisplayField('background')).toBeNull()
  })

  it('scores longer aliases higher', () => {
    const aliases = ['intro video', 'intro vcard video']
    expect(scoreAttachmentTypeName('intro vcard video', aliases)).toBeGreaterThan(
      scoreAttachmentTypeName('intro video', aliases)
    )
  })

  it('compares media URLs without query/hash', () => {
    expect(sameMediaUrl('https://cdn.example.com/a.mp4?x=1', 'https://cdn.example.com/a.mp4#t=0')).toBe(true)
    expect(sameMediaUrl('https://cdn.example.com/a.mp4', 'https://cdn.example.com/b.mp4')).toBe(false)
  })
})
