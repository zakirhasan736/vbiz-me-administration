import type { VCardCustomSocialLink, VCardSocial } from '@/types/vcard'

/** Back-office social input key → Card Settings visibility label. */
export const SOCIAL_KEY_TO_DISPLAY_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'FaceBook',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  youtube: 'Youtube',
  truth: 'Truth',
  rumble: 'Rumble',
  linkedin: 'LinkedIn',
}

const NETWORK_BASE_URL: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${stripAt(h)}`,
  facebook: (h) => `https://facebook.com/${stripAt(h)}`,
  twitter: (h) => `https://x.com/${stripAt(h)}`,
  tiktok: (h) => `https://tiktok.com/@${stripAt(h)}`,
  youtube: (h) => `https://youtube.com/@${stripAt(h)}`,
  truth: (h) => `https://truthsocial.com/@${stripAt(h)}`,
  rumble: (h) => `https://rumble.com/c/${stripAt(h)}`,
  linkedin: (h) => `https://linkedin.com/in/${stripAt(h)}`,
}

function stripAt(handle: string) {
  return handle.trim().replace(/^@+/, '')
}

export function createDefaultVCardSocial(): VCardSocial {
  return { handles: {}, customLinks: [], games: {} }
}

export function socialHandleUrl(networkKey: string, handle: string): string {
  const trimmed = handle.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const build = NETWORK_BASE_URL[networkKey]
  return build ? build(trimmed) : ''
}

/** Resolve href for a profile home social tile (display label e.g. "FaceBook"). */
export function getSocialHrefForDisplayLabel(label: string, social: VCardSocial | undefined, website?: string): string {
  if (label === 'Website') {
    const w = website?.trim()
    if (!w) return ''
    return w.startsWith('http') ? w : `https://${w}`
  }
  if (!social?.handles) return ''
  for (const [key, displayLabel] of Object.entries(SOCIAL_KEY_TO_DISPLAY_LABEL)) {
    if (displayLabel === label) {
      return socialHandleUrl(key, social.handles[key] ?? '')
    }
  }
  const custom = social.customLinks?.find((l) => l.name.trim().toLowerCase() === label.trim().toLowerCase())
  return custom?.url?.trim() ?? ''
}

export function normalizeCustomSocialLinks(links: VCardCustomSocialLink[]): VCardCustomSocialLink[] {
  return links.filter((l) => l.name.trim() || l.url.trim())
}
