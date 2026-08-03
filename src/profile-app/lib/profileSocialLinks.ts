import { resolveWhatsappHref } from '@/profile-app/lib/profileHomeData'

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
