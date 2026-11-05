export const COLOR_PANEL_WIDTH = 292
export const COLOR_PANEL_HEIGHT = 468
export const COLOR_SHEET_BREAKPOINT = 640

export type AnchorRect = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export type ViewportSize = { width: number; height: number }

export type PopoverBox = {
  placement: 'above' | 'below' | 'sheet'
  top: number
  left: number
  width: number
  maxHeight: number
}

const MARGIN = 8
const GAP = 8

/**
 * Desktop and tablet float beside the trigger. Narrow phones and short landscape
 * phones use a bottom sheet so the panel cannot clip or force horizontal scroll.
 */
export function placeColorPopover(
  anchor: AnchorRect,
  viewport: ViewportSize,
  panel: { width: number; height: number } = { width: COLOR_PANEL_WIDTH, height: COLOR_PANEL_HEIGHT }
): PopoverBox {
  const width = Math.min(panel.width, Math.max(160, viewport.width - MARGIN * 2))
  const landscapePhone = viewport.height < 500 && viewport.width < 900
  if (viewport.width < COLOR_SHEET_BREAKPOINT || landscapePhone) {
    return {
      placement: 'sheet',
      top: 0,
      left: 0,
      width: viewport.width,
      maxHeight: Math.max(220, viewport.height - MARGIN),
    }
  }

  const spaceBelow = viewport.height - anchor.bottom - MARGIN
  const spaceAbove = anchor.top - MARGIN
  const placement = spaceBelow < panel.height + GAP && spaceAbove > spaceBelow ? 'above' : 'below'
  const maxHeight = Math.min(panel.height, Math.max(160, viewport.height - MARGIN * 2))
  let top = placement === 'below' ? anchor.bottom + GAP : anchor.top - GAP - maxHeight
  top = Math.max(MARGIN, Math.min(top, viewport.height - MARGIN - maxHeight))
  let left = anchor.left
  if (left + width > viewport.width - MARGIN) left = viewport.width - MARGIN - width
  if (left < MARGIN) left = MARGIN
  return { placement, top, left, width, maxHeight }
}
