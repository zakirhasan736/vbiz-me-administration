import type { VCardExtraField, VCardPersonal } from '@/types/vcard'
import type { DisplayFieldConfig } from '@/types/vcardDisplaySettings'
import { Briefcase, Building2, Globe, Link2, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'

const EXTRA_ICON_MAP: Record<string, LucideIcon> = {
  Link: Link2,
  Phone: Phone,
  Mail: Mail,
  Location: MapPin,
}

export type ProfileContactItem = {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  isLink?: boolean
  href?: string
  style?: Pick<DisplayFieldConfig, 'textColor' | 'backgroundColor' | 'iconColor'>
}

export const PROFILE_CONTACT_LABEL_ORDER = ['Profession', 'Company', 'Email', 'Phone', 'Website', 'Address'] as const

export type BentoProfileContactItem = ProfileContactItem & {
  colSpan: 1 | 2
}

const MAX_BENTO_CONTACT_ITEMS = 6

/** Row widths per item count — e.g. 5 items → [2,1,2], 3 items → [2,1], 6 items → [2,1,2,1]. */
function getBentoRowPattern(count: number): number[] {
  const patterns: Record<number, number[]> = {
    1: [1],
    2: [2],
    3: [2, 1],
    4: [2, 2],
    5: [2, 1, 2],
    6: [2, 1, 2, 1],
  }
  return patterns[count] ?? [2, 2, 2]
}

function assignBentoColSpans(items: ProfileContactItem[]): BentoProfileContactItem[] {
  const slice = items.slice(0, MAX_BENTO_CONTACT_ITEMS)
  const count = slice.length
  if (count === 0) return []

  const colSpans: (1 | 2)[] = []
  for (const row of getBentoRowPattern(count)) {
    if (row === 1) {
      colSpans.push(2)
    } else {
      colSpans.push(1, 1)
    }
  }

  return slice.map((item, index) => ({
    ...item,
    colSpan: colSpans[index] ?? 1,
  }))
}

function resolveProfessionValue(personal: VCardPersonal, isVisible: (key: string) => boolean): string {
  if (isVisible('MyInfo Profession') && personal.profession?.trim()) {
    return cleanProfileFieldValue(personal.profession)
  }
  if (isVisible('MyInfo Designation') && personal.designation?.trim()) {
    return cleanProfileFieldValue(personal.designation)
  }
  return ''
}

export function splitDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: 'Your', rest: 'Name' }
  return { first: parts[0], rest: parts.slice(1).join(' ') }
}

/** Strip legacy vBiz field separators (e.g. "Software Engineer ||") from API values. */
export function cleanProfileFieldValue(value: string): string {
  return value
    .replace(/\s*\|\|\s*/g, ' · ')
    .replace(/\s*·\s*$/g, '')
    .replace(/^\s*·\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function buildProfileContactItems(
  personal: VCardPersonal,
  isVisible: (key: string) => boolean,
  field: (key: string) => DisplayFieldConfig
): ProfileContactItem[] {
  const items: ProfileContactItem[] = []

  const professionValue = resolveProfessionValue(personal, isVisible)
  if (professionValue) {
    const professionStyle = field('MyInfo Profession')
    const designationStyle = field('MyInfo Designation')
    items.push({
      icon: Briefcase,
      label: 'Profession',
      value: professionValue,
      detail: 'Role',
      style:
        professionStyle.textColor || professionStyle.backgroundColor || professionStyle.iconColor
          ? professionStyle
          : designationStyle,
    })
  }
  if (isVisible('MyInfo Company') && personal.company) {
    items.push({
      icon: Building2,
      label: 'Company',
      value: personal.company,
      detail: 'Org',
      style: field('MyInfo Company'),
    })
  }
  if (isVisible('MyInfo Email') && personal.email) {
    items.push({
      icon: Mail,
      label: 'Email',
      value: personal.email,
      isLink: true,
      href: `mailto:${personal.email}`,
      detail: 'Contact',
      style: field('MyInfo Email'),
    })
  }
  if (isVisible('MyInfo Phone') && personal.phone) {
    items.push({
      icon: Phone,
      label: 'Phone',
      value: personal.phone,
      isLink: true,
      href: `tel:${personal.phone.replace(/\s/g, '')}`,
      detail: 'Direct',
      style: field('MyInfo Phone'),
    })
  }
  const website = personal.website?.trim()
  if (isVisible('MyInfo Website') && website) {
    items.push({
      icon: Globe,
      label: 'Website',
      value: website.replace(/^https?:\/\//i, ''),
      isLink: true,
      href: website.startsWith('http') ? website : `https://${website}`,
      detail: 'Digital',
      style: field('MyInfo Website'),
    })
  }
  if (isVisible('MyInfo Address') && personal.address) {
    items.push({
      icon: MapPin,
      label: 'Address',
      value: personal.address,
      detail: 'HQ',
      style: field('MyInfo Address'),
    })
  }

  return items
}

/** Desktop bento grid: up to 6 core fields, auto row layout by count. */
export function buildBentoContactItems(
  personal: VCardPersonal,
  isVisible: (key: string) => boolean,
  field: (key: string) => DisplayFieldConfig
): BentoProfileContactItem[] {
  const byLabel = new Map(buildProfileContactItems(personal, isVisible, field).map((item) => [item.label, item]))

  const ordered = PROFILE_CONTACT_LABEL_ORDER.map((label) => byLabel.get(label)).filter(
    (item): item is ProfileContactItem => Boolean(item)
  )

  return assignBentoColSpans(ordered)
}

/** Mobile / popup: all core contact fields plus API extra fields. */
export function buildFullContactItems(
  personal: VCardPersonal,
  isVisible: (key: string) => boolean,
  field: (key: string) => DisplayFieldConfig,
  extraFields: VCardExtraField[] = []
): ProfileContactItem[] {
  return [...buildProfileContactItems(personal, isVisible, field), ...buildExtraFieldContactItems(extraFields)]
}

export function formatProfileViewCount(views: number): string {
  if (views >= 1_000_000) {
    const m = views / 1_000_000
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')}M`
  }
  if (views >= 1_000) {
    const k = views / 1_000
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(views)
}

export function resolveWhatsappHref(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}`
}

export function buildExtraFieldContactItems(extraFields: VCardExtraField[]): ProfileContactItem[] {
  return extraFields
    .filter((f) => f.name.trim() && f.value.trim())
    .map((f) => {
      const value = f.value.trim()
      const isUrl = /^https?:\/\//i.test(value)
      return {
        icon: EXTRA_ICON_MAP[f.icon] ?? Link2,
        label: f.name.trim(),
        value,
        detail: 'Custom',
        isLink: isUrl,
        href: isUrl ? value : undefined,
      }
    })
}
