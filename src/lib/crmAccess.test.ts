import { describe, expect, it } from 'vitest'
import { CRM_UI_ENABLED, canSessionUseCrm, canShowCrmEntry } from './crmAccess'

describe('CRM session gate', () => {
  it('enables the native CRM workspace', () => {
    expect(CRM_UI_ENABLED).toBe(true)
  })

  it('requires the leads module for staff CRM', () => {
    expect(canSessionUseCrm({ role: 'super-admin', packageAllowsCrm: false })).toBe(true)
    expect(canSessionUseCrm({ role: 'admin', allowedModules: ['leads'], packageAllowsCrm: false })).toBe(true)
    expect(canSessionUseCrm({ role: 'admin', allowedModules: ['support'], packageAllowsCrm: false })).toBe(false)
    expect(canSessionUseCrm({ role: 'admin', allowedModules: [], packageAllowsCrm: false })).toBe(false)
  })

  it('does not package-gate CRM for owners', () => {
    expect(canSessionUseCrm({ role: 'vcard-owner', packageAllowsCrm: false })).toBe(true)
    expect(canSessionUseCrm({ role: 'vcard-owner', packageAllowsCrm: true })).toBe(true)
    expect(canSessionUseCrm({ role: 'corporate-owner', packageAllowsCrm: false })).toBe(true)
  })

  it('always shows CRM nav/button for single and corporate back office', () => {
    expect(canShowCrmEntry({ role: 'vcard-owner', packageAllowsCrm: false })).toBe(true)
    expect(canShowCrmEntry({ role: 'corporate-owner', packageAllowsCrm: false })).toBe(true)
    expect(canShowCrmEntry({ role: 'admin', allowedModules: ['leads'] })).toBe(true)
    expect(canShowCrmEntry({ role: 'admin', allowedModules: ['support'] })).toBe(false)
  })
})
