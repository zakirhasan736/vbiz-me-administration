import {
  PROFILE_MEDIA_EXPLAINER_SOURCE,
  PROFILE_MEDIA_EXPLAINER_TEMP_ID,
  applyProfileMediaToExplainerTab,
  explainerTabSignature,
  readProfileMediaExplainer,
} from '@/lib/vcardExplainerFromProfileMedia'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import type { VCardData, VCardSectionPostItem } from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

const EXPLAINER = PUBLIC_SECTION_NAMES.explainer

function card(opts?: {
  file?: string
  youtube?: string
  personal?: string
  extraItems?: VCardSectionPostItem[]
}): VCardData {
  const base = createDefaultVCardData()
  return {
    ...base,
    personal: { ...base.personal, explainerVideoUrl: opts?.personal ?? '' },
    displaySettings: {
      globalEnabled: true,
      fields: {
        'Intro vCard Video': { visible: true, customValue: opts?.file ?? '' },
        'Intro YouTube vCard Video Link': { visible: true, customValue: opts?.youtube ?? '' },
      },
    },
    sectionPosts: {
      [EXPLAINER]: opts?.extraItems ?? [],
    },
  }
}

function items(data: VCardData): VCardSectionPostItem[] {
  return data.sectionPosts?.[EXPLAINER] ?? []
}

describe('applyProfileMediaToExplainerTab', () => {
  it('copies an uploaded file into the 2D Video Explainer tab', () => {
    const file = 'https://cdn.example.com/explainer.mp4'
    const next = applyProfileMediaToExplainerTab(card({ file }))
    const row = items(next)[0]

    expect(readProfileMediaExplainer(next)).toEqual({ fileUrl: file, externalUrl: '' })
    expect(row).toMatchObject({
      id: PROFILE_MEDIA_EXPLAINER_TEMP_ID,
      title: '2D Video Explainer',
      featuredImage: file,
      url: file,
      active: true,
      metas: { source: PROFILE_MEDIA_EXPLAINER_SOURCE },
    })
  })

  it('copies a YouTube URL into the explainer tab without treating it as a file', () => {
    const youtube = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const next = applyProfileMediaToExplainerTab(card({ personal: youtube }), { syncYoutubeFromPersonal: true })
    const row = items(next)[0]

    expect(row.featuredImage).toBe('')
    expect(row.url).toBe(youtube)
    expect(next.personal.explainerVideoUrl).toBe(youtube)
    expect(next.displaySettings?.fields['Intro YouTube vCard Video Link']?.customValue).toBe(youtube)
  })

  it('keeps extra explainer tab items when profile media is updated', () => {
    const extra: VCardSectionPostItem = {
      id: 'sec_manual',
      title: 'Custom clip',
      description: '',
      url: 'https://cdn.example.com/other.mp4',
      featuredImage: 'https://cdn.example.com/other.mp4',
      date: '',
      rating: '',
      location: '',
      active: true,
    }
    const file = 'https://cdn.example.com/from-profile.mp4'
    const next = applyProfileMediaToExplainerTab(card({ file, extraItems: [extra] }))
    const rows = items(next)

    expect(rows).toHaveLength(2)
    expect(rows[0].metas?.source).toBe(PROFILE_MEDIA_EXPLAINER_SOURCE)
    expect(rows[0].featuredImage).toBe(file)
    expect(rows[1]).toMatchObject({ id: 'sec_manual', title: 'Custom clip' })
  })

  it('removes only the profile-media row when media is cleared', () => {
    const extra: VCardSectionPostItem = {
      id: 'sec_keep',
      title: 'Keep me',
      description: '',
      url: 'https://cdn.example.com/keep.mp4',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }
    const seeded = applyProfileMediaToExplainerTab(
      card({ file: 'https://cdn.example.com/gone.mp4', extraItems: [extra] })
    )
    const cleared = applyProfileMediaToExplainerTab(
      card({
        extraItems: items(seeded),
      })
    )

    expect(items(cleared)).toEqual([expect.objectContaining({ id: 'sec_keep', title: 'Keep me' })])
  })

  it('is a no-op when the explainer tab already matches profile media', () => {
    const file = 'https://cdn.example.com/same.mp4'
    const first = applyProfileMediaToExplainerTab(card({ file }))
    const second = applyProfileMediaToExplainerTab(first)

    expect(explainerTabSignature(second)).toBe(explainerTabSignature(first))
    expect(second).toBe(first)
  })
})
