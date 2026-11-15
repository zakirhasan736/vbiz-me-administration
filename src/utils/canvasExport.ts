/**
 * `canvas.toDataURL()` throws a SecurityError ("Tainted canvases may not be exported") once an
 * image from another site has been drawn without CORS approval — and that throw happens at
 * export time, not when the image is drawn. Returns null instead so callers can fall back.
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement | null | undefined,
  type = 'image/png',
  quality?: number
): string | null {
  if (!canvas) return null
  try {
    return canvas.toDataURL(type, quality)
  } catch {
    return null
  }
}
