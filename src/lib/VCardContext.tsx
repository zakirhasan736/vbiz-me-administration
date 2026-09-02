'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { hasAboutMeDraftContent } from '@/lib/aboutMeDraft'
import { flushAboutMeUpsert } from '@/lib/aboutMePersist'
import { clearCreateCardOwner, getCreateCardOwner } from '@/lib/admin/createCardOwner'
import { useCardScopeId, useCardScopeMode } from '@/lib/card-scope'
import {
  collectVCardActivationProblems,
  collectVCardCreationProblems,
  vCardActivationProblemMessage,
  vCardCreationProblemMessage,
} from '@/lib/cardActivation'
import { AI_CARD_AGENT_EVENT, readAiCardAgentOpen } from '@/lib/dashboardTour'
import { broadcastPublicCardSettingsSaved } from '@/lib/publicCardLiveSync'
import { TAB_REGISTRY } from '@/lib/tabRegistry'
import { applyEditorSettingsToThemeConfig } from '@/lib/theme/resolveCardTheme'
import { notify } from '@/lib/toast/toast'
import {
  clearPendingCardSave,
  clearProfileCreationKey,
  createAutosaveScheduler,
  dirtyBucketForPath,
  getOrCreateProfileCreationKey,
  hasPersistablePostsDelta,
  isEmptyFaq,
  isEmptyGeneralPost,
  isEmptySectionPost,
  isSaveWorthyChange,
  mergeLocalEmptyDrafts,
  persistableEducation,
  persistableExperience,
  persistableFaqs,
  persistableGeneralPosts,
  persistablePortfolio,
  persistableReviews,
  persistableSectionPosts,
  persistableServices,
  persistableSkills,
  readPendingCardSave,
  setByPath,
  writePendingCardSave,
} from '@/lib/vcardAutosave'
import { designSettingsToVCardDefaults } from '@/lib/vcardDesignDefaults'
import { applyEnabledNavOrderToDisplaySettings, getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import { DEFAULT_EDITOR_SECTION, buildEditorPath } from '@/lib/vcardEditorRoutes'
import { isExplainerMediaPath } from '@/lib/vcardExplainerFromProfileMedia'
import { storageKeyForEditorNavOrder } from '@/lib/vcardNavbar'
import { loadAndSyncSectionPosts, mapApiPostsToSectionPosts } from '@/lib/vcardPostsSync'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { VCARD_SECTION_SCHEMAS } from '@/lib/vcardSectionSchemas'
import { skillGroupsToApiItems } from '@/lib/vcardSkills'
import { shouldAutofillSlugFromName, slugFromDisplayName } from '@/lib/vcardSlug'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { publicApi } from '@/redux/api/publicApi'
import {
  BLOG_POST_TYPE,
  FAQ_POST_TYPE,
  isLocalTempId,
  mapApiPostsToFaqs,
  mapApiPostsToGeneralPosts,
  mapApiProfileToVCardRecord,
  mapVCardDataToProfilePayload,
  useCreateProfileBlogMutation,
  useCreateProfileMutation,
  useCreateProfilePostMutation,
  useCreateProfileTabItemMutation,
  useDeleteProfileBlogMutation,
  useDeleteProfilePostMutation,
  useDeleteProfileTabItemMutation,
  useGetProfileQuery,
  useLazyListEditorSectionsQuery,
  useLazyListProfileBlogsQuery,
  useLazyListProfilePostsQuery,
  useLazyListProfileTabItemsQuery,
  useReplaceEducationMutation,
  useReplaceExperiencesMutation,
  useReplacePortfoliosMutation,
  useReplaceReviewsMutation,
  useReplaceServicesMutation,
  useReplaceSkillsMutation,
  useReplaceSocialLinksMutation,
  useUpdateProfileBlogMutation,
  useUpdateProfileCardMutation,
  useUpdateProfilePostMutation,
  useUpdateProfileTabItemMutation,
} from '@/redux/features/profiles/profiles.api'
import { addVCard, replaceVCardData, selectVCardById, updateVCard } from '@/redux/features/vcards/vcards.slice'
import type { RootState } from '@/redux/store'
import type { VCardData, VCardRecord, VCardSectionPostItem } from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'
import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type VCardSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type DirtyBucket =
  | 'profile'
  | 'education'
  | 'experience'
  | 'services'
  | 'portfolio'
  | 'reviews'
  | 'skills'
  | 'socialLinks'
  | 'posts'
  | 'aboutMe'

const ALL_DIRTY_BUCKETS: DirtyBucket[] = [
  'profile',
  'education',
  'experience',
  'services',
  'portfolio',
  'reviews',
  'skills',
  'socialLinks',
  'posts',
]

const PUBLIC_INVALIDATE_DEBOUNCE_MS = 4000

const PUBLIC_INVALIDATION_TAGS = [
  'MyCard',
  'DynamicSection',
  'ProfileAiData',
  'ProfileSettings',
  'NavBarLinks',
  'AboutMe',
  'Services',
  'Gallery',
  'Reviews',
  'Clients',
  'Videos',
  'VideoExplainer',
] as const

/** Settings/SEO/template/theme — do not blast section caches on autosave. */
const SETTINGS_PUBLIC_TAGS = ['MyCard', 'ProfileSettings', 'NavBarLinks', 'ProfileAiData'] as const

interface VCardContextType {
  cardId: string | null
  isCreateMode: boolean
  vCardData: VCardData
  avatarImageUrl: string
  updateData: (path: string, value: unknown) => void
  updateMeta: (patch: { avatarImageUrl?: string }) => void
  markAboutMeDirty: () => void
  saveVCard: (opts?: { skipNavigate?: boolean; publish?: boolean }) => Promise<string | void>
  flushSave: () => Promise<void>
  saveStatus: VCardSaveStatus
  saveError: string | null
  loading: boolean
}

const VCardContext = createContext<VCardContextType | undefined>(undefined)

function applyNameSlugAutofill(prev: VCardData, next: VCardData, path: string): VCardData {
  if (path !== 'personal.fullName') return next
  if (!shouldAutofillSlugFromName(prev.slug)) return next
  const generated = slugFromDisplayName(String(next.personal?.fullName || ''))
  if (!generated) return next
  return { ...next, slug: generated }
}

/** Profession + designation stay identical in the builder; designation wins when present. */
function applyProfessionDesignationSync(next: VCardData, path: string, value: unknown): VCardData {
  if (path !== 'personal.designation' && path !== 'personal.profession') return next
  if (typeof value !== 'string') return next
  const personal = next.personal
  if (!personal) return next
  if (personal.designation === value && personal.profession === value) return next
  return {
    ...next,
    personal: {
      ...personal,
      designation: value,
      profession: value,
    },
  }
}

function toVCardData(record: VCardRecord): VCardData {
  const rest = { ...record } as Record<string, unknown>
  delete rest.id
  delete rest.createdAt
  delete rest.updatedAt
  delete rest.views
  delete rest.saves
  delete rest.avatarImageUrl
  delete rest.isActive
  return rest as VCardData
}

/** Merge server-normalized profile fields without dropping separately persisted collections/posts. */
function mergeServerProfileData(current: VCardData, server: VCardData): VCardData {
  return {
    ...current,
    ...server,
    education: current.education,
    experience: current.experience,
    services: current.services,
    portfolio: current.portfolio,
    reviews: current.reviews,
    skills: current.skills,
    generalPosts: current.generalPosts,
    faqs: current.faqs,
    sectionPosts: current.sectionPosts,
    social: {
      ...(server.social ?? current.social ?? createDefaultVCardSocial()),
      customLinks: current.social?.customLinks ?? [],
    },
  }
}

function buildCreateDraft(design: RootState['designSettings']): VCardData {
  const defaults = designSettingsToVCardDefaults(design)
  return createDefaultVCardData({
    theme: defaults.theme,
    appearance: defaults.appearance,
  })
}

function designDefaultsSignature(design: RootState['designSettings']): string {
  const d = designSettingsToVCardDefaults(design)
  return JSON.stringify(d)
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (
      err as {
        data?: { message?: string; requestId?: string; errorMessages?: { path?: string; message?: string }[] }
      }
    ).data
    const withReference = (message: string) => (data?.requestId ? `${message} (Reference: ${data.requestId})` : message)
    if (data?.message && data.message !== 'Validation Error') return withReference(data.message)
    const details = data?.errorMessages?.map((item) => item.message).filter((msg): msg is string => Boolean(msg))
    if (details?.length) return withReference(details.join('. '))
    if (data?.message) return withReference(data.message)
  }
  if (err instanceof Error && err.message) return err.message
  return 'Failed to save changes'
}

const SAVE_ERROR_TOAST_DEDUPE_MS = 4000
let lastSaveErrorToast: { message: string; at: number } | null = null

function toastSaveError(message: string) {
  const now = Date.now()
  if (
    lastSaveErrorToast &&
    lastSaveErrorToast.message === message &&
    now - lastSaveErrorToast.at < SAVE_ERROR_TOAST_DEDUPE_MS
  ) {
    return
  }
  lastSaveErrorToast = { message, at: now }
  notify.error(message)
}

const SAVE_SUCCESS_TOAST_DEDUPE_MS = 1800
let lastSaveSuccessToast: { message: string; at: number } | null = null

function toastSaveSuccess(buckets: ReadonlySet<DirtyBucket>) {
  const message = buckets.size === 1 && buckets.has('profile') ? 'Card settings saved.' : 'Card changes saved.'
  const now = Date.now()
  if (
    lastSaveSuccessToast &&
    lastSaveSuccessToast.message === message &&
    now - lastSaveSuccessToast.at < SAVE_SUCCESS_TOAST_DEDUPE_MS
  ) {
    return
  }
  lastSaveSuccessToast = { message, at: now }
  notify.success(message)
}

function isAppearanceOrThemePath(path: string): boolean {
  return path === 'theme' || path.startsWith('theme.') || path === 'appearance' || path.startsWith('appearance.')
}

function isCreateDraftAutosaveReady(data: VCardData): boolean {
  return Boolean(
    data.personal?.fullName?.trim() && data.slug?.trim() && collectVCardCreationProblems(data).length === 0
  )
}

export function VCardProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const cardId = useCardScopeId()
  const mode = useCardScopeMode()
  const isCreateMode = mode === 'create'
  const design = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s: RootState) => selectVCardById(s, cardId))
  const recordRef = useRef(record)
  recordRef.current = record

  const { data: remoteProfile, isFetching } = useGetProfileQuery(cardId || '', {
    skip: isCreateMode || !cardId,
    refetchOnMountOrArgChange: true,
  })
  const [createProfile, { isLoading: creating }] = useCreateProfileMutation()
  const [updateProfileCard] = useUpdateProfileCardMutation()
  const [replaceEducation] = useReplaceEducationMutation()
  const [replaceExperiences] = useReplaceExperiencesMutation()
  const [replaceServices] = useReplaceServicesMutation()
  const [replacePortfolios] = useReplacePortfoliosMutation()
  const [replaceReviews] = useReplaceReviewsMutation()
  const [replaceSkills] = useReplaceSkillsMutation()
  const [replaceSocialLinks] = useReplaceSocialLinksMutation()
  const [listPosts] = useLazyListProfilePostsQuery()
  const [createPost] = useCreateProfilePostMutation()
  const [updatePost] = useUpdateProfilePostMutation()
  const [deletePost] = useDeleteProfilePostMutation()
  const [listBlogs] = useLazyListProfileBlogsQuery()
  const [createBlog] = useCreateProfileBlogMutation()
  const [updateBlog] = useUpdateProfileBlogMutation()
  const [deleteBlog] = useDeleteProfileBlogMutation()
  const [listTabItems] = useLazyListProfileTabItemsQuery()
  const [listEditorSections] = useLazyListEditorSectionsQuery()
  const [createTabItem] = useCreateProfileTabItemMutation()
  const [updateTabItem] = useUpdateProfileTabItemMutation()
  const [deleteTabItem] = useDeleteProfileTabItemMutation()

  const postsHydratedForId = useRef<string | null>(null)
  const postsSnapshotRef = useRef<{
    generalPosts: VCardData['generalPosts']
    faqs: VCardData['faqs']
    sectionPosts: Record<string, VCardSectionPostItem[]>
  }>({
    generalPosts: [],
    faqs: [],
    sectionPosts: {},
  })

  const lastSavedDataRef = useRef<VCardData | null>(null)
  const lastSavedProfilePayloadRef = useRef<string>('')
  const editDataRef = useRef<VCardData | null>(null)
  const dirtyBucketsRef = useRef<Set<DirtyBucket>>(new Set())
  // A brand-new card waits for a genuine typing pause before creating and
  // navigating. Once it has a real ID, edit mode also uses the max checkpoint.
  const autosaveSchedulerRef = useRef(createAutosaveScheduler(isCreateMode ? { maxMs: 0 } : undefined))
  const scheduleAutosaveRef = useRef<() => void>(() => undefined)
  const savingRef = useRef(false)
  const pendingResaveRef = useRef(false)
  const saveGateRef = useRef({ dirty: false, saving: false })
  const editorHydratedForIdRef = useRef<string | null>(null)
  const createPromiseRef = useRef<Promise<string> | null>(null)
  const createdProfileIdRef = useRef<string | null>(null)
  const createAutosaveRef = useRef<() => Promise<string | void>>(async () => undefined)

  const [saveStatus, setSaveStatus] = useState<VCardSaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const invalidatePublicTags = useCallback(() => {
    dispatch(publicApi.util.invalidateTags([...PUBLIC_INVALIDATION_TAGS]))
  }, [dispatch])

  const invalidateSettingsPublicTags = useCallback(() => {
    dispatch(publicApi.util.invalidateTags([...SETTINGS_PUBLIC_TAGS]))
  }, [dispatch])

  const publicInvalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const schedulePublicInvalidate = useCallback(
    (immediate = false) => {
      if (publicInvalidateTimerRef.current) {
        clearTimeout(publicInvalidateTimerRef.current)
        publicInvalidateTimerRef.current = null
      }
      if (immediate) {
        invalidatePublicTags()
        return
      }
      publicInvalidateTimerRef.current = setTimeout(() => {
        publicInvalidateTimerRef.current = null
        invalidatePublicTags()
      }, PUBLIC_INVALIDATE_DEBOUNCE_MS)
    },
    [invalidatePublicTags]
  )

  useEffect(() => {
    editorHydratedForIdRef.current = null
    postsHydratedForId.current = null
    editDataRef.current = null
  }, [cardId])

  useEffect(() => {
    if (isCreateMode) return
    createPromiseRef.current = null
    createdProfileIdRef.current = null
  }, [isCreateMode])

  useEffect(() => {
    if (isCreateMode || !record) return
    // Keep the live draft ref aligned with Redux, but never clobber newer local edits
    // that landed in editDataRef ahead of the last dispatch.
    if (!editDataRef.current) {
      editDataRef.current = toVCardData(record)
    }
  }, [isCreateMode, record])

  useEffect(() => {
    if (!remoteProfile || isCreateMode) return

    const mapped = mapApiProfileToVCardRecord(remoteProfile)
    const profileId = mapped.id

    const metaPatch = {
      views: mapped.views,
      avatarImageUrl: mapped.avatarImageUrl,
      backgroundImageUrl: mapped.backgroundImageUrl,
      isActive: mapped.isActive,
      isDraft: mapped.isDraft,
      isPublic: mapped.isPublic,
    }

    // Refetch after autosave must not rewrite the open editor — that remounts fields and steals focus.
    if (editorHydratedForIdRef.current === profileId) {
      if (saveGateRef.current.dirty || saveGateRef.current.saving) return
      const current = recordRef.current
      const metaChanged =
        !current ||
        current.views !== metaPatch.views ||
        current.avatarImageUrl !== metaPatch.avatarImageUrl ||
        current.backgroundImageUrl !== metaPatch.backgroundImageUrl ||
        current.isActive !== metaPatch.isActive ||
        current.isDraft !== metaPatch.isDraft ||
        current.isPublic !== metaPatch.isPublic
      if (!metaChanged) return
      dispatch(updateVCard({ id: profileId, patch: metaPatch }))
      return
    }

    const mappedData = toVCardData(mapped)
    const pending = readPendingCardSave(profileId)
    const localRecord = recordRef.current
    const localData = localRecord?.id === profileId ? toVCardData(localRecord) : null

    if (pending && localData) {
      editDataRef.current = localData
      lastSavedDataRef.current = mappedData
      lastSavedProfilePayloadRef.current = JSON.stringify(mapVCardDataToProfilePayload(mappedData))
      for (const bucket of pending.buckets) dirtyBucketsRef.current.add(bucket)
      saveGateRef.current.dirty = true
      dispatch(addVCard({ id: profileId, seed: localData }))
      dispatch(updateVCard({ id: profileId, patch: { ...metaPatch, createdAt: mapped.createdAt } }))
      editorHydratedForIdRef.current = profileId
      window.setTimeout(() => {
        setSaveStatus('dirty')
        void flushSaveRef.current()
      }, 0)
      return
    }

    const posts = postsSnapshotRef.current
    const generalPosts = posts.generalPosts ?? []
    const faqs = posts.faqs ?? []
    const sectionPosts = posts.sectionPosts ?? {}
    const data = {
      ...mappedData,
      generalPosts: generalPosts.length ? generalPosts : mappedData.generalPosts,
      faqs: faqs.length ? faqs : mappedData.faqs,
      sectionPosts: Object.keys(sectionPosts).length ? sectionPosts : mappedData.sectionPosts,
    }

    editDataRef.current = data
    lastSavedDataRef.current = data
    lastSavedProfilePayloadRef.current = JSON.stringify(mapVCardDataToProfilePayload(data))
    dispatch(addVCard({ id: profileId, seed: data }))
    dispatch(replaceVCardData({ id: profileId, data }))
    dispatch(updateVCard({ id: profileId, patch: { ...metaPatch, createdAt: mapped.createdAt } }))
    editorHydratedForIdRef.current = profileId
  }, [remoteProfile, isCreateMode, dispatch])

  useEffect(() => {
    if (isCreateMode || !cardId) return
    if (postsHydratedForId.current === cardId) return

    const profileId = cardId
    let cancelled = false
    const publicNameToTabKey = (name: string) => {
      const needle = name.trim().toLowerCase()
      if (needle === 'faq') return 'faqs'
      if (needle === 'mission' || needle === 'mission statement' || needle === 'company mission statement') {
        return 'mission_statement'
      }
      return Object.values(TAB_REGISTRY).find((t) => t.publicSectionName.toLowerCase() === needle)?.key || null
    }

    const applyHydratedPosts = (
      generalPosts: VCardData['generalPosts'],
      faqs: VCardData['faqs'],
      sectionPosts: Record<string, VCardSectionPostItem[]>
    ) => {
      if (cancelled) return
      postsHydratedForId.current = profileId
      postsSnapshotRef.current = { generalPosts, faqs, sectionPosts }

      const latest = editDataRef.current || (record ? toVCardData(record) : null)
      if (!latest) return
      const withPosts = {
        ...latest,
        generalPosts,
        faqs,
        sectionPosts,
      }
      editDataRef.current = withPosts
      lastSavedDataRef.current = withPosts
      lastSavedProfilePayloadRef.current = JSON.stringify(mapVCardDataToProfilePayload(withPosts))
      dispatch(replaceVCardData({ id: profileId, data: withPosts }))
    }

    ;(async () => {
      try {
        const schemas = Object.values(VCARD_SECTION_SCHEMAS)
        try {
          const bundle = await listEditorSections(profileId).unwrap()
          if (!bundle || Array.isArray(bundle) || !bundle.tabs) {
            throw new Error('editor-sections unavailable')
          }
          const generalPosts = mapApiPostsToGeneralPosts(bundle.blogs || [])
          const faqs = mapApiPostsToFaqs(bundle.tabs.faqs || [])
          const sectionPosts: Record<string, VCardSectionPostItem[]> = {}
          schemas.forEach((schema) => {
            const tabKey = publicNameToTabKey(schema.postTypeName)
            sectionPosts[schema.postTypeName] = mapApiPostsToSectionPosts((tabKey && bundle.tabs[tabKey]) || [])
          })
          applyHydratedPosts(generalPosts, faqs, sectionPosts)
          return
        } catch {
          /* older API without /editor-sections */
        }

        const [blogPosts, faqPosts, ...sectionResults] = await Promise.all([
          (async () => {
            try {
              const rows = await listBlogs({ id: profileId, limit: 50 }).unwrap()
              if (rows.length) return rows
            } catch {
              /* fall through */
            }
            return listPosts({ id: profileId, postType: BLOG_POST_TYPE })
              .unwrap()
              .catch(() => [])
          })(),
          (async () => {
            try {
              const rows = await listTabItems({ id: profileId, tabKey: 'faqs', limit: 50 }).unwrap()
              if (rows.length) return rows
            } catch {
              /* fall through */
            }
            return listPosts({ id: profileId, postType: FAQ_POST_TYPE })
              .unwrap()
              .catch(() => [])
          })(),
          ...schemas.map(async (schema) => {
            const tabKey = publicNameToTabKey(schema.postTypeName)
            if (tabKey && TAB_REGISTRY[tabKey]?.architecture === 'direct') {
              try {
                const rows = await listTabItems({ id: profileId, tabKey, limit: 50 }).unwrap()
                if (rows.length) return rows
              } catch {
                /* fall through */
              }
            }
            return listPosts({ id: profileId, postType: schema.postTypeName })
              .unwrap()
              .catch(() => [])
          }),
        ])
        if (cancelled) return

        const generalPosts = mapApiPostsToGeneralPosts(blogPosts)
        const faqs = mapApiPostsToFaqs(faqPosts)
        const sectionPosts: Record<string, VCardSectionPostItem[]> = {}
        schemas.forEach((schema, index) => {
          sectionPosts[schema.postTypeName] = mapApiPostsToSectionPosts(sectionResults[index] || [])
        })
        applyHydratedPosts(generalPosts, faqs, sectionPosts)
      } catch {
        postsHydratedForId.current = profileId
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cardId, isCreateMode, dispatch, listPosts, listBlogs, listTabItems, listEditorSections, record])

  const accountDefaultsSig = designDefaultsSignature(design)
  const [createDraft, setCreateDraft] = useState<VCardData>(() => buildCreateDraft(design))
  const [appliedDefaultsSig, setAppliedDefaultsSig] = useState(accountDefaultsSig)
  const createDraftRef = useRef(createDraft)

  useEffect(() => {
    createDraftRef.current = createDraft
  }, [createDraft])

  if (isCreateMode && accountDefaultsSig !== appliedDefaultsSig) {
    setAppliedDefaultsSig(accountDefaultsSig)
    const defaults = designSettingsToVCardDefaults(design)
    setCreateDraft((prev) => {
      const next = {
        ...prev,
        theme: { ...prev.theme, ...defaults.theme },
        appearance: defaults.appearance,
      }
      createDraftRef.current = next
      return next
    })
  }

  const vCardData: VCardData = useMemo(() => {
    const base = isCreateMode ? createDraft : !record ? createDefaultVCardData() : toVCardData(record)
    return {
      ...base,
      social: base.social ?? createDefaultVCardSocial(),
      extraFields: base.extraFields ?? [],
      education: base.education ?? [],
      experience: base.experience ?? [],
      services: base.services ?? [],
      generalPosts: base.generalPosts ?? [],
      faqs: base.faqs ?? [],
      sectionPosts: base.sectionPosts ?? {},
      customTabs: base.customTabs ?? [],
      tabLabelOverrides: base.tabLabelOverrides ?? {},
      portfolio: base.portfolio ?? [],
      reviews: base.reviews ?? [],
      skills: base.skills ?? [],
      seo: base.seo ?? createDefaultVCardData().seo,
    }
  }, [isCreateMode, createDraft, record])

  const markDirty = useCallback(
    (bucket: DirtyBucket) => {
      dirtyBucketsRef.current.add(bucket)
      saveGateRef.current.dirty = true
      setSaveStatus('dirty')
      setSaveError(null)
      if (cardId) writePendingCardSave(cardId, dirtyBucketsRef.current)
    },
    [cardId]
  )

  const persistDirtyBuckets = useCallback(
    async (
      profileId: string,
      data: VCardData,
      buckets: Set<DirtyBucket>
    ): Promise<{ wroteProfile: boolean; wroteChanges: boolean }> => {
      const tasks: Promise<unknown>[] = []
      let wroteProfile = false
      let wroteChanges = false
      const saved = lastSavedDataRef.current
      const explainerKey = PUBLIC_SECTION_NAMES.explainer
      if (
        JSON.stringify(data.sectionPosts?.[explainerKey] ?? []) !==
        JSON.stringify(postsSnapshotRef.current.sectionPosts?.[explainerKey] ?? [])
      ) {
        buckets.add('posts')
      }

      if (buckets.has('profile')) {
        const payload = mapVCardDataToProfilePayload(data)
        const payloadJson = JSON.stringify(payload)
        if (payloadJson === lastSavedProfilePayloadRef.current) {
          buckets.delete('profile')
        } else {
          wroteChanges = true
          tasks.push(
            updateProfileCard({ id: profileId, body: payload })
              .unwrap()
              .then((updated) => {
                if (updated) {
                  const normalized = toVCardData(mapApiProfileToVCardRecord(updated))
                  lastSavedProfilePayloadRef.current = JSON.stringify(mapVCardDataToProfilePayload(normalized))
                  // Do not let response A overwrite edit B that landed while A was in flight.
                  if (editDataRef.current === data) {
                    data = mergeServerProfileData(data, normalized)
                    editDataRef.current = data
                    dispatch(replaceVCardData({ id: profileId, data }))
                  }
                } else {
                  lastSavedProfilePayloadRef.current = payloadJson
                }
                wroteProfile = true
              })
          )
        }
      }
      if (buckets.has('education')) {
        const items = persistableEducation(data.education)
        if (saved && JSON.stringify(persistableEducation(saved.education)) === JSON.stringify(items)) {
          buckets.delete('education')
        } else {
          wroteChanges = true
          tasks.push(
            replaceEducation({
              id: profileId,
              items: items.map((e) => ({
                institute: e.institute,
                degree: e.degree,
                fromDate: e.fromDate || null,
                toDate: e.toDate || null,
                tillNow: e.tillNow,
              })),
            }).unwrap()
          )
        }
      }
      if (buckets.has('experience')) {
        const items = persistableExperience(data.experience)
        if (saved && JSON.stringify(persistableExperience(saved.experience)) === JSON.stringify(items)) {
          buckets.delete('experience')
        } else {
          wroteChanges = true
          tasks.push(
            replaceExperiences({
              id: profileId,
              items: items.map((e) => ({
                company: e.company,
                jobTitle: e.jobTitle,
                description: e.description,
                fromDate: e.fromDate || null,
                toDate: e.toDate || null,
                tillNow: e.tillNow,
              })),
            }).unwrap()
          )
        }
      }
      if (buckets.has('services')) {
        const items = persistableServices(data.services)
        if (saved && JSON.stringify(persistableServices(saved.services)) === JSON.stringify(items)) {
          buckets.delete('services')
        } else {
          wroteChanges = true
          tasks.push(
            replaceServices({
              id: profileId,
              items: items.map((s) => ({
                title: s.title,
                description: s.description,
                imageUrl: s.featuredImage,
                reviewUrl: s.url,
                status: s.active ? 1 : 0,
              })),
            }).unwrap()
          )
        }
      }
      if (buckets.has('portfolio')) {
        const items = persistablePortfolio(data.portfolio)
        if (saved && JSON.stringify(persistablePortfolio(saved.portfolio)) === JSON.stringify(items)) {
          buckets.delete('portfolio')
        } else {
          wroteChanges = true
          tasks.push(
            replacePortfolios({
              id: profileId,
              items: items.map((p) => ({
                title: p.title,
                description: p.description,
                imageUrl: p.imageUrl,
                featuredImage: p.imageUrl,
                attachmentUrl: p.attachments?.url || null,
                attachmentName: p.attachments?.name || null,
                url: p.url,
                status: p.active ? 1 : 0,
              })),
            }).unwrap()
          )
        }
      }
      if (buckets.has('reviews')) {
        const items = persistableReviews(data.reviews)
        if (saved && JSON.stringify(persistableReviews(saved.reviews)) === JSON.stringify(items)) {
          buckets.delete('reviews')
        } else {
          wroteChanges = true
          tasks.push(
            replaceReviews({
              id: profileId,
              items: items.map((r) => ({
                author: r.author,
                text: r.text,
                rating: r.rating,
                imageUrl: r.imageUrl || '',
                reviewUrl: r.url || '',
                status: 1,
              })),
            }).unwrap()
          )
        }
      }
      if (buckets.has('skills')) {
        const items = persistableSkills(data.skills)
        if (saved && JSON.stringify(persistableSkills(saved.skills)) === JSON.stringify(items)) {
          buckets.delete('skills')
        } else {
          wroteChanges = true
          tasks.push(
            replaceSkills({
              id: profileId,
              items: skillGroupsToApiItems(items),
            }).unwrap()
          )
        }
      }
      if (buckets.has('socialLinks')) {
        const items = (data.social?.customLinks || []).filter(
          (l) => l.name?.trim() || l.url?.trim() || !isLocalTempId(l.id)
        )
        const savedItems = (saved?.social?.customLinks || []).filter(
          (l) => l.name?.trim() || l.url?.trim() || !isLocalTempId(l.id)
        )
        if (JSON.stringify(items) === JSON.stringify(savedItems)) {
          buckets.delete('socialLinks')
        } else {
          wroteChanges = true
          tasks.push(
            replaceSocialLinks({
              id: profileId,
              items: items.map((l) => ({
                name: l.name,
                url: l.url,
              })),
            }).unwrap()
          )
        }
      }

      if (buckets.has('aboutMe')) {
        wroteChanges = true
        tasks.push(flushAboutMeUpsert(dispatch, profileId))
      }

      if (buckets.has('posts') && postsHydratedForId.current !== profileId) {
        dirtyBucketsRef.current.add('posts')
        buckets.delete('posts')
      }

      if (buckets.has('posts') && !hasPersistablePostsDelta(data, postsSnapshotRef.current)) {
        buckets.delete('posts')
      }

      await Promise.all(tasks)

      const shouldSyncPosts = buckets.has('posts')
      if (shouldSyncPosts) {
        const synced = await loadAndSyncSectionPosts({
          profileId,
          blogPosts: data.generalPosts || [],
          faqs: data.faqs || [],
          sectionPosts: data.sectionPosts || {},
          snapshot: postsSnapshotRef.current,
          listPosts,
          createPost,
          updatePost,
          deletePost,
          listBlogs,
          createBlog,
          updateBlog,
          deleteBlog,
          listTabItems,
          createTabItem,
          updateTabItem,
          deleteTabItem,
        })

        const wrotePosts = Boolean(synced.blog || synced.faqs || Object.keys(synced.sectionPosts || {}).length)
        if (wrotePosts) {
          const generalPosts = synced.blog
            ? mergeLocalEmptyDrafts(data.generalPosts, mapApiPostsToGeneralPosts(synced.blog), isEmptyGeneralPost)
            : data.generalPosts || []
          const faqs = synced.faqs
            ? mergeLocalEmptyDrafts(data.faqs, mapApiPostsToFaqs(synced.faqs), isEmptyFaq)
            : data.faqs || []
          const sectionPosts: Record<string, VCardSectionPostItem[]> = { ...(data.sectionPosts || {}) }
          for (const [postTypeName, apiPosts] of Object.entries(synced.sectionPosts || {})) {
            sectionPosts[postTypeName] = mergeLocalEmptyDrafts(
              data.sectionPosts?.[postTypeName],
              mapApiPostsToSectionPosts(apiPosts),
              isEmptySectionPost
            )
          }
          postsHydratedForId.current = profileId

          const next = {
            ...data,
            generalPosts,
            faqs,
            sectionPosts,
          }
          // Only toast when persistable content actually changed (skip empty draft open/close no-ops).
          if (hasPersistablePostsDelta(next, postsSnapshotRef.current)) {
            wroteChanges = true
          }
          editDataRef.current = next
          data = next
          dispatch(
            replaceVCardData({
              id: profileId,
              data: next,
            })
          )
        }
        postsSnapshotRef.current = {
          generalPosts: persistableGeneralPosts(data.generalPosts),
          faqs: persistableFaqs(data.faqs),
          sectionPosts: persistableSectionPosts(data.sectionPosts),
        }
      }

      lastSavedDataRef.current = data
      return { wroteProfile, wroteChanges }
    },
    [
      updateProfileCard,
      replaceEducation,
      replaceExperiences,
      replaceServices,
      replacePortfolios,
      replaceReviews,
      replaceSkills,
      replaceSocialLinks,
      listPosts,
      createPost,
      updatePost,
      deletePost,
      listBlogs,
      createBlog,
      updateBlog,
      deleteBlog,
      listTabItems,
      createTabItem,
      updateTabItem,
      deleteTabItem,
      dispatch,
    ]
  )

  const runPersist = useCallback(async (): Promise<void> => {
    if (isCreateMode || !cardId) return

    for (;;) {
      if (savingRef.current) {
        pendingResaveRef.current = true
        return
      }
      if (dirtyBucketsRef.current.size === 0) {
        clearPendingCardSave(cardId)
        return
      }

      const data = editDataRef.current
      if (!data) return

      const buckets = new Set(dirtyBucketsRef.current)
      dirtyBucketsRef.current = new Set()
      savingRef.current = true
      saveGateRef.current.saving = true
      saveGateRef.current.dirty = false
      setSaveStatus('saving')
      setSaveError(null)

      try {
        const { wroteProfile, wroteChanges } = await persistDirtyBuckets(cardId, data, buckets)
        if (wroteChanges) {
          toastSaveSuccess(buckets)
        }
        if (wroteProfile) {
          invalidateSettingsPublicTags()
          broadcastPublicCardSettingsSaved({ profileId: cardId, slug: data.slug })
        }

        if (dirtyBucketsRef.current.size > 0 || pendingResaveRef.current) {
          pendingResaveRef.current = false
          if (dirtyBucketsRef.current.size > 0) {
            saveGateRef.current.dirty = true
            setSaveStatus('dirty')
            writePendingCardSave(cardId, dirtyBucketsRef.current)
            scheduleAutosaveRef.current()
            return
          }
        }
        clearPendingCardSave(cardId)
        setSaveStatus('saved')
        return
      } catch (err) {
        for (const bucket of buckets) dirtyBucketsRef.current.add(bucket)
        saveGateRef.current.dirty = true
        writePendingCardSave(cardId, dirtyBucketsRef.current)
        const message = errorMessage(err)
        setSaveStatus('error')
        setSaveError(message)
        toastSaveError(message)
        throw err instanceof Error ? err : new Error(message)
      } finally {
        savingRef.current = false
        saveGateRef.current.saving = false
      }
    }
  }, [isCreateMode, cardId, persistDirtyBuckets, invalidateSettingsPublicTags])

  const scheduleAutosave = useCallback(() => {
    if (isCreateMode) {
      autosaveSchedulerRef.current.schedule(() => {
        if (readAiCardAgentOpen() || createdProfileIdRef.current) return
        if (!isCreateDraftAutosaveReady(createDraftRef.current)) return
        void createAutosaveRef.current().catch(() => {
          // Status/error already set by saveVCard.
        })
      })
      return
    }
    autosaveSchedulerRef.current.schedule(() => {
      void runPersist().catch(() => {
        // Status/error already set in runPersist.
      })
    })
  }, [isCreateMode, runPersist])

  scheduleAutosaveRef.current = scheduleAutosave

  useEffect(() => {
    if (!isCreateMode) return
    const onAgentState = (event: Event) => {
      const open = (event as CustomEvent<{ open?: boolean }>).detail?.open
      if (open !== false || !saveGateRef.current.dirty) return
      scheduleAutosaveRef.current()
    }
    window.addEventListener(AI_CARD_AGENT_EVENT, onAgentState)
    return () => window.removeEventListener(AI_CARD_AGENT_EVENT, onAgentState)
  }, [isCreateMode])

  const flushSave = useCallback(async () => {
    if (isCreateMode) return
    autosaveSchedulerRef.current.cancel()
    await runPersist()
    schedulePublicInvalidate(true)
  }, [isCreateMode, runPersist, schedulePublicInvalidate])

  const flushSaveRef = useRef(flushSave)
  useEffect(() => {
    flushSaveRef.current = flushSave
  }, [flushSave])

  useEffect(() => {
    const scheduler = autosaveSchedulerRef.current
    if (isCreateMode) return () => scheduler.cancel()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushSaveRef.current()
      }
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyBucketsRef.current.size === 0 && !saveGateRef.current.dirty) return
      void flushSaveRef.current()
      event.preventDefault()
      event.returnValue = ''
    }

    const onPageHide = () => {
      void flushSaveRef.current()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      scheduler.cancel()
      void flushSaveRef.current()
    }
  }, [isCreateMode])

  const updateData = useCallback(
    (path: string, value: unknown) => {
      if (isCreateMode) {
        const prev = createDraftRef.current
        let next = setByPath(prev as unknown as Record<string, unknown>, path, value) as unknown as VCardData
        next = applyNameSlugAutofill(prev, next, path)
        next = applyProfessionDesignationSync(next, path, value)
        if (isAppearanceOrThemePath(path)) {
          next = {
            ...next,
            themeConfig: applyEditorSettingsToThemeConfig(next.themeConfig, next.theme, next.appearance),
          }
        }
        createDraftRef.current = next
        setCreateDraft(next)
        const saveWorthy =
          isSaveWorthyChange(path, prev, next) ||
          (isExplainerMediaPath(path) && isSaveWorthyChange('sectionPosts', prev, next))
        if (saveWorthy) {
          markDirty(dirtyBucketForPath(path))
          scheduleAutosave()
        }
        return
      }
      if (!cardId) return
      const base = editDataRef.current ?? (record ? toVCardData(record) : null)
      if (!base) return
      let next = setByPath(base as unknown as Record<string, unknown>, path, value) as unknown as VCardData
      next = applyNameSlugAutofill(base, next, path)
      next = applyProfessionDesignationSync(next, path, value)
      if (isAppearanceOrThemePath(path)) {
        next = {
          ...next,
          themeConfig: applyEditorSettingsToThemeConfig(next.themeConfig, next.theme, next.appearance),
        }
      }
      editDataRef.current = next
      dispatch(replaceVCardData({ id: cardId, data: next }))
      const saveWorthy =
        isSaveWorthyChange(path, base, next) ||
        (isExplainerMediaPath(path) && isSaveWorthyChange('sectionPosts', base, next))
      if (!saveWorthy) return
      markDirty(dirtyBucketForPath(path))
      if (isExplainerMediaPath(path)) markDirty('posts')
      scheduleAutosave()
    },
    [isCreateMode, cardId, dispatch, record, markDirty, scheduleAutosave]
  )

  const updateMeta = useCallback(
    (patch: { avatarImageUrl?: string }) => {
      if (isCreateMode) return
      if (!cardId) return
      dispatch(updateVCard({ id: cardId, patch }))
    },
    [isCreateMode, cardId, dispatch]
  )

  const markAboutMeDirty = useCallback(() => {
    markDirty('aboutMe')
    scheduleAutosave()
  }, [markDirty, scheduleAutosave])

  const persistCollections = useCallback(
    async (profileId: string, data: VCardData) => {
      // Profile scalars were already written by create/update; only sync collections + posts.
      await persistDirtyBuckets(
        profileId,
        data,
        new Set<DirtyBucket>([
          'education',
          'experience',
          'services',
          'portfolio',
          'reviews',
          'skills',
          'socialLinks',
          'posts',
        ])
      )
    },
    [persistDirtyBuckets]
  )

  const saveVCard = useCallback(
    async (opts?: { skipNavigate?: boolean; publish?: boolean }) => {
      if (isCreateMode) {
        if (createPromiseRef.current) return createPromiseRef.current

        let task: Promise<string> | null = null
        task = (async (): Promise<string> => {
          await Promise.resolve()
          setSaveStatus('saving')
          setSaveError(null)

          try {
            const draftRaw = createDraftRef.current
            let draft = draftRaw
            try {
              const rawOrder = localStorage.getItem(storageKeyForEditorNavOrder('draft'))
              const parsed = rawOrder ? (JSON.parse(rawOrder) as string[]) : null
              const order =
                (Array.isArray(draft.displaySettings?.editorNavOrder) && draft.displaySettings.editorNavOrder.length
                  ? draft.displaySettings.editorNavOrder
                  : null) || (Array.isArray(parsed) && parsed.length ? parsed : null)
              if (order?.length) {
                draft = {
                  ...draft,
                  displaySettings: applyEnabledNavOrderToDisplaySettings(getDisplaySettingsFromVCard(draft), order),
                }
                createDraftRef.current = draft
                setCreateDraft(draft)
              }
            } catch {
              /* ignore order hydrate */
            }

            const slug = (draft.slug || '').trim()
            const name = (draft.personal?.fullName || '').trim()
            if (!name) throw new Error('Please enter your name before creating the vCard.')
            if (!slug) throw new Error('Please set a public URL slug before creating the vCard.')
            const creationProblem = collectVCardCreationProblems(draft)[0]
            if (creationProblem) throw new Error(vCardCreationProblemMessage(creationProblem))

            const publish = opts?.publish === true
            if (publish) {
              const activationProblems = collectVCardActivationProblems(draft)
              if (activationProblems.length) throw new Error(vCardActivationProblemMessage(activationProblems))
            }

            const createPayloadData: VCardData = {
              ...draft,
              isDraft: !publish,
              isPublic: publish,
            }
            const profilePayload = {
              ...mapVCardDataToProfilePayload(createPayloadData),
              isDraft: !publish,
              isPublic: publish,
            }
            const existingProfileId = createdProfileIdRef.current
            const assignedOwner = getCreateCardOwner()
            const persisted = existingProfileId
              ? await updateProfileCard({ id: existingProfileId, body: profilePayload }).unwrap()
              : await createProfile({
                  ...profilePayload,
                  creationKey: getOrCreateProfileCreationKey(),
                  ...(assignedOwner?.userId ? { ownerUserId: assignedOwner.userId } : {}),
                }).unwrap()

            // Capture the durable identity before any secondary request. If a child write
            // fails, retrying this create screen updates this profile instead of POSTing again.
            createdProfileIdRef.current = String(persisted.id)
            const mapped = mapApiProfileToVCardRecord(persisted)
            const profileId = String(mapped.id)
            const serverData = toVCardData(mapped)
            lastSavedProfilePayloadRef.current = JSON.stringify(mapVCardDataToProfilePayload(serverData))
            const seed = {
              ...serverData,
              ...draft,
              slug: mapped.slug || draft.slug,
              displaySettings: draft.displaySettings || mapped.displaySettings,
              isDraft: !publish,
              isPublic: publish,
            }
            dispatch(addVCard({ id: profileId, seed }))
            dispatch(
              updateVCard({
                id: profileId,
                patch: {
                  isActive: publish,
                  isDraft: !publish,
                  isPublic: publish,
                },
              })
            )
            editDataRef.current = seed

            await persistCollections(profileId, seed)
            if (hasAboutMeDraftContent()) {
              await flushAboutMeUpsert(dispatch, profileId)
            }

            // Ownership is needed for recovery until every requested section is durable.
            clearCreateCardOwner()
            clearProfileCreationKey()
            saveGateRef.current.dirty = false
            setSaveStatus('saved')
            invalidatePublicTags()

            try {
              const order = seed.displaySettings?.editorNavOrder
              if (Array.isArray(order) && order.length) {
                localStorage.setItem(storageKeyForEditorNavOrder(profileId), JSON.stringify(order))
              }
            } catch {
              /* ignore */
            }

            if (!opts?.skipNavigate) {
              router.push(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, profileId))
            }
            return profileId
          } catch (err) {
            const message = errorMessage(err)
            saveGateRef.current.dirty = true
            setSaveStatus('error')
            setSaveError(message)
            toastSaveError(message)
            throw err instanceof Error ? err : new Error(message)
          } finally {
            if (task && createPromiseRef.current === task) createPromiseRef.current = null
          }
        })()

        createPromiseRef.current = task
        return task
      }

      if (!cardId) throw new Error('No vCard selected')
      for (const bucket of ALL_DIRTY_BUCKETS) dirtyBucketsRef.current.add(bucket)
      saveGateRef.current.dirty = true
      setSaveStatus('dirty')
      await flushSave()
    },
    [
      isCreateMode,
      cardId,
      createProfile,
      updateProfileCard,
      persistCollections,
      invalidatePublicTags,
      dispatch,
      router,
      flushSave,
    ]
  )

  createAutosaveRef.current = () => saveVCard({ publish: false })

  const value = useMemo(
    () => ({
      cardId,
      isCreateMode,
      vCardData,
      avatarImageUrl: record?.avatarImageUrl || '',
      updateData,
      updateMeta,
      markAboutMeDirty,
      saveVCard,
      flushSave,
      saveStatus,
      saveError,
      loading: creating || (!isCreateMode && !record && isFetching),
    }),
    [
      cardId,
      isCreateMode,
      vCardData,
      updateData,
      updateMeta,
      markAboutMeDirty,
      saveVCard,
      flushSave,
      saveStatus,
      saveError,
      creating,
      record,
      isFetching,
    ]
  )

  return <VCardContext.Provider value={value}>{children}</VCardContext.Provider>
}

export function useVCard() {
  const context = useContext(VCardContext)
  if (context === undefined) {
    throw new Error('useVCard must be used within a VCardProvider')
  }
  return context
}
