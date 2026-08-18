import {
  getTourStorageKey,
  hydrateCompletedTours,
  isTourCompleted,
  markTourDone,
  shouldAutoStartTour,
} from '@/lib/dashboardTour'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const UID = 'user-1'

describe('tour completion persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0]?.trim()
      if (name) document.cookie = `${name}=; path=/; max-age=0`
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('auto-starts only once per registered user after the tour is marked done', () => {
    expect(shouldAutoStartTour('create_card', UID)).toBe(true)
    markTourDone('create_card', UID)
    expect(isTourCompleted('create_card', UID)).toBe(true)
    expect(shouldAutoStartTour('create_card', UID)).toBe(false)
    expect(localStorage.getItem(getTourStorageKey('create_card', UID))).toBe('1')
  })

  it('does not treat another account as complete', () => {
    markTourDone('create_card', UID)
    expect(shouldAutoStartTour('create_card', 'user-2')).toBe(true)
  })

  it('honors server-completed tours even when local storage is empty', () => {
    expect(shouldAutoStartTour('dashboard', UID, ['dashboard'])).toBe(false)
  })

  it('migrates the legacy unscoped key onto the current user', () => {
    localStorage.setItem(getTourStorageKey('create_card'), '1')
    expect(isTourCompleted('create_card', UID)).toBe(true)
    expect(localStorage.getItem(getTourStorageKey('create_card', UID))).toBe('1')
  })

  it('hydrates local flags from the account record', () => {
    hydrateCompletedTours(UID, ['dashboard', 'create_card'])
    expect(shouldAutoStartTour('dashboard', UID)).toBe(false)
    expect(shouldAutoStartTour('create_card', UID)).toBe(false)
  })
})
