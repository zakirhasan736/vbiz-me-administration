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

/** Wish & Outreach targeting labels (CRM leads, not meeting schedule types). */
export function wishScopeLabel(scope: MeetingScope): string {
  switch (scope) {
    case 'global':
      return 'Global wish'
    case 'group':
      return 'Grouped wish'
    case 'one_to_one':
    default:
      return 'Single wish'
  }
}

export function wishScopeHint(scope: MeetingScope): string {
  switch (scope) {
    case 'global':
      return 'Sends to every CRM lead in your current CRM scope at the scheduled USA time.'
    case 'group':
      return 'Pick multiple CRM leads. Only those people receive the wish at the scheduled time.'
    case 'one_to_one':
    default:
      return 'Pick one CRM lead. That person receives the wish at the scheduled time.'
  }
}
