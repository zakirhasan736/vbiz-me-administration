'use client'

import { EditorNavEmptyPanel } from '@/components/EditorNavEmptyPanel'
import { EditorNavInfoPanel } from '@/components/EditorNavInfoPanel'
import { SectionPostsEditorPanel } from '@/components/vcard/SectionPostsEditorPanel'
import { TabBlog } from '@/components/VCardBlog'
import { TabEducation } from '@/components/VCardEducation'
import { TabExperience } from '@/components/VCardExperience'
import { TabFaq } from '@/components/VCardFaq'
import { TabLinkShortener } from '@/components/VCardLinkShortener'
import { VCardLivePreview } from '@/components/VCardLivePreview'
import { TabPortfolio } from '@/components/VCardPortfolio'
import { TabServices } from '@/components/VCardServices'
import { TabSetting } from '@/components/VCardSetting'
import { TabSkill } from '@/components/VCardSkill'
import { Tab1MediaProfile } from '@/components/VCardTab1'
import { Tab2PersonalInfo } from '@/components/VCardTab2'
import { Tab3SocialGames } from '@/components/VCardTab3'
import { Tab4HomeMedia } from '@/components/VCardTab4'
import { Tab5ExtraFields } from '@/components/VCardTab5'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { requestTourRemeasure, runWithTourProgrammaticScroll } from '@/lib/dashboardTour'
import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import { useVCard } from '@/lib/VCardContext'
import { getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import {
  buildEditorPath,
  buildEditorSectionPath,
  buildEditorSettingsPath,
  parseEditorSegments,
  type EditorBasePath,
} from '@/lib/vcardEditorRoutes'
import { filterNavItemsByVisibility, getNavItemById, NAV_BAR_NAV_ITEMS, type EditorNavPanel } from '@/lib/vcardNavbar'
import { getSectionSchema } from '@/lib/vcardSectionSchemas'
import { cn } from '@/utils/cn'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Eye,
  FileText,
  Loader2,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useMemo, useState } from 'react'

const subTabs = [
  { id: 1, name: 'Media & Profile' },
  { id: 2, name: 'Personal Info' },
  { id: 3, name: 'Social & Games' },
  { id: 4, name: 'Home Media' },
  { id: 5, name: 'Extra Fields' },
]

type VCardEditProps = {
  basePath: EditorBasePath
  segments?: string[]
  cardId?: string
}

export default function VCardEdit({ basePath, segments, cardId }: VCardEditProps) {
  const router = useRouter()
  const {
    vCardData,
    updateData,
    saveVCard,
    flushSave,
    saveStatus,
    saveError,
    isCreateMode,
    cardId: contextCardId,
  } = useVCard()
  const display = useMemo(() => getDisplaySettingsFromVCard(vCardData), [vCardData])
  const visibleNavItems = useMemo(() => filterNavItemsByVisibility(NAV_BAR_NAV_ITEMS, display), [display])
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isActive: isTourActive, currentStep } = useDashboardTour()

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
      case 'blog':
        return <TabBlog />
      case 'faq':
        return <TabFaq />
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

    if (currentStep.id === 'editor-settings') {
      const main = document.getElementById('main-scroll')
      if (main && main.scrollTop > 0) {
        runWithTourProgrammaticScroll(() => {
          main.scrollTo({ top: 0, behavior: 'instant' })
        })
      }
    }

    requestAnimationFrame(() => requestTourRemeasure())
  }, [isTourActive, currentStep, segments])

  const { scrollRef: mainNavRef, scrollClassName: mainNavScrollClassName } = useHorizontalScroll(
    'editor-main-nav',
    segments
  )
  const { scrollRef: subNavRef, scrollClassName: subNavScrollClassName } = useHorizontalScroll(
    'editor-sub-nav',
    segments
  )

  const sectionHref = (sectionId: string) => buildEditorSectionPath(basePath, sectionId, cardId)
  const settingsHref = buildEditorSettingsPath(basePath, route.settingsTab, cardId)
  const subTabHref = (tabId: number) => buildEditorPath(basePath, { sectionId: activeNavId, subTab: tabId }, cardId)

  const goToSubTab = (tabId: number) => {
    router.push(subTabHref(tabId))
  }

  return (
    <div className="relative flex min-h-screen w-full justify-center pt-4 pb-24 sm:pt-10" data-tour-editor-scope>
      <div className="bg-primary-500/10 pointer-events-none fixed top-20 left-1/2 h-125 w-full max-w-250 -translate-x-1/2 rounded-full blur-[150px]" />

      <div className="relative z-10 flex w-full max-w-325 flex-col gap-6">
        {isCreateMode && (
          <Link
            href="/vcards"
            className="hover:border-primary-500/30 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:text-slate-900 dark:border-white/10 dark:bg-[#0b0f19]/80 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My vCards
          </Link>
        )}

        <div className="flex w-full justify-center">
          <div className="relative flex w-full min-w-0 flex-col justify-between gap-2 rounded-3xl border border-slate-200 bg-white/60 p-2 shadow-sm backdrop-blur-2xl md:flex-row md:items-center dark:border-white/5 dark:bg-[#0b0f19]/60">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                ref={mainNavRef}
                className={cn('mask-edges flex-nowrap items-center gap-1 px-2 md:px-4', mainNavScrollClassName)}
              >
                {visibleNavItems.map((item) => {
                  const isActive = !isSettingsOpen && activeNavId === item.id
                  return (
                    <Link
                      key={item.id}
                      href={sectionHref(item.id)}
                      draggable={false}
                      data-tour-id={`tour-nav-${item.id}`}
                      title={item.label}
                      className={cn(
                        'flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-all duration-300',
                        isActive
                          ? 'bg-primary-600 border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 scale-[1.02] border text-white shadow-sm'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'dark:text-primary-400 text-white' : 'text-slate-500 dark:text-slate-400'
                        )}
                      />
                      <span className="max-w-36 truncate sm:max-w-none">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mx-2 hidden h-8 w-px shrink-0 bg-slate-200 md:block dark:bg-white/10" />

            <div className="flex shrink-0 items-center gap-3 px-2 pb-2 md:pb-0">
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
                    'flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-[12.5px] font-semibold whitespace-nowrap transition-all',
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
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-[13.5px] font-semibold whitespace-nowrap transition-all duration-300',
                  isSettingsOpen
                    ? 'bg-primary-600 border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 scale-[1.02] border text-white shadow-sm'
                    : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                )}
              >
                <Settings className={cn('h-4 w-4', isSettingsOpen ? 'dark:text-primary-400 text-white' : '')} />
                Settings
              </Link>

              <button className="hover:border-primary-500/50 dark:hover:text-primary-400 group flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold whitespace-nowrap text-slate-700 shadow-sm transition-all duration-300 hover:text-slate-900 dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-200">
                <FileText className="text-primary-600 dark:text-primary-400 h-4 w-4" />
                My vCard
              </button>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 whitespace-nowrap shadow-sm dark:border-white/5 dark:bg-white/5">
                <span className="pointer-events-none text-[11px] font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
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
              data-tour-id={isPersonalEditor ? `tour-editor-panel-${activeNavId}` : undefined}
            >
              <div className="via-primary-500/10 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent" />

              {isPersonalEditor && (
                <div className="min-w-0 overflow-hidden px-6 pt-8 sm:px-12">
                  <div
                    ref={subNavRef}
                    className={cn(
                      'items-end gap-10 border-b border-slate-200 dark:border-white/5',
                      subNavScrollClassName
                    )}
                  >
                    {subTabs.map((tab) => {
                      const isActive = activeTab === tab.id
                      return (
                        <Link
                          key={tab.id}
                          href={subTabHref(tab.id)}
                          draggable={false}
                          className={cn(
                            'group relative shrink-0 cursor-pointer pb-4 text-[14px] font-semibold whitespace-nowrap transition-colors duration-200',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'dark:hover:text-primary-300 text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition-colors duration-200',
                                isActive
                                  ? 'bg-primary-600 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/40 border-transparent text-white shadow-sm'
                                  : 'group-hover:border-primary-500/50 dark:group-hover:border-primary-500/50 dark:group-hover:text-primary-400 border-slate-200 bg-slate-50 text-slate-500 group-hover:text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400'
                              )}
                            >
                              {tab.id}
                            </div>
                            <span>{tab.name}</span>
                          </div>
                          <div
                            className={cn(
                              'bg-primary-600 dark:bg-primary-500 absolute inset-x-0 -bottom-px h-0.5 transition-opacity duration-200',
                              isActive ? 'opacity-100' : 'opacity-0'
                            )}
                          />
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
    </div>
  )
}
