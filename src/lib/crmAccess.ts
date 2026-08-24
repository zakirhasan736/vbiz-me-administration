import { isStaffRole } from '@/constants/userRole'

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
