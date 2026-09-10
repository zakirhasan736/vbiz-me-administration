import { isStaffRole } from '@/constants/userRole'

/**
 * Flip to true when native CRM features are ready.
 * `/crm` stays reserved and shows Coming soon while this is false.
 */
export const CRM_UI_ENABLED = true

/**
 * Who may use CRM features.
 * Owners (single / corporate / linked member) are never package-gated.
 * Staff need the leads module (super-admin always).
 */
export function canSessionUseCrm(input: {
  role?: string | null
  allowedModules?: string[] | null
  /** Ignored for owners — kept for call-site compatibility. */
  packageAllowsCrm?: boolean
}): boolean {
  if (input.role === 'super-admin') return true
  if (isStaffRole(input.role)) {
    return (input.allowedModules || []).includes('leads')
  }
  return input.role === 'vcard-owner' || input.role === 'corporate-owner'
}

/**
 * Header / sidebar CRM entry for single + corporate back office.
 * Same rules as session use — owners always get a CRM button/nav link.
 */
export function canShowCrmEntry(input: {
  role?: string | null
  allowedModules?: string[] | null
  packageAllowsCrm?: boolean
  entitlementsLoading?: boolean
}): boolean {
  if (!CRM_UI_ENABLED) return false
  return canSessionUseCrm(input)
}
