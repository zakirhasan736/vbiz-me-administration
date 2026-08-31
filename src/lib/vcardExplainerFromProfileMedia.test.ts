import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'
import {
  EXPLAINER_SECTION,
  patchExplainerSectionMedia,
  readExplainerSectionMedia,
} from './vcardExplainerFromProfileMedia'

const base = createDefaultVCardData()

describe('readExplainerSectionMedia', () => {
  it('returns empty when no explainer section posts exist', () => {
    expect(readExplainerSectionMedia(base)).toEqual({ fileUrl: '', externalUrl: '' })
  })

  it('reads uploaded file from featuredImage', () => {
    const data = patchExplainerSectionMedia(base, { fileUrl: 'https://cdn.example.com/explainer.mp4' })
    expect(readExplainerSectionMedia(data)).toEqual({
      fileUrl: 'https://cdn.example.com/explainer.mp4',
      externalUrl: '',
    })
  })

  it('reads YouTube URL from external url field', () => {
    const data = patchExplainerSectionMedia(base, { externalUrl: 'https://youtube.com/watch?v=abc' })
    expect(readExplainerSectionMedia(data)).toEqual({
      fileUrl: '',
      externalUrl: 'https://youtube.com/watch?v=abc',
    })
  })
})

describe('patchExplainerSectionMedia', () => {
  it('writes explainer section posts without touching display settings', () => {
    const file = 'https://cdn.example.com/explainer.mp4'
    const next = patchExplainerSectionMedia(base, { fileUrl: file })
    const items = next.sectionPosts?.[EXPLAINER_SECTION] ?? []

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: '2D Video Explainer',
      featuredImage: file,
      url: file,
      active: true,
    })
    expect(next.displaySettings?.fields?.['Intro vCard Video']?.customValue).toBeFalsy()
  })

  it('clears explainer section when both file and external url are removed', () => {
    const seeded = patchExplainerSectionMedia(base, { fileUrl: 'https://cdn.example.com/explainer.mp4' })
    const cleared = patchExplainerSectionMedia(seeded, { fileUrl: '', externalUrl: '' })
    expect(cleared.sectionPosts?.[PUBLIC_SECTION_NAMES.explainer] ?? []).toHaveLength(0)
  })

  it('preserves extra explainer rows when updating the primary item', () => {
    const primary = {
      id: 'sec_primary',
      title: 'Primary',
      description: '',
      url: 'https://cdn.example.com/old.mp4',
      featuredImage: 'https://cdn.example.com/old.mp4',
      date: '',
      rating: '',
      location: '',
      active: true,
    }
    const extra = {
      id: 'sec_extra',
      title: 'Secondary',
      description: '',
      url: 'https://cdn.example.com/other.mp4',
      featuredImage: 'https://cdn.example.com/other.mp4',
      date: '',
      rating: '',
      location: '',
      active: true,
    }
    const withExtra = {
      ...base,
      sectionPosts: {
        [EXPLAINER_SECTION]: [primary, extra],
      },
    }
    const next = patchExplainerSectionMedia(withExtra, { fileUrl: 'https://cdn.example.com/primary.mp4' })
    const items = next.sectionPosts?.[EXPLAINER_SECTION] ?? []
    expect(items).toHaveLength(2)
    expect(items[0]?.featuredImage).toBe('https://cdn.example.com/primary.mp4')
    expect(items[1]?.id).toBe('sec_extra')
  })
})
