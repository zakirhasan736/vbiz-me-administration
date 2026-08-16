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

/** Card Settings → Icons tab labels → contact / My Info fields. */
const CONTACT_LABEL_TO_ICON_FIELD: Record<string, string> = {
  Profession: 'Profession Icon',
  Company: 'Company/Office Icon',
  Email: 'Email Icon',
  Phone: 'Phone Icon',
  Website: 'My Info Website Icon',
  Address: 'Address Icon',
}

function pickStyle(
  primary: DisplayFieldConfig,
  iconField?: DisplayFieldConfig
): Pick<DisplayFieldConfig, 'textColor' | 'backgroundColor' | 'iconColor'> | undefined {
  const textColor = primary.textColor
  const backgroundColor = primary.backgroundColor
  const iconColor = primary.iconColor || iconField?.iconColor || iconField?.textColor
  if (!textColor && !backgroundColor && !iconColor) return undefined
  return {
    ...(textColor ? { textColor } : {}),
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(iconColor ? { iconColor } : {}),
  }
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

/**
 * Public/global title under the name: Profession first, Designation as fallback.
 * Respects MyInfo visibility toggles when an `isVisible` checker is provided.
 */
export function resolveGlobalProfession(
  personal: Pick<VCardPersonal, 'profession' | 'designation'>,
  isVisible?: (key: string) => boolean
): string {
  const visible = isVisible ?? (() => true)
  if (visible('MyInfo Profession') && personal.profession?.trim()) {
    return cleanProfileFieldValue(personal.profession)
  }
  if (visible('MyInfo Designation') && personal.designation?.trim()) {
    return cleanProfileFieldValue(personal.designation)
  }
  return ''
}

function resolveProfessionValue(personal: VCardPersonal, isVisible: (key: string) => boolean): string {
  return resolveGlobalProfession(personal, isVisible)
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
  const iconFor = (contactLabel: string) => {
    const iconKey = CONTACT_LABEL_TO_ICON_FIELD[contactLabel]
    if (!iconKey || !isVisible(iconKey)) return undefined
    return field(iconKey)
  }

  const professionValue = resolveProfessionValue(personal, isVisible)
  if (professionValue) {
    const professionStyle = field('MyInfo Profession')
    const designationStyle = field('MyInfo Designation')
    const primary =
      professionStyle.textColor || professionStyle.backgroundColor || professionStyle.iconColor
        ? professionStyle
        : designationStyle
    items.push({
      icon: Briefcase,
      label: 'Profession',
      value: professionValue,
      detail: 'Role',
      style: pickStyle(primary, iconFor('Profession')),
    })
  }
  if (isVisible('MyInfo Company') && personal.company) {
    items.push({
      icon: Building2,
      label: 'Company',
      value: personal.company,
      detail: 'Org',
      style: pickStyle(field('MyInfo Company'), iconFor('Company')),
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
      style: pickStyle(field('MyInfo Email'), iconFor('Email')),
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
      style: pickStyle(field('MyInfo Phone'), iconFor('Phone')),
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
      style: pickStyle(field('MyInfo Website'), iconFor('Website')),
    })
  }
  if (isVisible('MyInfo Address') && personal.address) {
    items.push({
      icon: MapPin,
      label: 'Address',
      value: personal.address,
      detail: 'HQ',
      style: pickStyle(field('MyInfo Address'), iconFor('Address')),
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
