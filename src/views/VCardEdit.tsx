'use client'

import { EditorNavEmptyPanel } from '@/components/EditorNavEmptyPanel'
import { EditorNavInfoPanel } from '@/components/EditorNavInfoPanel'
import { TakeTourTrigger } from '@/components/tour/TakeTourBanner'
import { AboutMeEditorPanel } from '@/components/vcard/AboutMeEditorPanel'
import { AddTabsModal } from '@/components/vcard/AddTabsModal'
import { AiGenerateModal, type AiProfilePayload } from '@/components/vcard/AiGenerateModal'
import { useCreateAgentUi } from '@/components/vcard/create-agent/CreateAgentUiProvider'
import { CustomTabEditorPanel } from '@/components/vcard/CustomTabEditorPanel'
import { useLivePreview } from '@/components/vcard/LivePreviewProvider'
import { SectionPostsEditorPanel } from '@/components/vcard/SectionPostsEditorPanel'
import { TabCompletionInspectorButton } from '@/components/vcard/TabCompletionInspectorButton'
import { TabBlog } from '@/components/VCardBlog'
import { TabCertificates } from '@/components/VCardCertificates'
import { TabContentMedia } from '@/components/VCardContentMedia'
import { TabEducation } from '@/components/VCardEducation'
import { TabExperience } from '@/components/VCardExperience'
import { TabFaq } from '@/components/VCardFaq'
import { TabGlobalConnection } from '@/components/VCardGlobalConnection'
import { TabLinkShortener } from '@/components/VCardLinkShortener'
import { TabMyInfo } from '@/components/VCardMyInfo'
import { TabPortfolio } from '@/components/VCardPortfolio'
import { TabProfile } from '@/components/VCardProfile'
import { TabResume } from '@/components/VCardResume'
import { TabReviews } from '@/components/VCardReviews'
import { TabServices } from '@/components/VCardServices'
import { TabSetting } from '@/components/VCardSetting'
import { TabSkill } from '@/components/VCardSkill'
import { Tab1MediaProfile } from '@/components/VCardTab1'
import { Tab2PersonalInfo } from '@/components/VCardTab2'
import { Tab3SocialGames } from '@/components/VCardTab3'
import { Tab4HomeMedia } from '@/components/VCardTab4'
import { Tab5ExtraFields } from '@/components/VCardTab5'
import { isStaffRole } from '@/constants/userRole'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { ACCOUNT_PAUSED_CREATE_MESSAGE, ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { createCardOwnerKindLabel, getCreateCardOwner, type CreateCardOwnerSession } from '@/lib/admin/createCardOwner'
import {
  createCardTabNameToNavId,
  getAiSeedCreateCardNavIds,
  getDefaultCreateCardNavIds,
  normalizeNavOrderWithPinnedEnds,
  normalizeNavOrderWithRequiredTabs,
} from '@/lib/createCardTabs'
import { requestTourRemeasure } from '@/lib/dashboardTour'
import { pushEditorPath } from '@/lib/editorShallowRoute'
import { directoryPathForOwnerMode } from '@/lib/packageOwnerMode'
import { buildProfilePath, DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import { shouldPreserveCustomNavOrder } from '@/lib/publicNavOrder'
import { notify } from '@/lib/toast/toast'
import {
  getEditorPanelCompletionStats,
  getNavItemCompletionPercent,
  getOverallCardCompletionPercent,
  getPersonalSubCompletions,
} from '@/lib/vcardCompletion'
import { useVCard } from '@/lib/VCardContext'
import { applyEnabledNavOrderToDisplaySettings, getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import {
  buildEditorPath,
  buildEditorSectionPath,
  buildEditorSettingsPath,
  parseEditorSegments,
  type EditorBasePath,
} from '@/lib/vcardEditorRoutes'
import {
  applyNavLabelOverrides,
  filterEditorMainNavItems,
  getEditorNavLabel,
  getNavItemById,
  isCustomNavItemId,
  isPersonalEditorNavId,
  mergeCustomNavItems,
  NAV_BAR_NAV_ITEMS,
  selectEnabledNavItems,
  storageKeyForEditorNavOrder,
  type EditorNavPanel,
} from '@/lib/vcardNavbar'
import { getSectionSchema } from '@/lib/vcardSectionSchemas'
import { useUpdateProfileCardMutation } from '@/redux/features/profiles/profiles.api'
import { updateVCard } from '@/redux/features/vcards/vcards.slice'
import { cn } from '@/utils/cn'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Eye,
  Loader2,
  Plus,
  Save,
  Settings,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type VCardEditProps = {
  basePath: EditorBasePath
  segments?: string[]
  cardId?: string
}

function readEditorNavOrderIds(cardKey: string, preferAiSeed = false): string[] {
  try {
    const raw = localStorage.getItem(storageKeyForEditorNavOrder(cardKey))
    if (!raw) return preferAiSeed ? getAiSeedCreateCardNavIds() : getDefaultCreateCardNavIds()
    const parsed = JSON.parse(raw) as string[]
    if (Array.isArray(parsed) && parsed.length) {
      return normalizeNavOrderWithPinnedEnds(parsed)
    }
    return preferAiSeed ? getAiSeedCreateCardNavIds() : getDefaultCreateCardNavIds()
  } catch {
    return preferAiSeed ? getAiSeedCreateCardNavIds() : getDefaultCreateCardNavIds()
  }
}

export default function VCardEdit({ basePath, segments, cardId }: VCardEditProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const role = useAppSelector((state) => state.user.user?.role)
  const currentUserId = useAppSelector((state) => state.user.user?.id)
  const { ownerMode, isCorporateBackOffice } = useOwnerMode()
  const { canMutateVcards, isPaused, isSuspended } = useAccountStatus()
  const isStaff = isStaffRole(role)
  const isDirectoryEditor = isCorporateBackOffice || isStaff
  const directoryHref = directoryPathForOwnerMode(ownerMode, role)
  const directoryLabel = isCorporateBackOffice
    ? 'Back to Team vCards'
    : isStaff
      ? 'Back to My Cards'
      : 'Back to My vCards'

  useEffect(() => {
    if (isStaff || canMutateVcards) return
    notify.warning(isSuspended ? ACCOUNT_SUSPENDED_MESSAGE : ACCOUNT_PAUSED_CREATE_MESSAGE)
    router.replace(directoryHref)
  }, [isStaff, canMutateVcards, isSuspended, isPaused, directoryHref, router])
  const {
    vCardData,
    updateData,
    saveVCard,
    flushSave,
    saveStatus,
    isCreateMode,
    cardId: contextCardId,
    avatarImageUrl,
  } = useVCard()
  const display = useMemo(() => getDisplaySettingsFromVCard(vCardData), [vCardData])
  const completionMeta = useMemo(() => ({ avatarImageUrl }), [avatarImageUrl])
  const { isOpen: showPreview, open: openLivePreview, toggle: toggleLivePreview, setEditorSectionId } = useLivePreview()
  const [isSaving, setIsSaving] = useState(false)
  const [isActivatingDraft, setIsActivatingDraft] = useState(false)
  const [showAddTabs, setShowAddTabs] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [updateProfileCard] = useUpdateProfileCardMutation()
  const { openAgent } = useCreateAgentUi()
  const { isActive: isTourActive, currentStep, registerActivateTab } = useDashboardTour()

  const isAiCreateFlow = isCreateMode && searchParams.get('agent') === '1'
  const [createOwner, setCreateOwner] = useState<CreateCardOwnerSession | null>(null)
  const [createOwnerMode, setCreateOwnerMode] = useState<boolean | null>(null)

  useEffect(() => {
    if (isAiCreateFlow) openAgent()
  }, [isAiCreateFlow, openAgent])

  const activeCardId = contextCardId || cardId || ''
  const cardKey = activeCardId || 'draft'
  const isClient = typeof window !== 'undefined'

  // Create-owner banner: sync from sessionStorage during render (same pattern as navOrder/cardKey)
  if (isClient && createOwnerMode !== isCreateMode) {
    setCreateOwnerMode(isCreateMode)
    setCreateOwner(isCreateMode ? getCreateCardOwner() : null)
  }
  const [navOrderIds, setNavOrderIds] = useState(() =>
    isClient
      ? readEditorNavOrderIds(
          cardKey,
          isCreateMode &&
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('agent') === '1'
        )
      : getDefaultCreateCardNavIds()
  )
  const [navOrderReady, setNavOrderReady] = useState(isClient)
  const [navOrderCardKey, setNavOrderCardKey] = useState(cardKey)
  const [aiTabsSeeded, setAiTabsSeeded] = useState(false)
  const [pendingAiDisplayOrder, setPendingAiDisplayOrder] = useState<string[] | null>(null)
  const appliedAiDisplayKeyRef = useRef<string | null>(null)

  if (!navOrderReady && isClient) {
    setNavOrderReady(true)
    setNavOrderIds(readEditorNavOrderIds(cardKey, isAiCreateFlow))
  }

  if (cardKey !== navOrderCardKey) {
    setNavOrderCardKey(cardKey)
    setNavOrderIds(isClient ? readEditorNavOrderIds(cardKey, isAiCreateFlow) : getDefaultCreateCardNavIds())
    setAiTabsSeeded(false)
    setPendingAiDisplayOrder(null)
  }

  // AI create: seed Personal + pinned ends once (render-phase, same pattern as cardKey sync)
  if (isAiCreateFlow && !aiTabsSeeded && isClient) {
    setAiTabsSeeded(true)
    try {
      const seed = getAiSeedCreateCardNavIds()
      const raw = localStorage.getItem(storageKeyForEditorNavOrder(cardKey))
      const parsed = raw ? (JSON.parse(raw) as string[]) : null
      const defaults = getDefaultCreateCardNavIds()
      const isFullManualDefault =
        Array.isArray(parsed) && parsed.length >= defaults.length - 1 && defaults.every((id) => parsed.includes(id))

      if (!raw || isFullManualDefault) {
        setNavOrderIds(seed)
        localStorage.setItem(storageKeyForEditorNavOrder(cardKey), JSON.stringify(seed))
        setPendingAiDisplayOrder(seed)
      } else if (Array.isArray(parsed) && parsed.length) {
        const normalized = normalizeNavOrderWithPinnedEnds(parsed)
        setNavOrderIds(normalized)
        setPendingAiDisplayOrder(normalized)
      }
    } catch {
      const seed = getAiSeedCreateCardNavIds()
      setNavOrderIds(seed)
      setPendingAiDisplayOrder(seed)
    }
  }

  const displayNavOrder = useMemo(() => {
    if (!Array.isArray(display.editorNavOrder) || !display.editorNavOrder.length) return null
    const preserve = shouldPreserveCustomNavOrder(vCardData.slug, display.navOrderCustomized)
    return preserve
      ? normalizeNavOrderWithRequiredTabs(display.editorNavOrder)
      : normalizeNavOrderWithPinnedEnds(display.editorNavOrder)
  }, [display.editorNavOrder, display.navOrderCustomized, vCardData.slug])

  const effectiveNavOrderIds = useMemo(
    () => displayNavOrder ?? (isCreateMode ? navOrderIds : []),
    [displayNavOrder, isCreateMode, navOrderIds]
  )

  useEffect(() => {
    if (!isCreateMode) return
    const normalized = normalizeNavOrderWithPinnedEnds(
      effectiveNavOrderIds.length ? effectiveNavOrderIds : getDefaultCreateCardNavIds()
    )
    const current = Array.isArray(display.editorNavOrder) ? display.editorNavOrder : []
    if (current.join('|') === normalized.join('|')) return
    updateData('displaySettings', applyEnabledNavOrderToDisplaySettings(display, normalized))
  }, [isCreateMode, display, effectiveNavOrderIds, updateData])

  // One-shot: push AI seed visibility into draft displaySettings
  useEffect(() => {
    if (!isCreateMode) return
    if (!pendingAiDisplayOrder) return
    const key = `${cardKey}:${pendingAiDisplayOrder.join('|')}`
    if (appliedAiDisplayKeyRef.current === key) return
    appliedAiDisplayKeyRef.current = key
    updateData(
      'displaySettings',
      applyEnabledNavOrderToDisplaySettings(getDisplaySettingsFromVCard(vCardData), pendingAiDisplayOrder)
    )
  }, [isCreateMode, pendingAiDisplayOrder, cardKey, updateData, vCardData])

  // Persist display order to localStorage when it arrives from the API/draft
  useEffect(() => {
    if (!displayNavOrder?.length) return
    try {
      localStorage.setItem(storageKeyForEditorNavOrder(cardKey), JSON.stringify(displayNavOrder))
    } catch {
      /* ignore */
    }
  }, [displayNavOrder, cardKey])

  useEffect(() => {
    const openPreview = () => openLivePreview()
    const onNavOrder = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (Array.isArray(detail) && detail.length) {
        setNavOrderIds(normalizeNavOrderWithPinnedEnds(detail))
      }
    }
    window.addEventListener('vbiz-open-live-preview', openPreview)
    window.addEventListener('vbiz-create-nav-order', onNavOrder as EventListener)
    return () => {
      window.removeEventListener('vbiz-open-live-preview', openPreview)
      window.removeEventListener('vbiz-create-nav-order', onNavOrder as EventListener)
    }
  }, [openLivePreview])

  const editorNavCatalog = useMemo(
    () =>
      applyNavLabelOverrides(mergeCustomNavItems(NAV_BAR_NAV_ITEMS, vCardData.customTabs), vCardData.tabLabelOverrides),
    [vCardData.customTabs, vCardData.tabLabelOverrides]
  )

  const enabledNavItems = useMemo(
    () =>
      selectEnabledNavItems(
        editorNavCatalog,
        effectiveNavOrderIds.length ? { ...display, editorNavOrder: effectiveNavOrderIds } : display
      ),
    [display, effectiveNavOrderIds, editorNavCatalog]
  )

  const visibleNavItems = useMemo(() => filterEditorMainNavItems(enabledNavItems), [enabledNavItems])
  const enabledNavIds = useMemo(() => enabledNavItems.map((item) => item.id), [enabledNavItems])
  const personalSubs = useMemo(() => getPersonalSubCompletions(vCardData, completionMeta), [vCardData, completionMeta])

  const saveStatusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'dirty'
        ? 'Autosave pending'
        : saveStatus === 'saved'
          ? 'Saved'
          : saveStatus === 'error'
            ? 'Save failed'
            : null

  const handleSaveChanges = useCallback(() => {
    if (isCreateMode) {
      void saveVCard()
        .then(() => notify.success('Draft saved.'))
        .catch(() => undefined)
      return
    }
    void flushSave().catch(() => undefined)
  }, [flushSave, isCreateMode, saveVCard])

  const publicCardPath = useMemo(() => buildProfilePath(vCardData.slug || ''), [vCardData.slug])
  const openPublicCard = useCallback(() => {
    if (!vCardData.slug?.trim()) {
      notify.warning('Set a public URL slug before opening the card.')
      return
    }
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      notify.error('Allow pop-ups to open your public card in a new tab.')
      return
    }
    previewWindow.opener = null
    const navigate = () => {
      if (!previewWindow.closed) previewWindow.location.href = publicCardPath
    }
    if (saveStatus === 'dirty' || saveStatus === 'error') {
      previewWindow.document.title = 'Saving card...'
      void flushSave()
        .then(navigate)
        .catch(() => previewWindow.close())
      return
    }
    navigate()
  }, [flushSave, publicCardPath, saveStatus, vCardData.slug])
  const opensPublicCard = Boolean(!isCreateMode && !vCardData.isDraft && vCardData.isPublic)

  const SaveStatusIcon =
    saveStatus === 'saving'
      ? Loader2
      : saveStatus === 'dirty'
        ? CloudOff
        : saveStatus === 'saved'
          ? Cloud
          : saveStatus === 'error'
            ? AlertCircle
            : null

  const route = useMemo(() => parseEditorSegments(segments), [segments])
  const activeNavId = route.isSettings ? route.sectionId : route.sectionId
  const activeTab = route.subTab ?? 1
  const isSettingsOpen = route.isSettings
  const activeMainNavId = useMemo(() => {
    if (isPersonalEditorNavId(activeNavId)) return 'home'
    return activeNavId
  }, [activeNavId])
  const previewSectionForRoute = route.isSettings ? DEFAULT_PROFILE_SECTION : activeMainNavId

  useEffect(() => {
    setEditorSectionId(previewSectionForRoute)
  }, [previewSectionForRoute, setEditorSectionId])

  const overallPercent = useMemo(
    () => getOverallCardCompletionPercent(visibleNavItems, vCardData, completionMeta),
    [visibleNavItems, vCardData, completionMeta]
  )
  const activeNavIndex = useMemo(() => {
    return visibleNavItems.findIndex((item) => item.id === activeMainNavId)
  }, [visibleNavItems, activeMainNavId])

  const activeNavItem = getNavItemById(activeNavId, editorNavCatalog)
  const activeMainNavItem = getNavItemById(activeMainNavId, editorNavCatalog)
  const editorPanel = useMemo(() => activeNavItem?.editorPanel ?? ({ kind: 'empty' } as const), [activeNavItem])
  const isPersonalEditor = editorPanel.kind === 'personal'
  const inspectorPanel = useMemo<EditorNavPanel>(
    () => (isPersonalEditor ? { kind: 'personal', subTab: activeTab } : editorPanel),
    [activeTab, editorPanel, isPersonalEditor]
  )
  const inspectorLabel = isPersonalEditor
    ? personalSubs.find((tab) => tab.id === activeTab)?.name || activeMainNavItem?.label || 'Personal'
    : activeMainNavItem
      ? getEditorNavLabel(activeMainNavItem)
      : activeNavItem
        ? getEditorNavLabel(activeNavItem)
        : 'Current tab'
  const renderEditorPanel = (panel: EditorNavPanel) => {
    switch (panel.kind) {
      case 'personal':
        return (
          <>
            {activeTab === 1 && <Tab1MediaProfile />}
            {activeTab === 2 && <Tab2PersonalInfo />}
            {activeTab === 3 && <Tab3SocialGames />}
            {activeTab === 4 && <Tab4HomeMedia />}
            {activeTab === 5 && <Tab5ExtraFields />}
          </>
        )
      case 'about-me':
        return <AboutMeEditorPanel cardId={contextCardId} />
      case 'education':
        return <TabEducation />
      case 'experience':
        return <TabExperience />
      case 'skill':
        return <TabSkill />
      case 'services':
        return <TabServices />
      case 'portfolio':
        return <TabPortfolio />
      case 'reviews':
        return <TabReviews />
      case 'blog':
        return <TabBlog />
      case 'faq':
        return <TabFaq />
      case 'profile':
        return <TabProfile />
      case 'resume':
        return <TabResume />
      case 'content-media':
        return <TabContentMedia />
      case 'global-connection':
        return <TabGlobalConnection />
      case 'my-info':
        return <TabMyInfo />
      case 'certificates':
        return <TabCertificates />
      case 'link-shortener':
        return <TabLinkShortener />
      case 'section-posts': {
        const schema = getSectionSchema(panel.schemaKey)
        if (!schema) {
          return (
            <EditorNavEmptyPanel
              title={activeNavItem?.label ?? 'Section'}
              tourTargetId={`tour-editor-panel-${activeNavId}`}
            />
          )
        }
        const posts = vCardData.sectionPosts?.[schema.postTypeName] ?? []
        return (
          <SectionPostsEditorPanel
            schema={schema}
            posts={posts}
            cardId={contextCardId}
            onPostsChange={(next) => {
              updateData('sectionPosts', {
                ...(vCardData.sectionPosts ?? {}),
                [schema.postTypeName]: next,
              })
            }}
          />
        )
      }
      case 'custom-tab': {
        const tab = vCardData.customTabs?.find((entry) => entry.id === panel.tabId)
        if (!tab) {
          return (
            <EditorNavEmptyPanel
              title={activeNavItem?.label ?? 'Custom tab'}
              tourTargetId={`tour-editor-panel-${activeNavId}`}
            />
          )
        }
        return (
          <CustomTabEditorPanel
            tab={tab}
            cardId={contextCardId}
            onChange={(nextTab) => {
              const nextTabs = (vCardData.customTabs || []).map((entry) => (entry.id === nextTab.id ? nextTab : entry))
              updateData('customTabs', nextTabs)
              updateData('tabLabelOverrides', {
                ...(vCardData.tabLabelOverrides || {}),
                [nextTab.id]: nextTab.label,
              })
            }}
          />
        )
      }
      case 'info':
        return <EditorNavInfoPanel infoKey={panel.infoKey} tourTargetId={`tour-editor-panel-${activeNavId}`} />
      case 'empty':
      default:
        return null
    }
  }

  useLayoutEffect(() => {
    if (!isTourActive || !currentStep) return
    requestAnimationFrame(() => requestTourRemeasure())
  }, [isTourActive, currentStep, segments])

  /** Keep the create-session query (`agent`, `reset`) so section links never restart the draft. */
  const createQuerySuffix = useMemo(() => {
    if (basePath !== '/vcards/create') return ''
    const params = new URLSearchParams()
    if (searchParams.get('agent') === '1') params.set('agent', '1')
    const reset = searchParams.get('reset')
    if (reset) params.set('reset', reset)
    const query = params.toString()
    return query ? `?${query}` : ''
  }, [basePath, searchParams])

  const withEditorQuery = useCallback(
    (path: string) => (createQuerySuffix && !path.includes('?') ? `${path}${createQuerySuffix}` : path),
    [createQuerySuffix]
  )

  const sectionHref = (sectionId: string) => withEditorQuery(buildEditorSectionPath(basePath, sectionId, cardId))
  const settingsHref = withEditorQuery(buildEditorSettingsPath(basePath, route.settingsTab, cardId))
  /** Personal sub-tabs stay under Home; About Me is its own top-level section. */
  const subTabHref = (tabId: number) =>
    withEditorQuery(buildEditorPath(basePath, { sectionId: 'home', subTab: tabId }, cardId))

  /** Section changes only rewrite the URL — the shell in `layout.tsx` stays mounted. */
  const goToEditorPath = useCallback((path: string) => {
    pushEditorPath(path)
    // Router navigation used to reset scroll; keep that so panels open at the top.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const handleEditorLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      goToEditorPath(href)
    },
    [goToEditorPath]
  )

  useEffect(() => {
    const activate = (tab: string) => {
      const navId = createCardTabNameToNavId(tab)
      if (!navId) return
      goToEditorPath(withEditorQuery(buildEditorSectionPath(basePath, navId, cardId)))
    }
    registerActivateTab(activate)
    return () => registerActivateTab(null)
  }, [registerActivateTab, goToEditorPath, withEditorQuery, basePath, cardId])

  const {
    scrollRef: mainNavRef,
    scrollClassName: mainNavScrollClassName,
    canScrollLeft,
    canScrollRight,
    hiddenLeftCount,
    hiddenRightCount,
    scrollByTabs,
    scrollActiveIntoPeek,
    updateOverflow,
  } = useHorizontalScroll('editor-main-nav', segments)
  const { scrollRef: subNavRef, scrollClassName: subNavScrollClassName } = useHorizontalScroll(
    'editor-sub-nav',
    segments
  )

  useLayoutEffect(() => {
    if (isSettingsOpen) return
    const lastNavId = visibleNavItems[visibleNavItems.length - 1]?.id
    const el = mainNavRef.current
    if (!el) return
    if (activeMainNavId === 'home') {
      el.scrollLeft = 0
    } else if (activeMainNavId === lastNavId) {
      el.scrollLeft = el.scrollWidth - el.clientWidth
    } else {
      return
    }
    updateOverflow()
  }, [activeMainNavId, cardKey, isSettingsOpen, mainNavRef, updateOverflow, visibleNavItems])

  useEffect(() => {
    const t = window.setTimeout(() => {
      updateOverflow()
      if (!isSettingsOpen) {
        const lastNavId = visibleNavItems[visibleNavItems.length - 1]?.id
        if (activeMainNavId !== 'home' && activeMainNavId !== lastNavId) {
          scrollActiveIntoPeek(activeMainNavId)
        }
      }
    }, 60)
    return () => window.clearTimeout(t)
  }, [
    visibleNavItems.length,
    activeMainNavId,
    isSettingsOpen,
    cardKey,
    scrollActiveIntoPeek,
    updateOverflow,
    visibleNavItems,
  ])

  const goToSubTab = (tabId: number) => {
    goToEditorPath(subTabHref(tabId))
  }

  const applyAddTabs = ({
    nextIds,
    customTabs,
    labelOverrides,
    navOrderCustomized,
  }: {
    nextIds: string[]
    customTabs: NonNullable<typeof vCardData.customTabs>
    labelOverrides: NonNullable<typeof vCardData.tabLabelOverrides>
    navOrderCustomized?: boolean
  }) => {
    const normalized = nextIds
    const next = applyEnabledNavOrderToDisplaySettings(display, normalized, {
      preserveCustom: Boolean(navOrderCustomized),
    })
    updateData('displaySettings', next)
    updateData('customTabs', customTabs)
    updateData('tabLabelOverrides', labelOverrides)
    setNavOrderIds(normalized)
    localStorage.setItem(storageKeyForEditorNavOrder(cardKey), JSON.stringify(normalized))

    const added = normalized.filter((id) => !enabledNavIds.includes(id))
    const addedCustom = [...added].reverse().find((id) => isCustomNavItemId(id))
    const nextSection = addedCustom || added[0]
    if (nextSection) {
      goToEditorPath(sectionHref(nextSection))
    } else if (!normalized.includes(activeNavId) && normalized[0]) {
      goToEditorPath(sectionHref(normalized[0]))
    }
    setShowAddTabs(false)
  }

  const applyAiProfile = (data: AiProfilePayload) => {
    if (data.fullName) updateData('personal.fullName', data.fullName)
    if (data.title) updateData('personal.designation', data.title)
    if (data.company) updateData('personal.company', data.company)
    if (data.bio) updateData('personal.about', data.bio)
    if (data.email) updateData('personal.email', data.email)
    if (data.phone) updateData('personal.phone', data.phone)
    if (data.location) updateData('personal.address', data.location)
    if (data.website) updateData('personal.website', data.website)
  }

  const activateDraftCard = async () => {
    if (!activeCardId) {
      notify.error('Create or save this card before activating it.')
      return
    }
    setIsActivatingDraft(true)
    try {
      try {
        await flushSave()
      } catch {
        // Persist errors are already toasted from VCardContext.
        return
      }
      await updateProfileCard({ id: activeCardId, body: { isDraft: false, isPublic: true } }).unwrap()
      dispatch(
        updateVCard({
          id: activeCardId,
          patch: {
            isActive: true,
            isDraft: false,
            isPublic: true,
          },
        })
      )
      notify.success('Card activated. The public link is live.')
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not activate card.'
      notify.error(message)
    } finally {
      setIsActivatingDraft(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full justify-center pt-4 pb-24 sm:pt-10" data-tour-editor-scope>
      <div className="bg-primary-500/10 pointer-events-none fixed top-20 left-1/2 h-125 w-full max-w-250 -translate-x-1/2 rounded-full blur-[150px]" />

      <div className="relative z-10 flex w-full max-w-325 flex-col gap-6">
        {isCreateMode && createOwner ? (
          <div className="animate-in slide-in-from-top-4 flex w-full flex-col gap-1 rounded-3xl border border-indigo-500/25 bg-indigo-500/10 p-5 px-6 text-indigo-900 duration-300 dark:text-indigo-100">
            <p className="text-[15px] font-bold">
              Creating for <span className="font-extrabold">{createOwner.name || createOwner.email}</span>
            </p>
            <p className="text-xs font-semibold text-indigo-700/80 dark:text-indigo-200/80">
              {[createOwner.email, createCardOwnerKindLabel(createOwner, currentUserId)].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : null}
        {!isCreateMode && vCardData.isDraft ? (
          <div className="animate-in slide-in-from-top-4 flex w-full flex-col justify-between gap-4 rounded-3xl border border-emerald-500/25 bg-emerald-50 p-5 px-6 text-emerald-900 duration-300 sm:flex-row sm:items-center dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
            <div>
              <p className="text-[15px] font-black">This card is saved as a draft</p>
              <p className="mt-1 text-xs font-semibold text-emerald-800/75 dark:text-emerald-100/75">
                It is not live yet. Activate it when the information looks ready; optional uploads can still be added
                later.
              </p>
            </div>
            <button
              type="button"
              disabled={isActivatingDraft}
              onClick={() => void activateDraftCard()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isActivatingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isActivatingDraft ? 'Activating...' : 'Activate card'}
            </button>
          </div>
        ) : null}
        {isDirectoryEditor ? (
          <div className="animate-in slide-in-from-top-4 flex w-full flex-col justify-between gap-4 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 px-6 text-amber-800 duration-300 sm:flex-row sm:items-center dark:text-amber-200/95">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xs font-black tracking-wider text-amber-600 dark:text-amber-400">
                {isCreateMode ? 'NEW' : 'EDIT'}
              </span>
              <div>
                <p className="text-[15px] font-bold">
                  {isCreateMode ? (
                    'Creating Profile'
                  ) : (
                    <>
                      Editing Profile:{' '}
                      <span className="font-extrabold text-amber-900 dark:text-amber-100">
                        {vCardData.personal?.fullName || 'Employee Profile'}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isCreateMode
                    ? saveStatus === 'dirty'
                      ? 'Autosave pending — the draft saves after required profile details are complete'
                      : 'New profile — save when you are ready'
                    : `${vCardData.personal?.designation || 'Role'} • ${vCardData.personal?.profession || 'General'}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <TakeTourTrigger
                tourKey="create_card"
                triggerLabel="Take card tour"
                className="px-4 py-2.5 text-xs font-black"
              />
              <button
                type="button"
                onClick={opensPublicCard ? openPublicCard : openLivePreview}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-amber-700',
                  !opensPublicCard && 'hidden md:inline-flex'
                )}
                title={opensPublicCard ? 'Open the public card in a new tab' : 'Preview this card in the builder'}
              >
                <Eye className="h-4 w-4" />
                {opensPublicCard ? 'View' : 'Preview'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={directoryHref}
              className="hover:border-primary-500/30 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:text-slate-900 dark:border-white/10 dark:bg-[#0b0f19]/80 dark:text-slate-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {directoryLabel}
            </Link>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <TakeTourTrigger
                tourKey="create_card"
                triggerLabel="Take card tour"
                className="px-4 py-2.5 text-xs font-black"
              />
              <button
                type="button"
                onClick={opensPublicCard ? openPublicCard : openLivePreview}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-amber-700',
                  !opensPublicCard && 'hidden md:inline-flex'
                )}
                title={opensPublicCard ? 'Open the public card in a new tab' : 'Preview this card in the builder'}
              >
                <Eye className="h-4 w-4" />
                {opensPublicCard ? 'View' : 'Preview'}
              </button>
            </div>
          </div>
        )}

        <div
          data-tour="card-complete"
          data-tour-id="tour-card-complete"
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200/70 bg-white/50 px-3 py-2 dark:border-white/5 dark:bg-[#0b0f19]/50"
        >
          <span className="shrink-0 text-[10px] font-black tracking-wider text-slate-400 uppercase">Card complete</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-[12px] font-black text-slate-800 tabular-nums dark:text-white">
            {overallPercent}%
          </span>
        </div>

        <div className="flex w-full justify-center" data-tour="tabs-bar" data-tour-id="tour-tabs-bar">
          <div className="relative flex w-full min-w-0 flex-col justify-between gap-1.5 rounded-2xl border border-slate-200 bg-white/60 py-1 pr-1.5 pl-0 shadow-sm backdrop-blur-2xl xl:flex-row xl:items-center dark:border-white/5 dark:bg-[#0b0f19]/60">
            <div className="relative flex min-w-0 flex-1 items-center gap-1">
              {canScrollLeft && (
                <button
                  type="button"
                  aria-label="Show previous tabs"
                  onClick={() => scrollByTabs(-1)}
                  className="absolute top-1/2 left-1 z-20 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100/95 px-1.5 py-1 text-[10px] font-black whitespace-nowrap text-slate-700 shadow-sm hover:border-indigo-300 dark:border-white/10 dark:bg-[#0b0f19]/95 dark:text-slate-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {Math.max(hiddenLeftCount, 1)} prev
                </button>
              )}

              <div className="relative min-w-0 flex-1 overflow-hidden">
                {canScrollLeft && (
                  <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-16 bg-linear-to-r from-white/95 to-transparent dark:from-[#0b0f19]/95" />
                )}
                {canScrollRight && (
                  <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-10 bg-linear-to-l from-white/95 to-transparent dark:from-[#0b0f19]/95" />
                )}

                <div ref={mainNavRef} className={cn('items-center gap-1.5 pr-1 pl-5', mainNavScrollClassName)}>
                  {visibleNavItems.map((item, index) => {
                    const isActive = !isSettingsOpen && activeMainNavId === item.id
                    const stats = item.editorPanel
                      ? getEditorPanelCompletionStats(item.editorPanel, vCardData, completionMeta)
                      : {
                          filled: 0,
                          total: 0,
                          empty: 0,
                          percent: getNavItemCompletionPercent(item.editorPanel, vCardData, completionMeta),
                        }
                    const percent = stats.percent
                    const done = stats.total ? stats.empty === 0 : percent >= 100
                    const chipLabel = getEditorNavLabel(item)
                    const isNeighbor =
                      activeNavIndex >= 0 && !isActive && index >= activeNavIndex - 2 && index <= activeNavIndex + 2
                    const href = sectionHref(item.id)
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        prefetch={false}
                        onClick={(event) => handleEditorLinkClick(event, href)}
                        draggable={false}
                        data-tab-chip
                        data-tab-name={item.id}
                        data-tour-id={`tour-nav-${item.id}`}
                        title={chipLabel}
                        className={cn(
                          'relative flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border py-2 pr-2.5 pl-3 text-[14px] font-bold whitespace-nowrap transition-all duration-300',
                          isActive
                            ? 'bg-primary-600 border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 scale-[1.02] text-white shadow-sm'
                            : isNeighbor
                              ? 'border-slate-200/70 bg-slate-50/80 text-slate-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300'
                              : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'dark:text-primary-400 text-white' : 'text-slate-500 dark:text-slate-400'
                          )}
                        />
                        <span className="max-w-36 truncate sm:max-w-none">{chipLabel}</span>
                        {done ? (
                          <span
                            className={cn(
                              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                              isActive
                                ? 'bg-white/20 text-white dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            )}
                            title="Complete"
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                              isActive
                                ? 'dark:bg-primary-500/20 dark:text-primary-300 bg-white/15 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            )}
                          >
                            {stats.total ? `${stats.filled}/${stats.total}` : `${percent}%`}
                          </span>
                        )}
                        {isActive && (
                          <span
                            className="dark:bg-primary-400/50 absolute right-3 bottom-1 left-3 h-0.5 overflow-hidden rounded-full bg-white/35"
                            aria-hidden
                          >
                            <span
                              className="dark:bg-primary-300 block h-full bg-white transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </span>
                        )}
                      </Link>
                    )
                  })}
                  <div className="w-14 shrink-0" aria-hidden />
                </div>
              </div>

              <button
                type="button"
                aria-label="Show next tabs"
                disabled={!canScrollRight}
                onClick={() => scrollByTabs(1)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-1 text-[10px] font-black whitespace-nowrap transition-all',
                  canScrollRight
                    ? 'border-indigo-200/80 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25'
                    : 'pointer-events-none border-transparent opacity-0'
                )}
              >
                {Math.max(hiddenRightCount, 1)} next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 xl:block dark:bg-white/10" />

            <div
              className="flex shrink-0 items-center gap-1 px-1 pb-1 xl:pb-0"
              data-tour="tabs-actions"
              data-tour-id="tour-tabs-actions"
            >
              <button
                type="button"
                data-tour="add-tabs"
                data-tour-id="tour-add-tabs"
                onClick={() => setShowAddTabs(true)}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/80 px-3 py-1.5 text-[14px] font-black whitespace-nowrap text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                title="Add"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                Add
              </button>

              {saveStatusLabel && SaveStatusIcon && (
                <span
                  role="status"
                  title={saveStatusLabel}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap',
                    saveStatus === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                      : saveStatus === 'dirty'
                        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                        : saveStatus === 'saving'
                          ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  )}
                >
                  <SaveStatusIcon className={cn('h-3.5 w-3.5', saveStatus === 'saving' && 'animate-spin')} />
                  {saveStatusLabel}
                </span>
              )}

              {(saveStatus === 'dirty' || saveStatus === 'error') && (
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-[12px] font-bold whitespace-nowrap text-white transition-colors hover:bg-indigo-700"
                  title={saveStatus === 'error' ? 'Retry saving changes' : 'Save changes'}
                >
                  <Save className="h-3.5 w-3.5" />
                  {saveStatus === 'error' ? 'Retry save' : 'Save changes'}
                </button>
              )}

              <button
                type="button"
                data-tour="ai-generate"
                data-tour-id="tour-ai-generate"
                onClick={() => openAgent()}
                className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-3 py-2 text-[14px] font-bold whitespace-nowrap text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
                title="Generate with AI"
              >
                <Sparkles className="h-5 w-5 text-emerald-200" />
                Generate
              </button>

              <Link
                id="tour-editor-settings"
                href={settingsHref}
                prefetch={false}
                onClick={(event) => handleEditorLinkClick(event, settingsHref)}
                data-tour-id="tour-editor-settings"
                title="Settings"
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                  isSettingsOpen
                    ? 'bg-primary-600 border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-white shadow-sm'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
                )}
              >
                <Settings className="h-5 w-5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-col">
          {isSettingsOpen ? (
            <TabSetting basePath={basePath} settingsTab={route.settingsTab} cardId={cardId} />
          ) : (
            <div
              className="relative flex min-h-175 flex-col overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0b0f19]"
              data-tour="tab-form"
              data-tour-id={isPersonalEditor ? `tour-editor-panel-${activeNavId}` : undefined}
            >
              <div className="via-primary-500/10 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent" />

              {isPersonalEditor && (
                <div className="min-w-0 overflow-hidden px-6 pt-8 sm:px-12">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={activeTab <= 1}
                      onClick={() => goToSubTab(activeTab - 1)}
                      className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-35 dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-300 dark:hover:bg-[#252b3d]"
                    >
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                      Previous
                    </button>
                    <TabCompletionInspectorButton
                      compact
                      label={inspectorLabel}
                      panel={inspectorPanel}
                      vCardData={vCardData}
                      completionMeta={completionMeta}
                    />
                    <button
                      type="button"
                      disabled={activeTab >= 5}
                      onClick={() => goToSubTab(activeTab + 1)}
                      className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-35 dark:border-white/10 dark:bg-[#1e2333] dark:text-white dark:hover:bg-[#252b3d]"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <div
                    ref={subNavRef}
                    className={cn(
                      'items-center gap-8 border-b border-slate-200 dark:border-white/5',
                      subNavScrollClassName
                    )}
                  >
                    {personalSubs.map((tab) => {
                      const isActive = activeTab === tab.id
                      const done = tab.total ? tab.filled >= tab.total : tab.percent >= 100
                      const href = subTabHref(tab.id)
                      return (
                        <Link
                          key={tab.id}
                          href={href}
                          prefetch={false}
                          onClick={(event) => handleEditorLinkClick(event, href)}
                          draggable={false}
                          className={cn(
                            'group relative flex shrink-0 cursor-pointer flex-col gap-3 pb-5 text-[14px] font-semibold whitespace-nowrap transition-all',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'dark:hover:text-primary-300 text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-300',
                                done
                                  ? 'border-transparent bg-emerald-500 text-white'
                                  : isActive
                                    ? 'bg-primary-600 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/40 scale-110 border-transparent text-white shadow-sm'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400'
                              )}
                            >
                              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : tab.id}
                            </div>
                            <span>{tab.name}</span>
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                                done
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : isActive
                                    ? 'bg-primary-500/15 text-primary-600 dark:text-primary-300'
                                    : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                              )}
                            >
                              {tab.total ? `${tab.filled}/${tab.total}` : `${tab.percent}%`}
                            </span>
                          </div>
                          {isActive && (
                            <div className="absolute right-0 bottom-0 left-0 h-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                              <div
                                className="bg-primary-600 dark:bg-primary-500 h-full transition-all"
                                style={{ width: `${tab.percent}%` }}
                              />
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="relative flex-1 p-6 sm:p-12">
                {!isPersonalEditor && editorPanel.kind !== 'empty' ? (
                  <div className="mb-6 flex justify-end">
                    <TabCompletionInspectorButton
                      label={inspectorLabel}
                      panel={inspectorPanel}
                      vCardData={vCardData}
                      completionMeta={completionMeta}
                    />
                  </div>
                ) : null}
                <div key={`${activeNavId}-${activeTab}`} className="animate-in fade-in zoom-in-95 h-full duration-500">
                  {editorPanel.kind === 'empty' ? (
                    <EditorNavEmptyPanel
                      title={activeNavItem?.label ?? 'Section'}
                      tourTargetId={`tour-editor-panel-${activeNavId}`}
                    />
                  ) : (
                    renderEditorPanel(editorPanel)
                  )}
                </div>
              </div>

              {isPersonalEditor && (
                <div className="mt-auto flex items-center justify-between rounded-b-3xl border-t border-slate-200 bg-slate-50 p-6 sm:px-12 dark:border-white/5 dark:bg-white/2">
                  {activeTab > 1 ? (
                    <button
                      onClick={() => goToSubTab(activeTab - 1)}
                      className="group mobile:px-7 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-300 dark:hover:bg-[#252b3d]"
                    >
                      <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />{' '}
                      Previous
                    </button>
                  ) : (
                    <div></div>
                  )}
                  {activeTab < 5 ? (
                    <button
                      onClick={() => goToSubTab(activeTab + 1)}
                      className="group mobile:px-7 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#1e2333] dark:text-white dark:hover:bg-[#252b3d]"
                    >
                      Next Step{' '}
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  ) : isCreateMode ? (
                    <button
                      onClick={async () => {
                        setIsSaving(true)
                        try {
                          await saveVCard()
                          notify.success('Draft saved. Use Preview to review it, then Activate card when ready.')
                        } catch (e) {
                          const message =
                            (e as { data?: { message?: string } })?.data?.message ||
                            (e as Error)?.message ||
                            'Could not create vCard.'
                          notify.error(message)
                        } finally {
                          setIsSaving(false)
                        }
                      }}
                      disabled={isSaving}
                      className="bg-primary-600 hover:bg-primary-700 border-primary-500/20 mobile:px-7 flex items-center gap-2.5 rounded-xl border px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4.5 w-4.5" />
                      )}
                      {isSaving ? 'Creating...' : 'Create draft'}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        setIsSaving(true)
                        try {
                          await flushSave()
                        } catch {
                          // Persist errors are already toasted from VCardContext.
                        } finally {
                          setIsSaving(false)
                        }
                      }}
                      disabled={isSaving || saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'idle'}
                      className="bg-primary-600 hover:bg-primary-700 border-primary-500/20 mobile:px-7 flex items-center gap-2.5 rounded-xl border px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSaving || saveStatus === 'saving' ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4.5 w-4.5" />
                      )}
                      {isSaving || saveStatus === 'saving' ? 'Saving...' : 'Save now'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleLivePreview}
        aria-pressed={showPreview}
        aria-label={showPreview ? 'Hide live preview' : 'Show live preview'}
        title={showPreview ? 'Hide live preview' : 'Show live preview'}
        className={cn(
          'group fixed right-4 bottom-4 z-60 hidden items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 md:flex lg:right-8 lg:bottom-8',
          showPreview
            ? 'h-14 w-14 border-slate-200 bg-white text-slate-900 shadow-lg hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
            : 'bg-primary-600 h-14 w-14 border-transparent text-white shadow-xl hover:scale-105'
        )}
      >
        <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {showPreview ? (
          <Eye className="h-5 w-5 text-slate-500 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white" />
        ) : (
          <Eye className="h-6 w-6 shrink-0" />
        )}
      </button>

      <AddTabsModal
        open={showAddTabs}
        onClose={() => setShowAddTabs(false)}
        enabledIds={enabledNavIds}
        vCardData={vCardData}
        onApply={applyAddTabs}
      />

      <AiGenerateModal open={showAiModal} onClose={() => setShowAiModal(false)} onApply={applyAiProfile} />
    </div>
  )
}
