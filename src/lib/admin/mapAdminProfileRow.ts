import type { AdminCard } from '@/lib/admin/adminCardShape'
import type { AdminProfileRow } from '@/redux/features/adminProfiles/adminProfiles.api'

/** Map admin list API row → AdminCard shape used by directory UI. */
export function mapAdminProfileRowToCard(row: AdminProfileRow): AdminCard {
  const statusName = (row.status?.name || 'active').toLowerCase()
  const professionName = row.profession?.name || ''
  return {
    id: row.id,
    slug: row.slug || undefined,
    ownerId: row.user?.id,
    status: statusName,
    isPublic: row.isPublic,
    personal: {
      fullName: row.name,
      email: row.email,
      company: row.companyName || '',
      designation: row.designation || '',
      profession: professionName,
      department: professionName,
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
    },
    socials: {},
    avatar: row.avatar,
    viewCount: row.viewCount,
    saveCount: 0,
    shareCount: 0,
    analytics: {
      views: row.viewCount,
      clicks: 0,
      ctr: '0',
    },
    companyUserId: row.companyUser?.id || null,
  }
}
