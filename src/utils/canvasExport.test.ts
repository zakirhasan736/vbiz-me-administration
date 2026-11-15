import { canvasToDataUrl } from '@/utils/canvasExport'
import { describe, expect, it } from 'vitest'

function fakeCanvas(toDataURL: () => string): HTMLCanvasElement {
  return { toDataURL } as unknown as HTMLCanvasElement
}

describe('canvasToDataUrl', () => {
  it('returns the exported image', () => {
    expect(canvasToDataUrl(fakeCanvas(() => 'data:image/png;base64,AAAA'))).toBe('data:image/png;base64,AAAA')
  })

  it('returns null instead of throwing when the canvas is tainted or missing', () => {
    const tainted = fakeCanvas(() => {
      throw new DOMException(
        "Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.",
        'SecurityError'
      )
    })
    expect(canvasToDataUrl(tainted)).toBeNull()
    expect(canvasToDataUrl(null)).toBeNull()
  })
})
