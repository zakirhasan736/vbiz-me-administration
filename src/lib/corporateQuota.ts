import { getAdminThemeConfig } from '@/lib/admin/adminTheme'

export function getCorporateCardQuota(): number {
  if (typeof window === 'undefined') return 15
  const raw = localStorage.getItem('admin_corporate_quota')
  if (raw) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  return getAdminThemeConfig().corporateCardQuota || 15
}
