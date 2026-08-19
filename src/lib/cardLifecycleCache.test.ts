import {
  adjustLifecycleTotal,
  nextDraftFlag,
  queryLifecycle,
  shouldInsertIntoLifecycleList,
  shouldRemoveFromLifecycleList,
} from '@/lib/cardLifecycleCache'
import { describe, expect, it } from 'vitest'

describe('card lifecycle cache', () => {
  it('activates a draft by moving counts from draft to active', () => {
    expect(nextDraftFlag({ isDraft: false }, true)).toBe(false)
    expect(adjustLifecycleTotal(5, 'draft', true, false)).toBe(4)
    expect(adjustLifecycleTotal(171, 'active', true, false)).toBe(172)
    expect(shouldRemoveFromLifecycleList('draft', true, false)).toBe(true)
    expect(shouldInsertIntoLifecycleList('active', true, false)).toBe(true)
  })

  it('moves an active card back to draft', () => {
    expect(adjustLifecycleTotal(171, 'active', false, true)).toBe(170)
    expect(adjustLifecycleTotal(5, 'draft', false, true)).toBe(6)
    expect(shouldRemoveFromLifecycleList('active', false, true)).toBe(true)
    expect(shouldInsertIntoLifecycleList('draft', false, true)).toBe(true)
  })

  it('leaves counts alone when public/status changes without leaving the bucket', () => {
    expect(adjustLifecycleTotal(171, 'active', false, false)).toBe(171)
    expect(adjustLifecycleTotal(5, 'draft', true, true)).toBe(5)
    expect(shouldRemoveFromLifecycleList('active', false, false)).toBe(false)
  })

  it('reads the lifecycle filter from list query args', () => {
    expect(queryLifecycle({ lifecycle: 'draft', limit: 1 })).toBe('draft')
    expect(queryLifecycle({ skip: 0, limit: 20 })).toBeUndefined()
  })
})
