import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import type { VCardSectionPostItem } from '@/types/vcard'

export type SectionFieldKey =
  'title' | 'description' | 'url' | 'featuredImage' | 'date' | 'rating' | 'location' | 'active'

export type VCardSectionSchema = {
  key: string // ProfileNavContentKey
  postTypeName: string // exact PUBLIC_SECTION_NAMES value
  title: string
  description: string
  addLabel: string
  emptyTitle: string
  emptyHint: string
  fields: SectionFieldKey[]
  accentClass?: string // tailwind color family hint e.g. 'violet' | 'amber' | 'teal'
}

const DEFAULT_FIELDS: SectionFieldKey[] = ['title', 'description', 'url', 'featuredImage', 'active']

function schema(
  partial: Omit<VCardSectionSchema, 'fields' | 'addLabel' | 'emptyTitle' | 'emptyHint' | 'description'> &
    Partial<
      Pick<VCardSectionSchema, 'fields' | 'addLabel' | 'emptyTitle' | 'emptyHint' | 'description' | 'accentClass'>
    >
): VCardSectionSchema {
  const title = partial.title
  return {
    description: partial.description ?? `Manage ${title} entries shown on your public profile.`,
    addLabel: partial.addLabel ?? 'Add Item',
    emptyTitle: partial.emptyTitle ?? `No ${title.toLowerCase()} items yet`,
    emptyHint: partial.emptyHint ?? `Click "Add Item" to create your first ${title.toLowerCase()} entry.`,
    fields: partial.fields ?? DEFAULT_FIELDS,
    accentClass: partial.accentClass ?? 'amber',
    key: partial.key,
    postTypeName: partial.postTypeName,
    title,
  }
}

export const VCARD_SECTION_SCHEMAS: Record<string, VCardSectionSchema> = {
  mission: schema({
    key: 'mission',
    postTypeName: PUBLIC_SECTION_NAMES.mission,
    title: 'Mission Statement',
    description: 'Share your company mission and purpose on the public profile.',
    addLabel: 'Add Mission',
    emptyTitle: 'No mission entries yet',
    emptyHint: 'Add a mission statement for your public profile.',
    accentClass: 'violet',
  }),
  additional: schema({
    key: 'additional',
    postTypeName: PUBLIC_SECTION_NAMES.additionalServices,
    title: 'Additional Services',
    accentClass: 'teal',
  }),
  videos: schema({
    key: 'videos',
    postTypeName: PUBLIC_SECTION_NAMES.videos,
    title: 'Videos',
    addLabel: 'Add Video',
    emptyTitle: 'No videos yet',
    emptyHint: 'Add video links or embeds for your public profile.',
    accentClass: 'violet',
  }),
  'video-links': schema({
    key: 'video-links',
    postTypeName: PUBLIC_SECTION_NAMES.videoLinks,
    title: 'Video Links',
    addLabel: 'Add Link',
    accentClass: 'violet',
  }),
  explainer: schema({
    key: 'explainer',
    postTypeName: PUBLIC_SECTION_NAMES.explainer,
    title: '2D Video Explainer',
    addLabel: 'Add Explainer',
    accentClass: 'teal',
  }),
  certificates: schema({
    key: 'certificates',
    postTypeName: PUBLIC_SECTION_NAMES.certificates,
    title: 'Certificates & Licenses',
    addLabel: 'Add Certificate',
    accentClass: 'teal',
  }),
  'insurance-license': schema({
    key: 'insurance-license',
    postTypeName: PUBLIC_SECTION_NAMES.insuranceLicense,
    title: 'Insurance License',
    addLabel: 'Add License',
    accentClass: 'teal',
  }),
  licensing: schema({
    key: 'licensing',
    postTypeName: PUBLIC_SECTION_NAMES.licensing,
    title: 'Licensing',
    addLabel: 'Add License',
    accentClass: 'teal',
  }),
  clients: schema({
    key: 'clients',
    postTypeName: PUBLIC_SECTION_NAMES.clients,
    title: 'Clients',
    fields: ['title', 'description', 'url', 'featuredImage', 'active'],
    addLabel: 'Add Client',
    emptyTitle: 'No clients yet',
    emptyHint: 'Add clients to showcase on your public profile.',
    accentClass: 'amber',
  }),
  'meet-team': schema({
    key: 'meet-team',
    postTypeName: PUBLIC_SECTION_NAMES.meetTeam,
    title: 'Meet Our Team',
    addLabel: 'Add Member',
    accentClass: 'violet',
  }),
  calendar: schema({
    key: 'calendar',
    postTypeName: PUBLIC_SECTION_NAMES.calendar,
    title: 'Calendar',
    fields: ['title', 'description', 'date', 'url', 'location', 'active'],
    addLabel: 'Add Event',
    emptyTitle: 'No calendar items yet',
    emptyHint: 'Add calendar entries for your public profile.',
    accentClass: 'teal',
  }),
  events: schema({
    key: 'events',
    postTypeName: PUBLIC_SECTION_NAMES.events,
    title: 'Events',
    fields: ['title', 'description', 'date', 'url', 'location', 'active'],
    addLabel: 'Add Event',
    emptyTitle: 'No events yet',
    emptyHint: 'Add events for your public profile.',
    accentClass: 'amber',
  }),
  booking: schema({
    key: 'booking',
    postTypeName: PUBLIC_SECTION_NAMES.booking,
    title: 'Booking',
    fields: ['title', 'description', 'url', 'date', 'active'],
    addLabel: 'Add Booking',
    accentClass: 'violet',
  }),
  announcement: schema({
    key: 'announcement',
    postTypeName: PUBLIC_SECTION_NAMES.announcement,
    title: 'Announcement',
    addLabel: 'Add Announcement',
    accentClass: 'amber',
  }),
  bbb: schema({
    key: 'bbb',
    postTypeName: PUBLIC_SECTION_NAMES.bbb,
    title: 'BBB Accreditation',
    accentClass: 'teal',
  }),
  breakfast: schema({
    key: 'breakfast',
    postTypeName: PUBLIC_SECTION_NAMES.breakfast,
    title: 'Breakfast',
    addLabel: 'Add Item',
    accentClass: 'amber',
  }),
  dinner: schema({
    key: 'dinner',
    postTypeName: PUBLIC_SECTION_NAMES.dinner,
    title: 'Dinner',
    addLabel: 'Add Item',
    accentClass: 'violet',
  }),
  lunch: schema({
    key: 'lunch',
    postTypeName: PUBLIC_SECTION_NAMES.lunch,
    title: 'Lunch',
    addLabel: 'Add Item',
    accentClass: 'teal',
  }),
  dcp: schema({
    key: 'dcp',
    postTypeName: PUBLIC_SECTION_NAMES.dcp,
    title: 'DCP',
    accentClass: 'amber',
  }),
  'home-solar': schema({
    key: 'home-solar',
    postTypeName: PUBLIC_SECTION_NAMES.homeSolar,
    title: 'Home Solar',
    accentClass: 'teal',
  }),
  inventory: schema({
    key: 'inventory',
    postTypeName: PUBLIC_SECTION_NAMES.inventory,
    title: 'Inventory',
    addLabel: 'Add Item',
    accentClass: 'violet',
  }),
  'join-my-team': schema({
    key: 'join-my-team',
    postTypeName: PUBLIC_SECTION_NAMES.joinMyTeam,
    title: 'Join My Team',
    addLabel: 'Add Role',
    accentClass: 'amber',
  }),
  menu: schema({
    key: 'menu',
    postTypeName: PUBLIC_SECTION_NAMES.menu,
    title: 'Menu',
    addLabel: 'Add Item',
    accentClass: 'teal',
  }),
  'media-press': schema({
    key: 'media-press',
    postTypeName: PUBLIC_SECTION_NAMES.mediaPress,
    title: 'Media Press',
    addLabel: 'Add Press Item',
    accentClass: 'violet',
  }),
  'property-listing': schema({
    key: 'property-listing',
    postTypeName: PUBLIC_SECTION_NAMES.propertyListing,
    title: 'Property Listing',
    addLabel: 'Add Listing',
    accentClass: 'amber',
  }),
  'resiliency-products': schema({
    key: 'resiliency-products',
    postTypeName: PUBLIC_SECTION_NAMES.resiliencyProducts,
    title: 'Resiliency Products',
    addLabel: 'Add Product',
    accentClass: 'teal',
  }),
  'see-products': schema({
    key: 'see-products',
    postTypeName: PUBLIC_SECTION_NAMES.seeProducts,
    title: 'See Products',
    addLabel: 'Add Product',
    accentClass: 'violet',
  }),
  'sales-person': schema({
    key: 'sales-person',
    postTypeName: PUBLIC_SECTION_NAMES.salesPerson,
    title: 'Sales Person',
    addLabel: 'Add Sales Person',
    accentClass: 'amber',
  }),
  'why-choose-us': schema({
    key: 'why-choose-us',
    postTypeName: PUBLIC_SECTION_NAMES.whyChooseUs,
    title: 'Why Choose Us',
    addLabel: 'Add Reason',
    accentClass: 'teal',
  }),
  'contact-us': schema({
    key: 'contact-us',
    postTypeName: PUBLIC_SECTION_NAMES.contactUs,
    title: 'Contact Us',
    description: 'Manage Contact Us entries shown on your public profile.',
    addLabel: 'Add Contact Block',
    emptyTitle: 'No Contact Us content yet',
    emptyHint: 'Add a contact block visitors can read on the Contact Us tab.',
    accentClass: 'sky',
  }),
}

export function getSectionSchema(key: string): VCardSectionSchema | undefined {
  return VCARD_SECTION_SCHEMAS[key]
}

export function createDefaultSectionPostItem(): VCardSectionPostItem {
  const id = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  return {
    id,
    clientKey: id,
    title: '',
    description: '',
    url: '',
    featuredImage: '',
    date: '',
    rating: '',
    location: '',
    active: true,
  }
}

export function normalizeSectionPostList(items: VCardSectionPostItem[] | null | undefined): VCardSectionPostItem[] {
  if (!items?.length) return []
  return items.map((entry) => {
    const id = entry.id || `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    return {
      id,
      clientKey: entry.clientKey || id,
      title: entry.title ?? '',
      description: entry.description ?? '',
      url: entry.url ?? '',
      featuredImage: entry.featuredImage ?? '',
      date: entry.date ?? '',
      rating: entry.rating ?? '',
      location: entry.location ?? '',
      active: entry.active !== false,
      ...(entry.metas ? { metas: entry.metas } : {}),
    }
  })
}
