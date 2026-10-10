import {
  isEditorDraftId,
  isEmptySectionPost,
  mergeSyncedListPreservingClientKeys,
  remapLiveListAfterSync,
} from '@/lib/vcardAutosave'
import { createDefaultSectionPostItem } from '@/lib/vcardSectionSchemas'
import type { VCardSectionPostItem } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

function row(partial: Partial<VCardSectionPostItem> & { id: string; title: string }): VCardSectionPostItem {
  return {
    clientKey: partial.clientKey || partial.id,
    description: '',
    url: '',
    featuredImage: '',
    date: '',
    rating: '',
    location: '',
    active: true,
    ...partial,
  }
}

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

  it('does not revive items the owner deleted while autosave was in flight', () => {
    const kept = createDefaultSectionPostItem()
    kept.title = 'Keep me'
    kept.clientKey = 'client-keep'
    kept.id = 'server-keep'

    const savedDeleted: VCardSectionPostItem = {
      id: 'server-gone',
      clientKey: 'client-gone',
      title: 'Deleted mid-flight',
      description: '',
      url: '',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }
    const savedKept: VCardSectionPostItem = {
      id: 'server-keep',
      clientKey: 'client-keep',
      title: 'Keep me',
      description: '',
      url: '',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }

    const merged = mergeSyncedListPreservingClientKeys([kept], [savedDeleted, savedKept], isEmptySectionPost)

    expect(merged).toHaveLength(1)
    expect(merged[0]!.id).toBe('server-keep')
    expect(merged[0]!.title).toBe('Keep me')
  })

  it('treats AI paste draft prefixes as local temp ids', () => {
    expect(isEditorDraftId('post_abc')).toBe(true)
    expect(isEditorDraftId('blog_abc')).toBe(true)
    expect(isEditorDraftId('faq_abc')).toBe(true)
    expect(isEditorDraftId('port_abc')).toBe(true)
    expect(isEditorDraftId('pf_abc')).toBe(true)
    expect(isEditorDraftId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
  })

  it('remaps live rows from save-time pairing without reviving deleted AI posts', () => {
    const saveA = row({ id: 'post_a', clientKey: 'post_a', title: 'AI one' })
    const saveB = row({ id: 'post_b', clientKey: 'post_b', title: 'AI two' })
    const saveC = row({ id: 'post_c', clientKey: 'post_c', title: 'Keep me' })
    const saved = [
      row({ id: 'server-a', title: 'AI one' }),
      row({ id: 'server-b', title: 'AI two' }),
      row({ id: 'server-c', title: 'Keep me' }),
    ]
    // Owner deleted the two AI rows while autosave was in flight; only C remains, with typing.
    const liveC = row({ id: 'post_c', clientKey: 'post_c', title: 'Keep me edited' })

    const remapped = remapLiveListAfterSync([liveC], [saveA, saveB, saveC], saved, isEmptySectionPost)

    expect(remapped).toHaveLength(1)
    expect(remapped[0]!.id).toBe('server-c')
    expect(remapped[0]!.clientKey).toBe('post_c')
    expect(remapped[0]!.title).toBe('Keep me edited')
  })

  it('keeps a row added during save and remaps only the saved ones', () => {
    const saveA = row({ id: 'post_a', clientKey: 'post_a', title: 'First' })
    const liveA = row({ id: 'post_a', clientKey: 'post_a', title: 'First typed' })
    const liveNew = row({ id: 'post_new', clientKey: 'post_new', title: 'Added mid-flight' })
    const saved = [row({ id: 'server-a', title: 'First' })]

    const remapped = remapLiveListAfterSync([liveA, liveNew], [saveA], saved, isEmptySectionPost)

    expect(remapped).toHaveLength(2)
    expect(remapped[0]!.id).toBe('server-a')
    expect(remapped[0]!.title).toBe('First typed')
    expect(remapped[1]!.id).toBe('post_new')
    expect(remapped[1]!.title).toBe('Added mid-flight')
  })

  it('baseline merge still remaps draft ids in save order', () => {
    const draftA = row({ id: 'post_a', clientKey: 'post_a', title: 'A' })
    const draftB = row({ id: 'post_b', clientKey: 'post_b', title: 'B' })
    const saved = [row({ id: 'server-a', title: 'A' }), row({ id: 'server-b', title: 'B' })]

    const merged = mergeSyncedListPreservingClientKeys([draftA, draftB], saved, isEmptySectionPost)
    expect(merged.map((item) => item.id)).toEqual(['server-a', 'server-b'])
    expect(merged.map((item) => item.clientKey)).toEqual(['post_a', 'post_b'])
  })

  it('keeps newer local typing when the saved row is stale mid-flight', () => {
    const draft = createDefaultSectionPostItem()
    draft.title = 'aaaaaaaa'
    draft.url = 'aaaaaaaa'
    const draftKey = draft.clientKey || draft.id

    const saved: VCardSectionPostItem = {
      id: 'server-uuid-3',
      clientKey: 'server-uuid-3',
      title: 'aaaa',
      description: '',
      url: 'aaaa',
      featuredImage: '',
      date: '',
      rating: '',
      location: '',
      active: true,
    }

    const merged = mergeSyncedListPreservingClientKeys([draft], [saved], isEmptySectionPost)

    expect(merged).toHaveLength(1)
    expect(merged[0]!.id).toBe('server-uuid-3')
    expect(merged[0]!.clientKey).toBe(draftKey)
    expect(merged[0]!.title).toBe('aaaaaaaa')
    expect(merged[0]!.url).toBe('aaaaaaaa')
  })
})
