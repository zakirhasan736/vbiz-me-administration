import { describe, expect, it } from 'vitest'
import {
  allocateCustomTabId,
  createDraftCustomTab,
  isCustomNavItemId,
  remintCustomTabPublicId,
  slugifyNavTabId,
} from './vcardNavbar'

describe('custom tab public ids', () => {
  it('slugifies labels', () => {
    expect(slugifyNavTabId('Events')).toBe('events')
    expect(slugifyNavTabId('  My Pricing! ')).toBe('my-pricing')
  })

  it('allocates smart ids and suffixes collisions with built-in tabs', () => {
    expect(allocateCustomTabId('Events', [])).toBe('events-2')
    expect(allocateCustomTabId('Services', ['services-2'])).toBe('services-3')
    expect(allocateCustomTabId('Pricing', [])).toBe('pricing')
    expect(allocateCustomTabId('Pricing', ['pricing'])).toBe('pricing-2')
  })

  it('creates draft tabs with slug id and stable key', () => {
    const tab = createDraftCustomTab('Events', [])
    expect(tab.id).toBe('events-2')
    expect(tab.key).toMatch(/^ct_/)
    expect(tab.label).toBe('Events')
  })

  it('remints public id on rename while keeping stable key', () => {
    const tab = { id: 'custom-tab-old', key: 'custom-tab-old', label: 'Old', items: [] }
    const next = remintCustomTabPublicId(tab, 'Events', ['events'])
    expect(next.id).toBe('events-2')
    expect(next.key).toBe('custom-tab-old')
    expect(next.label).toBe('Events')
  })

  it('recognizes legacy and smart custom tab ids', () => {
    expect(isCustomNavItemId('custom-tab-123-abc')).toBe(true)
    expect(isCustomNavItemId('events-2')).toBe(true)
    expect(isCustomNavItemId('pricing')).toBe(true)
    expect(isCustomNavItemId('events')).toBe(false)
    expect(isCustomNavItemId('services')).toBe(false)
    expect(isCustomNavItemId('post-type-9')).toBe(false)
  })
})
