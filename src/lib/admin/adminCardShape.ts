import type { VCardRecord } from '@/types/vcard'

/** Backoffice-compatible card shape used by admin directory UI. */
export type AdminCard = Record<string, unknown> & {
  id: string
  slug?: string
  ownerId?: string
  status?: string
  isPublic?: boolean
  personal?: Record<string, unknown>
  socials?: Record<string, string>
  viewCount?: number
  uniqueViewCount?: number
  shareCount?: number
  saveCount?: number
  adminPortfolio?: boolean
}

export function toAdminCardShape(record: VCardRecord, ownerId?: string): AdminCard {
  const handles = record.social?.handles || {}
  return {
    ...(record as unknown as AdminCard),
    id: record.id,
    slug: record.slug,
    ownerId: ownerId || (record as unknown as AdminCard).ownerId,
    status: record.isActive ? 'active' : 'inactive',
    isPublic: record.isPublic,
    personal: record.personal as unknown as Record<string, unknown>,
    socials: {
      facebook: handles.facebook || '',
      twitter: handles.twitter || '',
      instagram: handles.instagram || '',
      linkedin: handles.linkedin || '',
      youtube: handles.youtube || '',
      whatsapp: record.personal.whatsapp || '',
    },
    viewCount: Number(record.views) || 0,
    uniqueViewCount: Math.max(0, Math.round(Number(record.views) * 0.7) || 0),
    shareCount: Number((record as unknown as AdminCard).shareCount) || 0,
    saveCount: Number(record.saves) || 0,
  }
}
