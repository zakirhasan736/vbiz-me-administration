export type AdminPermissionKey =
  | 'dashboard'
  | 'vcards'
  | 'mycards'
  | 'users'
  | 'leads'
  | 'support'
  | 'announcements'
  | 'templates'
  | 'packages'
  | 'schedule'
  | 'team'
  | 'audit'
  | 'settings'

export type AdminStaffRoleName = 'Co-Administrator' | 'Moderator' | 'Compliance Auditor' | 'Support Agent'

export const ALL_PERMISSIONS: { key: AdminPermissionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'mycards', label: 'My Cards' },
  { key: 'vcards', label: 'All vCards' },
  { key: 'users', label: 'Users' },
  { key: 'leads', label: 'Leads' },
  { key: 'support', label: 'Support Tickets' },
  { key: 'announcements', label: 'Global Announcement' },
  { key: 'templates', label: 'Templates' },
  { key: 'packages', label: 'Packages' },
  { key: 'schedule', label: 'Schedules' },
  { key: 'team', label: 'Admin Team' },
  { key: 'audit', label: 'System Audits' },
  { key: 'settings', label: 'Settings' },
]

export const SUPER_ADMIN_ONLY_MODULES: AdminPermissionKey[] = ['packages', 'team', 'audit']

export const GRANTABLE_PERMISSIONS = ALL_PERMISSIONS.filter((p) => !SUPER_ADMIN_ONLY_MODULES.includes(p.key))

export const STAFF_ROLE_PRESETS: AdminStaffRoleName[] = [
  'Co-Administrator',
  'Moderator',
  'Compliance Auditor',
  'Support Agent',
]

const ROLE_DEFAULTS: Record<AdminStaffRoleName, AdminPermissionKey[]> = {
  'Co-Administrator': [
    'dashboard',
    'mycards',
    'vcards',
    'users',
    'leads',
    'support',
    'announcements',
    'templates',
    'schedule',
    'settings',
  ],
  Moderator: ['dashboard', 'mycards', 'vcards', 'leads', 'support', 'announcements', 'schedule'],
  'Compliance Auditor': ['dashboard', 'users', 'leads', 'settings'],
  'Support Agent': ['dashboard', 'support', 'leads', 'users'],
}

export function defaultsForStaffRole(role: AdminStaffRoleName): AdminPermissionKey[] {
  return [...(ROLE_DEFAULTS[role] || ROLE_DEFAULTS.Moderator)]
}

export function resolvePermissions(input: {
  role?: string | null
  staffRole?: string | null
  allowedModules?: string[] | null
}): AdminPermissionKey[] {
  if (input.role === 'super-admin') {
    return ALL_PERMISSIONS.map((p) => p.key)
  }

  if (input.role !== 'admin') return []

  if (input.allowedModules?.length) {
    const grantable = new Set(GRANTABLE_PERMISSIONS.map((p) => p.key))
    return input.allowedModules.filter((m): m is AdminPermissionKey => grantable.has(m as AdminPermissionKey))
  }

  if (input.staffRole && input.staffRole in ROLE_DEFAULTS) {
    return defaultsForStaffRole(input.staffRole as AdminStaffRoleName)
  }

  return defaultsForStaffRole('Moderator')
}

export function canAccessPermission(
  permission: AdminPermissionKey,
  input: { role?: string | null; staffRole?: string | null; allowedModules?: string[] | null }
): boolean {
  return resolvePermissions(input).includes(permission)
}

export function roleLabelForUser(input: { role?: string | null; staffRole?: string | null }): string {
  if (input.role === 'super-admin') return 'Super Admin'
  if (input.staffRole) return input.staffRole
  if (input.role === 'admin') return 'Admin'
  return 'Staff'
}
