/**
 * Classify builder attachments by type name only (never filenames).
 * Short tokens like intro/background/profile are omitted so Intro and Background cannot mix.
 */
export const BUILDER_ATTACHMENT_FIELD_ALIASES: Array<{ field: string; aliases: string[]; canonical: string }> = [
  {
    field: 'Profile Image/Video',
    canonical: 'Profile Image/Video',
    aliases: ['profile image/video', 'profile picture', 'profile pic', 'profile_pic', 'avatar', 'profile image'],
  },
  {
    field: 'Background Video/Image',
    canonical: 'Background Video/Image',
    aliases: ['background video/image', 'background_media', 'bg_video', 'bg video', 'background video'],
  },
  {
    field: 'Intro vCard Video',
    canonical: 'Intro vCard Video',
    aliases: ['intro vcard video', 'intro video'],
  },
  {
    field: 'Background Music',
    canonical: 'Background Music',
    aliases: ['background music', 'background audio', 'bg music', 'music'],
  },
]

export function scoreAttachmentTypeName(typeName: string | null | undefined, aliases: string[]): number {
  const name = (typeName || '').toLowerCase().trim()
  if (!name) return -1
  let best = -1
  for (const alias of aliases) {
    const a = alias.toLowerCase().trim()
    if (!a) continue
    if (name === a) return Math.max(best, a.length + 1000)
    if (name.includes(a)) best = Math.max(best, a.length)
  }
  return best
}

export function normalizeMediaUrlKey(url: string | null | undefined): string {
  return (url || '').trim().split(/[?#]/)[0].toLowerCase()
}

export function sameMediaUrl(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeMediaUrlKey(a)
  const right = normalizeMediaUrlKey(b)
  return Boolean(left && right && left === right)
}

/** Map an attachment type name to a display field — type name only, longest match wins. */
export function attachmentTypeToDisplayField(typeName: string | null | undefined): string | null {
  const name = (typeName || '').toLowerCase().trim()
  if (!name) return null

  let bestField: string | null = null
  let bestScore = -1
  for (const entry of BUILDER_ATTACHMENT_FIELD_ALIASES) {
    if (name === entry.canonical.toLowerCase()) {
      return entry.field
    }
    const score = scoreAttachmentTypeName(name, entry.aliases)
    if (score > bestScore) {
      bestScore = score
      bestField = entry.field
    }
  }
  return bestScore >= 0 ? bestField : null
}
