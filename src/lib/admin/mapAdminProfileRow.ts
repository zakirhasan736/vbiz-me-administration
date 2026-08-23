import type { AdminCard } from '@/lib/admin/adminCardShape'
import { resolveCardStatus } from '@/lib/cardStatus'
import type { AdminProfileRow } from '@/redux/features/adminProfiles/adminProfiles.api'

function pickSocials(row: AdminProfileRow): Record<string, string> {
  const entries: Array<[string, string | null | undefined]> = [
    ['facebook', row.facebook],
    ['instagram', row.instagram],
    ['twitter', row.twitter],
    ['tiktok', row.tiktok],
    ['youtube', row.youtube],
    ['linkedin', row.linkedin],
    ['rumble', row.rumble],
    ['truth', row.truth],
    ['website', row.website],
    ['whatsapp', row.whatsapp],
  ]
  const socials: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (value && String(value).trim()) socials[key] = String(value).trim()
  }
  return socials
}

/** Lifecycle flags are canonical; status can be stale on legacy rows. */
export function isAdminProfileDraft(row: Pick<AdminProfileRow, 'isDraft'>): boolean {
  return row.isDraft === true
}

/** Map admin list API row → AdminCard shape used by directory UI. */
export function mapAdminProfileRowToCard(row: AdminProfileRow): AdminCard {
  const isDraft = isAdminProfileDraft(row)
  const statusName = resolveCardStatus({
    status: row.status?.name,
    isDraft,
    isPublic: row.isPublic,
  })
  const professionName = row.profession?.name || ''
  const views = Number(row.viewCount) || 0
  const clicks = Number(row.clickCount) || 0
  const saves = Number(row.saveCount) || 0
  const shares = Number(row.shareCount ?? row.clickCount) || 0
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
  return {
    id: row.id,
    slug: row.slug || undefined,
    ownerId: row.user?.id,
    status: statusName,
    isPublic: row.isPublic,
    isDraft,
    personal: {
      fullName: row.name,
      email: row.email,
      company: row.companyName || '',
      designation: row.designation || '',
      profession: professionName,
      department: professionName,
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      website: row.website || '',
    },
    socials: pickSocials(row),
    socialClicks: row.socialClicks || [],
    avatar: row.avatar || undefined,
    viewCount: views,
    uniqueViewCount: views,
    saveCount: saves,
    shareCount: shares,
    analytics: {
      views,
      clicks,
      ctr,
    },
    companyUserId: row.companyUser?.id || null,
    companyUserEmail: row.companyUser?.email || null,
    companyUserRole: row.companyUser?.role || null,
    createdById: row.createdBy?.id || null,
    createdByRole: row.createdBy?.role || null,
    ownerRole: row.user?.role || null,
    ownerEmail: row.user?.email || null,
  }
}
