'use client'

import { Modal } from '@/components/ui/Modal'
import {
  applyAnalyzeToDraft,
  draftFieldWrites,
  mergeSectionPayload,
  type AnalyzeResponse,
} from '@/lib/ai/applyCardDraft'
import { cardAgentForm, cardAgentJson } from '@/lib/ai/cardAgentClient'
import { TAB_NAV_MAP } from '@/lib/ai/cardBlueprint'
import { gapFieldToSection, type GapItem } from '@/lib/ai/gapReport'
import {
  CREATE_CARD_TAB_BY_NAME,
  CREATE_CARD_TAB_BY_NAV_ID,
  getCardTabCatalogForAi,
  getCreateCardDisplayLabel,
  normalizeNavOrderWithPinnedEnds,
  PINNED_END_NAV_IDS,
  resolveCreateCardTabName,
} from '@/lib/createCardTabs'
import { ensureNotificationPermission, saveNotificationPrefs } from '@/lib/notifications'
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
  'intake' | 'working' | 'tabs' | 'section-gate' | 'coach' | 'features' | 'preview' | 'creating' | 'celebrate'

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

type AiCardAgentWizardProps = {
  open: boolean
  onClose: () => void
  vCardData: VCardData
  updateData: (path: string, value: unknown) => void
  enabledNavIds: string[]
  onEnableNavIds: (ids: string[]) => void
  onOpenSettings?: (section: SettingsTabId) => void
  /** Persist/create the card after user confirms preview. Return new card id when navigation is deferred. */
  onCreateCard?: () => Promise<string | void>
  onOpenLivePreview?: () => void
  /** Called after celebrate — e.g. navigate to the new card editor */
  onCreatedNavigate?: (cardId?: string) => void
  onFinish?: () => void
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
  if (section === 'personal') {
    return [
      personal.fullName,
      personal.email,
      personal.phone,
      personal.designation,
      personal.company,
      personal.about,
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

function buildSmartSectionPayload(section: string, data: VCardData): Record<string, unknown> | null {
  const personal = data.personal || ({} as VCardData['personal'])
  const company = personal.company?.trim() || personal.fullName?.trim() || ''
  const role = personal.designation?.trim() || personal.profession?.trim() || ''
  const about = personal.about?.trim() || ''
  const serviceTitles = (data.services || []).map((item) => item.title).filter(hasText)
  const serviceDescriptions = (data.services || []).map((item) => item.description).filter(hasText)
  const businessSummary =
    about || serviceDescriptions[0] || (serviceTitles.length ? `Provides ${serviceTitles.join(', ')}.` : '')

  if (section === 'experience' && (company || role || businessSummary)) {
    return {
      experience: [
        {
          company: company || 'Current business',
          jobTitle: role || 'Business Owner',
          description: businessSummary || `Professional work connected to ${company || 'this business'}.`,
          fromDate: '',
          toDate: '',
          tillNow: true,
        },
      ],
    }
  }

  if (section === 'skills') {
    const skills = splitSkillHints([role, personal.profession || '', ...serviceTitles])
    if (skills.length) return { skills: [{ type: 'Core', skills }] }
  }

  if (section === 'services' && !data.services?.length && (role || businessSummary)) {
    return {
      services: [
        {
          title: role || `${company || 'Business'} Services`,
          description: businessSummary || 'Core services based on the business profile.',
          url: personal.website || '',
        },
      ],
    }
  }

  if (section === 'portfolio' && (serviceTitles.length || businessSummary)) {
    return {
      portfolio: [
        {
          title: serviceTitles[0] ? `${serviceTitles[0]} Work` : 'Featured Work',
          description: businessSummary || 'Representative work based on the current business profile.',
          url: personal.website || '',
        },
      ],
    }
  }

  if (section === 'blogs' && businessSummary) {
    return {
      blogs: [
        {
          title: `About ${company || personal.fullName || 'this business'}`,
          description: businessSummary,
          category: 'News',
        },
      ],
    }
  }

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
        { label: 'About / bio', filled: hasText(personal.about) },
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
        { label: 'Profile story', filled: hasText(personal.about) },
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
        { label: 'Resume summary', filled: hasText(resumeState.summary) || hasText(personal.about) },
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
}: AiCardAgentWizardProps) {
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
  const [gateGap, setGateGap] = useState<GapItem | null>(null)
  const [skippedGapIds, setSkippedGapIds] = useState<string[]>([])
  const [dragNavId, setDragNavId] = useState<string | null>(null)
  const [dragOverNavId, setDragOverNavId] = useState<string | null>(null)
  const [openLaunchTabs, setOpenLaunchTabs] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef(vCardData)
  const wasOpenRef = useRef(false)
  const skippedGapIdsRef = useRef<string[]>([])
  const sourceContextRef = useRef<StoredSourceContext>({ websiteUrl: '', businessText: '', files: [] })

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
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: `Welcome — I’ll craft your card with you, step by step.\n\n• Start with a website, docs, or a short business note\n• I’ll suggest only real card sections from your nav list\n• Approve each empty section to fill it, or skip for later\n• Drag tabs to set the perfect order (Global Connection & My Info stay last)\n\nSections I can work with:\n${getCardTabCatalogForAi()}`,
      },
    ])
    setWebsiteUrl('')
    setComposer('')
    setFiles([])
    setError('')
    setScore(0)
    setGaps([])
    setRecommendations([])
    setSelectedRecs([])
    setFeatureQueue([])
    setFeatureIndex(0)
    setAcceptedFeatures([])
    setAcceptedFeatureDetails([])
    setCreateProgress(0)
    setCreatedCardId(null)
    setGateGap(null)
    setSkippedGapIds([])
    skippedGapIdsRef.current = []
    sourceContextRef.current = { websiteUrl: '', businessText: '', files: [] }
    setDragNavId(null)
    setDragOverNavId(null)
    setOpenLaunchTabs([])
    setActiveNav(enabledNavIds)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only when newly opened

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase, busy])

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
    return Boolean(source.websiteUrl || source.businessText || source.files.length)
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
    if (source.websiteUrl) form.set('websiteUrl', source.websiteUrl)
    const textParts = [
      `The user approved filling "${sectionLabel}" from the earlier create-card sources. Prefer real extracted data. If the source does not support this section, return an empty array/object for that section instead of inventing specific facts.`,
      source.businessText ? `Original business note:\n${source.businessText}` : '',
    ].filter(Boolean)
    if (textParts.length) form.set('text', textParts.join('\n\n'))
    for (const file of source.files) form.append('files', file)
  }, [])

  const askNextGap = useCallback(
    (report: { score: number; gaps: GapItem[]; nextBest: GapItem | null }) => {
      const skipped = new Set(skippedGapIdsRef.current)
      const next =
        report.gaps.find((g) => !skipped.has(g.id)) ||
        (report.nextBest && !skipped.has(report.nextBest.id) ? report.nextBest : null)

      if (!next || report.score >= 95) {
        pushMsg(
          'assistant',
          `Looking sharp — you’re at ${report.score}%. Next up: optional extras (live assistant, Canva, SEO, alerts). A quick yes or no for each.`
        )
        const queue = [...OPTIONAL_ITEMS]
        setFeatureQueue(queue)
        setFeatureIndex(0)
        setGateGap(null)
        setPhase('features')
        if (queue[0]) {
          pushMsg('assistant', `Enable ${queue[0].title}? ${queue[0].description}`)
        }
        return
      }

      setCoachSection(gapFieldToSection(next.field))
      setGateGap(next)
      setPhase('section-gate')
      pushMsg(
        'assistant',
        `“${next.tab}” still needs attention — ${next.title}.\n\nApprove to fill it now, or Skip to leave it for the editor later.`,
        `${report.gaps.filter((g) => !skipped.has(g.id)).length} open`
      )
    },
    [pushMsg]
  )

  const runAnalyze = async (opts?: { text?: string; url?: string; files?: File[] }) => {
    const url = (opts?.url ?? websiteUrl).trim()
    const text = (opts?.text ?? composer).trim()
    const uploadFiles = opts?.files ?? files
    if (!url && !text && uploadFiles.length === 0) {
      setError('Add a website, business text, or documents first.')
      return
    }

    sourceContextRef.current = { websiteUrl: url, businessText: text, files: [...uploadFiles] }
    setError('')
    setBusy(true)
    setPhase('working')
    if (url || text || uploadFiles.length) {
      pushMsg(
        'user',
        [url && `Website: ${url}`, text, uploadFiles.length ? `Attached ${uploadFiles.length} file(s)` : '']
          .filter(Boolean)
          .join('\n')
      )
    }
    pushMsg('assistant', 'Reading your sources and shaping a first draft…')

    try {
      const form = new FormData()
      if (url) form.set('websiteUrl', url)
      if (text) form.set('businessText', text)
      for (const file of uploadFiles) form.append('files', file)

      pushMsg('assistant', 'Crafting Personal, Services, Portfolio, Stories, FAQs, and Reviews from what you shared…')
      const json = await cardAgentForm<AnalyzeResponse>('analyze', form)
      const mapped = applyAnalyzeToDraft(json, draftRef.current)
      applyDraft(mapped.data, mapped.enabledNavIds)

      const filledBits = [
        mapped.data.services?.length ? `${mapped.data.services.length} services` : null,
        mapped.data.portfolio?.length ? `${mapped.data.portfolio.length} portfolio pieces` : null,
        mapped.data.generalPosts?.length ? `${mapped.data.generalPosts.length} stories` : null,
        mapped.data.reviews?.length ? `${mapped.data.reviews.length} reviews` : null,
        mapped.data.faqs?.length ? `${mapped.data.faqs.length} FAQs` : null,
      ].filter(Boolean)

      const enabledLabels = mapped.enabledNavIds.map((id) => getCreateCardDisplayLabel(id, id)).join(' · ')

      pushMsg(
        'assistant',
        `${mapped.businessSummary || 'First draft is ready.'}\n\nFilled: ${filledBits.join(', ') || 'core personal details'}.\nSections on: ${enabledLabels}.`
      )

      if ((mapped.data.reviews || []).length >= 4) {
        pushMsg(
          'assistant',
          `I found ${mapped.data.reviews?.length || 0} reviews and added them all for now. The final checklist will show the Reviews tab so you can keep everything or trim it before launch.`
        )
      }

      const suggestJson = await cardAgentJson<{ recommendations?: RecommendedTab[] }>('suggest-tabs', {
        businessSummary: mapped.businessSummary,
        enabledNavIds: mapped.enabledNavIds,
        draftSummary: `${mapped.data.personal.fullName} — ${mapped.data.personal.company}`,
      })
      const enabledSet = new Set(mapped.enabledNavIds)
      const recs: RecommendedTab[] = []
      const seen = new Set<string>()
      for (const raw of suggestJson.recommendations || mapped.recommendedTabs || []) {
        const resolved = resolveRecommendedTab(raw)
        if (!resolved || enabledSet.has(resolved.navId) || seen.has(resolved.navId)) continue
        seen.add(resolved.navId)
        recs.push(resolved)
      }
      setRecommendations(recs)
      setSelectedRecs(recs.filter((r) => r.priority === 'high').map((r) => r.navId))

      const report = await refreshGaps(mapped.enabledNavIds, mapped.data)

      if (recs.length) {
        pushMsg(
          'assistant',
          `From your card nav list, these sections look like a great fit: ${recs.map((r) => r.tab).join(', ')}. Select what you want, then continue — or keep the current set.`
        )
        setPhase('tabs')
      } else {
        askNextGap(report)
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

  const acceptTabs = async () => {
    const nextNav = normalizeNavOrderWithPinnedEnds([...activeNav, ...selectedRecs])
    onEnableNavIds(nextNav)
    setActiveNav(nextNav)
    pushMsg(
      'user',
      selectedRecs.length
        ? `Add sections: ${selectedRecs.map((id) => getCreateCardDisplayLabel(id, id)).join(', ')}`
        : 'Keep current sections'
    )
    setBusy(true)
    try {
      const report = await refreshGaps(nextNav)
      pushMsg(
        'assistant',
        `Sections locked in (${nextNav.map((id) => getCreateCardDisplayLabel(id, id)).join(' → ')}). Completeness ${report.score}%. Drag to reorder anytime — Global Connection and My Info stay last.`
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

    const fallback = buildSmartSectionPayload(section, draftRef.current)
    if (fallback && payloadHasContent(section, fallback)) {
      return { payload: fallback, usedFallback: true }
    }

    return { payload, usedFallback: false }
  }, [])

  const approveGateSection = async () => {
    if (!gateGap) return
    const gap = gateGap
    const section = gapFieldToSection(gap.field)
    pushMsg('user', `Approve - fill ${gap.tab}`)
    setCoachSection(section)

    if (!hasStoredSources()) {
      setPhase('coach')
      pushMsg(
        'assistant',
        `${gap.explanation}\n\n${gap.howToProvide}\n\nShare text, a link note, or attach a PDF/DOCX/image - I will fill "${gap.tab}" for you.`
      )
      return
    }

    setBusy(true)
    pushMsg('assistant', `Reading the earlier ${sourceSummaryLine()} again for ${gap.tab}...`)
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
      const report = await refreshGaps(activeNav, merged)
      pushMsg(
        'assistant',
        usedFallback
          ? `I drafted ${gap.tab} from the current card context because the saved sources did not contain a direct ${gap.tab} section. Card is now ${report.score}% complete.`
          : afterCount > beforeCount
            ? `Filled ${gap.tab} from the saved sources. Card is now ${report.score}% complete.`
            : `Updated ${gap.tab} from the saved sources. Card is now ${report.score}% complete.`
      )
      setGateGap(null)
      askNextGap(report)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not auto-fill this section'
      setError(msg)
      setPhase('coach')
      pushMsg(
        'assistant',
        `I could not auto-fill ${gap.tab} from the earlier sources: ${msg}.\n\n${gap.howToProvide}\n\nYou can paste details now or skip this section for later.`
      )
    } finally {
      setBusy(false)
    }
    if (hasStoredSources()) return
    pushMsg('user', `Approve — fill ${gateGap.tab}`)
    setCoachSection(gapFieldToSection(gateGap.field))
    setPhase('coach')
    pushMsg(
      'assistant',
      `${gateGap.explanation}\n\n${gateGap.howToProvide}\n\nShare text, a link note, or attach a PDF/DOCX/image — I’ll fill “${gateGap.tab}” for you.`
    )
  }

  const skipGateSection = async () => {
    if (!gateGap) return
    pushMsg('user', `Skip — ${gateGap.tab} for now`)
    const nextSkipped = [...skippedGapIdsRef.current, gateGap.id]
    skippedGapIdsRef.current = nextSkipped
    setSkippedGapIds(nextSkipped)
    setGateGap(null)
    setBusy(true)
    try {
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
    pushMsg('assistant', `Shaping ${SECTION_OPTIONS.find((s) => s.id === section)?.label || section}…`)

    try {
      const form = new FormData()
      form.set('section', section)
      form.set('text', text)
      form.set('currentDraft', JSON.stringify(draftRef.current))
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
      const report = await refreshGaps(activeNav, merged)
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
        note =
          'SEO can be polished from Settings > SEO after create. Use the card name, location, services, reviews, and a short meta description.'
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
      pushMsg('assistant', `Next: do you want ${next.title}? ${next.description} Reply yes or no.`)
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

  const goToPreview = () => {
    const nextLaunchTabs = buildLaunchTabs(draftRef.current, activeNav)
    setOpenLaunchTabs(
      nextLaunchTabs
        .filter((tab) => tab.percent < 100)
        .slice(0, 4)
        .map((tab) => tab.navId)
    )
    setPhase('preview')
    pushMsg('assistant', `Preview ready at ${score}%. Confirm to create the card, or keep editing in chat.`)
  }

  const finishAndOpenEditor = () => {
    onFinish?.()
    onCreatedNavigate?.(createdCardId || undefined)
    onClose()
  }

  const confirmCreateCard = async () => {
    if (!onCreateCard) {
      setError('Create action is not available. Use Create vCard in the editor.')
      return
    }
    setError('')
    setBusy(true)
    setPhase('creating')
    setCreateProgress(4)
    pushMsg('user', 'Looks good — create my card')
    pushMsg('assistant', 'Creating your vCard…')

    let tick: ReturnType<typeof setInterval> | undefined
    let createdId: string | void
    try {
      tick = setInterval(() => {
        setCreateProgress((p) => (p >= 88 ? p : p + Math.random() * 6 + 2))
      }, 160)
      createdId = await onCreateCard()
      if (tick) clearInterval(tick)
      setCreateProgress(100)
      setCreatedCardId(typeof createdId === 'string' ? createdId : null)
      setPhase('celebrate')
      pushMsg(
        'assistant',
        'Boom! Your card is created. Review the celebration, then continue to the editor — your draft is ready to polish.'
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
      const report = await refreshGaps(activeNav, merged)
      setScore(report.score)
      setPhase('preview')
      pushMsg(
        'assistant',
        usedFallback
          ? `I drafted ${tab.label} from the current card context because the saved sources did not include direct data for it. Review the checklist again before launch.`
          : afterCount > beforeCount
            ? `Added ${tab.label} details. Review the checklist again before launch.`
            : `Updated ${tab.label}. Review the checklist again before launch.`
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not fill tab'
      setError(msg)
      pushMsg('assistant', `I could not fill ${tab.label}: ${msg}. You can still create now or edit it manually later.`)
    } finally {
      setBusy(false)
    }
  }

  const handleSend = () => {
    if (busy) return
    if (phase === 'section-gate') {
      void approveGateSection()
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
      pushMsg('user', composer.trim())
      pushMsg(
        'assistant',
        'Open live preview to review, or tap Confirm create when you’re ready. You can also keep filling gaps in the editor after create.'
      )
      setComposer('')
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
  const launchOverallPercent = launchTabs.length
    ? Math.round(launchTabs.reduce((sum, tab) => sum + tab.percent, 0) / launchTabs.length)
    : score
  const headerPercent =
    phase === 'creating' || phase === 'celebrate'
      ? Math.min(100, Math.round(createProgress))
      : phase === 'preview'
        ? launchOverallPercent
        : score
  // Keep the popup open for the whole AI create journey until Continue after celebrate.
  const sessionLocked =
    phase === 'working' ||
    phase === 'tabs' ||
    phase === 'section-gate' ||
    phase === 'coach' ||
    phase === 'features' ||
    phase === 'preview' ||
    phase === 'creating' ||
    phase === 'celebrate' ||
    busy ||
    score > 0 ||
    messages.length > 1

  const stepLabel =
    phase === 'intake'
      ? 'Share sources'
      : phase === 'working'
        ? 'Crafting draft'
        : phase === 'tabs'
          ? 'Choose sections'
          : phase === 'section-gate'
            ? 'Approve sections'
            : phase === 'coach'
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
        if (sessionLocked) return
        onClose()
      }}
      preventClose={sessionLocked}
      closeOnOverlayClick={!sessionLocked}
      closeOnEscape={!sessionLocked}
      overlayClassName="items-start overflow-y-auto p-2 py-3 sm:items-center sm:p-4"
      className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] dark:border-white/10 dark:bg-[#0b0f19]"
    >
      {(phase === 'celebrate' || (phase === 'creating' && createProgress > 96)) && <ConfettiBurst />}
      <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-indigo-500/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 sm:h-11 sm:w-11">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Card Studio</h3>
              <p className="truncate text-xs font-semibold text-slate-400">
                {stepLabel} · guided create until your card is ready
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
              disabled={sessionLocked}
              onClick={() => {
                if (sessionLocked) return
                onClose()
              }}
              title={sessionLocked ? 'Finish creating the card first' : 'Close'}
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

        {phase === 'tabs' && recommendations.length > 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50 p-4 shadow-sm dark:border-white/10 dark:from-white/5 dark:to-transparent">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">
                Suggested from your nav list
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Only real card sections — pick what fits this business.
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
              Continue with selected <ArrowRight className="h-3.5 w-3.5" />
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
              Empty section · your call
            </p>
            <h4 className="mt-2 text-base font-black text-slate-950 dark:text-white">{gateGap.tab}</h4>
            <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{gateGap.title}</p>
            <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
              {gateGap.explanation}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void approveGateSection()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20"
              >
                <Check className="h-3.5 w-3.5" /> Approve & auto-fill
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void skipGateSection()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip for now
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
                  pushMsg(
                    'assistant',
                    'Okay — moving to optional features. You can still fill gaps later in the editor.'
                  )
                  const queue = [...OPTIONAL_ITEMS]
                  setFeatureQueue(queue)
                  setFeatureIndex(0)
                  setPhase('features')
                  if (queue[0]) {
                    pushMsg('assistant', `Do you want ${queue[0].title}? ${queue[0].description} Reply yes or no.`)
                  }
                }}
                className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Skip to features
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'features' && featureQueue[featureIndex] ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void answerFeature(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
            >
              Yes — {featureQueue[featureIndex].title}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void answerFeature(false)}
              className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              No thanks
            </button>
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
                  <p className="mt-1 text-[11px] font-bold text-amber-600">Set a public URL slug before creating.</p>
                )}
              </div>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                {launchOverallPercent}%
              </span>
            </div>

            {incompleteLaunchTabs.length ? (
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {incompleteLaunchTabs.length} tab{incompleteLaunchTabs.length === 1 ? '' : 's'} need optional polish.
                You can fill them, skip them, or create now and finish inside the editor.
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                All selected content tabs are ready. Media upload fields can still be improved after create.
              </p>
            )}

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
                              onClick={() => setOpenLaunchTabs((prev) => prev.filter((id) => id !== tab.navId))}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                            >
                              Skip this tab
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

            <div className="flex flex-wrap gap-2 pt-1">
              {onOpenLivePreview ? (
                <button
                  type="button"
                  onClick={() => onOpenLivePreview()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
                >
                  <Eye className="h-3.5 w-3.5" /> Open live preview
                </button>
              ) : null}
              {acceptedFeatureDetails.map((feature, index) => (
                <button
                  key={`${feature.key}-${index}`}
                  type="button"
                  onClick={() => {
                    pushMsg('assistant', `${feature.title}: ${feature.note}`)
                    if (feature.key !== 'canva') onOpenSettings?.(feature.settingsSection)
                  }}
                  className="rounded-xl bg-white/80 px-3 py-2 text-[11px] font-black text-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  {feature.key === 'canva' ? 'Show Canva instructions' : `Open ${feature.title}`}
                </button>
              ))}
              <button
                type="button"
                disabled={busy || !previewName.trim() || !previewSlug.trim()}
                onClick={() => void confirmCreateCard()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black text-white disabled:opacity-50"
              >
                Create now <ArrowRight className="h-3.5 w-3.5" />
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
                  Preview · your permission to create
                </p>
                <h4 className="truncate text-base font-black text-slate-950 dark:text-white">{previewName}</h4>
                {previewCompany ? (
                  <p className="truncate text-xs font-semibold text-slate-500">{previewCompany}</p>
                ) : null}
                {previewSlug ? (
                  <p className="mt-1 truncate text-[11px] font-bold text-slate-400">/{previewSlug}</p>
                ) : (
                  <p className="mt-1 text-[11px] font-bold text-amber-600">
                    Set a public URL slug in Personal before creating.
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
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
              <span className="text-sm font-black">Creating your card…</span>
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
            <p className="text-[11px] font-semibold text-slate-500">Saving profile, tabs, and content — hang tight.</p>
          </div>
        ) : null}

        {phase === 'celebrate' ? (
          <div className="relative space-y-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 dark:border-emerald-500/25 dark:bg-emerald-500/15">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <PartyPopper className="h-6 w-6" />
              <span className="text-base font-black">Boom — card created!</span>
            </div>
            <p className="text-xs font-semibold text-emerald-900/80 dark:text-emerald-100/90">
              {previewName} is saved. Continue to open the editor with your mostly complete card.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-black tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                Create complete · {Math.min(100, Math.round(createProgress))}%
              </span>
            </div>
            <button
              type="button"
              onClick={finishAndOpenEditor}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"
            >
              Continue to editor <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {phase !== 'creating' && phase !== 'celebrate' ? (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
          {phase === 'intake' ? (
            <div className="mb-2">
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Website URL (optional) — I’ll crawl services, portfolio, blog, FAQ pages"
                className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
              />
            </div>
          ) : null}
          {fileLabel ? (
            <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Paperclip className="h-3 w-3" /> {fileLabel}
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
                  ? 'Describe the business, or paste text…'
                  : phase === 'section-gate'
                    ? 'Or tap Approve & fill / Skip above…'
                    : phase === 'coach'
                      ? 'Paste content for the approved section…'
                      : phase === 'features'
                        ? 'yes / no'
                        : phase === 'preview'
                          ? 'Type “yes” to confirm create…'
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
              Start generating my card <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {phase === 'coach' && score >= 90 ? (
            <button
              type="button"
              disabled={busy}
              onClick={goToPreview}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-black text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              Ready — preview & create <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
