export const USER_ROLES = ['vcard-owner', 'corporate-owner', 'admin'] as const

export type TUserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<TUserRole, string> = {
  'vcard-owner': 'vCard Owner',
  'corporate-owner': 'Corporate Owner',
  admin: 'Admin',
}
