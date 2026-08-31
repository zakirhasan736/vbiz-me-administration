import { requestSessionExpiryWarning } from '@/lib/auth/sessionPolicy'
import { describe, expect, it, vi } from 'vitest'

describe('session policy', () => {
  it('does not dispatch session expiry warnings anymore', () => {
    const listener = vi.fn()
    window.addEventListener('vbiz:session-expiring', listener)
    requestSessionExpiryWarning('idle')
    requestSessionExpiryWarning('expired')
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('vbiz:session-expiring', listener)
  })
})
