import { mapAdminProfileRowToCard } from '@/lib/admin/mapAdminProfileRow'
import type { AdminProfileRow } from '@/redux/features/adminProfiles/adminProfiles.api'
import { describe, expect, it } from 'vitest'

function row(partial?: Partial<AdminProfileRow>): AdminProfileRow {
  return {
    id: 'card-1',
    slug: 'demo-card',
    name: 'Demo Owner',
    email: 'demo@example.com',
    companyName: 'Demo Co',
    designation: 'Founder',
    phone: null,
    whatsapp: null,
    avatar: 'https://cdn.example.com/a.jpg',
    isPublic: true,
    isDraft: false,
    viewCount: 10,
    createdAt: '2026-03-12T08:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
    status: { id: 's1', name: 'active' },
    profession: { id: 'p1', name: 'Design' },
    user: { id: 'u1', name: 'Demo', email: 'demo@example.com', role: 'user' },
    companyUser: null,
    ...partial,
  }
}

describe('mapAdminProfileRowToCard', () => {
  it('maps createdAt and updatedAt for admin directory cards', () => {
    const card = mapAdminProfileRowToCard(row())
    expect(card.createdAt).toBe('2026-03-12T08:00:00.000Z')
    expect(card.updatedAt).toBe('2026-09-10T10:00:00.000Z')
  })
})
