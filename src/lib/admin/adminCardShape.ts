import { resolveCardStatus } from '@/lib/cardStatus'
import type { VCardRecord } from '@/types/vcard'

/** Backoffice-compatible card shape used by admin directory UI. */
export type AdminCard = Record<string, unknown> & {
  id: string
  slug?: string
  ownerId?: string
  ownerEmail?: string | null
  ownerRole?: string | null
  companyUserId?: string | null
  companyUserEmail?: string | null
  companyUserRole?: string | null
  createdById?: string | null
  createdByRole?: string | null
  status?: string
  isPublic?: boolean
  isDraft?: boolean
  personal?: Record<string, unknown>
  socials?: Record<string, string>
  socialClicks?: Array<{ channel: string; label: string; clickCount: number }>
  viewCount?: number
  uniqueViewCount?: number
  shareCount?: number
  saveCount?: number
  adminPortfolio?: boolean
  avatar?: string
  avatarImageUrl?: string
}

export function adminCardAvatarUrl(card: Pick<AdminCard, 'avatar' | 'avatarImageUrl'>): string {
  const avatar = typeof card.avatar === 'string' ? card.avatar.trim() : ''
  if (avatar) return avatar
  return typeof card.avatarImageUrl === 'string' ? card.avatarImageUrl.trim() : ''
}

export function toAdminCardShape(
  record: VCardRecord,
  ownerId?: string,
  extras?: {
    companyUserId?: string | null
    ownerRole?: string | null
    profileUserId?: string | null
    companyUserRole?: string | null
    createdById?: string | null
    createdByRole?: string | null
  }
): AdminCard {
  const handles = record.social?.handles || {}
  const clicks = Number(record.clickCount) || 0
  const views = Number(record.views) || 0
  const saves = Number(record.saves) || 0
  const shares = Number(record.shareCount ?? record.clickCount) || 0
  return {
    ...(record as unknown as AdminCard),
    id: record.id,
    slug: record.slug,
    ownerId: extras?.profileUserId || ownerId || (record as unknown as AdminCard).ownerId,
    ownerRole: extras?.ownerRole ?? null,
    companyUserId: extras?.companyUserId ?? null,
    companyUserRole: extras?.companyUserRole ?? null,
    createdById: extras?.createdById ?? null,
    createdByRole: extras?.createdByRole ?? null,
    status: resolveCardStatus({
      status: record.status,
      isDraft: record.isDraft,
      isPublic: record.isPublic,
      isActive: record.isActive,
    }),
    isPublic: record.isPublic,
    isDraft: Boolean(record.isDraft),
    personal: record.personal as unknown as Record<string, unknown>,
    socials: {
      facebook: handles.facebook || '',
      twitter: handles.twitter || '',
      instagram: handles.instagram || '',
      linkedin: handles.linkedin || '',
      youtube: handles.youtube || '',
      tiktok: handles.tiktok || '',
      website: handles.website || record.personal.website || '',
      rumble: handles.rumble || '',
      truth: handles.truth || '',
      whatsapp: record.personal.whatsapp || '',
    },
    socialClicks: record.socialClicks || [],
    avatar: record.avatarImageUrl,
    viewCount: views,
    uniqueViewCount: views,
    shareCount: shares,
    saveCount: saves,
    analytics: {
      views,
      clicks,
      ctr: views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0',
    },
  }
}
