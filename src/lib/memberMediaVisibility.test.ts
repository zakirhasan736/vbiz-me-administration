import { mergeHiddenCorporateOwned, withoutCorporateOwned } from '@/lib/memberMediaVisibility'
import { describe, expect, it } from 'vitest'

describe('member media visibility', () => {
  const items = [{ id: 'owner', corporateOwned: true }, { id: 'mine' }]

  it('hides owner rows only while the checkbox is on', () => {
    expect(withoutCorporateOwned(items, true)).toEqual([{ id: 'mine' }])
    expect(withoutCorporateOwned(items, false)).toEqual(items)
  })

  it('keeps owner rows in the saved list when the editor reorders visible items', () => {
    expect(mergeHiddenCorporateOwned(items, [{ id: 'mine' }, { id: 'new' }])).toEqual([
      { id: 'owner', corporateOwned: true },
      { id: 'mine' },
      { id: 'new' },
    ])
  })
})
