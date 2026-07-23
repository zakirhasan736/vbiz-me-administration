/** True when the URL points at video media (not a still image). */
export function isVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(trimmed) || trimmed.startsWith('blob:')
}
