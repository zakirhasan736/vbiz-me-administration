import {
  hiddenOwnerMediaMatches,
  isHideOwnerSectionPostEnabled,
  mergeHiddenCorporateOwned,
  ownerMediaFingerprint,
  schemaKeysForPublicSectionName,
  toggleHiddenOwnerMedia,
  withoutCorporateOwned,
  withoutHiddenOwnerMedia,
} from '@/lib/memberMediaVisibility'
import { describe, expect, it } from 'vitest'

describe('member media visibility', () => {
  const items = [{ id: 'owner', corporateOwned: true }, { id: 'mine' }]

  it('hides owner rows only while the checkbox is on', () => {
    expect(withoutCorporateOwned(items, true)).toEqual([{ id: 'mine' }])
    expect(withoutCorporateOwned(items, false)).toEqual(items)
  })

  it('hides one owner photo on the public card and can show it again', () => {
    const photo = { id: 'owner', title: 'Office', imageUrl: 'https://cdn.example/office.jpg', corporateOwned: true }
    const mine = { id: 'mine', title: 'Headshot', corporateOwned: false }
    const hidden = toggleHiddenOwnerMedia([], photo)
    expect(hiddenOwnerMediaMatches(hidden, { ...photo, id: 'synced-id' })).toBe(true)
    expect(ownerMediaFingerprint(photo)).toBe(hidden[0]?.fingerprint)
    expect(withoutHiddenOwnerMedia([photo, mine], hidden, false)).toEqual([mine])
    expect(toggleHiddenOwnerMedia(hidden, photo)).toEqual([])
  })

  it('keeps owner rows in the saved list when the editor reorders visible items', () => {
    expect(mergeHiddenCorporateOwned(items, [{ id: 'mine' }, { id: 'new' }])).toEqual([
      { id: 'owner', corporateOwned: true },
      { id: 'mine' },
      { id: 'new' },
    ])
  })

  it('maps Certificates Licenses public posts to the certificates editor hide toggle', () => {
    const names = { certificates: 'Certificates Licenses', videos: 'Videos' }
    expect(schemaKeysForPublicSectionName('Certificates Licenses', names)).toEqual(['certificates'])
    expect(isHideOwnerSectionPostEnabled({ certificates: true }, 'Certificates Licenses', ['certificates'])).toBe(true)
    expect(isHideOwnerSectionPostEnabled({ certificates: true }, 'Certificates Licenses', [])).toBe(false)
    expect(
      isHideOwnerSectionPostEnabled({ 'Certificates Licenses': true }, 'Certificates Licenses', ['certificates'])
    ).toBe(true)
  })
})
