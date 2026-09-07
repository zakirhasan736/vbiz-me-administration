import { isEmptySectionPost, mergeSyncedListPreservingClientKeys } from '@/lib/vcardAutosave'
import { createDefaultSectionPostItem } from '@/lib/vcardSectionSchemas'
import type { VCardSectionPostItem } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

describe('mergeSyncedListPreservingClientKeys', () => {
  it('keeps clientKey when draft id remaps to a server id', () => {
    const draft = createDefaultSectionPostItem()
    draft.title = 'Test title'
    const draftKey = draft.clientKey || draft.id

    const saved: VCardSectionPostItem = {
      id: 'server-uuid-1',
      clientKey: 'server-uuid-1',
      title: 'Test title',
      description: '',
      url: '',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }

    const merged = mergeSyncedListPreservingClientKeys([draft], [saved], isEmptySectionPost)

    expect(merged).toHaveLength(1)
    expect(merged[0]!.id).toBe('server-uuid-1')
    expect(merged[0]!.clientKey).toBe(draftKey)
    expect(merged[0]!.title).toBe('Test title')
  })

  it('still appends empty local drafts after saved rows', () => {
    const filled = createDefaultSectionPostItem()
    filled.title = 'Saved license'
    const empty = createDefaultSectionPostItem()

    const saved: VCardSectionPostItem = {
      id: 'server-uuid-2',
      clientKey: 'server-uuid-2',
      title: 'Saved license',
      description: '',
      url: '',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }

    const merged = mergeSyncedListPreservingClientKeys([filled, empty], [saved], isEmptySectionPost)

    expect(merged).toHaveLength(2)
    expect(merged[0]!.id).toBe('server-uuid-2')
    expect(merged[0]!.clientKey).toBe(filled.clientKey || filled.id)
    expect(merged[1]!.id).toBe(empty.id)
    expect(isEmptySectionPost(merged[1]!)).toBe(true)
  })
})
