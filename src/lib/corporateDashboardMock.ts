import type { DashboardContact } from '@/components/dashboard/home'
import type { CorporateBroadcast } from '@/lib/corporateBroadcasts'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { createDefaultVCardData, type VCardRecord } from '@/types/vcard'

export const CORPORATE_QUOTA_LIMIT = 15

export const CORPORATE_METRICS = {
  totalViews: 1534,
  uniqueViews: 892,
  shares: 146,
  totalSaves: 281,
  activeCount: 4,
}

export const CORPORATE_CHART_DATA = [
  { name: 'Apr', total: 85, Engineering: 45, Marketing: 25, Sales: 15 },
  { name: 'May', total: 110, Engineering: 55, Marketing: 35, Sales: 20 },
  { name: 'Jun', total: 145, Engineering: 70, Marketing: 45, Sales: 30 },
  { name: 'Jul', total: 190, Engineering: 90, Marketing: 60, Sales: 40 },
  { name: 'Aug', total: 250, Engineering: 120, Marketing: 80, Sales: 50 },
  { name: 'Sep', total: 3192, Engineering: 1240, Marketing: 890, Sales: 1062 },
]

export const CORPORATE_WEEKLY_DATA = [
  { name: 'Mon', views: 42, clicks: 18 },
  { name: 'Tue', views: 58, clicks: 24 },
  { name: 'Wed', views: 71, clicks: 31 },
  { name: 'Thu', views: 65, clicks: 28 },
  { name: 'Fri', views: 89, clicks: 41 },
  { name: 'Sat', views: 34, clicks: 12 },
  { name: 'Sun', views: 28, clicks: 9 },
]

export const CORPORATE_SOCIAL_CHANNELS: Array<{
  channel: DashboardSocialChannel
  label: string
  count: number
  trendPercent: number
}> = [
  { channel: 'facebook', label: 'Facebook', count: 18, trendPercent: 8 },
  { channel: 'twitter', label: 'Twitter', count: 12, trendPercent: 4 },
  { channel: 'instagram', label: 'Instagram', count: 35, trendPercent: 20 },
  { channel: 'whatsapp', label: 'WhatsApp', count: 54, trendPercent: 15 },
  { channel: 'linkedin', label: 'LinkedIn', count: 42, trendPercent: 12 },
  { channel: 'youtube', label: 'YouTube', count: 15, trendPercent: 5 },
  { channel: 'website', label: 'Web Visits', count: 86, trendPercent: 12 },
]

export const CORPORATE_DEPARTMENT_MATRIX = [
  { dept: 'Sales', count: '450 clicks', color: 'bg-amber-500', pct: 42 },
  { dept: 'Marketing', count: '380 clicks', color: 'bg-pink-500', pct: 35 },
  { dept: 'Engineering', count: '185 clicks', color: 'bg-indigo-500', pct: 17 },
  { dept: 'HR & Others', count: '65 clicks', color: 'bg-slate-400', pct: 6 },
]

export type MockSocialClick = { platform: string; clickCount: number }

/** Seed per-card social click rows for the Socials Insights tab / simulator. */
export const CORPORATE_SOCIAL_CLICKS_BY_CARD: Record<string, MockSocialClick[]> = {
  'mock-corp-zakir': [
    { platform: 'LinkedIn', clickCount: 14 },
    { platform: 'WhatsApp', clickCount: 9 },
    { platform: 'Web Visits', clickCount: 22 },
  ],
  'mock-corp-sarah': [
    { platform: 'Instagram', clickCount: 18 },
    { platform: 'LinkedIn', clickCount: 12 },
    { platform: 'Facebook', clickCount: 7 },
  ],
  'mock-corp-david': [
    { platform: 'WhatsApp', clickCount: 21 },
    { platform: 'LinkedIn', clickCount: 8 },
    { platform: 'Twitter', clickCount: 5 },
  ],
  'mock-corp-alex': [
    { platform: 'LinkedIn', clickCount: 28 },
    { platform: 'WhatsApp', clickCount: 16 },
    { platform: 'YouTube', clickCount: 11 },
    { platform: 'Web Visits', clickCount: 34 },
  ],
}

function mockCard(
  id: string,
  slug: string,
  personal: { fullName: string; designation: string; profession: string; email: string; phone: string },
  meta: { views: number; saves: number },
  handles: Record<string, string>
): VCardRecord {
  const base = createDefaultVCardData({
    slug,
    social: {
      handles,
      customLinks: [],
      games: {},
    },
  })
  const now = new Date().toISOString()
  return {
    ...base,
    id,
    personal: {
      ...base.personal,
      fullName: personal.fullName,
      designation: personal.designation,
      profession: personal.profession,
      company: 'vBiz Corporate',
      email: personal.email,
      phone: personal.phone,
      whatsapp: personal.phone,
      about: `${personal.fullName} — ${personal.designation} at vBiz Corporate.`,
    },
    views: meta.views,
    saves: meta.saves,
    avatarImageUrl: '',
    backgroundImageUrl: '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const CORPORATE_MOCK_CARDS: VCardRecord[] = [
  mockCard(
    'mock-corp-zakir',
    'zakir-hosen',
    {
      fullName: 'Zakir Hosen',
      designation: 'Senior Technical Architect',
      profession: 'Engineering',
      email: 'zakir@vbiz.me',
      phone: '+1 555 0101',
    },
    { views: 154, saves: 32 },
    {
      linkedin: 'https://linkedin.com/in/zakir',
      whatsapp: 'https://wa.me/15550101',
      website: 'https://vbiz.me',
    }
  ),
  mockCard(
    'mock-corp-sarah',
    'sarah-jenkins',
    {
      fullName: 'Sarah Jenkins',
      designation: 'VP of Product Marketing',
      profession: 'Marketing',
      email: 'sarah@vbiz.me',
      phone: '+1 555 0102',
    },
    { views: 450, saves: 89 },
    {
      instagram: 'https://instagram.com/sarah',
      linkedin: 'https://linkedin.com/in/sarah',
      facebook: 'https://facebook.com/sarah',
    }
  ),
  mockCard(
    'mock-corp-david',
    'david-chen',
    {
      fullName: 'David Chen',
      designation: 'Lead Recruitment Advisor',
      profession: 'HR',
      email: 'david@vbiz.me',
      phone: '+1 555 0103',
    },
    { views: 310, saves: 45 },
    {
      whatsapp: 'https://wa.me/15550103',
      linkedin: 'https://linkedin.com/in/david',
      twitter: 'https://twitter.com/david',
    }
  ),
  mockCard(
    'mock-corp-alex',
    'alex-rodriguez',
    {
      fullName: 'Alex Rodriguez',
      designation: 'Senior Account Executive',
      profession: 'Sales',
      email: 'alex@vbiz.me',
      phone: '+1 555 0104',
    },
    { views: 620, saves: 115 },
    {
      linkedin: 'https://linkedin.com/in/alex',
      whatsapp: 'https://wa.me/15550104',
      youtube: 'https://youtube.com/@alex',
      website: 'https://vbiz.me/alex',
    }
  ),
]

export const CORPORATE_MOCK_CONTACTS: Array<
  DashboardContact & {
    consent?: boolean
    privateNotes?: string
    lastReply?: string
    metadata?: {
      device?: string
      browser?: string
      approximateLocation?: string
      referrer?: string
    }
  }
> = [
  {
    id: 'contact-1',
    name: 'Ayesha Rahman',
    email: 'ayesha@example.com',
    phone: '+880 1711 000111',
    message: 'Would love to connect about partnership opportunities.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    profile: { id: 'mock-corp-zakir', name: 'Zakir Hosen', slug: 'zakir-hosen' },
    consent: true,
    metadata: {
      device: 'iPhone 15',
      browser: 'Safari',
      approximateLocation: 'Dhaka, BD',
      referrer: 'LinkedIn',
    },
  },
  {
    id: 'contact-2',
    name: 'Michael Torres',
    email: 'michael@acme.co',
    phone: '+1 415 555 0199',
    message: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    profile: { id: 'mock-corp-sarah', name: 'Sarah Jenkins', slug: 'sarah-jenkins' },
    consent: true,
    lastReply: 'Thanks for connecting — sending the deck shortly.',
    metadata: {
      device: 'MacBook Pro',
      browser: 'Chrome',
      approximateLocation: 'San Francisco, US',
      referrer: 'Direct',
    },
  },
  {
    id: 'contact-3',
    name: 'Priya Nair',
    email: 'priya.nair@outlook.com',
    phone: '+91 98200 11223',
    message: 'Please send the team brochure.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    profile: { id: 'mock-corp-alex', name: 'Alex Rodriguez', slug: 'alex-rodriguez' },
    consent: true,
    privateNotes: 'Hot lead — enterprise interest',
    metadata: {
      device: 'Pixel 8',
      browser: 'Chrome',
      approximateLocation: 'Mumbai, IN',
      referrer: 'WhatsApp',
    },
  },
  {
    id: 'contact-4',
    name: 'James Okonkwo',
    email: 'james.o@globex.io',
    phone: '+44 7700 900123',
    message: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    profile: { id: 'mock-corp-david', name: 'David Chen', slug: 'david-chen' },
    consent: false,
    metadata: {
      device: 'Windows PC',
      browser: 'Edge',
      approximateLocation: 'London, UK',
      referrer: 'Google',
    },
  },
]

export const CORPORATE_MOCK_BROADCASTS: CorporateBroadcast[] = [
  {
    id: 'bc-mock-1',
    text: 'Please note: Our HQ office has relocated to 500 Madison Ave, New York!',
    type: 'broadcast',
    audience: 'all',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'bc-mock-2',
    text: 'Scheduled maintenance this Sunday 2–4 AM UTC — public cards remain available.',
    type: 'system',
    audience: 'all',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]
