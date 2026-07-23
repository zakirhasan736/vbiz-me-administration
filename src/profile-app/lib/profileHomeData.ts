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

export function splitDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: 'Your', rest: 'Name' }
  return { first: parts[0], rest: parts.slice(1).join(' ') }
}

export function buildProfileContactItems(
  personal: VCardPersonal,
  isVisible: (key: string) => boolean,
  field: (key: string) => DisplayFieldConfig
): ProfileContactItem[] {
  const items: ProfileContactItem[] = []

  if (isVisible('MyInfo Profession') && personal.profession) {
    items.push({
      icon: Briefcase,
      label: 'Profession',
      value: personal.profession,
      detail: 'Role',
      style: field('MyInfo Profession'),
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
  if (isVisible('MyInfo Company') && personal.company) {
    items.push({
      icon: Building2,
      label: 'Company',
      value: personal.company,
      detail: 'Org',
      style: field('MyInfo Company'),
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
