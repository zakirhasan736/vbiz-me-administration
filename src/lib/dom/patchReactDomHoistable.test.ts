import { applyHoistableRemoveChildGuards } from '@/lib/dom/patchReactDomHoistable'
import { describe, expect, it } from 'vitest'

describe('applyHoistableRemoveChildGuards', () => {
  it('null-checks React 19 HostHoistable unmount', () => {
    const production =
      'deletedFiber.memoizedState?deletedFiber.memoizedState.count--:deletedFiber.stateNode&&((deletedFiber=deletedFiber.stateNode),deletedFiber.parentNode.removeChild(deletedFiber));'
    const patched = applyHoistableRemoveChildGuards(production)
    expect(patched).toContain('deletedFiber.parentNode&&deletedFiber.parentNode.removeChild(deletedFiber)')
    expect(patched).not.toContain('),deletedFiber.parentNode.removeChild(deletedFiber)')
  })

  it('is idempotent', () => {
    const once = applyHoistableRemoveChildGuards('current.parentNode.removeChild(current)')
    expect(applyHoistableRemoveChildGuards(once)).toBe(once)
  })
})
