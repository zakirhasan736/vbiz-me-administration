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

export type VCardCompletionField = {
  label: string
  filled: boolean
  hint?: string
  upload?: boolean
  group?: string
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

function fieldsPercent(fields: VCardCompletionField[]): number {
  if (!fields.length) return 0
  return pct(fields.filter((field) => field.filled).length, fields.length)
}

function activeItems<T extends { active?: boolean }>(items?: T[]): T[] {
  return (items || []).filter((item) => item.active !== false)
}

function itemLabel(base: string, index: number, field: string): string {
  return `${base} #${index + 1} ${field}`
}

function resumeDocuments(data: VCardData): unknown[] {
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
  if (Array.isArray(block?.documents)) return block.documents
  if (block?.document) return [block.document]
  if (block?.url || legacy?.url) return [block?.url || legacy?.url]
  return []
}

function resumeSummary(data: VCardData): string {
  const block = (
    data as { sections?: Record<string, unknown>; resume?: { url?: string; title?: string; summary?: string } }
  ).sections?.Resume as { title?: string; summary?: string; body?: string } | undefined
  const legacy = (data as { resume?: { url?: string; title?: string; summary?: string } }).resume
  return block?.summary || block?.body || legacy?.summary || block?.title || legacy?.title || ''
}

function sectionPostFields(data: VCardData, panel: Extract<EditorNavPanel, { kind: 'section-posts' }>) {
  const schema = getSectionSchema(panel.schemaKey)
  if (!schema) return []
  const posts = activeItems(data.sectionPosts?.[schema.postTypeName])
  if (!posts.length) {
    return [{ label: `${schema.title} entries`, filled: false, group: schema.title }]
  }
  const fields = new Set(schema.fields)
  return posts.flatMap((post, index) => {
    const group = `${schema.title} #${index + 1}`
    const checks: VCardCompletionField[] = []
    if (fields.has('title'))
      checks.push({ label: itemLabel(schema.title, index, 'title'), filled: filled(post.title), group })
    if (fields.has('description')) {
      checks.push({ label: itemLabel(schema.title, index, 'description'), filled: filled(post.description), group })
    }
    if (fields.has('url'))
      checks.push({ label: itemLabel(schema.title, index, 'URL'), filled: filled(post.url), group })
    if (fields.has('featuredImage')) {
      checks.push({
        label: itemLabel(schema.title, index, 'featured media'),
        filled: filled(post.featuredImage),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
        group,
      })
    }
    if (fields.has('date'))
      checks.push({ label: itemLabel(schema.title, index, 'date'), filled: filled(post.date), group })
    if (fields.has('rating')) {
      checks.push({ label: itemLabel(schema.title, index, 'rating'), filled: filled(post.rating), group })
    }
    if (fields.has('location')) {
      checks.push({ label: itemLabel(schema.title, index, 'location'), filled: filled(post.location), group })
    }
    return checks
  })
}

export function getEditorPanelCompletionFields(
  panel: EditorNavPanel,
  data: VCardData,
  meta?: PersonalCompletionMeta
): VCardCompletionField[] {
  const p = data.personal || ({} as VCardData['personal'])
  const avatar = displayCustom(data, 'Profile Image/Video') || meta?.avatarImageUrl || ''
  const background = displayCustom(data, 'Background Video/Image') || meta?.backgroundImageUrl || ''
  const intro =
    displayCustom(data, 'Intro vCard Video') ||
    displayCustom(data, 'Intro YouTube vCard Video Link') ||
    p.explainerVideoUrl ||
    ''
  const bgMusic = displayCustom(data, 'Background Music') || displayCustom(data, 'YouTube Background Music Link') || ''
  const social = data.social
  const socialCount =
    (social?.handles ? Object.values(social.handles).filter((value) => filled(value)).length : 0) +
    (social?.customLinks || []).filter((link) => filled(link?.url)).length +
    (social?.games ? Object.values(social.games).filter((value) => filled(value)).length : 0)
  const personalFields: Record<number, VCardCompletionField[]> = {
    1: [
      {
        label: 'Profile image/video',
        filled: filled(avatar),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
      },
      {
        label: 'Background media',
        filled: filled(background),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
      },
      { label: 'Public URL slug', filled: filled(data.slug) },
    ],
    2: [
      { label: 'Full name', filled: filled(p.fullName) },
      { label: 'Email', filled: filled(p.email) },
      { label: 'Phone', filled: filled(p.phone) },
      { label: 'Headline/title', filled: filled(p.designation) || filled(p.profession) },
      { label: 'Company', filled: filled(p.company) },
      { label: 'About text', filled: filled(p.about) },
      { label: 'Address/location', filled: filled(p.address) },
    ],
    3: [
      { label: 'At least one social/contact link', filled: socialCount > 0 },
      { label: 'Website or custom social link', filled: filled(p.website) || Boolean(social?.customLinks?.length) },
      { label: 'Two or more connection links', filled: socialCount >= 2 },
    ],
    4: [
      { label: 'Intro video', filled: filled(intro), hint: 'Upload, YouTube, or Canva asset.', upload: true },
      { label: 'Background music or media', filled: filled(bgMusic) || filled(background) },
      { label: 'Brand color', filled: filled(data.theme?.primaryColor) },
    ],
    5: [
      {
        label: 'Extra info row',
        filled: Boolean(data.extraFields?.some((field) => filled(field?.name) && filled(field?.value))),
      },
      { label: 'Relationship or gender detail', filled: filled(p.relationship) || filled(p.gender) },
      { label: 'Website or WhatsApp', filled: filled(p.website) || filled(p.whatsapp) },
    ],
  }

  switch (panel.kind) {
    case 'personal':
      return panel.subTab ? personalFields[panel.subTab] || [] : Object.values(personalFields).flat()
    case 'education': {
      const items = data.education || []
      if (!items.length) return [{ label: 'Education entries', filled: false }]
      return items.flatMap((item, index) => [
        {
          label: itemLabel('Education', index, 'school'),
          filled: filled(item.institute),
          group: `Education #${index + 1}`,
        },
        {
          label: itemLabel('Education', index, 'degree'),
          filled: filled(item.degree),
          group: `Education #${index + 1}`,
        },
        {
          label: itemLabel('Education', index, 'start date'),
          filled: filled(item.fromDate),
          group: `Education #${index + 1}`,
        },
      ])
    }
    case 'experience': {
      const items = data.experience || []
      if (!items.length) return [{ label: 'Experience entries', filled: false }]
      return items.flatMap((item, index) => [
        {
          label: itemLabel('Experience', index, 'company'),
          filled: filled(item.company),
          group: `Experience #${index + 1}`,
        },
        {
          label: itemLabel('Experience', index, 'job title'),
          filled: filled(item.jobTitle),
          group: `Experience #${index + 1}`,
        },
        {
          label: itemLabel('Experience', index, 'description'),
          filled: filled(item.description),
          group: `Experience #${index + 1}`,
        },
      ])
    }
    case 'skill': {
      const items = data.skills || []
      if (!items.length) return [{ label: 'Skill groups', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('Skill', index, 'group name'), filled: filled(item.type), group: `Skill #${index + 1}` },
        {
          label: itemLabel('Skill', index, 'tags'),
          filled: Boolean(item.skills?.length),
          group: `Skill #${index + 1}`,
        },
      ])
    }
    case 'services': {
      const items = activeItems(data.services)
      if (!items.length) return [{ label: 'Service entries', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('Service', index, 'title'), filled: filled(item.title), group: `Service #${index + 1}` },
        {
          label: itemLabel('Service', index, 'description'),
          filled: filled(item.description),
          group: `Service #${index + 1}`,
        },
        {
          label: itemLabel('Service', index, 'image'),
          filled: filled(item.featuredImage),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Service #${index + 1}`,
        },
      ])
    }
    case 'portfolio': {
      const items = activeItems(data.portfolio)
      if (!items.length) return [{ label: 'Portfolio entries', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('Portfolio', index, 'title'), filled: filled(item.title), group: `Portfolio #${index + 1}` },
        {
          label: itemLabel('Portfolio', index, 'description'),
          filled: filled(item.description),
          group: `Portfolio #${index + 1}`,
        },
        {
          label: itemLabel('Portfolio', index, 'image'),
          filled: filled(item.imageUrl),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Portfolio #${index + 1}`,
        },
      ])
    }
    case 'reviews': {
      const items = data.reviews || []
      if (!items.length) return [{ label: 'Review entries', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('Review', index, 'reviewer'), filled: filled(item.author), group: `Review #${index + 1}` },
        { label: itemLabel('Review', index, 'text'), filled: filled(item.text), group: `Review #${index + 1}` },
        { label: itemLabel('Review', index, 'rating'), filled: Number(item.rating) > 0, group: `Review #${index + 1}` },
      ])
    }
    case 'blog': {
      const items = activeItems(data.generalPosts)
      if (!items.length) return [{ label: 'News/blog posts', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('Post', index, 'title'), filled: filled(item.title), group: `Post #${index + 1}` },
        {
          label: itemLabel('Post', index, 'description'),
          filled: filled(item.description),
          group: `Post #${index + 1}`,
        },
        {
          label: itemLabel('Post', index, 'featured image'),
          filled: filled(item.featuredImage),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Post #${index + 1}`,
        },
      ])
    }
    case 'faq': {
      const items = activeItems(data.faqs)
      if (!items.length) return [{ label: 'FAQ entries', filled: false }]
      return items.flatMap((item, index) => [
        { label: itemLabel('FAQ', index, 'question'), filled: filled(item.question), group: `FAQ #${index + 1}` },
        { label: itemLabel('FAQ', index, 'answer'), filled: filled(item.answer), group: `FAQ #${index + 1}` },
      ])
    }
    case 'profile':
      return [
        { label: 'Profile story', filled: filled(p.about) },
        { label: 'Headline/title', filled: filled(p.designation) || filled(p.profession) },
        {
          label: 'Profile photo',
          filled: filled(avatar),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
        },
      ]
    case 'resume':
      return [
        { label: 'Resume summary', filled: filled(resumeSummary(data)) || filled(p.about) },
        {
          label: 'Resume document',
          filled: resumeDocuments(data).length > 0,
          hint: 'Upload a PDF/DOC after create, or attach a Canva/exported asset.',
          upload: true,
        },
      ]
    case 'content-media': {
      const cm = (data as { contentMedia?: { gallery?: unknown[]; videos?: unknown[] } }).contentMedia
      return [
        {
          label: 'Gallery media',
          filled: Boolean(cm?.gallery?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
        },
        {
          label: 'Video media',
          filled: Boolean(cm?.videos?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
        },
      ]
    }
    case 'global-connection':
      return [{ label: 'Shared global connection area', filled: true }]
    case 'my-info':
      return [
        { label: 'Call action', filled: filled(p.phone) },
        { label: 'Email action', filled: filled(p.email) },
        { label: 'Website action', filled: filled(p.website) },
      ]
    case 'section-posts':
      return sectionPostFields(data, panel)
    case 'certificates': {
      const items = activeItems(data.sectionPosts?.[PUBLIC_SECTION_NAMES.certificates])
      if (!items.length) return [{ label: 'Certification entries', filled: false }]
      return items.flatMap((item, index) => [
        {
          label: itemLabel('Certification', index, 'title'),
          filled: filled(item.title),
          group: `Certification #${index + 1}`,
        },
        {
          label: itemLabel('Certification', index, 'document/image'),
          filled: filled(item.featuredImage) || filled(item.url),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Certification #${index + 1}`,
        },
      ])
    }
    case 'custom-tab': {
      const tab = data.customTabs?.find((entry) => entry.id === panel.tabId)
      const items = activeItems(tab?.items)
      if (!items.length) return [{ label: `${tab?.label || 'Custom tab'} content blocks`, filled: false }]
      return items.flatMap((item, index) => [
        {
          label: itemLabel(tab?.label || 'Custom', index, 'title'),
          filled: filled(item.title),
          group: `${tab?.label || 'Custom'} #${index + 1}`,
        },
        {
          label: itemLabel(tab?.label || 'Custom', index, 'description'),
          filled: filled(item.description),
          group: `${tab?.label || 'Custom'} #${index + 1}`,
        },
        {
          label: itemLabel(tab?.label || 'Custom', index, 'media'),
          filled: filled(item.mediaUrl) || Boolean(item.gallery?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `${tab?.label || 'Custom'} #${index + 1}`,
        },
      ])
    }
    case 'link-shortener':
      return [{ label: 'Website URL', filled: filled(p.website) }]
    case 'info':
      return [{ label: 'Read-only helper section', filled: true }]
    case 'empty':
    default:
      return []
  }
}

function personalPercent(data: VCardData, meta?: PersonalCompletionMeta): number {
  const subs = getPersonalSubCompletions(data, meta)
  if (subs.length === 0) return 0
  return Math.round(subs.reduce((sum, t) => sum + t.percent, 0) / subs.length)
}

function panelPercent(panel: EditorNavPanel, data: VCardData, meta?: PersonalCompletionMeta): number {
  const completionFields = getEditorPanelCompletionFields(panel, data, meta)
  if (completionFields.length) return fieldsPercent(completionFields)

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
