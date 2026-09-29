import { SAFE_DOM_UNMOUNT_BOOTSTRAP } from '@/lib/dom/safeDomUnmount'
import { afterEach, describe, expect, it } from 'vitest'

describe('SAFE_DOM_UNMOUNT_BOOTSTRAP', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('no-ops removeChild when the node is already detached', () => {
    new Function(SAFE_DOM_UNMOUNT_BOOTSTRAP)()

    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)
    child.remove()

    expect(() => parent.removeChild(child)).not.toThrow()
    expect(parent.contains(child)).toBe(false)
  })
})
