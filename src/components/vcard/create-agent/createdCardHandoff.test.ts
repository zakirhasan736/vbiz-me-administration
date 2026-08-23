import { describe, expect, it, vi } from 'vitest'
import { completeCreatedCardHandoff } from './createdCardHandoff'

describe('AI-created card editor handoff', () => {
  it('navigates a newly created card without running competing create-route cleanup', () => {
    const onCreatedNavigate = vi.fn()
    const onClose = vi.fn()

    expect(
      completeCreatedCardHandoff({
        isEdit: false,
        cardId: 'profile-123',
        onCreatedNavigate,
        onClose,
      })
    ).toBe('navigate')
    expect(onCreatedNavigate).toHaveBeenCalledWith('profile-123')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes normally for an existing-card AI session', () => {
    const onCreatedNavigate = vi.fn()
    const onClose = vi.fn()

    expect(
      completeCreatedCardHandoff({
        isEdit: true,
        cardId: 'profile-123',
        onCreatedNavigate,
        onClose,
      })
    ).toBe('close')
    expect(onCreatedNavigate).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
