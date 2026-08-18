import {
  AUTOSAVE_IDLE_MS,
  AUTOSAVE_MAX_MS,
  clearPendingCardSave,
  createAutosaveScheduler,
  pendingSaveStorageKey,
  readPendingCardSave,
  writePendingCardSave,
} from '@/lib/vcardAutosave'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('createAutosaveScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for idle time after the latest change before running', () => {
    const run = vi.fn()
    const scheduler = createAutosaveScheduler()

    scheduler.schedule(run)
    vi.advanceTimersByTime(1000)
    scheduler.schedule(run)
    vi.advanceTimersByTime(AUTOSAVE_IDLE_MS - 1)

    expect(run).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('runs at the max wait even if typing never pauses', () => {
    const run = vi.fn()
    const scheduler = createAutosaveScheduler()

    scheduler.schedule(run)
    vi.advanceTimersByTime(1000)
    scheduler.schedule(run)
    vi.advanceTimersByTime(1000)
    scheduler.schedule(run)
    vi.advanceTimersByTime(AUTOSAVE_MAX_MS - 2000)

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('cancel drops a pending run', () => {
    const run = vi.fn()
    const scheduler = createAutosaveScheduler()
    scheduler.schedule(run)
    scheduler.cancel()
    vi.advanceTimersByTime(AUTOSAVE_MAX_MS)
    expect(run).not.toHaveBeenCalled()
  })
})

describe('pending card save marker', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips dirty buckets for crash recovery', () => {
    writePendingCardSave('card-1', ['profile', 'posts', 'profile'])
    expect(readPendingCardSave('card-1')).toMatchObject({
      buckets: ['profile', 'posts'],
    })
    expect(localStorage.getItem(pendingSaveStorageKey('card-1'))).toBeTruthy()
    clearPendingCardSave('card-1')
    expect(readPendingCardSave('card-1')).toBeNull()
  })
})
