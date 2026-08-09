export const USER_ROLES = ['vcard-owner', 'corporate-owner', 'admin', 'super-admin'] as const

export type TUserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<TUserRole, string> = {
  'vcard-owner': 'vCard Owner',
  'corporate-owner': 'Corporate Owner',
  admin: 'Admin',
  'super-admin': 'Super Admin',
}

export const isStaffRole = (role?: string | null): role is 'admin' | 'super-admin' => {
  return role === 'admin' || role === 'super-admin'
}

export const isSuperAdminRole = (role?: string | null): boolean => {
  return role === 'super-admin'
}
