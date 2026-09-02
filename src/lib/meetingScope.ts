import type { MeetingScope } from '@/types/meeting'

export function deriveOwnerAudience(
  ownerRole?: string | null,
  companyUserRole?: string | null
): 'single' | 'corporate' {
  if (ownerRole === 'corporate-owner' || companyUserRole === 'corporate-owner') return 'corporate'
  return 'single'
}

export function meetingScopeLabel(scope: MeetingScope): string {
  switch (scope) {
    case 'global':
      return 'Global schedule'
    case 'group':
      return 'Group schedule'
    case 'one_to_one':
    default:
      return 'One-to-one schedule'
  }
}
