import { directlyOwnedIds } from '@/lib/push/registerOwnerPush'
import { describe, expect, it } from 'vitest'

describe('directlyOwnedIds', () => {
  const rows = [
    { id: 'aa-hq', userId: 'AA', companyUserId: null },
    { id: 'card-b', userId: 'b', companyUserId: 'AA' },
    { id: 'card-c', userId: 'c', companyUserId: 'AA' },
    { id: 'unassigned', userId: null, companyUserId: 'AA' },
  ]

  it('registers a corporate device only on its own and unassigned cards, never linked member cards', () => {
    expect(directlyOwnedIds(rows, 'AA')).toEqual(['aa-hq', 'unassigned'])
  })

  it('registers a member device on its own card', () => {
    expect(directlyOwnedIds(rows, 'b')).toEqual(['card-b'])
  })

  it('lets the server decide when ownership fields or the user id are missing', () => {
    expect(directlyOwnedIds([{ id: 'x' }], 'AA')).toEqual(['x'])
    expect(directlyOwnedIds(rows, null)).toEqual(['aa-hq', 'card-b', 'card-c', 'unassigned'])
  })
})
