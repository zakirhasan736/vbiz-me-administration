import { isStaffRole } from '@/constants/userRole'

/**
 * Flip to true when native CRM features are ready.
 * `/crm` stays reserved and shows Coming soon while this is false.
 */
export const CRM_UI_ENABLED = true

/** Matches backend `assertModule(..., 'leads')` — empty admin modules are denied. */
export function canSessionUseCrm(input: {
  role?: string | null
  allowedModules?: string[] | null
  packageAllowsCrm: boolean
}): boolean {
  if (input.role === 'super-admin') return true
  if (isStaffRole(input.role)) {
    return (input.allowedModules || []).includes('leads')
  }
  return input.packageAllowsCrm
}

/**
 * Header / sidebar CRM entry for single + corporate back office.
 * Always shown for owners so they can open `/crm` (workspace still checks package).
 */
export function canShowCrmEntry(input: {
  role?: string | null
  allowedModules?: string[] | null
  packageAllowsCrm?: boolean
  entitlementsLoading?: boolean
}): boolean {
  if (!CRM_UI_ENABLED) return false
  if (input.role === 'super-admin') return true
  if (isStaffRole(input.role)) {
    return (input.allowedModules || []).includes('leads')
  }
  // Single + corporate (+ linked member) owners always get a CRM button/nav link.
  if (input.role === 'vcard-owner' || input.role === 'corporate-owner') return true
  if (input.entitlementsLoading) return false
  return Boolean(input.packageAllowsCrm)
}
