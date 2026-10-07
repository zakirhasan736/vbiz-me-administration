import { jpegPhotoFromImageBytes, sniffContactImageType } from '@/app/api/save-contact-vcf/loadVcfPhoto'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

describe('contact photo for the vCard file', () => {
  it('converts a webp image into a jpeg the phone can store', async () => {
    const webp = await sharp(PNG_1X1).webp().toBuffer()
    expect(sniffContactImageType(webp)).toBe('WEBP')
    const photo = await jpegPhotoFromImageBytes(webp)
    expect(photo?.type).toBe('JPEG')
    expect(sniffContactImageType(Buffer.from(photo?.base64 || '', 'base64'))).toBe('JPEG')
  })

  it('keeps a png avatar as a jpeg contact photo', async () => {
    const photo = await jpegPhotoFromImageBytes(PNG_1X1)
    expect(photo?.type).toBe('JPEG')
    expect(photo?.base64.length).toBeGreaterThan(20)
  })
})
