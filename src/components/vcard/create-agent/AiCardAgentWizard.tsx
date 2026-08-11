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
import type { SettingsTabId } from '@/lib/vcardEditorRoutes'
import type { VCardData } from '@/types/vcard'
import { cn } from '@/utils/cn'
import {
  ArrowRight,
  Check,
  CheckCircle2,
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
  const [createProgress, setCreateProgress] = useState(0)
  const [createdCardId, setCreatedCardId] = useState<string | null>(null)
  const [gateGap, setGateGap] = useState<GapItem | null>(null)
  const [skippedGapIds, setSkippedGapIds] = useState<string[]>([])
  const [dragNavId, setDragNavId] = useState<string | null>(null)
  const [dragOverNavId, setDragOverNavId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef(vCardData)
  const wasOpenRef = useRef(false)
  const skippedGapIdsRef = useRef<string[]>([])

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
    setCreateProgress(0)
    setCreatedCardId(null)
    setGateGap(null)
    setSkippedGapIds([])
    skippedGapIdsRef.current = []
    setDragNavId(null)
    setDragOverNavId(null)
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

  const approveGateSection = () => {
    if (!gateGap) return
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
      const merged = mergeSectionPayload(draftRef.current, section, json.payload || {})
      applyDraft(merged, activeNav)
      setComposer('')
      setFiles([])
      const report = await refreshGaps(activeNav, merged)
      pushMsg('assistant', `Updated ${section}. Card is now ${report.score}% complete.`)
      askNextGap(report)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not fill section'
      setError(msg)
      pushMsg('assistant', `That fill failed: ${msg}. Try again with clearer text or another file.`)
    } finally {
      setBusy(false)
    }
  }

  const answerFeature = (yes: boolean) => {
    const item = featureQueue[featureIndex]
    if (!item) return
    pushMsg('user', yes ? `Yes — enable ${item.title}` : `No — skip ${item.title}`)
    const nextAccepted = yes ? [...acceptedFeatures, item.settingsSection] : acceptedFeatures
    if (yes) {
      setAcceptedFeatures(nextAccepted)
      pushMsg(
        'assistant',
        `Noted. I’ll deep-link you into ${item.title} settings when we finish (or you can open it anytime from card settings).`
      )
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

    setPhase('preview')
    const scoreLine = `You’re at about ${score}% content completeness.`
    pushMsg(
      'assistant',
      `${scoreLine} Preview your card below. When it looks right, confirm and I’ll create it for you (with a progress animation).`
    )
  }

  const goToPreview = () => {
    setPhase('preview')
    pushMsg('assistant', `Preview ready at ${score}%. Confirm to create the card, or keep editing in chat.`)
  }

  const finishAndOpenEditor = () => {
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

  const handleSend = () => {
    if (busy) return
    if (phase === 'section-gate') {
      approveGateSection()
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
      if (/^(y|yes|sure|ok|please|enable|yeah)/.test(t)) answerFeature(true)
      else if (/^(n|no|skip|later|nah)/.test(t)) answerFeature(false)
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
      className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
    >
      {(phase === 'celebrate' || (phase === 'creating' && createProgress > 96)) && <ConfettiBurst />}
      <div className="relative overflow-hidden border-b border-slate-100 px-5 py-4 dark:border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-indigo-500/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
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
              <span className="ml-2 text-sm font-black text-emerald-700 dark:text-emerald-300">{score}%</span>
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
                : Math.max(score, phase === 'intake' ? 0 : 4)
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
                onClick={approveGateSection}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20"
              >
                <Check className="h-3.5 w-3.5" /> Approve & fill
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
              onClick={() => answerFeature(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
            >
              Yes — {featureQueue[featureIndex].title}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => answerFeature(false)}
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
