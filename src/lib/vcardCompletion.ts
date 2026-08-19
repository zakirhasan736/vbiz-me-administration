import { getAboutMeDraft, isAboutMeDescriptionFilled } from '@/lib/aboutMeDraft'
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
  filled: number
  total: number
}

export type CompletionScalarControl =
  'text' | 'email' | 'tel' | 'url' | 'textarea' | 'color' | 'slug' | 'date' | 'select' | 'tags' | 'rating'

export type CompletionListCollection =
  | 'education'
  | 'experience'
  | 'skills'
  | 'services'
  | 'portfolio'
  | 'reviews'
  | 'faqs'
  | 'generalPosts'
  | 'sectionPosts'
  | 'customTabItems'
  | 'certificates'

export type CompletionFieldEdit =
  | {
      type: 'scalar'
      path: string
      control: CompletionScalarControl
      options?: { value: string; label: string }[]
    }
  | {
      type: 'about-me-draft'
      field: 'title' | 'descriptionHtml' | 'featuredMediaUrl'
    }
  | {
      type: 'display-media'
      fieldKey: string
      accept: string
      attachmentType: string
      alsoUpdateMeta?: 'avatar'
      maxBytes?: number
      previewKind?: 'image' | 'video' | 'audio' | 'auto'
    }
  | {
      type: 'list-field'
      collection: CompletionListCollection
      itemId: string
      field: string
      control: CompletionScalarControl | 'media'
      postTypeName?: string
      tabId?: string
      accept?: string
    }
  | {
      type: 'seed-list'
      collection: CompletionListCollection
      postTypeName?: string
      tabId?: string
      label?: string
    }
  | { type: 'social-quick' }
  | { type: 'extra-row' }
  | {
      type: 'dual-scalar'
      paths: [string, string]
      labels: [string, string]
      controls?: [CompletionScalarControl, CompletionScalarControl]
      options?: [{ value: string; label: string }[], { value: string; label: string }[]]
    }
  | { type: 'content-gallery' }
  | { type: 'content-video' }
  | { type: 'resume-summary' }
  | { type: 'resume-document' }

export type VCardCompletionField = {
  id: string
  label: string
  filled: boolean
  hint?: string
  upload?: boolean
  group?: string
  edit?: CompletionFieldEdit
}

function displayCustom(data: VCardData, key: string) {
  return getFieldConfig(getDisplaySettingsFromVCard(data), key).customValue?.trim() || ''
}

function getPathValue(data: VCardData, path: string): string {
  const parts = path.split('.')
  let cur: unknown = data
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur == null ? '' : String(cur)
}

function previewText(value: string, max = 42): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function getCompletionFieldPreview(
  field: VCardCompletionField,
  data: VCardData,
  meta?: PersonalCompletionMeta
): string {
  if (!field.filled) return ''
  const edit = field.edit
  if (!edit) return 'Added'
  if (edit.type === 'scalar') return previewText(getPathValue(data, edit.path)) || 'Added'
  if (edit.type === 'dual-scalar') {
    const a = getPathValue(data, edit.paths[0]).trim()
    const b = getPathValue(data, edit.paths[1]).trim()
    return previewText([a, b].filter(Boolean).join(' · ')) || 'Added'
  }
  if (edit.type === 'display-media') {
    const value =
      displayCustom(data, edit.fieldKey) || (edit.alsoUpdateMeta === 'avatar' ? meta?.avatarImageUrl || '' : '')
    return filled(value) ? 'Uploaded' : ''
  }
  if (edit.type === 'list-field') {
    if (edit.control === 'media') return 'Uploaded'
    const raw = readPreviewListValue(data, edit)
    if (edit.control === 'rating' && raw) return `${raw}★`
    return previewText(raw) || 'Added'
  }
  if (edit.type === 'social-quick') return 'Links added'
  if (edit.type === 'extra-row') return 'Added'
  if (edit.type === 'about-me-draft') {
    const draft = getAboutMeDraft()
    if (edit.field === 'title') return previewText(draft.title) || 'Added'
    if (edit.field === 'descriptionHtml') {
      const text = draft.descriptionHtml
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return previewText(text) || 'Added'
    }
    return filled(draft.featuredMediaUrl) ? 'Uploaded' : ''
  }
  if (edit.type === 'resume-summary') return previewText(resumeSummary(data) || data.personal?.about || '') || 'Added'
  if (edit.type === 'resume-document') return 'Uploaded'
  if (edit.type === 'content-gallery' || edit.type === 'content-video') return 'Uploaded'
  if (edit.type === 'seed-list') return ''
  return 'Added'
}

function readPreviewListValue(data: VCardData, edit: Extract<CompletionFieldEdit, { type: 'list-field' }>): string {
  const find = <T extends { id: string }>(items: T[] | undefined) =>
    (items || []).find((item) => item.id === edit.itemId)
  const read = (item: unknown) => {
    if (!item || typeof item !== 'object') return ''
    const value = (item as Record<string, unknown>)[edit.field]
    if (Array.isArray(value)) return value.map(String).filter(Boolean).join(', ')
    return value == null ? '' : String(value)
  }
  switch (edit.collection) {
    case 'education':
      return read(find(data.education))
    case 'experience':
      return read(find(data.experience))
    case 'skills':
      return read(find(data.skills))
    case 'services':
      return read(find(data.services))
    case 'portfolio':
      return read(find(data.portfolio))
    case 'reviews':
      return read(find(data.reviews))
    case 'faqs':
      return read(find(data.faqs))
    case 'generalPosts':
      return read(find(data.generalPosts))
    case 'sectionPosts':
    case 'certificates':
      return read(find(data.sectionPosts?.[edit.postTypeName || '']))
    case 'customTabItems':
      return read(find(data.customTabs?.find((entry) => entry.id === edit.tabId)?.items))
    default:
      return ''
  }
}

export type CompletionStats = {
  fields: VCardCompletionField[]
  filled: number
  empty: number
  total: number
  percent: number
}

export function getEditorPanelCompletionStats(
  panel: EditorNavPanel,
  data: VCardData,
  meta?: PersonalCompletionMeta
): CompletionStats {
  const fields = getEditorPanelCompletionFields(panel, data, meta)
  const filledCount = fields.filter((field) => field.filled).length
  return {
    fields,
    filled: filledCount,
    empty: Math.max(0, fields.length - filledCount),
    total: fields.length,
    percent: fieldsPercent(fields),
  }
}
export function getPersonalSubCompletions(data: VCardData, meta?: PersonalCompletionMeta): PersonalSubCompletion[] {
  const names = ['Media & Profile', 'Personal Info', 'Social & Games', 'Home Media', 'Extra Fields'] as const
  return names.map((name, index) => {
    const stats = getEditorPanelCompletionStats({ kind: 'personal', subTab: index + 1 }, data, meta)
    return {
      id: index + 1,
      name,
      percent: stats.percent,
      filled: stats.filled,
      total: stats.total,
    }
  })
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

function sectionPostFields(
  data: VCardData,
  panel: Extract<EditorNavPanel, { kind: 'section-posts' }>
): VCardCompletionField[] {
  const schema = getSectionSchema(panel.schemaKey)
  if (!schema) return []
  const posts = activeItems(data.sectionPosts?.[schema.postTypeName])
  if (!posts.length) {
    return [
      {
        id: `sectionPosts.${schema.postTypeName}.seed`,
        label: `${schema.title} entries`,
        filled: false,
        group: schema.title,
        edit: {
          type: 'seed-list' as const,
          collection: 'sectionPosts' as const,
          postTypeName: schema.postTypeName,
          label: schema.title,
        },
      },
    ]
  }
  const fields = new Set(schema.fields)
  return posts.flatMap((post, index) => {
    const group = `${schema.title} #${index + 1}`
    const itemId = post.id
    const checks: VCardCompletionField[] = []
    if (fields.has('title')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.title`,
        label: itemLabel(schema.title, index, 'title'),
        filled: filled(post.title),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'title',
          control: 'text',
          postTypeName: schema.postTypeName,
        },
      })
    }
    if (fields.has('description')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.description`,
        label: itemLabel(schema.title, index, 'description'),
        filled: filled(post.description),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'description',
          control: 'textarea',
          postTypeName: schema.postTypeName,
        },
      })
    }
    if (fields.has('url')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.url`,
        label: itemLabel(schema.title, index, 'URL'),
        filled: filled(post.url),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'url',
          control: 'url',
          postTypeName: schema.postTypeName,
        },
      })
    }
    if (fields.has('featuredImage')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.featuredImage`,
        label: itemLabel(schema.title, index, 'featured media'),
        filled: filled(post.featuredImage),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'featuredImage',
          control: 'media',
          postTypeName: schema.postTypeName,
          accept: 'image/*,video/*',
        },
      })
    }
    if (fields.has('date')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.date`,
        label: itemLabel(schema.title, index, 'date'),
        filled: filled(post.date),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'date',
          control: 'date',
          postTypeName: schema.postTypeName,
        },
      })
    }
    if (fields.has('rating')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.rating`,
        label: itemLabel(schema.title, index, 'rating'),
        filled: filled(post.rating),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'rating',
          control: 'rating',
          postTypeName: schema.postTypeName,
        },
      })
    }
    if (fields.has('location')) {
      checks.push({
        id: `sectionPosts.${schema.postTypeName}.${itemId}.location`,
        label: itemLabel(schema.title, index, 'location'),
        filled: filled(post.location),
        group,
        edit: {
          type: 'list-field',
          collection: 'sectionPosts',
          itemId,
          field: 'location',
          control: 'text',
          postTypeName: schema.postTypeName,
        },
      })
    }
    return checks
  })
}

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

const RELATIONSHIP_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'In a relationship', label: 'In a relationship' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

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
        id: 'display.Profile Image/Video',
        label: 'Profile image/video',
        filled: filled(avatar),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
        edit: {
          type: 'display-media',
          fieldKey: 'Profile Image/Video',
          accept: 'image/*,video/*',
          attachmentType: 'Profile Image/Video',
          alsoUpdateMeta: 'avatar',
          maxBytes: 15 * 1024 * 1024,
          previewKind: 'auto',
        },
      },
      {
        id: 'display.Background Video/Image',
        label: 'Background media',
        filled: filled(background),
        hint: 'Upload, Gallery, or Canva asset.',
        upload: true,
        edit: {
          type: 'display-media',
          fieldKey: 'Background Video/Image',
          accept: 'image/*,video/*',
          attachmentType: 'Background Video/Image',
          maxBytes: 15 * 1024 * 1024,
          previewKind: 'auto',
        },
      },
      {
        id: 'slug',
        label: 'Public URL slug',
        filled: filled(data.slug),
        edit: { type: 'scalar', path: 'slug', control: 'slug' },
      },
    ],
    2: [
      {
        id: 'personal.fullName',
        label: 'Full name',
        filled: filled(p.fullName),
        edit: { type: 'scalar', path: 'personal.fullName', control: 'text' },
      },
      {
        id: 'personal.email',
        label: 'Email',
        filled: filled(p.email),
        edit: { type: 'scalar', path: 'personal.email', control: 'email' },
      },
      {
        id: 'personal.phone',
        label: 'Phone',
        filled: filled(p.phone),
        edit: { type: 'scalar', path: 'personal.phone', control: 'tel' },
      },
      {
        id: 'personal.headline',
        label: 'Headline/title',
        filled: filled(p.designation) || filled(p.profession),
        edit: {
          type: 'dual-scalar',
          paths: ['personal.designation', 'personal.profession'],
          labels: ['Headline/title', 'Profession'],
          controls: ['text', 'text'],
        },
      },
      {
        id: 'personal.company',
        label: 'Company',
        filled: filled(p.company),
        edit: { type: 'scalar', path: 'personal.company', control: 'text' },
      },
      {
        id: 'personal.address',
        label: 'Address/location',
        filled: filled(p.address),
        edit: { type: 'scalar', path: 'personal.address', control: 'text' },
      },
    ],
    3: [
      {
        id: 'social.at-least-one',
        label: 'At least one social/contact link',
        filled: socialCount > 0,
        edit: { type: 'social-quick' },
      },
      {
        id: 'social.website-or-custom',
        label: 'Website or custom social link',
        filled: filled(p.website) || Boolean(social?.customLinks?.some((link) => filled(link?.url))),
        edit: { type: 'social-quick' },
      },
      {
        id: 'social.two-or-more',
        label: 'Two or more connection links',
        filled: socialCount >= 2,
        edit: { type: 'social-quick' },
      },
    ],
    4: [
      {
        id: 'display.Intro vCard Video',
        label: 'Intro video',
        filled: filled(intro),
        hint: 'Upload, YouTube, or Canva asset.',
        upload: true,
        edit: {
          type: 'display-media',
          fieldKey: 'Intro vCard Video',
          accept: 'video/*',
          attachmentType: 'Intro vCard Video',
          maxBytes: 30 * 1024 * 1024,
          previewKind: 'video',
        },
      },
      {
        id: 'display.Background Music',
        label: 'Background music or media',
        filled: filled(bgMusic) || filled(background),
        edit: {
          type: 'display-media',
          fieldKey: 'Background Music',
          accept: 'audio/*,image/*,video/*',
          attachmentType: 'Background Music',
          maxBytes: 15 * 1024 * 1024,
          previewKind: 'auto',
        },
      },
      {
        id: 'theme.primaryColor',
        label: 'Brand color',
        filled: filled(data.theme?.primaryColor),
        edit: { type: 'scalar', path: 'theme.primaryColor', control: 'color' },
      },
    ],
    5: [
      {
        id: 'extraFields.row',
        label: 'Extra info row',
        filled: Boolean(data.extraFields?.some((field) => filled(field?.name) && filled(field?.value))),
        edit: { type: 'extra-row' },
      },
      {
        id: 'personal.relationship-or-gender',
        label: 'Relationship or gender detail',
        filled: filled(p.relationship) || filled(p.gender),
        edit: {
          type: 'dual-scalar',
          paths: ['personal.relationship', 'personal.gender'],
          labels: ['Relationship', 'Gender'],
          controls: ['select', 'select'],
          options: [RELATIONSHIP_OPTIONS, GENDER_OPTIONS],
        },
      },
      {
        id: 'personal.website-or-whatsapp',
        label: 'Website or WhatsApp',
        filled: filled(p.website) || filled(p.whatsapp),
        edit: {
          type: 'dual-scalar',
          paths: ['personal.website', 'personal.whatsapp'],
          labels: ['Website', 'WhatsApp'],
          controls: ['url', 'tel'],
        },
      },
    ],
  }

  switch (panel.kind) {
    case 'personal':
      return panel.subTab ? personalFields[panel.subTab] || [] : Object.values(personalFields).flat()
    case 'about-me': {
      const draft = getAboutMeDraft()
      return [
        {
          id: 'about-me.title',
          label: 'Title',
          filled: filled(draft.title),
          edit: { type: 'about-me-draft', field: 'title' },
        },
        {
          id: 'about-me.description',
          label: 'Description',
          filled: isAboutMeDescriptionFilled(draft.descriptionHtml),
          edit: { type: 'about-me-draft', field: 'descriptionHtml' },
        },
        {
          id: 'about-me.featuredMedia',
          label: 'Featured media',
          filled: filled(draft.featuredMediaUrl),
          upload: true,
          edit: { type: 'about-me-draft', field: 'featuredMediaUrl' },
        },
      ]
    }
    case 'education': {
      const items = data.education || []
      if (!items.length) {
        return [
          {
            id: 'education.seed',
            label: 'Education entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'education', label: 'Education' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `education.${item.id}.institute`,
          label: itemLabel('Education', index, 'school'),
          filled: filled(item.institute),
          group: `Education #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'education',
            itemId: item.id,
            field: 'institute',
            control: 'text',
          },
        },
        {
          id: `education.${item.id}.degree`,
          label: itemLabel('Education', index, 'degree'),
          filled: filled(item.degree),
          group: `Education #${index + 1}`,
          edit: { type: 'list-field', collection: 'education', itemId: item.id, field: 'degree', control: 'text' },
        },
        {
          id: `education.${item.id}.fromDate`,
          label: itemLabel('Education', index, 'start date'),
          filled: filled(item.fromDate),
          group: `Education #${index + 1}`,
          edit: { type: 'list-field', collection: 'education', itemId: item.id, field: 'fromDate', control: 'date' },
        },
      ])
    }
    case 'experience': {
      const items = data.experience || []
      if (!items.length) {
        return [
          {
            id: 'experience.seed',
            label: 'Experience entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'experience', label: 'Experience' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `experience.${item.id}.company`,
          label: itemLabel('Experience', index, 'company'),
          filled: filled(item.company),
          group: `Experience #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'experience',
            itemId: item.id,
            field: 'company',
            control: 'text',
          },
        },
        {
          id: `experience.${item.id}.jobTitle`,
          label: itemLabel('Experience', index, 'job title'),
          filled: filled(item.jobTitle),
          group: `Experience #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'experience',
            itemId: item.id,
            field: 'jobTitle',
            control: 'text',
          },
        },
        {
          id: `experience.${item.id}.description`,
          label: itemLabel('Experience', index, 'description'),
          filled: filled(item.description),
          group: `Experience #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'experience',
            itemId: item.id,
            field: 'description',
            control: 'textarea',
          },
        },
      ])
    }
    case 'skill': {
      const items = data.skills || []
      if (!items.length) {
        return [
          {
            id: 'skills.seed',
            label: 'Skill groups',
            filled: false,
            edit: { type: 'seed-list', collection: 'skills', label: 'Skill group' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `skills.${item.id}.type`,
          label: itemLabel('Skill', index, 'group name'),
          filled: filled(item.type),
          group: `Skill #${index + 1}`,
          edit: { type: 'list-field', collection: 'skills', itemId: item.id, field: 'type', control: 'text' },
        },
        {
          id: `skills.${item.id}.skills`,
          label: itemLabel('Skill', index, 'tags'),
          filled: Boolean(item.skills?.length),
          group: `Skill #${index + 1}`,
          edit: { type: 'list-field', collection: 'skills', itemId: item.id, field: 'skills', control: 'tags' },
        },
      ])
    }
    case 'services': {
      const items = activeItems(data.services)
      if (!items.length) {
        return [
          {
            id: 'services.seed',
            label: 'Service entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'services', label: 'Service' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `services.${item.id}.title`,
          label: itemLabel('Service', index, 'title'),
          filled: filled(item.title),
          group: `Service #${index + 1}`,
          edit: { type: 'list-field', collection: 'services', itemId: item.id, field: 'title', control: 'text' },
        },
        {
          id: `services.${item.id}.description`,
          label: itemLabel('Service', index, 'description'),
          filled: filled(item.description),
          group: `Service #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'services',
            itemId: item.id,
            field: 'description',
            control: 'textarea',
          },
        },
        {
          id: `services.${item.id}.featuredImage`,
          label: itemLabel('Service', index, 'image'),
          filled: filled(item.featuredImage),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Service #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'services',
            itemId: item.id,
            field: 'featuredImage',
            control: 'media',
            accept: 'image/*',
          },
        },
      ])
    }
    case 'portfolio': {
      const items = activeItems(data.portfolio)
      if (!items.length) {
        return [
          {
            id: 'portfolio.seed',
            label: 'Portfolio entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'portfolio', label: 'Portfolio' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `portfolio.${item.id}.title`,
          label: itemLabel('Portfolio', index, 'title'),
          filled: filled(item.title),
          group: `Portfolio #${index + 1}`,
          edit: { type: 'list-field', collection: 'portfolio', itemId: item.id, field: 'title', control: 'text' },
        },
        {
          id: `portfolio.${item.id}.description`,
          label: itemLabel('Portfolio', index, 'description'),
          filled: filled(item.description),
          group: `Portfolio #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'portfolio',
            itemId: item.id,
            field: 'description',
            control: 'textarea',
          },
        },
        {
          id: `portfolio.${item.id}.imageUrl`,
          label: itemLabel('Portfolio', index, 'image'),
          filled: filled(item.imageUrl),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Portfolio #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'portfolio',
            itemId: item.id,
            field: 'imageUrl',
            control: 'media',
            accept: 'image/*',
          },
        },
      ])
    }
    case 'reviews': {
      const items = data.reviews || []
      if (!items.length) {
        return [
          {
            id: 'reviews.seed',
            label: 'Review entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'reviews', label: 'Review' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `reviews.${item.id}.author`,
          label: itemLabel('Review', index, 'reviewer'),
          filled: filled(item.author),
          group: `Review #${index + 1}`,
          edit: { type: 'list-field', collection: 'reviews', itemId: item.id, field: 'author', control: 'text' },
        },
        {
          id: `reviews.${item.id}.text`,
          label: itemLabel('Review', index, 'text'),
          filled: filled(item.text),
          group: `Review #${index + 1}`,
          edit: { type: 'list-field', collection: 'reviews', itemId: item.id, field: 'text', control: 'textarea' },
        },
        {
          id: `reviews.${item.id}.rating`,
          label: itemLabel('Review', index, 'rating'),
          filled: Number(item.rating) > 0,
          group: `Review #${index + 1}`,
          edit: { type: 'list-field', collection: 'reviews', itemId: item.id, field: 'rating', control: 'rating' },
        },
      ])
    }
    case 'blog': {
      const items = activeItems(data.generalPosts)
      if (!items.length) {
        return [
          {
            id: 'generalPosts.seed',
            label: 'News/blog posts',
            filled: false,
            edit: { type: 'seed-list', collection: 'generalPosts', label: 'Post' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `generalPosts.${item.id}.title`,
          label: itemLabel('Post', index, 'title'),
          filled: filled(item.title),
          group: `Post #${index + 1}`,
          edit: { type: 'list-field', collection: 'generalPosts', itemId: item.id, field: 'title', control: 'text' },
        },
        {
          id: `generalPosts.${item.id}.description`,
          label: itemLabel('Post', index, 'description'),
          filled: filled(item.description),
          group: `Post #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'generalPosts',
            itemId: item.id,
            field: 'description',
            control: 'textarea',
          },
        },
        {
          id: `generalPosts.${item.id}.featuredImage`,
          label: itemLabel('Post', index, 'featured image'),
          filled: filled(item.featuredImage),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Post #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'generalPosts',
            itemId: item.id,
            field: 'featuredImage',
            control: 'media',
            accept: 'image/*',
          },
        },
      ])
    }
    case 'faq': {
      const items = activeItems(data.faqs)
      if (!items.length) {
        return [
          {
            id: 'faqs.seed',
            label: 'FAQ entries',
            filled: false,
            edit: { type: 'seed-list', collection: 'faqs', label: 'FAQ' },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `faqs.${item.id}.question`,
          label: itemLabel('FAQ', index, 'question'),
          filled: filled(item.question),
          group: `FAQ #${index + 1}`,
          edit: { type: 'list-field', collection: 'faqs', itemId: item.id, field: 'question', control: 'text' },
        },
        {
          id: `faqs.${item.id}.answer`,
          label: itemLabel('FAQ', index, 'answer'),
          filled: filled(item.answer),
          group: `FAQ #${index + 1}`,
          edit: { type: 'list-field', collection: 'faqs', itemId: item.id, field: 'answer', control: 'textarea' },
        },
      ])
    }
    case 'profile':
      return [
        {
          id: 'profile.headline',
          label: 'Headline/title',
          filled: filled(p.designation) || filled(p.profession),
          edit: {
            type: 'dual-scalar',
            paths: ['personal.designation', 'personal.profession'],
            labels: ['Headline/title', 'Profession'],
            controls: ['text', 'text'],
          },
        },
        {
          id: 'profile.photo',
          label: 'Profile photo',
          filled: filled(avatar),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          edit: {
            type: 'display-media',
            fieldKey: 'Profile Image/Video',
            accept: 'image/*,video/*',
            attachmentType: 'Profile Image/Video',
            alsoUpdateMeta: 'avatar',
            maxBytes: 15 * 1024 * 1024,
            previewKind: 'auto',
          },
        },
      ]
    case 'resume':
      return [
        {
          id: 'resume.summary',
          label: 'Resume summary',
          filled: filled(resumeSummary(data)) || filled(p.about),
          edit: { type: 'resume-summary' },
        },
        {
          id: 'resume.document',
          label: 'Resume document',
          filled: resumeDocuments(data).length > 0,
          hint: 'Upload a PDF/DOC after create, or attach a Canva/exported asset.',
          upload: true,
          edit: { type: 'resume-document' },
        },
      ]
    case 'content-media': {
      const cm = (data as { contentMedia?: { gallery?: unknown[]; videos?: unknown[] } }).contentMedia
      return [
        {
          id: 'contentMedia.gallery',
          label: 'Gallery media',
          filled: Boolean(cm?.gallery?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          edit: { type: 'content-gallery' },
        },
        {
          id: 'contentMedia.videos',
          label: 'Video media',
          filled: Boolean(cm?.videos?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          edit: { type: 'content-video' },
        },
      ]
    }
    case 'global-connection':
      return [{ id: 'global-connection', label: 'Shared global connection area', filled: true }]
    case 'my-info':
      return [
        {
          id: 'my-info.derived',
          label: 'Call, text, and email use Personal Info',
          filled: true,
          hint: 'Phone, WhatsApp, and email come from Personal Info. This tab is not filled separately.',
        },
      ]
    case 'info':
      return [
        {
          id: 'public-cards.fixed',
          label: 'Public Cards directory',
          filled: true,
          hint: 'Fixed product tab. No extra content is required.',
        },
      ]
    case 'section-posts':
      return sectionPostFields(data, panel)
    case 'certificates': {
      const postTypeName = PUBLIC_SECTION_NAMES.certificates
      const items = activeItems(data.sectionPosts?.[postTypeName])
      if (!items.length) {
        return [
          {
            id: 'certificates.seed',
            label: 'Certification entries',
            filled: false,
            edit: {
              type: 'seed-list',
              collection: 'certificates',
              postTypeName,
              label: 'Certification',
            },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `certificates.${item.id}.title`,
          label: itemLabel('Certification', index, 'title'),
          filled: filled(item.title),
          group: `Certification #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'certificates',
            itemId: item.id,
            field: 'title',
            control: 'text',
            postTypeName,
          },
        },
        {
          id: `certificates.${item.id}.media`,
          label: itemLabel('Certification', index, 'document/image'),
          filled: filled(item.featuredImage) || filled(item.url),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `Certification #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'certificates',
            itemId: item.id,
            field: 'featuredImage',
            control: 'media',
            postTypeName,
            accept: 'image/*,application/pdf',
          },
        },
      ])
    }
    case 'custom-tab': {
      const tab = data.customTabs?.find((entry) => entry.id === panel.tabId)
      const items = activeItems(tab?.items)
      if (!items.length) {
        return [
          {
            id: `customTab.${panel.tabId}.seed`,
            label: `${tab?.label || 'Custom tab'} content blocks`,
            filled: false,
            edit: {
              type: 'seed-list',
              collection: 'customTabItems',
              tabId: panel.tabId,
              label: tab?.label || 'Custom',
            },
          },
        ]
      }
      return items.flatMap((item, index) => [
        {
          id: `customTab.${panel.tabId}.${item.id}.title`,
          label: itemLabel(tab?.label || 'Custom', index, 'title'),
          filled: filled(item.title),
          group: `${tab?.label || 'Custom'} #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'customTabItems',
            itemId: item.id,
            field: 'title',
            control: 'text',
            tabId: panel.tabId,
          },
        },
        {
          id: `customTab.${panel.tabId}.${item.id}.description`,
          label: itemLabel(tab?.label || 'Custom', index, 'description'),
          filled: filled(item.description),
          group: `${tab?.label || 'Custom'} #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'customTabItems',
            itemId: item.id,
            field: 'description',
            control: 'textarea',
            tabId: panel.tabId,
          },
        },
        {
          id: `customTab.${panel.tabId}.${item.id}.media`,
          label: itemLabel(tab?.label || 'Custom', index, 'media'),
          filled: filled(item.mediaUrl) || Boolean(item.gallery?.length),
          hint: 'Upload, Gallery, or Canva asset.',
          upload: true,
          group: `${tab?.label || 'Custom'} #${index + 1}`,
          edit: {
            type: 'list-field',
            collection: 'customTabItems',
            itemId: item.id,
            field: 'mediaUrl',
            control: 'media',
            tabId: panel.tabId,
            accept: 'image/*,video/*',
          },
        },
      ])
    }
    case 'link-shortener':
      return [
        {
          id: 'link-shortener.website',
          label: 'Website URL',
          filled: filled(p.website),
          edit: { type: 'scalar', path: 'personal.website', control: 'url' },
        },
      ]
    case 'info':
      return [{ id: 'info.helper', label: 'Read-only helper section', filled: true }]
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
    case 'about-me': {
      const draft = getAboutMeDraft()
      const checks = [
        filled(draft.title),
        isAboutMeDescriptionFilled(draft.descriptionHtml),
        filled(draft.featuredMediaUrl),
      ]
      return pct(checks.filter(Boolean).length, checks.length)
    }
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
    case 'my-info':
      return 100
    case 'info':
      return 100
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
  const stats = getEditorPanelCompletionStats(panel, data, meta)
  if (stats.total > 0) return Math.max(0, Math.min(100, stats.percent))
  return Math.max(0, Math.min(100, panelPercent(panel, data, meta)))
}

export function getOverallCardCompletionPercent(
  items: Array<{ editorPanel?: EditorNavPanel }>,
  data: VCardData,
  meta?: PersonalCompletionMeta
): number {
  const counted = items.filter((item) => {
    const kind = item.editorPanel?.kind
    return kind !== 'my-info' && kind !== 'info' && kind !== 'global-connection'
  })
  if (counted.length === 0) return 0
  const total = counted.reduce((sum, item) => sum + getNavItemCompletionPercent(item.editorPanel, data, meta), 0)
  return Math.round(total / counted.length)
}
