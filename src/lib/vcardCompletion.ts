import { getDisplaySettingsFromVCard, getFieldConfig } from '@/lib/vcardDisplaySettings'
import type { EditorNavPanel } from '@/lib/vcardNavbar'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { getSectionSchema } from '@/lib/vcardSectionSchemas'
import type { VCardData } from '@/types/vcard'

function filled(value?: string | null) {
  return Boolean(value && String(value).trim())
}

function pct(done: number, total: number) {
  if (total <= 0) return 0
  return Math.round((done / total) * 100)
}

function listProgress(items: unknown[] | undefined, weight = 1) {
  if (!items || items.length === 0) return 0
  return Math.min(100, items.length * weight * 20)
}

function customTabProgress(data: VCardData, tabId: string) {
  const tab = data.customTabs?.find((entry) => entry.id === tabId)
  if (!tab) return 0
  const activeItems = (tab.items || []).filter((item) => item.active !== false)
  if (!activeItems.length) return 0
  const total = activeItems.length * 3
  const filledCount = activeItems.reduce(
    (sum, item) =>
      sum +
      (filled(item.title) ? 1 : 0) +
      (filled(item.description) ? 1 : 0) +
      (filled(item.mediaUrl) || Boolean(item.gallery?.length) ? 1 : 0),
    0
  )
  return pct(filledCount, total)
}

export type PersonalCompletionMeta = {
  avatarImageUrl?: string
  backgroundImageUrl?: string
}

export type PersonalSubCompletion = {
  id: number
  name: string
  percent: number
}

function displayCustom(data: VCardData, key: string) {
  return getFieldConfig(getDisplaySettingsFromVCard(data), key).customValue?.trim() || ''
}

export function getPersonalSubCompletions(data: VCardData, meta?: PersonalCompletionMeta): PersonalSubCompletion[] {
  const p = data.personal || ({} as VCardData['personal'])
  const social = data.social
  const handles = social?.handles ? Object.values(social.handles).filter((v) => filled(v)) : []
  const customLinks = (social?.customLinks || []).filter((l) => filled(l?.url))
  const games = social?.games ? Object.values(social.games).filter((v) => filled(v)) : []
  const socialFilledCount = handles.length + customLinks.length + games.length

  const avatar = displayCustom(data, 'Profile Image/Video') || meta?.avatarImageUrl || ''
  const background = displayCustom(data, 'Background Video/Image') || meta?.backgroundImageUrl || ''
  const intro =
    displayCustom(data, 'Intro vCard Video') ||
    displayCustom(data, 'Intro YouTube vCard Video Link') ||
    p.explainerVideoUrl ||
    ''
  const bgMusic = displayCustom(data, 'Background Music') || displayCustom(data, 'YouTube Background Music Link') || ''

  const mediaChecks = [filled(avatar), filled(background), filled(data.slug)]
  const infoChecks = [p.fullName, p.email, p.phone, p.designation, p.company, p.about, p.address, p.profession].map(
    filled
  )
  const socialChecks = [socialFilledCount > 0, handles.length > 0 || customLinks.length > 0, socialFilledCount >= 2]
  const homeChecks = [filled(intro), filled(bgMusic) || filled(background), filled(data.theme?.primaryColor)]
  const extras = data.extraFields || []
  const hasExtraRow = extras.some((f) => filled(f?.name) && filled(f?.value))
  const extraChecks = [
    hasExtraRow || filled(p.relationship),
    filled(p.gender) || hasExtraRow,
    filled(p.website) || filled(p.whatsapp),
  ]

  return [
    { id: 1, name: 'Media & Profile', percent: pct(mediaChecks.filter(Boolean).length, mediaChecks.length) },
    { id: 2, name: 'Personal Info', percent: pct(infoChecks.filter(Boolean).length, infoChecks.length) },
    { id: 3, name: 'Social & Games', percent: pct(socialChecks.filter(Boolean).length, socialChecks.length) },
    { id: 4, name: 'Home Media', percent: pct(homeChecks.filter(Boolean).length, homeChecks.length) },
    { id: 5, name: 'Extra Fields', percent: pct(extraChecks.filter(Boolean).length, extraChecks.length) },
  ]
}

function personalPercent(data: VCardData, meta?: PersonalCompletionMeta): number {
  const subs = getPersonalSubCompletions(data, meta)
  if (subs.length === 0) return 0
  return Math.round(subs.reduce((sum, t) => sum + t.percent, 0) / subs.length)
}

function panelPercent(panel: EditorNavPanel, data: VCardData, meta?: PersonalCompletionMeta): number {
  switch (panel.kind) {
    case 'personal':
      return personalPercent(data, meta)
    case 'education':
      return listProgress(data.education)
    case 'experience':
      return listProgress(data.experience)
    case 'skill':
      return listProgress(data.skills)
    case 'services':
      return listProgress(data.services)
    case 'portfolio':
      return listProgress(data.portfolio)
    case 'reviews':
      return listProgress(data.reviews)
    case 'blog':
      return listProgress(data.generalPosts)
    case 'faq':
      return listProgress(data.faqs)
    case 'profile':
      return personalPercent(data, meta)
    case 'resume': {
      const block = (
        data as { sections?: Record<string, unknown>; resume?: { url?: string; title?: string; summary?: string } }
      ).sections?.Resume as
        | {
            title?: string
            summary?: string
            body?: string
            documents?: unknown[]
            document?: unknown
            url?: string
          }
        | undefined
      const legacy = (data as { resume?: { url?: string; title?: string; summary?: string } }).resume
      const docs = Array.isArray(block?.documents)
        ? block.documents
        : block?.document
          ? [block.document]
          : block?.url || legacy?.url
            ? [block?.url || legacy?.url]
            : []
      const hasDoc = docs.length > 0
      const hasSummary = filled(block?.summary) || filled(block?.body) || filled(legacy?.summary)
      const hasTitle = filled(block?.title) || filled(legacy?.title)
      if (!hasDoc && !hasSummary && !hasTitle) return 0
      if (hasDoc && hasSummary) return 100
      if (hasDoc) return 70
      if (hasSummary || hasTitle) return 30
      return 0
    }
    case 'content-media': {
      const cm = (data as { contentMedia?: { gallery?: unknown[]; videos?: unknown[] } }).contentMedia
      return listProgress([...(cm?.gallery || []), ...(cm?.videos || [])])
    }
    case 'global-connection':
      return 100
    case 'my-info': {
      const m = (data as { myInfo?: { headline?: string } }).myInfo
      return filled(m?.headline) || filled(data.personal?.phone) || filled(data.personal?.email) ? 100 : 50
    }
    case 'section-posts': {
      const schema = getSectionSchema(panel.schemaKey)
      if (!schema) return 0
      return listProgress(data.sectionPosts?.[schema.postTypeName])
    }
    case 'custom-tab':
      return customTabProgress(data, panel.tabId)
    case 'certificates':
      return listProgress(data.sectionPosts?.[PUBLIC_SECTION_NAMES.certificates])
    case 'link-shortener':
      return filled(data.personal?.website) ? 100 : 0
    case 'info':
      return 50
    case 'empty':
    default:
      return 0
  }
}

export function getNavItemCompletionPercent(
  panel: EditorNavPanel | undefined,
  data: VCardData,
  meta?: PersonalCompletionMeta
): number {
  if (!panel) return 0
  return Math.max(0, Math.min(100, panelPercent(panel, data, meta)))
}

export function getOverallCardCompletionPercent(
  items: Array<{ editorPanel?: EditorNavPanel }>,
  data: VCardData,
  meta?: PersonalCompletionMeta
): number {
  if (items.length === 0) return 0
  const total = items.reduce((sum, item) => sum + getNavItemCompletionPercent(item.editorPanel, data, meta), 0)
  return Math.round(total / items.length)
}
