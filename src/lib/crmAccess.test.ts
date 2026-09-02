import { describe, expect, it } from 'vitest'
import { CRM_UI_ENABLED, canSessionUseCrm } from './crmAccess'

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

  it('uses package entitlement for owners, not staff modules', () => {
    expect(canSessionUseCrm({ role: 'vcard-owner', packageAllowsCrm: true })).toBe(true)
    expect(canSessionUseCrm({ role: 'vcard-owner', packageAllowsCrm: false })).toBe(false)
    expect(canSessionUseCrm({ role: 'corporate-owner', packageAllowsCrm: true })).toBe(true)
  })
})
