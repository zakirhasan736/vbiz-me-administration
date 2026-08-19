'use client'

import { Modal } from '@/components/ui/Modal'
import { getAboutMeDraft, isAboutMeDescriptionFilled } from '@/lib/aboutMeDraft'
import {
  applyAnalyzeToDraft,
  draftFieldWrites,
  mergeSectionPayload,
  type AnalyzeResponse,
} from '@/lib/ai/applyCardDraft'
import { cardAgentForm, cardAgentJobGet, cardAgentJobPost, cardAgentJson } from '@/lib/ai/cardAgentClient'
import { TAB_NAV_MAP } from '@/lib/ai/cardBlueprint'
import { gapFieldToSection, type GapItem } from '@/lib/ai/gapReport'
import {
  CREATE_CARD_TAB_BY_NAME,
  CREATE_CARD_TAB_BY_NAV_ID,
  getCreateCardDisplayLabel,
  normalizeNavOrderWithPinnedEnds,
  PINNED_END_NAV_IDS,
  resolveCreateCardTabName,
} from '@/lib/createCardTabs'
import { ensureNotificationPermission, saveNotificationPrefs } from '@/lib/notifications'
import { normalizeCardSeo, normalizeCardSeoPayload } from '@/lib/seo/cardSeo'
import { getDisplaySettingsFromVCard, getFieldConfig } from '@/lib/vcardDisplaySettings'
import type { SettingsTabId } from '@/lib/vcardEditorRoutes'
import type { VCardData } from '@/types/vcard'
import { cn } from '@/utils/cn'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileUp,
  Globe,
  GripVertical,
  Loader2,
  Paperclip,
  PartyPopper,
  Send,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ChatRole = 'assistant' | 'user' | 'system'
type Phase =
  | 'intake'
  | 'working'
  | 'plan'
  | 'field'
  | 'tabs'
  | 'section-gate'
  | 'coach'
  | 'features'
  | 'preview'
  | 'creating'
  | 'celebrate'
type LaunchMode = 'publish' | 'draft'

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  meta?: string
}

type RecommendedTab = { tab: string; navId: string; reason: string; priority?: string }

type OptionalFeatures = {
  aiAssistance?: boolean
  canva?: boolean
  seo?: boolean
  pushNotifications?: boolean
  emailNotifications?: boolean
}

type StoredSourceContext = {
  websiteUrl: string
  businessText: string
  files: File[]
  sessionId?: string
}

type PipelineStepStatus = 'pending' | 'active' | 'done' | 'skipped' | 'failed'
type PipelineStep = { id: string; label: string; status: PipelineStepStatus; detail?: string }

const JOB_STORAGE_KEY = 'vbiz-ai-card-job-id'

type CardPlanTab = {
  tabId: string
  name: string
  reason: string
  recommended: boolean
  selected: boolean
  percent: number
  ready: number
  empty: number
  mark: 'ready' | 'needs' | 'empty'
}

type JobField = {
  id: string
  tabId: string
  fieldKey: string
  fieldLabel: string
  required: boolean
  status: string
  source: string
  currentValue?: unknown
  aiGenerationAllowed: boolean
  prompt: string
  special?: string
}

type JobSnapshot = AnalyzeResponse & {
  jobId: string
  status: string
  userProgress?: PipelineStep[]
  cardPercent?: number
  cardPlan?: CardPlanTab[]
  nextField?: JobField | null
  field?: JobField
  selectedNavIds?: string[]
  addableTabs?: Array<{ navId: string; tab: string }>
  errorMessage?: string | null
  profileId?: string | null
  blueprint?: AnalyzeResponse['blueprint']
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

const WORKING_JOB_STATUSES = new Set(['QUEUED', 'EXTRACTING', 'ARCHITECTING', 'MAPPING_FIELDS', 'GENERATING'])

async function waitForCardAgentJob(
  snapshot: JobSnapshot,
  onProgress: (next: JobSnapshot) => void
): Promise<JobSnapshot> {
  if (!WORKING_JOB_STATUSES.has(snapshot.status)) return snapshot
  await sleep(1400)
  const next = await cardAgentJobGet<JobSnapshot>(snapshot.jobId)
  onProgress(next)
  return waitForCardAgentJob(next, onProgress)
}

const CARD_BUILD_PIPELINE: PipelineStep[] = [
  { id: 'website', label: 'Reading your website', status: 'pending' },
  { id: 'documents', label: 'Reading your documents', status: 'pending' },
  { id: 'understand', label: 'Understanding your business', status: 'pending' },
  { id: 'services', label: 'Finding your services', status: 'pending' },
  { id: 'build', label: 'Building your vBiz Me card', status: 'pending' },
  { id: 'write', label: 'Writing your content', status: 'pending' },
  { id: 'check', label: 'Checking your information', status: 'pending' },
]

function setStep(steps: PipelineStep[], id: string, status: PipelineStepStatus, detail?: string): PipelineStep[] {
  return steps.map((step) => (step.id === id ? { ...step, status, detail: detail ?? step.detail } : step))
}

type LaunchField = {
  label: string
  filled: boolean
  hint?: string
  upload?: boolean
}

type LaunchTab = {
  navId: string
  label: string
  percent: number
  fields: LaunchField[]
}

type AcceptedFeature = {
  key: keyof OptionalFeatures
  title: string
  settingsSection: SettingsTabId
  note: string
}

function labelFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const host = url.hostname.replace(/^www\./, '').split('.')[0] || ''
    return host
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(' ')
  } catch {
    return ''
  }
}

function cleanSourceNote(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 700)
}

function fallbackSeoFromDraft(data: VCardData) {
  const business = data.personal.company?.trim() || data.personal.fullName?.trim() || 'Professional'
  const role = data.personal.designation?.trim() || data.personal.profession?.trim()
  const title = `${business}${role ? ` | ${role}` : ''} | vBiz Me`
  const description =
    data.personal.about?.trim() ||
    `${business}${role ? ` provides ${role.toLowerCase()}` : ' helps clients'} with trusted services and contact information.`
  const serviceKeywords = (data.services || []).flatMap((service) => [service.title, service.type])
  return normalizeCardSeo({
    metaTitle: title,
    metaDescription: description,
    metaKeywords: [business, role, ...serviceKeywords],
  })
}

function featureSettingsLabel(feature: Pick<AcceptedFeature, 'key' | 'settingsSection'>): string {
  if (feature.key === 'aiAssistance') return 'Settings > AI Assistance'
  if (feature.key === 'canva') return 'Settings > Canva Integration'
  if (feature.key === 'seo') return 'Settings > SEO'
  if (feature.key === 'pushNotifications' || feature.key === 'emailNotifications') {
    return 'Settings > General notifications'
  }
  return `Settings > ${feature.settingsSection}`
}

type AiCardAgentWizardProps = {
  open: boolean
  onClose: () => void
  vCardData: VCardData
  updateData: (path: string, value: unknown) => void
  enabledNavIds: string[]
  onEnableNavIds: (ids: string[]) => void
  onOpenSettings?: (section: SettingsTabId) => void
  /** Persist/create the card after user confirms preview. Return new card id when navigation is deferred. */
  onCreateCard?: (options?: { publish?: boolean }) => Promise<string | void>
  onOpenLivePreview?: () => void
  /** Called after celebrate — e.g. navigate to the new card editor */
  onCreatedNavigate?: (cardId?: string) => void
  onFinish?: () => void
  /** Edit opens as a resume of the current card instead of a blank create session. */
  mode?: 'create' | 'edit'
}

const SECTION_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'personal', label: 'Personal / contact' },
  { id: 'services', label: 'Services' },
  { id: 'blogs', label: 'News / Blogs' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'faqs', label: 'FAQs' },
]

const OPTIONAL_ITEMS: Array<{
  key: keyof OptionalFeatures
  title: string
  description: string
  settingsSection: SettingsTabId
}> = [
  {
    key: 'aiAssistance',
    title: 'AI Assistance (Live Agent)',
    description: 'Train a guest-facing AI helper on this card.',
    settingsSection: 'ai-assistance',
  },
  {
    key: 'canva',
    title: 'Canva',
    description: 'Connect Canva for design assets on the card.',
    settingsSection: 'general',
  },
  {
    key: 'seo',
    title: 'SEO',
    description: 'Set SEO title, description, and share metadata.',
    settingsSection: 'seo',
  },
  {
    key: 'pushNotifications',
    title: 'Push notifications',
    description: 'Enable browser push for engagement.',
    settingsSection: 'general',
  },
  {
    key: 'emailNotifications',
    title: 'Email notifications',
    description: 'Configure email alerts for leads and activity.',
    settingsSection: 'general',
  },
]

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.05}s`,
        duration: `${1.4 + (i % 5) * 0.25}s`,
        color: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'][i % 6],
        rotate: (i * 47) % 360,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes ai-confetti-fall {
          0% { opacity: 1; transform: translate3d(0, -12px, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate3d(0, 440px, 0) rotate(720deg) scale(0.55); }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 h-2.5 w-2.5 rounded-sm"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animation: `ai-confetti-fall ${p.duration} ease-out ${p.delay} forwards`,
          }}
        />
      ))}
    </div>
  )
}

function uid() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function nextEmptyTabGaps(gaps: GapItem[], skippedIds: string[]): GapItem[] {
  const skipped = new Set(skippedIds)
  const remaining = gaps.filter((gap) => !skipped.has(gap.id))
  if (!remaining.length) return []
  const navId = remaining[0].navId
  return remaining.filter((gap) => gap.navId === navId)
}

function resolveRecommendedTab(raw: {
  tab?: string
  navId?: string
  reason?: string
  priority?: string
}): RecommendedTab | null {
  const def =
    (raw.navId && CREATE_CARD_TAB_BY_NAV_ID[raw.navId]) ||
    (raw.tab && CREATE_CARD_TAB_BY_NAME[raw.tab]) ||
    resolveCreateCardTabName(raw.tab || raw.navId || '') ||
    (raw.tab && CREATE_CARD_TAB_BY_NAV_ID[TAB_NAV_MAP[raw.tab]])
  if (!def || def.pinEnd || def.navId === 'home') return null
  return {
    tab: def.name,
    navId: def.navId,
    reason: raw.reason || `Add ${def.name} — ${def.description}`,
    priority: raw.priority || 'medium',
  }
}

function inferSectionFromText(text: string, fallback: string): string {
  const t = text.toLowerCase()
  if (/\b(faq|question|answer)\b/.test(t)) return 'faqs'
  if (/\b(blog|article|news|post)\b/.test(t)) return 'blogs'
  if (/\b(review|testimonial|client said)\b/.test(t)) return 'reviews'
  if (/\b(portfolio|project|case study|gallery)\b/.test(t)) return 'portfolio'
  if (/\b(service|offering|pricing|package)\b/.test(t)) return 'services'
  if (/\b(skill|expertise|proficien)\b/.test(t)) return 'skills'
  if (/\b(education|degree|university|school)\b/.test(t)) return 'education'
  if (/\b(experience|worked at|job|resume)\b/.test(t)) return 'experience'
  if (/\b(email|phone|whatsapp|linkedin|instagram|about me|my name)\b/.test(t)) return 'personal'
  return fallback
}

function sectionFromNavId(navId: string): string {
  const map: Record<string, string> = {
    home: 'personal',
    profile: 'personal',
    services: 'services',
    blog: 'blogs',
    gallery: 'portfolio',
    reviews: 'reviews',
    skills: 'skills',
    education: 'education',
    work: 'experience',
    faq: 'faqs',
  }
  return map[navId] || 'personal'
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? Boolean(value.trim()) : Boolean(value)
}

function countFilled(fields: LaunchField[]): number {
  return fields.filter((field) => field.filled).length
}

function launchPercent(fields: LaunchField[]): number {
  if (!fields.length) return 100
  return Math.round((countFilled(fields) / fields.length) * 100)
}

function displayCustom(data: VCardData, key: string): string {
  return getFieldConfig(getDisplaySettingsFromVCard(data), key).customValue?.trim() || ''
}

function getResumeState(data: VCardData): { summary: string; documents: unknown[] } {
  const block = (data as { sections?: Record<string, unknown> }).sections?.Resume as
    | {
        summary?: string
        body?: string
        documents?: unknown[]
        document?: unknown
        url?: string
      }
    | undefined
  const legacy = (data as { resume?: { url?: string; summary?: string } }).resume
  const documents = Array.isArray(block?.documents)
    ? block.documents
    : block?.document
      ? [block.document]
      : block?.url || legacy?.url
        ? [block?.url || legacy?.url]
        : []
  return {
    summary: String(block?.summary || block?.body || legacy?.summary || ''),
    documents,
  }
}

function hasCertificateDocument(data: VCardData): boolean {
  const posts = data.sectionPosts?.['Certifications/Licenses'] || []
  return posts.some((item) => {
    const documents = item.metas?.documents
    return hasText(item.featuredImage) || hasText(documents)
  })
}

function fieldHasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(fieldHasContent)
  if (value && typeof value === 'object') return Object.values(value).some(fieldHasContent)
  return hasText(value)
}

function payloadHasContent(section: string, payload: Record<string, unknown>): boolean {
  if (section === 'personal') return fieldHasContent(payload.personal) || fieldHasContent(payload.socialHandles)
  const value = payload[section === 'blogs' ? 'blogs' : section === 'faqs' ? 'faqs' : section]
  return Array.isArray(value) ? value.some(fieldHasContent) : fieldHasContent(value)
}

function sectionContentCount(data: VCardData, section: string): number {
  const personal = data.personal || ({} as VCardData['personal'])
  const aboutMeFilled = isAboutMeDescriptionFilled(getAboutMeDraft().descriptionHtml) || hasText(personal.about)
  if (section === 'personal') {
    return [
      personal.fullName,
      personal.email,
      personal.phone,
      personal.designation,
      personal.company,
      aboutMeFilled ? 'about' : '',
      personal.website,
      personal.address,
    ].filter(hasText).length
  }
  if (section === 'services') return data.services?.length || 0
  if (section === 'blogs') return data.generalPosts?.length || 0
  if (section === 'portfolio') return data.portfolio?.length || 0
  if (section === 'reviews') return data.reviews?.length || 0
  if (section === 'skills') return data.skills?.reduce((sum, group) => sum + (group.skills?.length || 0), 0) || 0
  if (section === 'education') return data.education?.length || 0
  if (section === 'experience') return data.experience?.length || 0
  if (section === 'faqs') return data.faqs?.length || 0
  return 0
}

function splitSkillHints(values: string[]): string[] {
  const seen = new Set<string>()
  const skills: string[] = []
  for (const raw of values) {
    for (const part of raw.split(/[,/|&]+/)) {
      const skill = part.trim().replace(/\s+/g, ' ')
      if (skill.length < 3 || seen.has(skill.toLowerCase())) continue
      seen.add(skill.toLowerCase())
      skills.push(skill)
      if (skills.length >= 8) return skills
    }
  }
  return skills
}

function buildSmartSectionPayload(
  section: string,
  data: VCardData,
  source?: StoredSourceContext
): Record<string, unknown> | null {
  const personal = data.personal || ({} as VCardData['personal'])
  const sourceWebsite = source?.websiteUrl?.trim() || personal.website?.trim() || ''
  const sourceNote = cleanSourceNote(source?.businessText || '')
  const company = personal.company?.trim() || personal.fullName?.trim() || labelFromUrl(sourceWebsite) || ''
  const role = personal.designation?.trim() || personal.profession?.trim() || ''
  const aboutDraft = getAboutMeDraft()
  const about =
    (isAboutMeDescriptionFilled(aboutDraft.descriptionHtml)
      ? aboutDraft.descriptionHtml
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .trim()
      : '') ||
    personal.about?.trim() ||
    ''
  const serviceTitles = (data.services || []).map((item) => item.title).filter(hasText)
  const serviceDescriptions = (data.services || []).map((item) => item.description).filter(hasText)
  const businessSummary =
    about ||
    sourceNote ||
    serviceDescriptions[0] ||
    (serviceTitles.length ? `Provides ${serviceTitles.join(', ')}.` : '')
  const inferredCompany = company || 'this business'

  if (section === 'personal' && (businessSummary || role || company || sourceWebsite)) {
    return {
      personal: {
        fullName: personal.fullName || company || labelFromUrl(sourceWebsite) || 'Business Profile',
        designation: personal.designation || role || 'Business Owner',
        company: personal.company || company || '',
        profession: personal.profession || role || '',
        about:
          personal.about ||
          about ||
          businessSummary ||
          `${inferredCompany} helps clients with tailored services and support.`,
        website: personal.website || sourceWebsite,
      },
      socialHandles: sourceWebsite ? { website: sourceWebsite } : {},
    }
  }

  if (section === 'experience') return null

  if (section === 'skills') {
    const skills = splitSkillHints([role, personal.profession || '', ...serviceTitles])
    if (skills.length) return { skills: [{ type: 'Core', skills }] }
  }

  if (section === 'services') return null

  if (section === 'portfolio') return null

  if (section === 'blogs') return null

  if (section === 'faqs' && (serviceTitles.length || personal.email || personal.phone || businessSummary)) {
    const serviceAnswer = serviceTitles.length
      ? `We offer ${serviceTitles.join(', ')}.`
      : businessSummary || 'Services are tailored to client needs.'
    const contactAnswer = [personal.email, personal.phone, personal.website].filter(hasText).join(' | ')
    return {
      faqs: [
        { question: 'What services are available?', answer: serviceAnswer },
        contactAnswer ? { question: 'How can clients get in touch?', answer: contactAnswer } : null,
      ].filter(Boolean),
    }
  }

  return null
}

function buildLaunchTabs(data: VCardData, navIds: string[]): LaunchTab[] {
  const uniqueIds = Array.from(new Set(navIds.length ? navIds : ['home']))
  return uniqueIds.map((navId) => {
    const label = getCreateCardDisplayLabel(navId, CREATE_CARD_TAB_BY_NAV_ID[navId]?.name || navId)
    const fields: LaunchField[] = []
    const personal = data.personal || ({} as VCardData['personal'])
    const socialCount = Object.values(data.social?.handles || {}).filter(hasText).length
    const profileMedia = displayCustom(data, 'Profile Image/Video')
    const backgroundMedia = displayCustom(data, 'Background Video/Image')
    const resumeState = getResumeState(data)

    if (navId === 'home') {
      fields.push(
        { label: 'Display name', filled: hasText(personal.fullName), hint: 'Shown at the top of the card.' },
        { label: 'Public URL slug', filled: hasText(data.slug), hint: 'Needed before create.' },
        { label: 'Email or phone', filled: hasText(personal.email) || hasText(personal.phone) },
        {
          label: 'About Me',
          filled: isAboutMeDescriptionFilled(getAboutMeDraft().descriptionHtml) || hasText(personal.about),
        },
        { label: 'Company or title', filled: hasText(personal.company) || hasText(personal.designation) },
        {
          label: 'Profile image/video',
          filled: hasText(profileMedia) || hasText(personal.explainerVideoUrl),
          hint: 'Optional upload or Canva asset.',
          upload: true,
        },
        {
          label: 'Background media',
          filled: hasText(backgroundMedia),
          hint: 'Optional upload or Canva asset.',
          upload: true,
        },
        { label: 'Social links', filled: socialCount > 0, hint: 'LinkedIn, Instagram, Facebook, or website.' }
      )
    } else if (navId === 'services') {
      fields.push(
        { label: 'Service items', filled: Boolean(data.services?.length) },
        { label: 'Service descriptions', filled: Boolean(data.services?.some((item) => hasText(item.description))) },
        {
          label: 'Service images',
          filled: Boolean(data.services?.some((item) => hasText(item.featuredImage))),
          upload: true,
        }
      )
    } else if (navId === 'gallery') {
      fields.push(
        { label: 'Portfolio items', filled: Boolean(data.portfolio?.length) },
        { label: 'Project descriptions', filled: Boolean(data.portfolio?.some((item) => hasText(item.description))) },
        {
          label: 'Portfolio images',
          filled: Boolean(data.portfolio?.some((item) => hasText(item.imageUrl))),
          upload: true,
        }
      )
    } else if (navId === 'reviews') {
      fields.push(
        { label: 'Reviews', filled: Boolean(data.reviews?.length) },
        { label: 'Reviewer names', filled: Boolean(data.reviews?.some((item) => hasText(item.author))) },
        { label: 'Review text', filled: Boolean(data.reviews?.some((item) => hasText(item.text))) }
      )
    } else if (navId === 'blog') {
      fields.push(
        { label: 'News/blog posts', filled: Boolean(data.generalPosts?.length) },
        { label: 'Post descriptions', filled: Boolean(data.generalPosts?.some((item) => hasText(item.description))) },
        {
          label: 'Featured images',
          filled: Boolean(data.generalPosts?.some((item) => hasText(item.featuredImage))),
          upload: true,
        }
      )
    } else if (navId === 'faq') {
      fields.push(
        { label: 'Questions', filled: Boolean(data.faqs?.some((item) => hasText(item.question))) },
        { label: 'Answers', filled: Boolean(data.faqs?.some((item) => hasText(item.answer))) }
      )
    } else if (navId === 'skills') {
      fields.push(
        { label: 'Skill groups', filled: Boolean(data.skills?.length) },
        { label: 'Skill tags', filled: Boolean(data.skills?.some((item) => item.skills?.length)) }
      )
    } else if (navId === 'education') {
      fields.push(
        { label: 'Education entries', filled: Boolean(data.education?.length) },
        { label: 'School names', filled: Boolean(data.education?.some((item) => hasText(item.institute))) },
        { label: 'Degree names', filled: Boolean(data.education?.some((item) => hasText(item.degree))) }
      )
    } else if (navId === 'work') {
      fields.push(
        { label: 'Experience entries', filled: Boolean(data.experience?.length) },
        { label: 'Company names', filled: Boolean(data.experience?.some((item) => hasText(item.company))) },
        { label: 'Job titles', filled: Boolean(data.experience?.some((item) => hasText(item.jobTitle))) }
      )
    } else if (navId === 'profile') {
      fields.push(
        { label: 'Headline/title', filled: hasText(personal.designation) || hasText(personal.profession) },
        {
          label: 'Profile photo',
          filled: hasText(profileMedia),
          hint: 'Optional upload or Canva asset.',
          upload: true,
        }
      )
    } else if (navId === 'resume') {
      fields.push(
        {
          label: 'Resume summary',
          filled:
            hasText(resumeState.summary) ||
            isAboutMeDescriptionFilled(getAboutMeDraft().descriptionHtml) ||
            hasText(personal.about),
        },
        {
          label: 'Resume document',
          filled: resumeState.documents.length > 0,
          hint: 'Optional upload after create.',
          upload: true,
        }
      )
    } else if (navId === 'certificates') {
      fields.push(
        { label: 'Certification entries', filled: Boolean(data.sectionPosts?.['Certifications/Licenses']?.length) },
        {
          label: 'Certificate document/image',
          filled: hasCertificateDocument(data),
          hint: 'Optional upload after create.',
          upload: true,
        }
      )
    } else if (navId === 'global-connection') {
      fields.push({ label: 'Global directory', filled: true, hint: 'Default shared connection area.' })
    } else if (navId === 'my-info') {
      fields.push(
        { label: 'Call action', filled: hasText(personal.phone) },
        { label: 'Email action', filled: hasText(personal.email) },
        { label: 'Website action', filled: hasText(personal.website) }
      )
    } else {
      fields.push({ label: `${label} content`, filled: false, hint: 'Optional custom section content.' })
    }

    const percent = launchPercent(fields)
    return { navId, label, percent, fields }
  })
}

function existingCardStatusMessage(data: VCardData, navIds: string[]): { overall: number; text: string } {
  const tabs = buildLaunchTabs(data, navIds)
  const overall = tabs.length ? Math.round(tabs.reduce((sum, tab) => sum + tab.percent, 0) / tabs.length) : 0
  const ready = tabs.filter((tab) => tab.percent === 100)
  const open = tabs.filter((tab) => tab.percent < 100)
  const readyLine = ready.length
    ? `Already ready: ${ready.map((tab) => tab.label).join(', ')}.`
    : 'Most tabs still need content.'
  const openLine = open.length
    ? `Still to finish: ${open.map((tab) => `${tab.label} (${tab.percent}%)`).join(', ')}.`
    : 'All current tabs look complete. You can still add a website or files to enrich the card.'
  return {
    overall,
    text: `This card is ${overall}% ready. I’ll pick up where you left off — not start from scratch.\n\n${readyLine}\n${openLine}\n\nAdd a website, documents, or notes if you have more source material, then tap Continue. Or continue with no new sources and I’ll resume the empty tabs with AI.`,
  }
}

export function AiCardAgentWizard({
  open,
  onClose,
  vCardData,
  updateData,
  enabledNavIds,
  onEnableNavIds,
  onOpenSettings,
  onCreateCard,
  onOpenLivePreview,
  onCreatedNavigate,
  onFinish,
  mode = 'create',
}: AiCardAgentWizardProps) {
  const isEdit = mode === 'edit'
  const [phase, setPhase] = useState<Phase>('intake')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [composer, setComposer] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [score, setScore] = useState(0)
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [activeNav, setActiveNav] = useState<string[]>(enabledNavIds)
  const [recommendations, setRecommendations] = useState<RecommendedTab[]>([])
  const [selectedRecs, setSelectedRecs] = useState<string[]>([])
  const [coachSection, setCoachSection] = useState('services')
  const [featureQueue, setFeatureQueue] = useState<typeof OPTIONAL_ITEMS>([])
  const [featureIndex, setFeatureIndex] = useState(0)
  const [acceptedFeatures, setAcceptedFeatures] = useState<SettingsTabId[]>([])
  const [acceptedFeatureDetails, setAcceptedFeatureDetails] = useState<AcceptedFeature[]>([])
  const [createProgress, setCreateProgress] = useState(0)
  const [createdCardId, setCreatedCardId] = useState<string | null>(null)
  const [launchMode, setLaunchMode] = useState<LaunchMode>('publish')
  const [createdLaunchMode, setCreatedLaunchMode] = useState<LaunchMode>('publish')
  const [gateGap, setGateGap] = useState<GapItem | null>(null)
  const [skippedGapIds, setSkippedGapIds] = useState<string[]>([])
  const [dragNavId, setDragNavId] = useState<string | null>(null)
  const [dragOverNavId, setDragOverNavId] = useState<string | null>(null)
  const [openLaunchTabs, setOpenLaunchTabs] = useState<string[]>([])
  const [activeFeatureGuideKey, setActiveFeatureGuideKey] = useState<keyof OptionalFeatures | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef(vCardData)
  const wasOpenRef = useRef(false)
  const skippedGapIdsRef = useRef<string[]>([])
  const sourceContextRef = useRef<StoredSourceContext>({ websiteUrl: '', businessText: '', files: [] })
  const sessionIdRef = useRef('')
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(CARD_BUILD_PIPELINE)
  const [recommendedAdds, setRecommendedAdds] = useState<string[]>([])
  const [cardPlan, setCardPlan] = useState<CardPlanTab[]>([])
  const [nextField, setNextField] = useState<JobField | null>(null)
  const [fieldDraft, setFieldDraft] = useState('')
  const [aiPreview, setAiPreview] = useState('')
  const [cardPercent, setCardPercent] = useState(0)

  useEffect(() => {
    draftRef.current = vCardData
  }, [vCardData])

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    // Bootstrap only when the popup newly opens — never mid-session on parent remounts
    if (wasOpenRef.current) return
    wasOpenRef.current = true
    setPhase('intake')
    const existingWebsite = vCardData.personal?.website?.trim() || ''
    const status = existingCardStatusMessage(vCardData, enabledNavIds)
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: isEdit
          ? status.text
          : `I’ll build your vBiz Me card with you, step by step:\n\n1. Read your website, files, or notes\n2. Suggest the right card tabs\n3. For each empty tab, ask “fill now?” — yes or skip\n4. Offer optional extras (live AI, Canva, SEO, notifications)\n5. Preview, then create\n\nAdd a website, files, or a short description, then tap Start.`,
      },
    ])
    setWebsiteUrl(existingWebsite)
    setComposer('')
    setFiles([])
    setError('')
    setScore(isEdit ? status.overall : 0)
    setGaps([])
    setRecommendations([])
    setSelectedRecs([])
    setFeatureQueue([])
    setFeatureIndex(0)
    setAcceptedFeatures([])
    setAcceptedFeatureDetails([])
    setCreateProgress(0)
    setCreatedCardId(null)
    setLaunchMode('publish')
    setCreatedLaunchMode('publish')
    setGateGap(null)
    setSkippedGapIds([])
    skippedGapIdsRef.current = []
    sourceContextRef.current = { websiteUrl: '', businessText: '', files: [] }
    sessionIdRef.current = ''
    setRecommendedAdds([])
    setPipelineSteps(CARD_BUILD_PIPELINE)
    setDragNavId(null)
    setDragOverNavId(null)
    setOpenLaunchTabs([])
    setActiveFeatureGuideKey(null)
    setActiveNav(enabledNavIds)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only when newly opened

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase, busy])

  useEffect(() => {
    if (phase !== 'working') return
    const aiIds = ['understand', 'services', 'build', 'write', 'check']
    let i = 0
    const timer = window.setInterval(() => {
      setPipelineSteps((prev) => {
        const extractionDone = prev
          .filter((s) => s.id === 'website' || s.id === 'documents')
          .every((s) => s.status !== 'pending' && s.status !== 'active')
        if (!extractionDone) return prev
        const current = aiIds[i % aiIds.length]
        i += 1
        return prev.map((step) => {
          if (step.id === 'website' || step.id === 'documents') return step
          if (step.id === current) return { ...step, status: 'active' }
          const idx = aiIds.indexOf(step.id)
          const curIdx = aiIds.indexOf(current)
          if (idx >= 0 && idx < curIdx) return { ...step, status: step.status === 'done' ? 'done' : 'done' }
          return step.status === 'active' ? { ...step, status: 'pending' } : step
        })
      })
    }, 2400)
    return () => window.clearInterval(timer)
  }, [phase])

  const pushMsg = useCallback((role: ChatRole, text: string, meta?: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, text, meta }])
  }, [])

  const applyDraft = useCallback(
    (data: VCardData, navIds: string[]) => {
      draftRef.current = data
      for (const write of draftFieldWrites(data)) {
        updateData(write.path, write.value)
      }
      const nextNav = normalizeNavOrderWithPinnedEnds(navIds)
      setActiveNav(nextNav)
      onEnableNavIds(nextNav)
    },
    [updateData, onEnableNavIds]
  )

  const refreshGaps = useCallback(async (navIds: string[], draft?: VCardData) => {
    const res = await fetch('/api/ai/card-agent/gap-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: draft || draftRef.current, enabledNavIds: navIds }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Gap report failed')
    setGaps(json.gaps || [])
    setScore(Number(json.score) || 0)
    if (json.nextBest?.field) {
      setCoachSection(gapFieldToSection(String(json.nextBest.field)))
    }
    return json as { score: number; gaps: GapItem[]; nextBest: GapItem | null }
  }, [])

  const hasStoredSources = useCallback(() => {
    const source = sourceContextRef.current
    return Boolean(source.sessionId || source.websiteUrl || source.businessText || source.files.length)
  }, [])

  const sourceSummaryLine = useCallback(() => {
    const source = sourceContextRef.current
    const bits = [
      source.websiteUrl ? 'website' : null,
      source.businessText ? 'business note' : null,
      source.files.length ? `${source.files.length} file${source.files.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    return bits.length ? bits.join(', ') : 'current card draft'
  }, [])

  const appendStoredSourcesToForm = useCallback((form: FormData, sectionLabel: string) => {
    const source = sourceContextRef.current
    if (source.sessionId) {
      form.set('sessionId', source.sessionId)
      form.set(
        'text',
        `The user approved filling "${sectionLabel}" from the saved business profile. Do not invent facts. If the profile does not support this section, return an empty array/object.`
      )
      return
    }
    if (source.websiteUrl) form.set('websiteUrl', source.websiteUrl)
    const textParts = [
      `The user approved filling "${sectionLabel}" from the earlier create-card sources. Prefer real extracted data. If the source does not support this section, return an empty array/object for that section instead of inventing specific facts.`,
      source.businessText ? `Original business note:\n${source.businessText}` : '',
    ].filter(Boolean)
    if (textParts.length) form.set('text', textParts.join('\n\n'))
    for (const file of source.files) form.append('files', file)
  }, [])

  const generateCardSeo = useCallback(async () => {
    const form = new FormData()
    form.set('section', 'seo')
    form.set('currentDraft', JSON.stringify(draftRef.current))
    appendStoredSourcesToForm(form, 'SEO metadata')
    const json = await cardAgentForm<{ payload?: Record<string, unknown> }>('fill-section', form)
    if (!json.payload || typeof json.payload.seo !== 'object' || json.payload.seo === null) {
      throw new Error('AI did not return SEO metadata')
    }
    return normalizeCardSeoPayload(json.payload.seo)
  }, [appendStoredSourcesToForm])

  const startFeaturesPhase = useCallback(
    (reportScore: number) => {
      const queue = [...OPTIONAL_ITEMS]
      setFeatureQueue(queue)
      setFeatureIndex(0)
      setGateGap(null)
      setPhase('features')
      const first = queue[0]
      pushMsg(
        'assistant',
        `Nice work — the tab pass is done (about ${reportScore}% complete). Content can still be polished in the editor.\n\nBefore preview, a few optional extras. None of these are required.\n\nFirst: ${first.title}. ${first.description}\n\nWant this on the card? Yes or skip.`
      )
    },
    [pushMsg]
  )

  const askNextGap = useCallback(
    (report: { score: number; gaps: GapItem[]; nextBest: GapItem | null }) => {
      const group = nextEmptyTabGaps(report.gaps, skippedGapIdsRef.current)
      if (!group.length) {
        startFeaturesPhase(report.score)
        return
      }

      const primary = group[0]
      const fieldNames = group.map((gap) => gap.title).join(', ')
      setCoachSection(gapFieldToSection(primary.field))
      setGateGap({
        ...primary,
        title: fieldNames,
        explanation: group.length > 1 ? `${primary.tab} still has empty fields: ${fieldNames}.` : primary.explanation,
      })
      setPhase('section-gate')
      const remainingTabs = new Set(
        report.gaps.filter((gap) => !skippedGapIdsRef.current.includes(gap.id)).map((gap) => gap.navId)
      ).size
      pushMsg(
        'assistant',
        `Let’s look at “${primary.tab}”. ${
          group.length > 1 ? `I still see empty fields: ${fieldNames}.` : `${primary.explanation}`
        }\n\nWant me to fill this now from your website and files? Tap Yes to fill, or Skip to leave it for the editor.`,
        `${remainingTabs} tab${remainingTabs === 1 ? '' : 's'} still open`
      )
    },
    [pushMsg, startFeaturesPhase]
  )

  const resumeExistingCard = async () => {
    setError('')
    setBusy(true)
    setPhase('working')
    pushMsg('user', 'Continue from the current card')
    pushMsg(
      'assistant',
      'Reviewing what is already on this card. Next I’ll resume the empty tabs — yes to fill with AI, or skip to leave them for the editor.'
    )
    try {
      const report = await refreshGaps(activeNav.length ? activeNav : enabledNavIds, draftRef.current)
      setPipelineSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: step.id === 'website' || step.id === 'documents' ? 'skipped' : 'done',
          detail:
            step.id === 'website' || step.id === 'documents' ? 'Using the card already in the editor.' : step.detail,
        }))
      )
      if (!report.gaps.length) {
        setPhase('preview')
        pushMsg(
          'assistant',
          `This card is about ${report.score}% complete and I don’t see empty content tabs. Confirm to save, or add a website/files to enrich it.`
        )
        return
      }
      askNextGap(report)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not read this card.'
      setError(msg)
      setPhase('intake')
      pushMsg('assistant', `I hit a problem: ${msg}. Add a website or documents, or try Continue again.`)
    } finally {
      setBusy(false)
    }
  }

  const runAnalyze = async (opts?: { text?: string; url?: string; files?: File[] }) => {
    const url = (opts?.url ?? websiteUrl).trim()
    const text = (opts?.text ?? composer).trim()
    const uploadFiles = opts?.files ?? files
    if (!url && !text && uploadFiles.length === 0) {
      if (isEdit) {
        await resumeExistingCard()
        return
      }
      setError('Add a website, business text, or documents first.')
      return
    }

    sourceContextRef.current = { websiteUrl: url, businessText: text, files: [...uploadFiles] }
    setError('')
    setBusy(true)
    setPhase('working')
    setPipelineSteps(
      CARD_BUILD_PIPELINE.map((step) => {
        if (step.id === 'website') {
          return { ...step, status: url ? 'active' : 'skipped', detail: url ? undefined : 'No website was provided.' }
        }
        if (step.id === 'documents') {
          return {
            ...step,
            status: uploadFiles.length ? 'active' : 'skipped',
            detail: uploadFiles.length ? undefined : 'No files were uploaded.',
          }
        }
        return { ...step, status: 'pending' }
      })
    )
    if (url || text || uploadFiles.length) {
      pushMsg(
        'user',
        [url && `Website: ${url}`, text, uploadFiles.length ? `Attached ${uploadFiles.length} file(s)` : '']
          .filter(Boolean)
          .join('\n')
      )
    }
    pushMsg(
      'assistant',
      'I’m reading your sources now. After that I’ll suggest the right tabs, then we’ll fill empty ones together — yes or skip, one tab at a time.'
    )

    try {
      const extractForm = new FormData()
      if (url) extractForm.set('websiteUrl', url)
      if (text) extractForm.set('businessText', text)
      for (const file of uploadFiles) extractForm.append('files', file)
      extractForm.set('existingCard', JSON.stringify(draftRef.current || {}))

      const initialJob = await cardAgentForm<JobSnapshot>('jobs', extractForm)
      if (initialJob.jobId) {
        sessionIdRef.current = initialJob.jobId
        sourceContextRef.current.sessionId = initialJob.jobId
        try {
          window.localStorage.setItem(JOB_STORAGE_KEY, initialJob.jobId)
        } catch {
          /* ignore */
        }
      }
      if (initialJob.userProgress?.length) {
        setPipelineSteps((prev) => {
          let next = prev
          for (const step of initialJob.userProgress || []) {
            next = setStep(next, step.id, step.status, step.detail)
          }
          return setStep(next, 'understand', 'active')
        })
      }
      const job = await waitForCardAgentJob(initialJob, (nextJob) => {
        if (nextJob.userProgress?.length) {
          setPipelineSteps((prev) => {
            let next = prev
            for (const step of nextJob.userProgress || []) {
              next = setStep(next, step.id, step.status, step.detail)
            }
            return next
          })
        }
      })
      if (job.status === 'FAILED') {
        throw new Error(job.errorMessage || 'Could not design your card.')
      }

      const json: AnalyzeResponse = {
        ...job,
        sessionId: job.jobId,
        blueprint: job.blueprint || job,
        enabledNavIds: job.selectedNavIds,
      } as AnalyzeResponse
      setPipelineSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: step.status === 'failed' ? 'failed' : step.status === 'skipped' ? 'skipped' : 'done',
        }))
      )
      const mapped = applyAnalyzeToDraft(json, draftRef.current)
      applyDraft(mapped.data, job.selectedNavIds || mapped.enabledNavIds)
      setCardPlan(job.cardPlan || [])
      setCardPercent(job.cardPercent || 0)
      setNextField(job.nextField || null)
      setFieldDraft('')
      setAiPreview('')

      if (typeof job.completion?.completionScore === 'number') {
        setScore(job.completion.completionScore)
      } else if (typeof job.cardPercent === 'number') {
        setScore(job.cardPercent)
      }
      setRecommendedAdds(job.completion?.recommended || [])

      const filledBits = [
        mapped.data.services?.length ? `${mapped.data.services.length} services` : null,
        mapped.data.portfolio?.length ? `${mapped.data.portfolio.length} portfolio pieces` : null,
        mapped.data.generalPosts?.length ? `${mapped.data.generalPosts.length} stories` : null,
        mapped.data.reviews?.length ? `${mapped.data.reviews.length} reviews` : null,
        mapped.data.faqs?.length ? `${mapped.data.faqs.length} FAQs` : null,
      ].filter(Boolean)

      const enabledLabels = mapped.enabledNavIds.map((id) => getCreateCardDisplayLabel(id, id)).join(' · ')
      const completeLine =
        typeof job.cardPercent === 'number'
          ? `Your vBiz Me card is ${job.cardPercent}% complete.`
          : typeof json.completion?.completionScore === 'number'
            ? `Your vBiz Me card is ${json.completion.completionScore}% complete.`
            : 'Your card plan is ready.'

      pushMsg(
        'assistant',
        `${completeLine} ${mapped.businessSummary || job.businessSummary || ''}\n\nI already drafted: ${filledBits.join(', ') || 'core personal details'}${enabledLabels ? `\nSuggested tabs: ${enabledLabels}` : ''}.\n\nNext I’ll show tab suggestions. Pick what belongs on this card — then I’ll ask about each empty tab.`
      )

      const recs: RecommendedTab[] = []
      const seenRecs = new Set<string>()
      const pushRec = (item: RecommendedTab | null) => {
        if (!item || seenRecs.has(item.navId)) return
        seenRecs.add(item.navId)
        recs.push(item)
      }
      for (const tab of job.cardPlan || []) {
        if (tab.tabId === 'home' || (PINNED_END_NAV_IDS as readonly string[]).includes(tab.tabId)) continue
        pushRec(
          resolveRecommendedTab({
            navId: tab.tabId,
            tab: tab.name,
            reason: tab.reason || (tab.recommended ? 'Fits this business' : 'Available for this card'),
            priority: tab.recommended ? 'high' : 'medium',
          })
        )
      }
      for (const raw of job.recommendedTabs || []) pushRec(resolveRecommendedTab(raw))
      try {
        const extra = await cardAgentJson<{
          recommendations?: Array<{ tab?: string; navId?: string; reason?: string; priority?: string }>
        }>('suggest-tabs', {
          businessSummary: mapped.businessSummary || job.businessSummary || '',
          enabledNavIds: job.selectedNavIds || mapped.enabledNavIds,
          sessionId: sessionIdRef.current,
        })
        for (const raw of extra.recommendations || []) pushRec(resolveRecommendedTab(raw))
      } catch {
        /* job recommendations are enough */
      }
      setRecommendations(recs)
      const preselected = (job.cardPlan || [])
        .filter(
          (tab) =>
            tab.selected && tab.tabId !== 'home' && !(PINNED_END_NAV_IDS as readonly string[]).includes(tab.tabId)
        )
        .map((tab) => tab.tabId)
      setSelectedRecs(preselected.length ? preselected : recs.map((item) => item.navId))
      if (!recs.length) {
        pushMsg('assistant', 'No extra tabs to suggest — I’ll collect the required owner details next.')
        await continueFieldFlow(job)
      } else {
        pushMsg(
          'assistant',
          `Here are the tabs I recommend for this business. Tick the ones you want, then continue.\n\nAfter that I’ll pause on each empty tab and ask: fill now, or skip?`
        )
        setPhase('tabs')
      }

      setComposer('')
      setFiles([])
      setWebsiteUrl('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI agent failed'
      setError(msg)
      pushMsg('assistant', `I hit a problem: ${msg}. You can retry with more details or another URL/document.`)
      setPhase('intake')
    } finally {
      setBusy(false)
    }
  }

  const ingestJob = useCallback(
    (job: JobSnapshot) => {
      setCardPlan(job.cardPlan || [])
      setCardPercent(job.cardPercent || 0)
      setNextField(job.nextField || null)
      if (typeof job.cardPercent === 'number') setScore(job.cardPercent)
      if (job.blueprint) {
        const mapped = applyAnalyzeToDraft(
          { blueprint: job.blueprint, sessionId: job.jobId, enabledNavIds: job.selectedNavIds } as AnalyzeResponse,
          draftRef.current
        )
        applyDraft(mapped.data, job.selectedNavIds || mapped.enabledNavIds)
      }
      if (job.selectedNavIds?.length) {
        const nextNav = normalizeNavOrderWithPinnedEnds(job.selectedNavIds)
        setActiveNav(nextNav)
        onEnableNavIds(nextNav)
      }
    },
    [applyDraft, onEnableNavIds]
  )

  const continueFieldFlow = async (job: JobSnapshot) => {
    ingestJob(job)
    if (job.nextField && !job.nextField.required) {
      const generated = sessionIdRef.current
        ? await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'fast-mode', { mode: 'ai' })
        : job
      ingestJob(generated)
      const report = await refreshGaps(generated.selectedNavIds || activeNav, draftRef.current)
      pushMsg(
        'assistant',
        'Thanks — I have the required owner details. I used your supplied context for optional copy where it was safe, and I’ll now review the selected sections with you.'
      )
      askNextGap(report)
      return
    }
    if (!job.nextField && job.status === 'WAITING_FOR_USER_INPUT' && sessionIdRef.current) {
      const assembled = await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'assemble', {})
      ingestJob(assembled)
      const report = await refreshGaps(assembled.selectedNavIds || activeNav, draftRef.current)
      askNextGap(report)
      return
    }
    if (job.status === 'READY' || (!job.nextField && job.status !== 'WAITING_FOR_USER_INPUT')) {
      const report = await refreshGaps(job.selectedNavIds || activeNav, draftRef.current)
      askNextGap(report)
      return
    }
    if (job.nextField) {
      setFieldDraft(typeof job.nextField.currentValue === 'string' ? job.nextField.currentValue : '')
      setAiPreview('')
      setPhase('field')
      const question =
        job.nextField.fieldKey === 'fullName'
          ? 'What name should appear publicly on the card?'
          : job.nextField.fieldKey === 'email'
            ? 'What email address should visitors use to contact the card owner?'
            : job.nextField.fieldKey === 'dob'
              ? "What is the card owner's date of birth? It is required to create the card and cannot be inferred or generated by AI. Please use YYYY-MM-DD."
              : job.nextField.fieldKey === 'company'
                ? 'What business or company name should appear on the card?'
                : job.nextField.prompt
      pushMsg('assistant', question)
      return
    }
    const report = await refreshGaps(job.selectedNavIds || activeNav, draftRef.current)
    askNextGap(report)
  }

  const runFastModeChoice = async (mode: 'ai' | 'found' | 'review') => {
    if (!sessionIdRef.current) return
    setBusy(true)
    try {
      if (mode === 'review') {
        pushMsg('user', 'Review everything')
        const job = await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'tabs', {
          selectedNavIds: ['home', ...selectedRecs],
        })
        await continueFieldFlow(job)
        return
      }
      pushMsg('user', mode === 'ai' ? 'Let AI handle what it can' : 'Use only what we found')
      await cardAgentJobPost(sessionIdRef.current, 'tabs', {
        selectedNavIds: ['home', ...selectedRecs],
      })
      const job = await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'fast-mode', { mode })
      await continueFieldFlow(job)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue')
    } finally {
      setBusy(false)
    }
  }

  const applyCurrentField = async (action: string, value?: unknown) => {
    if (!sessionIdRef.current || !nextField) return
    setBusy(true)
    try {
      const job = await cardAgentJobPost<JobSnapshot>(
        sessionIdRef.current,
        `fields/${encodeURIComponent(nextField.id)}`,
        { action, value: value ?? fieldDraft, instruction: fieldDraft }
      )
      if (action === 'AI_GENERATE' || action === 'IMPROVE_WITH_AI') {
        const generated = job.field?.currentValue
        setAiPreview(typeof generated === 'string' ? generated : JSON.stringify(generated, null, 2))
        ingestJob(job)
        setBusy(false)
        return
      }
      await continueFieldFlow(job)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that field')
    } finally {
      setBusy(false)
    }
  }

  const acceptTabs = async () => {
    const nextNav = normalizeNavOrderWithPinnedEnds(['home', ...selectedRecs])
    onEnableNavIds(nextNav)
    setActiveNav(nextNav)
    pushMsg(
      'user',
      selectedRecs.length
        ? `Use these tabs: ${selectedRecs.map((id) => getCreateCardDisplayLabel(id, id)).join(', ')}`
        : 'Keep the core tabs only'
    )
    setBusy(true)
    try {
      if (sessionIdRef.current) {
        const job = await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'tabs', { selectedNavIds: nextNav })
        pushMsg('assistant', `Locked in: ${nextNav.map((id) => getCreateCardDisplayLabel(id, id)).join(' → ')}.`)
        await continueFieldFlow(job)
        return
      }
      const report = await refreshGaps(nextNav)
      pushMsg(
        'assistant',
        `Locked in: ${nextNav.map((id) => getCreateCardDisplayLabel(id, id)).join(' → ')}.\n\nNow I’ll walk empty tabs one by one. For each, tell me yes (fill now) or skip.`
      )
      askNextGap(report)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh gaps')
    } finally {
      setBusy(false)
    }
  }

  const reorderNav = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return
    if (fromId === 'home' || (PINNED_END_NAV_IDS as readonly string[]).includes(fromId)) return
    if (toId === 'home' || (PINNED_END_NAV_IDS as readonly string[]).includes(toId)) return
    const pinned = new Set<string>(PINNED_END_NAV_IDS)
    const middle = activeNav.filter((id) => !pinned.has(id))
    const from = middle.indexOf(fromId)
    const to = middle.indexOf(toId)
    if (from < 0 || to < 0) return
    const nextMiddle = [...middle]
    const [item] = nextMiddle.splice(from, 1)
    nextMiddle.splice(to, 0, item)
    const next = normalizeNavOrderWithPinnedEnds(nextMiddle)
    setActiveNav(next)
    onEnableNavIds(next)
  }

  const removeTab = (navId: string) => {
    if (navId === 'home' || (PINNED_END_NAV_IDS as readonly string[]).includes(navId)) return
    const next = normalizeNavOrderWithPinnedEnds(activeNav.filter((id) => id !== navId))
    setActiveNav(next)
    onEnableNavIds(next)
    pushMsg('assistant', `Removed “${getCreateCardDisplayLabel(navId, navId)}” — easy to add again later.`)
  }

  const resolveSectionFillPayload = useCallback((section: string, rawPayload?: Record<string, unknown>) => {
    const payload = rawPayload || {}
    if (payloadHasContent(section, payload)) return { payload, usedFallback: false }

    const fallback = buildSmartSectionPayload(section, draftRef.current, sourceContextRef.current)
    if (fallback && payloadHasContent(section, fallback)) {
      return { payload: fallback, usedFallback: true }
    }

    return { payload, usedFallback: false }
  }, [])

  const refreshAfterDraftChange = useCallback(
    async (navIds: string[], draft: VCardData) => {
      try {
        return await refreshGaps(navIds, draft)
      } catch {
        const tabs = buildLaunchTabs(draft, navIds)
        const fallbackScore = tabs.length
          ? Math.round(tabs.reduce((sum, tab) => sum + tab.percent, 0) / tabs.length)
          : score
        setScore(fallbackScore)
        return { score: fallbackScore, gaps: [], nextBest: null }
      }
    },
    [refreshGaps, score]
  )

  const trySmartFallbackFill = useCallback(
    async (section: string, label: string, navIds: string[]) => {
      const fallback = buildSmartSectionPayload(section, draftRef.current, sourceContextRef.current)
      if (!fallback || !payloadHasContent(section, fallback)) return null

      const merged = mergeSectionPayload(draftRef.current, section, fallback)
      applyDraft(merged, navIds)
      const report = await refreshAfterDraftChange(navIds, merged)
      pushMsg(
        'assistant',
        `I drafted ${label} from the current card context because the saved sources did not contain direct ${label} data. Review the checklist again before launch.`
      )
      return report
    },
    [applyDraft, pushMsg, refreshAfterDraftChange]
  )

  const approveGateSection = async () => {
    if (!gateGap) return
    const gap = gateGap
    const section = gapFieldToSection(gap.field)
    pushMsg('user', `Yes — fill ${gap.tab} now`)
    setCoachSection(section)

    if (!hasStoredSources()) {
      setPhase('coach')
      pushMsg(
        'assistant',
        `I don’t have the original website/files in this session for “${gap.tab}”.\n\n${gap.howToProvide}\n\nPaste a note or attach a file and I’ll fill it.`
      )
      return
    }

    setBusy(true)
    pushMsg('assistant', `On it — filling “${gap.tab}” from your ${sourceSummaryLine()}…`)
    try {
      const form = new FormData()
      form.set('section', section)
      form.set('currentDraft', JSON.stringify(draftRef.current))
      appendStoredSourcesToForm(form, gap.tab)

      const json = await cardAgentForm<{ payload?: Record<string, unknown> }>('fill-section', form)
      const beforeCount = sectionContentCount(draftRef.current, section)
      const { payload, usedFallback } = resolveSectionFillPayload(section, json.payload)
      if (!payloadHasContent(section, payload)) {
        throw new Error('No reliable data found for this section yet.')
      }
      const merged = mergeSectionPayload(draftRef.current, section, payload)
      const afterCount = sectionContentCount(merged, section)
      applyDraft(merged, activeNav)
      setComposer('')
      setFiles([])
      const report = await refreshAfterDraftChange(activeNav, merged)
      pushMsg(
        'assistant',
        usedFallback
          ? `I drafted “${gap.tab}” from the rest of the card because the sources didn’t have a direct match. You’re at ${report.score}% — next tab coming up.`
          : afterCount > beforeCount
            ? `Filled “${gap.tab}”. Card is now ${report.score}% complete. Let’s check the next tab.`
            : `Updated “${gap.tab}”. Card is now ${report.score}% complete. Let’s check the next tab.`
      )
      setGateGap(null)
      askNextGap(report)
    } catch (e) {
      const report = await trySmartFallbackFill(section, gap.tab, activeNav)
      if (report) {
        setGateGap(null)
        askNextGap(report)
        return
      }
      const msg = e instanceof Error ? e.message : 'Could not auto-fill this section'
      setError(msg)
      setPhase('coach')
      pushMsg(
        'assistant',
        `I couldn’t auto-fill “${gap.tab}” from the saved sources: ${msg}.\n\n${gap.howToProvide}\n\nPaste details now, or skip this tab for later.`
      )
    } finally {
      setBusy(false)
    }
  }

  const skipGateSection = async () => {
    if (!gateGap) return
    const skippedTab = gateGap.tab
    const skippedNavId = gateGap.navId
    pushMsg('user', `Skip — ${skippedTab} for now`)
    const sameTabIds = gaps.filter((gap) => gap.navId === skippedNavId).map((gap) => gap.id)
    const nextSkipped = [...new Set([...skippedGapIdsRef.current, gateGap.id, ...sameTabIds])]
    skippedGapIdsRef.current = nextSkipped
    setSkippedGapIds(nextSkipped)
    setGateGap(null)
    setBusy(true)
    try {
      pushMsg(
        'assistant',
        `Okay — “${skippedTab}” stays on the card, and you can finish it in the editor. Checking the next tab…`
      )
      const report = await refreshGaps(activeNav)
      askNextGap(report)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue')
    } finally {
      setBusy(false)
    }
  }

  const fillFromComposer = async () => {
    const text = composer.trim()
    if (!text && files.length === 0) {
      setError('Type a reply or attach a file for me to fill the next section.')
      return
    }
    setError('')
    setBusy(true)
    const section = inferSectionFromText(text, coachSection)
    setCoachSection(section)
    pushMsg('user', text || `Attached ${files.length} file(s) for ${section}`)
    pushMsg(
      'assistant',
      `Shaping ${SECTION_OPTIONS.find((s) => s.id === section)?.label || section} from what you just shared…`
    )

    try {
      const form = new FormData()
      form.set('section', section)
      form.set('text', text)
      form.set('currentDraft', JSON.stringify(draftRef.current))
      if (sessionIdRef.current) form.set('sessionId', sessionIdRef.current)
      for (const file of files) form.append('files', file)

      const json = await cardAgentForm<{ payload?: Record<string, unknown> }>('fill-section', form)
      const beforeCount = sectionContentCount(draftRef.current, section)
      const { payload, usedFallback } = resolveSectionFillPayload(section, json.payload)
      if (!payloadHasContent(section, payload)) {
        throw new Error('No reliable data found for this section yet.')
      }
      const merged = mergeSectionPayload(draftRef.current, section, payload)
      const afterCount = sectionContentCount(merged, section)
      applyDraft(merged, activeNav)
      setComposer('')
      setFiles([])
      const report = await refreshAfterDraftChange(activeNav, merged)
      pushMsg(
        'assistant',
        usedFallback
          ? `I drafted ${section} from the current card context. Card is now ${report.score}% complete.`
          : afterCount > beforeCount
            ? `Added ${section} details. Card is now ${report.score}% complete.`
            : `Updated ${section}. Card is now ${report.score}% complete.`
      )
      askNextGap(report)
    } catch (e) {
      const label = SECTION_OPTIONS.find((s) => s.id === section)?.label || section
      const report = await trySmartFallbackFill(section, label, activeNav)
      if (report) {
        askNextGap(report)
        return
      }
      const msg = e instanceof Error ? e.message : 'Could not fill section'
      setError(msg)
      pushMsg('assistant', `That fill failed: ${msg}. Try again with clearer text or another file.`)
    } finally {
      setBusy(false)
    }
  }

  const answerFeature = async (yes: boolean) => {
    const item = featureQueue[featureIndex]
    if (!item || busy) return
    pushMsg('user', yes ? `Yes — enable ${item.title}` : `No — skip ${item.title}`)
    const nextAccepted = yes ? [...acceptedFeatures, item.settingsSection] : acceptedFeatures
    if (yes) {
      let note = ''
      if (item.key === 'aiAssistance') {
        updateData('aiAssistanceEnabled', true)
        note =
          'AI Assistance is turned on for this draft. After create, open Settings > AI Assistance to train it with business instructions, documents, and payment or lead-handling rules.'
      } else if (item.key === 'canva') {
        note =
          'Canva uses secure authorization from Settings > Canva Integration. Connect Canva there, create profile images, backgrounds, gallery assets, or intro media, then import or upload those assets into the empty media fields.'
      } else if (item.key === 'seo') {
        try {
          const generatedSeo = await generateCardSeo()
          draftRef.current = { ...draftRef.current, seo: generatedSeo }
          updateData('seo', generatedSeo)
          note =
            'AI generated a business-specific meta title, description, and keyword set. You can edit them in Settings > SEO.'
        } catch {
          const fallbackSeo = fallbackSeoFromDraft(draftRef.current)
          draftRef.current = { ...draftRef.current, seo: fallbackSeo }
          updateData('seo', fallbackSeo)
          note = 'SEO metadata was prepared from the card details. You can review or edit it in Settings > SEO.'
        }
      } else if (item.key === 'pushNotifications') {
        saveNotificationPrefs({ browserPush: true })
        const permission = await ensureNotificationPermission()
        note =
          permission === 'granted'
            ? 'Browser push notifications are enabled. You can fine tune categories from Settings > General notifications.'
            : permission === 'denied'
              ? 'Browser push is switched on in preferences, but the browser blocked permission. Re-enable it from browser site settings, then check Settings > General notifications.'
              : 'Browser push is switched on in preferences, but this browser does not support notification permission here. Check Settings > General notifications after create.'
      } else if (item.key === 'emailNotifications') {
        saveNotificationPrefs({ emailNotifications: true })
        note =
          'Email notifications are enabled in preferences. After create, review Settings > General notifications to choose which alerts should send email.'
      }
      setAcceptedFeatures(nextAccepted)
      pushMsg('assistant', note || `Noted. ${item.title} can be configured after the card is created.`)
      setAcceptedFeatureDetails((prev) => [
        ...prev,
        {
          key: item.key,
          title: item.title,
          settingsSection: item.settingsSection,
          note,
        },
      ])
      if (!note) {
        pushMsg(
          'assistant',
          item.key === 'canva'
            ? 'Noted. Canva will open through secure authorization from settings. After connecting, use Canva to create profile images, wallpapers, gallery assets, or intro media, then import/upload them into the empty media fields.'
            : `Noted. I’ll deep-link you into ${item.title} settings when we finish (or you can open it anytime from card settings).`
        )
      }
    } else {
      pushMsg('assistant', `Okay, skipping ${item.title}.`)
    }

    const nextIdx = featureIndex + 1
    if (nextIdx < featureQueue.length) {
      setFeatureIndex(nextIdx)
      const next = featureQueue[nextIdx]
      pushMsg('assistant', `Next: ${next.title}? ${next.description}\n\nYes to enable, or skip.`)
      return
    }

    const nextLaunchTabs = buildLaunchTabs(draftRef.current, activeNav)
    setOpenLaunchTabs(
      nextLaunchTabs
        .filter((tab) => tab.percent < 100)
        .slice(0, 4)
        .map((tab) => tab.navId)
    )
    setPhase('preview')
    const scoreLine = `You’re at about ${score}% content completeness.`
    pushMsg(
      'assistant',
      `${scoreLine} Preview your card below. When it looks right, confirm and I’ll create it for you (with a progress animation).`
    )
  }

  const showFeatureGuide = async (feature: AcceptedFeature) => {
    setActiveFeatureGuideKey(feature.key)

    if (feature.key === 'aiAssistance') {
      updateData('aiAssistanceEnabled', true)
    }

    if (feature.key === 'emailNotifications') {
      saveNotificationPrefs({ emailNotifications: true })
    }

    if (feature.key === 'pushNotifications') {
      saveNotificationPrefs({ browserPush: true })
      const permission = await ensureNotificationPermission()
      const note =
        permission === 'granted'
          ? 'Browser permission is granted. Push notifications are active for this browser.'
          : permission === 'denied'
            ? 'The browser denied push permission. Re-enable notifications from site settings, then return to General notifications.'
            : 'This browser cannot show the notification permission popup here. Check General notifications after create.'
      setAcceptedFeatureDetails((prev) =>
        prev.map((item) => (item.key === 'pushNotifications' ? { ...item, note } : item))
      )
      pushMsg('assistant', `Push notifications: ${note}`)
      return
    }

    pushMsg('assistant', `${feature.title}: ${feature.note}`)
  }

  const goToPreview = () => {
    const nextLaunchTabs = buildLaunchTabs(draftRef.current, activeNav)
    setOpenLaunchTabs(
      nextLaunchTabs
        .filter((tab) => tab.percent < 100)
        .slice(0, 4)
        .map((tab) => tab.navId)
    )
    setPhase('preview')
    pushMsg(
      'assistant',
      isEdit
        ? `Preview ready at ${score}%. Confirm to save these AI updates on the current card, or keep editing in chat.`
        : `Preview ready at ${score}%. Confirm to create the card, or keep editing in chat.`
    )
  }

  const finishAndOpenEditor = () => {
    onFinish?.()
    onCreatedNavigate?.(createdCardId || undefined)
    onClose()
  }

  const confirmCreateCard = async (modeChoice: LaunchMode = launchMode) => {
    if (!onCreateCard) {
      setError(
        isEdit
          ? 'Save is not available. Use Save now in the editor.'
          : 'Create action is not available. Use Create vCard in the editor.'
      )
      return
    }
    const publish = isEdit ? undefined : modeChoice === 'publish'
    setError('')
    setBusy(true)
    setPhase('creating')
    setCreateProgress(4)
    setCreatedLaunchMode(isEdit ? 'draft' : modeChoice)
    pushMsg(
      'user',
      isEdit
        ? 'Looks good — save these updates on my card'
        : publish
          ? 'Looks good - create and activate my card'
          : 'Looks good - save my card as a draft'
    )
    pushMsg(
      'assistant',
      isEdit
        ? 'Saving your card updates...'
        : publish
          ? 'Creating and activating your vCard...'
          : 'Saving your vCard draft...'
    )

    let tick: ReturnType<typeof setInterval> | undefined
    let createdId: string | undefined
    try {
      tick = setInterval(() => {
        setCreateProgress((p) => (p >= 88 ? p : p + Math.random() * 6 + 2))
      }, 160)
      if (!isEdit && sessionIdRef.current) {
        try {
          await cardAgentJobPost(sessionIdRef.current, 'assemble', {})
          const applied = await cardAgentJobPost<JobSnapshot>(sessionIdRef.current, 'apply', {
            publish: publish === true,
            seo: draftRef.current.seo,
          })
          if (applied.profileId) {
            createdId = applied.profileId
          }
        } catch {
          createdId = undefined
        }
      }
      if (!createdId) {
        createdId = (await onCreateCard(isEdit ? undefined : { publish: publish === true })) || undefined
      }
      if (tick) clearInterval(tick)
      setCreateProgress(100)
      setCreatedCardId(typeof createdId === 'string' ? createdId : null)
      setPhase('celebrate')
      pushMsg(
        'assistant',
        isEdit
          ? 'Saved. Your current card is updated. Close this or keep polishing in the editor.'
          : publish
            ? 'Done! Your card is created and active. Continue to the editor to polish anything optional.'
            : 'Done! Your card is saved as a draft. Continue to the editor when you are ready to activate it.'
      )
    } catch (e) {
      if (tick) clearInterval(tick)
      const msg = e instanceof Error ? e.message : 'Create failed'
      setError(msg)
      setPhase('preview')
      setCreateProgress(0)
      pushMsg('assistant', `Create failed: ${msg}. Fix the issue (name/slug) and try Confirm again.`)
    } finally {
      setBusy(false)
    }
  }

  const fillLaunchTab = async (tab: LaunchTab) => {
    const section = sectionFromNavId(tab.navId)
    const missingTextFields = tab.fields.filter((field) => !field.filled && !field.upload)
    setCoachSection(section)
    setError('')
    pushMsg('user', `Fill ${tab.label} before launch`)

    if (!missingTextFields.length) {
      pushMsg(
        'assistant',
        `${tab.label} only has media or document uploads left. AI cannot upload those files here; leave them for Canva or upload manually after create.`
      )
      setOpenLaunchTabs((prev) => prev.filter((id) => id !== tab.navId))
      return
    }

    if (!hasStoredSources()) {
      setPhase('coach')
      pushMsg(
        'assistant',
        `Send text or upload files for ${tab.label}. I will fill that tab, then bring you back to the launch checklist.`
      )
      return
    }

    setBusy(true)
    pushMsg('assistant', `Re-reading the earlier ${sourceSummaryLine()} for ${tab.label}...`)
    try {
      const form = new FormData()
      form.set('section', section)
      form.set('currentDraft', JSON.stringify(draftRef.current))
      appendStoredSourcesToForm(form, tab.label)

      const json = await cardAgentForm<{ payload?: Record<string, unknown> }>('fill-section', form)
      const beforeCount = sectionContentCount(draftRef.current, section)
      const { payload, usedFallback } = resolveSectionFillPayload(section, json.payload)
      if (!payloadHasContent(section, payload)) {
        throw new Error('No reliable data found for this tab yet.')
      }
      const merged = mergeSectionPayload(draftRef.current, section, payload)
      const afterCount = sectionContentCount(merged, section)
      applyDraft(merged, activeNav)
      const report = await refreshAfterDraftChange(activeNav, merged)
      setScore(report.score)
      setPhase('preview')
      setOpenLaunchTabs((prev) => (prev.includes(tab.navId) ? prev : [tab.navId, ...prev]))
      pushMsg(
        'assistant',
        usedFallback
          ? `I drafted ${tab.label} from the current card context because the saved sources did not include direct data for it. Review the checklist again before launch.`
          : afterCount > beforeCount
            ? `Added ${tab.label} details. Review the checklist again before launch.`
            : `Updated ${tab.label}. Review the checklist again before launch.`
      )
    } catch (e) {
      const report = await trySmartFallbackFill(section, tab.label, activeNav)
      if (report) {
        setScore(report.score)
        setPhase('preview')
        setOpenLaunchTabs((prev) => (prev.includes(tab.navId) ? prev : [tab.navId, ...prev]))
        return
      }
      const msg = e instanceof Error ? e.message : 'Could not fill tab'
      setError(msg)
      pushMsg('assistant', `I could not fill ${tab.label}: ${msg}. You can still create now or edit it manually later.`)
    } finally {
      setBusy(false)
    }
  }

  const handlePreviewReviewCommand = async (text: string): Promise<boolean> => {
    const normalized = text.toLowerCase()
    const existing = draftRef.current.reviews || []
    const numericOnly = /^\d{1,2}$/.test(normalized)
    if (!/review|testimonial/.test(normalized) && !(existing.length > 0 && numericOnly)) return false

    if (/\b(all|select all|keep all|use all)\b/.test(normalized)) {
      pushMsg('user', text)
      pushMsg('assistant', `Keeping all ${existing.length} reviews for launch.`)
      return true
    }

    const match =
      normalized.match(/\b(?:keep|select|use|show|top|first|only)\s+(\d{1,2})\b/) ||
      normalized.match(/^(\d{1,2})\s+(?:review|reviews|testimonial|testimonials)\b/) ||
      normalized.match(/^(\d{1,2})$/)
    if (!match) return false

    const count = Math.max(1, Math.min(30, Number(match[1]) || 1))
    if (!existing.length) return false

    const trimmed = { ...draftRef.current, reviews: existing.slice(0, count) }
    pushMsg('user', text)
    applyDraft(trimmed, activeNav)
    const report = await refreshAfterDraftChange(activeNav, trimmed)
    setScore(report.score)
    setOpenLaunchTabs((prev) => (prev.includes('reviews') ? prev : ['reviews', ...prev]))
    pushMsg(
      'assistant',
      `Done - keeping ${Math.min(count, existing.length)} of ${existing.length} reviews. The Reviews checklist is open so you can inspect it.`
    )
    return true
  }

  const handleSend = () => {
    if (busy) return
    if (phase === 'section-gate') {
      const t = composer.trim().toLowerCase()
      setComposer('')
      if (/^(n|no|skip|later|nah)/.test(t)) void skipGateSection()
      else void approveGateSection()
      return
    }
    if (phase === 'tabs') {
      void acceptTabs()
      return
    }
    if (phase === 'plan') {
      void runFastModeChoice('review')
      return
    }
    if (phase === 'field') {
      if (fieldDraft.trim()) void applyCurrentField('USER_INPUT')
      return
    }
    if (phase === 'intake' || (phase === 'working' && !score)) {
      void runAnalyze({ text: composer, url: websiteUrl, files })
      return
    }
    if (phase === 'coach') {
      void fillFromComposer()
      return
    }
    if (phase === 'features') {
      const t = composer.trim().toLowerCase()
      if (!t) return
      if (/^(y|yes|sure|ok|please|enable|yeah)/.test(t)) void answerFeature(true)
      else if (/^(n|no|skip|later|nah)/.test(t)) void answerFeature(false)
      else {
        pushMsg('user', composer.trim())
        pushMsg('assistant', 'Please reply yes or no for this feature, or use the buttons.')
        setComposer('')
      }
      setComposer('')
      return
    }
    if (phase === 'preview') {
      const t = composer.trim().toLowerCase()
      if (!t) return
      if (/^(y|yes|sure|ok|confirm|create|looks good|go)/.test(t)) {
        setComposer('')
        void confirmCreateCard()
        return
      }
      const raw = composer.trim()
      setComposer('')
      void handlePreviewReviewCommand(raw).then((handled) => {
        if (handled) return
        pushMsg('user', raw)
        pushMsg(
          'assistant',
          'Open live preview to review, tap a checklist tab for details, or tap Create now when you are ready. You can also keep filling gaps in the editor after create.'
        )
      })
      return
    }
  }
  const fileLabel = useMemo(() => {
    if (!files.length) return null
    return `${files.length} file${files.length === 1 ? '' : 's'} attached`
  }, [files])

  const personal = vCardData.personal || ({} as VCardData['personal'])
  const previewName = personal.fullName || 'Untitled card'
  const previewCompany = personal.company || personal.designation || ''
  const previewSlug = vCardData.slug || ''
  const launchTabs = useMemo(() => buildLaunchTabs(vCardData, activeNav), [vCardData, activeNav])
  const incompleteLaunchTabs = useMemo(() => launchTabs.filter((tab) => tab.percent < 100), [launchTabs])
  const launchEmptyFieldCount = useMemo(
    () => launchTabs.reduce((sum, tab) => sum + tab.fields.filter((field) => !field.filled).length, 0),
    [launchTabs]
  )
  const launchOverallPercent = launchTabs.length
    ? Math.round(launchTabs.reduce((sum, tab) => sum + tab.percent, 0) / launchTabs.length)
    : score
  const activeFeatureGuide = activeFeatureGuideKey
    ? acceptedFeatureDetails.find((feature) => feature.key === activeFeatureGuideKey) || null
    : null
  const headerPercent =
    phase === 'creating' || phase === 'celebrate'
      ? Math.min(100, Math.round(createProgress))
      : phase === 'preview'
        ? launchOverallPercent
        : score
  // X can close after an error or while reviewing. Only block it during the save request.
  const preventDismiss = phase === 'creating'

  const stepLabel =
    phase === 'intake'
      ? 'Share sources'
      : phase === 'working'
        ? 'Crafting draft'
        : phase === 'tabs' || phase === 'plan'
          ? 'Choose tabs'
          : phase === 'section-gate'
            ? 'Fill empty tabs'
            : phase === 'field' || phase === 'coach'
              ? 'Fill details'
              : phase === 'features'
                ? 'Extras'
                : phase === 'preview'
                  ? 'Preview'
                  : phase === 'creating'
                    ? 'Creating'
                    : phase === 'celebrate'
                      ? 'Ready'
                      : 'Creating'

  return (
    <Modal
      open={open}
      onClose={() => {
        if (preventDismiss) return
        onClose()
      }}
      preventClose={preventDismiss}
      closeOnOverlayClick={!preventDismiss && !busy}
      closeOnEscape={!preventDismiss}
      overlayClassName="items-start overflow-y-auto px-3 py-6 sm:items-center sm:p-6"
      className="relative flex max-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
    >
      {(phase === 'celebrate' || (phase === 'creating' && createProgress > 96)) && <ConfettiBurst />}
      <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-5 pt-5 pb-4 dark:border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-indigo-500/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 sm:h-11 sm:w-11">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Card Studio</h3>
              <p className="truncate text-xs font-semibold text-slate-400">
                {stepLabel} · {isEdit ? 'resume remaining work on this card' : 'guided create until your card is ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border border-emerald-200/80 bg-white/80 px-3 py-1.5 backdrop-blur sm:block dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                Complete
              </span>
              <span className="ml-2 text-sm font-black text-emerald-700 dark:text-emerald-300">{headerPercent}%</span>
            </div>
            <button
              type="button"
              disabled={preventDismiss}
              onClick={() => {
                if (preventDismiss) return
                onClose()
              }}
              title={preventDismiss ? 'Please wait while the card is created' : 'Close'}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{
            width: `${
              phase === 'creating' || phase === 'celebrate'
                ? Math.min(100, Math.round(createProgress))
                : Math.max(phase === 'preview' ? launchOverallPercent : score, phase === 'intake' ? 0 : 4)
            }%`,
          }}
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        {phase === 'working' && busy ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-[10px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-200">
              Building your card
            </p>
            <ol className="space-y-1.5">
              {pipelineSteps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-start gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-100"
                >
                  {step.status === 'active' ? (
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : step.status === 'done' ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : step.status === 'failed' ? (
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  ) : (
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-emerald-300 dark:border-emerald-700" />
                  )}
                  <span>
                    <span className={step.status === 'skipped' ? 'opacity-50' : ''}>{step.label}</span>
                    {step.detail ? (
                      <span className="mt-0.5 block text-[11px] font-medium opacity-70">{step.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {recommendedAdds.length && (phase === 'preview' || phase === 'tabs' || phase === 'coach') ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <p className="mb-1 font-black text-slate-800 dark:text-white">Your vBiz Me card is {score}% complete.</p>
            <ul className="list-disc space-y-1 pl-4">
              {recommendedAdds.slice(0, 5).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[92%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed font-semibold whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'
              )}
            >
              {m.text}
              {m.meta ? <p className="mt-1 text-[10px] font-bold opacity-60">{m.meta}</p> : null}
            </div>
          </div>
        ))}

        {busy ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Crafting…
          </div>
        ) : null}

        {phase === 'plan' ? (
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
            <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">Your recommended card</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">Your card is {cardPercent}% complete</p>
            <ul className="space-y-2">
              {cardPlan.map((tab) => (
                <li key={tab.tabId} className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tab.tabId === 'home' || selectedRecs.includes(tab.tabId) || tab.selected}
                      disabled={tab.tabId === 'home'}
                      onChange={() =>
                        setSelectedRecs((prev) =>
                          prev.includes(tab.tabId) ? prev.filter((id) => id !== tab.tabId) : [...prev, tab.tabId]
                        )
                      }
                    />
                    <span className="font-bold text-slate-800 dark:text-white">{tab.name}</span>
                  </label>
                  <span className="text-xs font-bold text-slate-500">
                    {tab.mark === 'ready' ? '✓ Ready' : tab.mark === 'needs' ? '● Needs information' : '○ Empty'} ·{' '}
                    {tab.percent}%
                  </span>
                </li>
              ))}
            </ul>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runFastModeChoice('review')}
                className="rounded-2xl border border-slate-200 py-3 text-xs font-black dark:border-white/15"
              >
                Review everything
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runFastModeChoice('ai')}
                className="rounded-2xl bg-slate-950 py-3 text-xs font-black text-white dark:bg-white dark:text-slate-950"
              >
                Let AI handle what it can
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runFastModeChoice('found')}
                className="rounded-2xl border border-slate-200 py-3 text-xs font-black dark:border-white/15"
              >
                Use only what we found
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'field' && nextField ? (
          <div className="space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-[10px] font-black tracking-[0.14em] text-emerald-700 uppercase">
              {getCreateCardDisplayLabel(nextField.tabId, nextField.tabId)}
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{nextField.fieldLabel}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{nextField.prompt}</p>
            {nextField.currentValue ? (
              <p className="rounded-2xl bg-white/80 p-3 text-xs font-medium text-slate-700 dark:bg-black/20 dark:text-slate-200">
                We found:{' '}
                {typeof nextField.currentValue === 'string'
                  ? nextField.currentValue
                  : JSON.stringify(nextField.currentValue)}
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500">We didn’t find this in your website or documents.</p>
            )}
            <textarea
              value={fieldDraft}
              onChange={(event) => setFieldDraft(event.target.value)}
              placeholder="Paste or type here…"
              className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950"
            />
            {aiPreview ? (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs dark:border-white/10">
                <p className="font-black">Suggested copy</p>
                <p className="whitespace-pre-wrap">{aiPreview}</p>
                <button
                  type="button"
                  onClick={() => void applyCurrentField('USER_INPUT', aiPreview)}
                  className="font-black text-emerald-700"
                >
                  Accept
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {nextField.aiGenerationAllowed ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyCurrentField('AI_GENERATE')}
                  className="rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white"
                >
                  Write with AI
                </button>
              ) : null}
              {nextField.status === 'PARTIAL' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyCurrentField('KEEP_THIS')}
                  className="rounded-full border px-3 py-2 text-[11px] font-black"
                >
                  Keep this
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy || !fieldDraft.trim()}
                onClick={() => void applyCurrentField('USER_INPUT')}
                className="rounded-full border px-3 py-2 text-[11px] font-black"
              >
                Save
              </button>
              {fieldDraft.trim() && nextField.aiGenerationAllowed ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyCurrentField('IMPROVE_WITH_AI', fieldDraft)}
                  className="rounded-full border px-3 py-2 text-[11px] font-black"
                >
                  Improve with AI
                </button>
              ) : null}
              {!nextField.required ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyCurrentField('SKIP')}
                  className="rounded-full border px-3 py-2 text-[11px] font-black"
                >
                  Skip
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {phase === 'tabs' && recommendations.length > 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm dark:border-white/10 dark:from-white/5 dark:to-transparent">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">Suggested card tabs</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                These fit this business. Tick what you want on the public card, then continue. I’ll ask about empty tabs
                next.
              </p>
            </div>
            {recommendations.map((rec) => {
              const checked = selectedRecs.includes(rec.navId)
              const Icon = CREATE_CARD_TAB_BY_NAV_ID[rec.navId]?.icon
              return (
                <button
                  key={`${rec.navId}-${rec.tab}`}
                  type="button"
                  onClick={() =>
                    setSelectedRecs((prev) => (checked ? prev.filter((id) => id !== rec.navId) : [...prev, rec.navId]))
                  }
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all',
                    checked
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/60'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      checked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10'
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900 dark:text-white">{rec.tab}</span>
                    <span className="text-xs font-semibold text-slate-500">{rec.reason}</span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-5 w-5 rounded-md border-2',
                      checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-white/20'
                    )}
                  />
                </button>
              )
            })}
            <button
              type="button"
              disabled={busy}
              onClick={() => void acceptTabs()}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-black tracking-wide text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-950"
            >
              Continue with selected tabs <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {(phase === 'tabs' || phase === 'section-gate' || phase === 'coach' || phase === 'features') &&
        activeNav.length > 0 ? (
          <div className="space-y-2 rounded-3xl border border-indigo-100/80 bg-linear-to-br from-indigo-50/90 to-white p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-transparent">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-indigo-600 uppercase dark:text-indigo-300">
                  Section order
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  Drag the handle to reorder · Global Connection & My Info stay last
                </p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {activeNav.map((id, index) => {
                const pinned = (PINNED_END_NAV_IDS as readonly string[]).includes(id)
                const locked = pinned || id === 'home'
                const emptyGap = gaps.find((g) => g.navId === id && !skippedGapIds.includes(g.id))
                const Icon = CREATE_CARD_TAB_BY_NAV_ID[id]?.icon
                const isDragging = dragNavId === id
                const isOver = dragOverNavId === id && dragNavId !== id
                return (
                  <li
                    key={id}
                    draggable={!locked}
                    onDragStart={(e) => {
                      if (locked) return
                      setDragNavId(id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', id)
                    }}
                    onDragOver={(e) => {
                      if (locked || !dragNavId) return
                      e.preventDefault()
                      setDragOverNavId(id)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const from = e.dataTransfer.getData('text/plain') || dragNavId
                      if (from) reorderNav(from, id)
                      setDragNavId(null)
                      setDragOverNavId(null)
                    }}
                    onDragEnd={() => {
                      setDragNavId(null)
                      setDragOverNavId(null)
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border bg-white/95 px-2.5 py-2 transition-all dark:bg-slate-900/80',
                      isDragging && 'opacity-50',
                      isOver && 'border-indigo-400 ring-2 ring-indigo-300/50',
                      !isOver && 'border-white/80 dark:border-white/10'
                    )}
                  >
                    {!locked ? (
                      <span
                        className="cursor-grab touch-none rounded-lg p-1 text-slate-400 active:cursor-grabbing"
                        title="Drag to reorder"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="w-6" />
                    )}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                      {Icon ? (
                        <Icon className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[10px] font-black">{index + 1}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                      {getCreateCardDisplayLabel(id, CREATE_CARD_TAB_BY_NAV_ID[id]?.name || id)}
                      {emptyGap ? (
                        <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          empty
                        </span>
                      ) : (
                        <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          ready
                        </span>
                      )}
                      {pinned ? <span className="ml-2 text-[10px] font-black text-indigo-500">pinned</span> : null}
                    </span>
                    {!locked ? (
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => removeTab(id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {phase === 'section-gate' && gateGap ? (
          <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-linear-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm dark:border-amber-500/25 dark:from-amber-500/15 dark:via-transparent dark:to-transparent">
            <p className="text-[10px] font-black tracking-[0.14em] text-amber-700 uppercase dark:text-amber-300">
              Empty tab · fill now?
            </p>
            <h4 className="mt-2 text-base font-black text-slate-950 dark:text-white">{gateGap.tab}</h4>
            <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">Want me to fill this now?</p>
            <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
              Empty: {gateGap.title}. {gateGap.explanation}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void approveGateSection()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20"
              >
                <Check className="h-3.5 w-3.5" /> Yes, fill now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void skipGateSection()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'coach' && gaps.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="mb-2 text-[10px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-300">
              Still empty ({gaps.length})
            </p>
            <ul className="max-h-28 space-y-1 overflow-y-auto">
              {gaps.slice(0, 6).map((g) => (
                <li key={g.id} className="text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                  • {g.title} — {g.howToProvide}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={coachSection}
                onChange={(e) => setCoachSection(e.target.value)}
                className="rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-[11px] font-bold dark:border-white/15 dark:bg-slate-900 dark:text-white"
              >
                {SECTION_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    Fill: {s.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  pushMsg('user', 'Skip remaining gaps for now')
                  startFeaturesPhase(score)
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Skip to features
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'features' && featureQueue[featureIndex] ? (
          <div className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm dark:border-indigo-500/25 dark:from-indigo-500/15 dark:via-transparent dark:to-transparent">
            <p className="text-[10px] font-black tracking-[0.14em] text-indigo-600 uppercase dark:text-indigo-300">
              Optional extra {featureIndex + 1} of {featureQueue.length}
            </p>
            <h4 className="mt-2 text-base font-black text-slate-950 dark:text-white">
              {featureQueue[featureIndex].title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
              {featureQueue[featureIndex].description} This is optional — skip if you do not need it yet.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void answerFeature(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"
              >
                <Check className="h-3.5 w-3.5" /> Yes, enable
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void answerFeature(false)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'preview' ? (
          <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-sm font-black text-white">
                {(previewName || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
                  Launch checklist
                </p>
                <h4 className="truncate text-base font-black text-slate-950 dark:text-white">{previewName}</h4>
                {previewCompany ? (
                  <p className="truncate text-xs font-semibold text-slate-500">{previewCompany}</p>
                ) : null}
                {previewSlug ? (
                  <p className="mt-1 truncate text-[11px] font-bold text-slate-400">/{previewSlug}</p>
                ) : (
                  <p className="mt-1 text-[11px] font-bold text-amber-600">
                    Set a public URL slug before {isEdit ? 'saving' : 'creating'}.
                  </p>
                )}
              </div>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                {launchOverallPercent}%
              </span>
            </div>

            {incompleteLaunchTabs.length ? (
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {launchOverallPercent}% ready with {launchEmptyFieldCount} empty field
                {launchEmptyFieldCount === 1 ? '' : 's'} across {incompleteLaunchTabs.length} tab
                {incompleteLaunchTabs.length === 1 ? '' : 's'}. Tap any tab to review, fill what AI can, skip, or{' '}
                {isEdit ? 'save now' : 'create now'} and finish inside the editor.
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                All selected content tabs are ready. Media upload fields can still be improved in the editor.
              </p>
            )}

            {!isEdit ? (
              <div className="rounded-2xl border border-white/80 bg-white/80 p-2 dark:border-white/10 dark:bg-slate-900/70">
                <p className="px-1 pb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Launch mode</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      mode: 'publish' as const,
                      title: 'Create & activate',
                      note: 'Live immediately and shown in Active cards.',
                    },
                    {
                      mode: 'draft' as const,
                      title: 'Save draft',
                      note: 'Shown in Draft cards until the user activates it.',
                    },
                  ].map((option) => {
                    const selected = launchMode === option.mode
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => setLaunchMode(option.mode)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-left transition-all',
                          selected
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-white/5'
                        )}
                      >
                        <span className="flex items-center gap-2 text-[11px] font-black">
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full border',
                              selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                            )}
                          >
                            {selected ? <Check className="h-2.5 w-2.5" /> : null}
                          </span>
                          {option.title}
                        </span>
                        <span className="mt-1 block pl-6 text-[10px] font-semibold opacity-75">{option.note}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {launchTabs.map((tab) => {
                const isOpen = openLaunchTabs.includes(tab.navId)
                const missingFields = tab.fields.filter((field) => !field.filled)
                const completedFields = tab.fields.filter((field) => field.filled)
                const visibleFields = [...missingFields, ...completedFields]
                const missingTextFields = missingFields.filter((field) => !field.upload)
                const missingCount = missingFields.length
                return (
                  <div
                    key={tab.navId}
                    className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenLaunchTabs((prev) =>
                          isOpen ? prev.filter((id) => id !== tab.navId) : [...prev, tab.navId]
                        )
                      }
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-black tabular-nums',
                          tab.percent >= 100
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        )}
                      >
                        {tab.percent}%
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                          {tab.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {missingCount ? `${missingCount} empty field${missingCount === 1 ? '' : 's'}` : 'Complete'}
                        </span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <span
                            className={cn(
                              'block h-full rounded-full transition-all',
                              tab.percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
                            )}
                            style={{ width: `${tab.percent}%` }}
                          />
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        {tab.percent >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                        <ChevronDown
                          className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')}
                        />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="space-y-2 border-t border-slate-100 px-3 py-3 dark:border-white/10">
                        {visibleFields.length ? (
                          <ul className="space-y-1.5">
                            {visibleFields.map((field) => (
                              <li key={`${tab.navId}-${field.label}`} className="flex items-start gap-2 text-[11px]">
                                <span
                                  className={cn(
                                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                                    field.filled ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                                  )}
                                >
                                  {field.filled ? (
                                    <Check className="h-2.5 w-2.5" />
                                  ) : field.upload ? (
                                    <FileUp className="h-2.5 w-2.5" />
                                  ) : null}
                                </span>
                                <span className="min-w-0 flex-1 font-semibold text-slate-600 dark:text-slate-300">
                                  <span className={field.filled ? 'text-slate-500 line-through' : ''}>
                                    {field.label}
                                  </span>
                                  {field.hint ? (
                                    <span className="block text-[10px] text-slate-400">{field.hint}</span>
                                  ) : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] font-semibold text-slate-500">
                            No required fields left for this tab.
                          </p>
                        )}
                        {tab.percent < 100 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {missingTextFields.length ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void fillLaunchTab(tab)}
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
                              >
                                Fill with AI
                              </button>
                            ) : (
                              <span className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                Upload or Canva asset can be added later
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenLaunchTabs((prev) => prev.filter((id) => id !== tab.navId))
                                pushMsg(
                                  'assistant',
                                  `${tab.label} is skipped for now. It will stay on the card, and you can finish those empty fields inside the editor.`
                                )
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                            >
                              Skip for editor
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {acceptedFeatureDetails.length ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <p className="text-[10px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  Approved extras
                </p>
                <ul className="mt-2 space-y-1.5">
                  {acceptedFeatureDetails.map((feature) => (
                    <li
                      key={`${feature.key}-${feature.title}`}
                      className="text-[11px] font-semibold text-emerald-900/80 dark:text-emerald-100"
                    >
                      <span className="font-black">{feature.title}:</span> {feature.note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeFeatureGuide ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{activeFeatureGuide.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-slate-300">
                      {activeFeatureGuide.note}
                    </p>
                    <p className="mt-2 text-[10px] font-black tracking-wide text-slate-400 uppercase">
                      Find it after create: {featureSettingsLabel(activeFeatureGuide)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {onOpenLivePreview ? (
                <button
                  type="button"
                  onClick={() => onOpenLivePreview()}
                  className="hidden items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm md:inline-flex dark:bg-slate-900 dark:text-white"
                >
                  <Eye className="h-3.5 w-3.5" /> Open live preview
                </button>
              ) : null}
              {acceptedFeatureDetails.map((feature, index) => (
                <button
                  key={`${feature.key}-${index}`}
                  type="button"
                  onClick={() => void showFeatureGuide(feature)}
                  className="rounded-xl bg-white/80 px-3 py-2 text-[11px] font-black text-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  {feature.key === 'pushNotifications'
                    ? 'Allow Push notifications'
                    : feature.key === 'canva'
                      ? 'Canva instructions'
                      : `Review ${feature.title}`}
                </button>
              ))}
              <button
                type="button"
                disabled={busy || !previewName.trim() || !previewSlug.trim()}
                onClick={() => void confirmCreateCard()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black text-white disabled:opacity-50"
              >
                {isEdit ? 'Save updates' : launchMode === 'publish' ? 'Create & activate' : 'Save draft'}{' '}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {openLaunchTabs.length < 0 && phase === 'preview' ? (
          <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-sm font-black text-white">
                {(previewName || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
                  Preview · your permission to {isEdit ? 'save' : 'create'}
                </p>
                <h4 className="truncate text-base font-black text-slate-950 dark:text-white">{previewName}</h4>
                {previewCompany ? (
                  <p className="truncate text-xs font-semibold text-slate-500">{previewCompany}</p>
                ) : null}
                {previewSlug ? (
                  <p className="mt-1 truncate text-[11px] font-bold text-slate-400">/{previewSlug}</p>
                ) : (
                  <p className="mt-1 text-[11px] font-bold text-amber-600">
                    Set a public URL slug in Personal before {isEdit ? 'saving' : 'creating'}.
                  </p>
                )}
              </div>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                {score}%
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Tabs:{' '}
              {activeNav
                .map((id) => getCreateCardDisplayLabel(id, CREATE_CARD_TAB_BY_NAV_ID[id]?.name || id))
                .join(' · ')}
            </p>
            {acceptedFeatures.length ? (
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Features to configure later: {acceptedFeatures.join(', ')}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {onOpenLivePreview ? (
                <button
                  type="button"
                  onClick={() => onOpenLivePreview()}
                  className="hidden items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm md:inline-flex dark:bg-slate-900 dark:text-white"
                >
                  <Eye className="h-3.5 w-3.5" /> Open live preview
                </button>
              ) : null}
              {acceptedFeatures.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => onOpenSettings?.(section)}
                  className="rounded-xl bg-white/80 px-3 py-2 text-[11px] font-black text-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  Open {section}
                </button>
              ))}
              <button
                type="button"
                disabled={busy || !previewName.trim() || !previewSlug.trim()}
                onClick={() => void confirmCreateCard()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black text-white disabled:opacity-50"
              >
                Confirm & create card <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'creating' ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm font-black">
                {isEdit
                  ? 'Saving your card updates...'
                  : createdLaunchMode === 'publish'
                    ? 'Creating and activating your card...'
                    : 'Saving your draft...'}
              </span>
              <span className="ml-auto text-sm font-black text-emerald-600">
                {Math.min(100, Math.round(createProgress))}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                style={{ width: `${Math.min(100, createProgress)}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              {isEdit
                ? 'Writing AI updates onto the card already in the editor.'
                : createdLaunchMode === 'publish'
                  ? 'Saving profile, tabs, and content, then making the public link live.'
                  : 'Saving profile, tabs, and content into the Draft area.'}
            </p>
          </div>
        ) : null}

        {phase === 'celebrate' ? (
          <div className="relative space-y-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 dark:border-emerald-500/25 dark:bg-emerald-500/15">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <PartyPopper className="h-6 w-6" />
              <span className="text-base font-black">
                {isEdit ? 'Updates saved!' : createdLaunchMode === 'publish' ? 'Card active!' : 'Draft saved!'}
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-900/80 dark:text-emerald-100/90">
              {isEdit
                ? `${previewName} is updated. Keep polishing optional uploads and settings in the editor.`
                : createdLaunchMode === 'publish'
                  ? `${previewName} is live now. Continue to the editor to polish optional uploads and settings.`
                  : `${previewName} is in Draft cards. Continue to the editor, then use Activate card when it is ready.`}
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-black tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                {createdLaunchMode === 'publish' ? 'Active card' : 'Draft card'} -{' '}
                {Math.min(100, Math.round(createProgress))}%
              </span>
            </div>
            <button
              type="button"
              onClick={finishAndOpenEditor}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"
            >
              {isEdit
                ? 'Back to editor'
                : createdLaunchMode === 'publish'
                  ? 'Open active card editor'
                  : 'Open draft editor'}{' '}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {phase !== 'creating' && phase !== 'celebrate' ? (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
          {phase === 'intake' ? (
            <div className="mb-2 space-y-2">
              {isEdit && launchTabs.length ? (
                <div className="space-y-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-[10px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                    Current card · {launchOverallPercent}% ready
                  </p>
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {launchTabs.map((tab) => (
                      <div
                        key={tab.navId}
                        className="flex items-center justify-between gap-2 text-[11px] font-semibold"
                      >
                        <span
                          className={
                            tab.percent === 100
                              ? 'text-emerald-800 dark:text-emerald-200'
                              : 'text-slate-600 dark:text-slate-300'
                          }
                        >
                          {tab.label}
                        </span>
                        <span className="text-slate-500 tabular-nums dark:text-slate-400">{tab.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase">Website</label>
              <div className="relative">
                <Globe className="pointer-events-none absolute top-3 left-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-xs font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                We read the live pages (About, Services, Contact). Photos of a website are not needed.
              </p>
            </div>
          ) : null}
          {fileLabel ? (
            <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Paperclip className="h-3 w-3" /> {fileLabel}
            </p>
          ) : phase === 'intake' ? (
            <p className="mb-1 text-[11px] font-medium text-slate-400">
              Attach PDFs, Word files, or photos. Text files are read directly; photos are read only when needed.
            </p>
          ) : null}
          <div className="flex items-end gap-2">
            <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              <FileUp className="h-4 w-4" />
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              rows={2}
              placeholder={
                phase === 'intake'
                  ? isEdit
                    ? 'Optional notes to resume with AI…'
                    : 'Business notes or instructions (optional)…'
                  : phase === 'tabs'
                    ? 'Tap Continue when your tabs look right…'
                    : phase === 'section-gate'
                      ? 'Type yes to fill, or skip…'
                      : phase === 'coach'
                        ? 'Paste details or attach a file for this tab…'
                        : phase === 'features'
                          ? 'yes / skip'
                          : phase === 'preview'
                            ? isEdit
                              ? 'Type “yes” to save updates…'
                              : 'Type “yes” to confirm create…'
                            : 'Message the assistant…'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleSend}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {phase === 'intake' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAnalyze()}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black text-white dark:bg-white dark:text-slate-950"
            >
              {isEdit ? (
                <>
                  Continue — resume remaining work <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Start — read sources, then build my card <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : null}
          {phase === 'coach' && score >= 90 ? (
            <button
              type="button"
              disabled={busy}
              onClick={goToPreview}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-black text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              {isEdit ? 'Ready — preview & save' : 'Ready — preview & create'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
