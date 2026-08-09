'use client'

import { EditorNavEmptyPanel } from '@/components/EditorNavEmptyPanel'
import { EditorNavInfoPanel } from '@/components/EditorNavInfoPanel'
import { TakeTourBanner } from '@/components/tour/TakeTourBanner'
import { AddTabsModal } from '@/components/vcard/AddTabsModal'
import { AiGenerateModal, type AiProfilePayload } from '@/components/vcard/AiGenerateModal'
import { SectionPostsEditorPanel } from '@/components/vcard/SectionPostsEditorPanel'
import { TabBlog } from '@/components/VCardBlog'
import { TabCertificates } from '@/components/VCardCertificates'
import { TabContentMedia } from '@/components/VCardContentMedia'
import { TabEducation } from '@/components/VCardEducation'
import { TabExperience } from '@/components/VCardExperience'
import { TabFaq } from '@/components/VCardFaq'
import { TabGlobalConnection } from '@/components/VCardGlobalConnection'
import { TabLinkShortener } from '@/components/VCardLinkShortener'
import { VCardLivePreview } from '@/components/VCardLivePreview'
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
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { createCardTabNameToNavId, getDefaultCreateCardNavIds } from '@/lib/createCardTabs'
import { requestTourRemeasure } from '@/lib/dashboardTour'
import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import {
  getNavItemCompletionPercent,
  getOverallCardCompletionPercent,
  getPersonalSubCompletions,
} from '@/lib/vcardCompletion'
import { useVCard } from '@/lib/VCardContext'
import { getDisplaySettingsFromVCard, patchDisplayField } from '@/lib/vcardDisplaySettings'
import {
  buildEditorPath,
  buildEditorSectionPath,
  buildEditorSettingsPath,
  parseEditorSegments,
  type EditorBasePath,
} from '@/lib/vcardEditorRoutes'
import {
  filterEditorMainNavItems,
  filterNavItemsByVisibility,
  getEditorNavLabel,
  getNavItemById,
  isPersonalEditorNavId,
  LOCKED_NAV_ITEM_IDS,
  NAV_BAR_NAV_ITEMS,
  sortNavItemsByOrder,
  storageKeyForEditorNavOrder,
  type EditorNavPanel,
} from '@/lib/vcardNavbar'
import { getSectionSchema } from '@/lib/vcardSectionSchemas'
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
  Settings,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

type VCardEditProps = {
  basePath: EditorBasePath
  segments?: string[]
  cardId?: string
}

function readEditorNavOrderIds(cardKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKeyForEditorNavOrder(cardKey))
    if (!raw) return getDefaultCreateCardNavIds()
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) && parsed.length ? parsed : getDefaultCreateCardNavIds()
  } catch {
    return getDefaultCreateCardNavIds()
  }
}

export default function VCardEdit({ basePath, segments, cardId }: VCardEditProps) {
  const router = useRouter()
  const role = useAppSelector((state) => state.user.user?.role)
  const directoryHref =
    role === 'corporate-owner'
      ? '/teamvcard'
      : role === 'admin' || role === 'super-admin'
        ? '/admin/mycards'
        : '/vcards'
  const directoryLabel =
    role === 'corporate-owner'
      ? 'Back to Team vCards'
      : role === 'admin' || role === 'super-admin'
        ? 'Back to My Cards'
        : 'Back to My vCards'
  const {
    vCardData,
    updateData,
    saveVCard,
    flushSave,
    saveStatus,
    saveError,
    isCreateMode,
    cardId: contextCardId,
    avatarImageUrl,
  } = useVCard()
  const display = useMemo(() => getDisplaySettingsFromVCard(vCardData), [vCardData])
  const completionMeta = useMemo(() => ({ avatarImageUrl }), [avatarImageUrl])
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddTabs, setShowAddTabs] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const { isActive: isTourActive, currentStep, registerActivateTab } = useDashboardTour()

  const cardKey = contextCardId || cardId || 'draft'
  const isClient = typeof window !== 'undefined'
  const [navOrderIds, setNavOrderIds] = useState(() =>
    isClient ? readEditorNavOrderIds(cardKey) : getDefaultCreateCardNavIds()
  )
  const [navOrderReady, setNavOrderReady] = useState(isClient)
  const [navOrderCardKey, setNavOrderCardKey] = useState(cardKey)

  if (!navOrderReady && isClient) {
    setNavOrderReady(true)
    setNavOrderIds(readEditorNavOrderIds(cardKey))
  }

  if (cardKey !== navOrderCardKey) {
    setNavOrderCardKey(cardKey)
    setNavOrderIds(isClient ? readEditorNavOrderIds(cardKey) : getDefaultCreateCardNavIds())
  }

  const visibleNavItems = useMemo(() => {
    const filtered = filterEditorMainNavItems(filterNavItemsByVisibility(NAV_BAR_NAV_ITEMS, display))
    const ordered = sortNavItemsByOrder(filtered, navOrderIds)
    if (!navOrderIds.length) return ordered
    const idSet = new Set(navOrderIds)
    const preferred = ordered.filter((item) => idSet.has(item.id))
    return preferred.length ? preferred : ordered
  }, [display, navOrderIds])

  const enabledNavIds = useMemo(() => visibleNavItems.map((item) => item.id), [visibleNavItems])
  const personalSubs = useMemo(() => getPersonalSubCompletions(vCardData, completionMeta), [vCardData, completionMeta])

  const saveStatusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'dirty'
        ? 'Unsaved'
        : saveStatus === 'saved'
          ? 'Saved'
          : saveStatus === 'error'
            ? 'Save failed'
            : null

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

  const overallPercent = useMemo(
    () => getOverallCardCompletionPercent(visibleNavItems, vCardData, completionMeta),
    [visibleNavItems, vCardData, completionMeta]
  )
  const activeNavIndex = useMemo(() => {
    const chipId = isPersonalEditorNavId(activeNavId) ? 'home' : activeNavId
    return visibleNavItems.findIndex((item) => item.id === chipId)
  }, [visibleNavItems, activeNavId])

  const activeNavItem = getNavItemById(activeNavId)
  const editorPanel = activeNavItem?.editorPanel ?? { kind: 'empty' as const }
  const isPersonalEditor = editorPanel.kind === 'personal'

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

  const sectionHref = (sectionId: string) => buildEditorSectionPath(basePath, sectionId, cardId)
  const settingsHref = buildEditorSettingsPath(basePath, route.settingsTab, cardId)
  /** Prefer /home for personal sub-tabs so About Me deep-links consolidate under Personal. */
  const personalSubSectionId = activeNavId === 'about' ? 'home' : activeNavId
  const subTabHref = (tabId: number) =>
    buildEditorPath(basePath, { sectionId: personalSubSectionId, subTab: tabId }, cardId)

  useEffect(() => {
    const activate = (tab: string) => {
      const navId = createCardTabNameToNavId(tab)
      if (!navId) return
      router.push(buildEditorSectionPath(basePath, navId, cardId))
    }
    registerActivateTab(activate)
    return () => registerActivateTab(null)
  }, [registerActivateTab, router, basePath, cardId])

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

  useEffect(() => {
    const t = window.setTimeout(() => {
      updateOverflow()
      if (!isSettingsOpen) {
        const chipId = isPersonalEditorNavId(activeNavId) ? 'home' : activeNavId
        scrollActiveIntoPeek(chipId)
      }
    }, 60)
    return () => window.clearTimeout(t)
  }, [visibleNavItems.length, activeNavId, isSettingsOpen, cardKey, scrollActiveIntoPeek, updateOverflow])

  const goToSubTab = (tabId: number) => {
    router.push(subTabHref(tabId))
  }

  const applyAddTabs = (nextIds: string[]) => {
    let next = display
    const idSet = new Set(nextIds)
    for (const item of NAV_BAR_NAV_ITEMS) {
      const visible = LOCKED_NAV_ITEM_IDS.has(item.id) || idSet.has(item.id)
      next = patchDisplayField(next, item.label, { visible })
    }
    updateData('displaySettings', next)
    setNavOrderIds(nextIds)
    localStorage.setItem(storageKeyForEditorNavOrder(cardKey), JSON.stringify(nextIds))

    const added = nextIds.filter((id) => !enabledNavIds.includes(id))
    if (added.length) {
      router.push(sectionHref(added[0]))
    } else if (!nextIds.includes(activeNavId) && nextIds[0]) {
      router.push(sectionHref(nextIds[0]))
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

  return (
    <div className="relative flex min-h-screen w-full justify-center pt-4 pb-24 sm:pt-10" data-tour-editor-scope>
      <div className="bg-primary-500/10 pointer-events-none fixed top-20 left-1/2 h-125 w-full max-w-250 -translate-x-1/2 rounded-full blur-[150px]" />

      <div className="relative z-10 flex w-full max-w-325 flex-col gap-6">
        <TakeTourBanner
          tourKey="create_card"
          title="Take a create-card tour"
          body="Guided walkthrough of Generate, Portfolio, Services, Skill, AI Auto-fill, My Info, and every major tab — start anytime."
        />
        <Link
          href={directoryHref}
          className="hover:border-primary-500/30 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:text-slate-900 dark:border-white/10 dark:bg-[#0b0f19]/80 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {directoryLabel}
        </Link>

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
                    const isActive =
                      !isSettingsOpen &&
                      (activeNavId === item.id || (item.id === 'home' && isPersonalEditorNavId(activeNavId)))
                    const percent = getNavItemCompletionPercent(item.editorPanel, vCardData, completionMeta)
                    const done = percent >= 100
                    const chipLabel = getEditorNavLabel(item)
                    const isNeighbor =
                      activeNavIndex >= 0 && !isActive && index >= activeNavIndex - 2 && index <= activeNavIndex + 2
                    return (
                      <Link
                        key={item.id}
                        href={sectionHref(item.id)}
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
                            {percent}%
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

              {!isCreateMode && saveStatusLabel && SaveStatusIcon && (
                <button
                  type="button"
                  title={saveStatus === 'error' ? saveError || 'Save failed — click to retry' : saveStatusLabel}
                  onClick={() => {
                    if (saveStatus === 'error' || saveStatus === 'dirty') {
                      void flushSave().catch(() => undefined)
                    }
                  }}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-all',
                    saveStatus === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                      : saveStatus === 'dirty'
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                        : saveStatus === 'saving'
                          ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  )}
                >
                  <SaveStatusIcon className={cn('h-3.5 w-3.5', saveStatus === 'saving' && 'animate-spin')} />
                  {saveStatusLabel}
                </button>
              )}

              <Link
                id="tour-editor-settings"
                href={settingsHref}
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

              <button
                type="button"
                data-tour="ai-generate"
                data-tour-id="tour-ai-generate"
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-3 py-2 text-[14px] font-bold whitespace-nowrap text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
                title="Generate with AI"
              >
                <Sparkles className="h-5 w-5 text-emerald-200" />
                Generate
              </button>

              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 whitespace-nowrap shadow-sm dark:border-white/5 dark:bg-white/5">
                <span className="pointer-events-none text-[10px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Visibility
                </span>
                <label className="group flex cursor-pointer items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={vCardData.isPublic}
                      onChange={(e) => updateData('isPublic', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 shadow-sm peer-checked:bg-emerald-500 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-4 peer-checked:after:border-white dark:bg-slate-700"></div>
                  </div>
                </label>
              </div>
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
                  <div
                    ref={subNavRef}
                    className={cn(
                      'items-center gap-8 border-b border-slate-200 dark:border-white/5',
                      subNavScrollClassName
                    )}
                  >
                    {personalSubs.map((tab) => {
                      const isActive = activeTab === tab.id
                      const done = tab.percent >= 100
                      return (
                        <Link
                          key={tab.id}
                          href={subTabHref(tab.id)}
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
                              {tab.percent}%
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
                <div className="animate-in fade-in zoom-in-95 fill-mode-both h-full duration-500">
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
                        } catch (e) {
                          alert('Error saving Profile: ' + (e as Error).message)
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
                      {isSaving ? 'Creating...' : 'Create vCard'}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        setIsSaving(true)
                        try {
                          await flushSave()
                        } catch (e) {
                          alert('Error saving Profile: ' + (e as Error).message)
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
        onClick={() => setShowPreview(!showPreview)}
        className={cn(
          'group fixed right-4 bottom-4 z-60 flex items-center justify-center overflow-hidden rounded-2xl border transition-all duration-300 lg:right-8 lg:bottom-8',
          showPreview &&
            'max-sm:right-3 max-sm:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:scale-90 max-sm:opacity-90',
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

      <VCardLivePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        editorSectionId={route.isSettings ? DEFAULT_PROFILE_SECTION : route.sectionId}
      />

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
