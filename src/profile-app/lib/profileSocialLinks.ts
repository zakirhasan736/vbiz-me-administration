import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { resolveWhatsappHref } from '@/profile-app/lib/profileHomeData'
import { baseUrl } from '@/redux/api/publicApi'

/** Display labels for profile social tiles, in render order. */
export const PROFILE_SOCIAL_LABELS = [
  'Twitter',
  'FaceBook',
  'Instagram',
  'LinkedIn',
  'Whatsapp',
  'TikTok',
  'Youtube',
  'Pinterest',
  'Rumble',
  'Truth',
  'Website',
] as const

export type ProfileSocialLabel = (typeof PROFILE_SOCIAL_LABELS)[number]

/** Canonical channels tracked by the dashboard Overview. */
export type TrackableSocialChannel =
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'whatsapp'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'truth'
  | 'rumble'
  | 'pinterest'
  | 'website'

const LABEL_TO_CHANNEL: Record<string, TrackableSocialChannel> = {
  Twitter: 'twitter',
  twitter: 'twitter',
  FaceBook: 'facebook',
  Facebook: 'facebook',
  facebook: 'facebook',
  Instagram: 'instagram',
  instagram: 'instagram',
  LinkedIn: 'linkedin',
  linkedin: 'linkedin',
  Whatsapp: 'whatsapp',
  WhatsApp: 'whatsapp',
  whatsapp: 'whatsapp',
  Youtube: 'youtube',
  YouTube: 'youtube',
  youtube: 'youtube',
  TikTok: 'tiktok',
  tiktok: 'tiktok',
  Truth: 'truth',
  'Truth Social': 'truth',
  truth: 'truth',
  Rumble: 'rumble',
  rumble: 'rumble',
  Pinterest: 'pinterest',
  pinterest: 'pinterest',
  Website: 'website',
  website: 'website',
}

export function socialLabelToChannel(label: string): TrackableSocialChannel | null {
  return LABEL_TO_CHANNEL[label] ?? null
}

export function resolveSocialLinkHref(
  label: string,
  socialHref: (displayLabel: string) => string,
  whatsapp?: string
): string {
  if (label === 'Whatsapp') {
    return resolveWhatsappHref(whatsapp ?? '')
  }
  return socialHref(label)?.trim() ?? ''
}

/** Show social tiles when the profile/API value resolves to a link (ignores visibility flags). */
export function filterSocialItemsWithLinks<T extends { label: string }>(
  items: readonly T[],
  socialHref: (displayLabel: string) => string,
  whatsapp?: string
): T[] {
  return items.filter((item) => Boolean(resolveSocialLinkHref(item.label, socialHref, whatsapp)))
}

export function getProfileSocialLinks(
  socialHref: (displayLabel: string) => string,
  whatsapp?: string
): Array<{ label: ProfileSocialLabel; href: string }> {
  return PROFILE_SOCIAL_LABELS.flatMap((label) => {
    const href = resolveSocialLinkHref(label, socialHref, whatsapp)
    return href ? [{ label, href }] : []
  })
}

function postTrackEvent(body: Record<string, string>): void {
  if (typeof window === 'undefined') return
  void fetch(`${baseUrl.replace(/\/$/, '')}/track-event`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined)
}

/**
 * Fire-and-forget social click tracking. Deduped server-side per guest + channel.
 * Never blocks navigation.
 */
export function trackSocialClick(opts: { label: string; profileId?: string; slug?: string }): void {
  if (typeof window === 'undefined') return
  const channel = socialLabelToChannel(opts.label)
  if (!channel) return
  if (!opts.profileId && !opts.slug) return
  const guestId = getOrCreateGuestId()
  if (!guestId) return

  const body: Record<string, string> = {
    eventType: 'social_click',
    channel,
    guestId,
  }
  if (opts.profileId) body.profileId = opts.profileId
  if (opts.slug) body.slug = opts.slug

  postTrackEvent(body)
}

/** Count a unique profile view once per anonymous guest (server dedupes). */
export function trackProfileView(opts: { profileId?: string; slug?: string }): void {
  if (typeof window === 'undefined') return
  if (!opts.profileId && !opts.slug) return
  const guestId = getOrCreateGuestId()
  if (!guestId) return

  const body: Record<string, string> = {
    eventType: 'profile_view',
    guestId,
  }
  if (opts.profileId) body.profileId = opts.profileId
  if (opts.slug) body.slug = opts.slug

  postTrackEvent(body)
}

/** onClick helper for social anchors — tracks then allows default navigation. */
export function onTrackedSocialClick(label: string, profileId?: string, slug?: string): void {
  trackSocialClick({ label, profileId, slug })
}
