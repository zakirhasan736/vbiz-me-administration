'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { clearCreateCardOwner, getCreateCardOwner } from '@/lib/admin/createCardOwner'
import { useCardScopeId, useCardScopeMode } from '@/lib/card-scope'
import { notify } from '@/lib/toast/toast'
import { designSettingsToVCardDefaults } from '@/lib/vcardDesignDefaults'
import { applyEnabledNavOrderToDisplaySettings, getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import { DEFAULT_EDITOR_SECTION, buildEditorPath } from '@/lib/vcardEditorRoutes'
import { storageKeyForEditorNavOrder } from '@/lib/vcardNavbar'
import { loadAndSyncSectionPosts, mapApiPostsToSectionPosts } from '@/lib/vcardPostsSync'
import { VCARD_SECTION_SCHEMAS } from '@/lib/vcardSectionSchemas'
import { skillGroupsToApiItems } from '@/lib/vcardSkills'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { publicApi } from '@/redux/api/publicApi'
import {
  BLOG_POST_TYPE,
  FAQ_POST_TYPE,
  mapApiPostsToFaqs,
  mapApiPostsToGeneralPosts,
  mapApiProfileToVCardRecord,
  mapVCardDataToProfilePayload,
  useCreateProfileMutation,
  useCreateProfilePostMutation,
  useDeleteProfilePostMutation,
  useGetProfileQuery,
  useLazyListProfilePostsQuery,
  useReplaceEducationMutation,
  useReplaceExperiencesMutation,
  useReplacePortfoliosMutation,
  useReplaceReviewsMutation,
  useReplaceServicesMutation,
  useReplaceSkillsMutation,
  useReplaceSocialLinksMutation,
  useUpdateProfileCardMutation,
  useUpdateProfilePostMutation,
} from '@/redux/features/profiles/profiles.api'
import { addVCard, replaceVCardData, selectVCardById, updateVCard } from '@/redux/features/vcards/vcards.slice'
import type { RootState } from '@/redux/store'
import type { VCardData, VCardRecord, VCardSectionPostItem } from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'
import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type VCardSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type DirtyBucket =
  'profile' | 'education' | 'experience' | 'services' | 'portfolio' | 'reviews' | 'skills' | 'socialLinks' | 'posts'

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

const AUTOSAVE_DEBOUNCE_MS = 1000

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

interface VCardContextType {
  cardId: string | null
  isCreateMode: boolean
  vCardData: VCardData
  avatarImageUrl: string
  updateData: (path: string, value: unknown) => void
  updateMeta: (patch: { avatarImageUrl?: string }) => void
  saveVCard: (opts?: { skipNavigate?: boolean; publish?: boolean }) => Promise<string | void>
  flushSave: () => Promise<void>
  saveStatus: VCardSaveStatus
  saveError: string | null
  loading: boolean
}

const VCardContext = createContext<VCardContextType | undefined>(undefined)

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.')
  const clone = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>
  let current: Record<string, unknown> = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {}
    }
    current = current[k] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
  return clone
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

function dirtyBucketForPath(path: string): DirtyBucket {
  if (path === 'education' || path.startsWith('education.')) return 'education'
  if (path === 'experience' || path.startsWith('experience.')) return 'experience'
  if (path === 'services' || path.startsWith('services.')) return 'services'
  if (path === 'portfolio' || path.startsWith('portfolio.')) return 'portfolio'
  if (path === 'reviews' || path.startsWith('reviews.')) return 'reviews'
  if (path === 'skills' || path.startsWith('skills.')) return 'skills'
  if (path === 'social.customLinks' || path.startsWith('social.customLinks.')) return 'socialLinks'
  if (
    path === 'customTabs' ||
    path.startsWith('customTabs.') ||
    path === 'tabLabelOverrides' ||
    path.startsWith('tabLabelOverrides.')
  ) {
    return 'profile'
  }
  if (
    path === 'generalPosts' ||
    path.startsWith('generalPosts.') ||
    path === 'faqs' ||
    path.startsWith('faqs.') ||
    path === 'sectionPosts' ||
    path.startsWith('sectionPosts.')
  ) {
    return 'posts'
  }
  return 'profile'
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (
      err as {
        data?: { message?: string; errorMessages?: { path?: string; message?: string }[] }
      }
    ).data
    if (data?.message && data.message !== 'Validation Error') return data.message
    const details = data?.errorMessages?.map((item) => item.message).filter((msg): msg is string => Boolean(msg))
    if (details?.length) return details.join('. ')
    if (data?.message) return data.message
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

export function VCardProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const cardId = useCardScopeId()
  const mode = useCardScopeMode()
  const isCreateMode = mode === 'create'
  const design = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s: RootState) => selectVCardById(s, cardId))

  const { data: remoteProfile, isFetching } = useGetProfileQuery(cardId || '', {
    skip: isCreateMode || !cardId,
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

  const editDataRef = useRef<VCardData | null>(null)
  const dirtyBucketsRef = useRef<Set<DirtyBucket>>(new Set())
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)
  const pendingResaveRef = useRef(false)
  const saveGateRef = useRef({ dirty: false, saving: false })
  const editorHydratedForIdRef = useRef<string | null>(null)

  const [saveStatus, setSaveStatus] = useState<VCardSaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const invalidatePublicTags = useCallback(() => {
    dispatch(publicApi.util.invalidateTags([...PUBLIC_INVALIDATION_TAGS]))
  }, [dispatch])

  useEffect(() => {
    editorHydratedForIdRef.current = null
    postsHydratedForId.current = null
    editDataRef.current = null
  }, [cardId])

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
    if (saveGateRef.current.dirty || saveGateRef.current.saving) return

    const mapped = mapApiProfileToVCardRecord(remoteProfile)
    const profileId = mapped.id

    // Refetch after autosave must not rewrite the open editor — that remounts fields and steals focus.
    if (editorHydratedForIdRef.current === profileId) {
      dispatch(
        updateVCard({
          id: profileId,
          patch: {
            views: mapped.views,
            avatarImageUrl: mapped.avatarImageUrl,
            backgroundImageUrl: mapped.backgroundImageUrl,
            updatedAt: mapped.updatedAt,
            isActive: mapped.isActive,
            isDraft: mapped.isDraft,
            isPublic: mapped.isPublic,
          },
        })
      )
      return
    }

    const alreadyHydratedPosts = postsHydratedForId.current === profileId
    const mappedData = toVCardData(mapped)
    const data = alreadyHydratedPosts
      ? {
          ...mappedData,
          generalPosts: postsSnapshotRef.current.generalPosts ?? [],
          faqs: postsSnapshotRef.current.faqs ?? [],
          sectionPosts: postsSnapshotRef.current.sectionPosts ?? {},
        }
      : mappedData

    editDataRef.current = data
    dispatch(addVCard({ id: profileId, seed: data }))
    dispatch(replaceVCardData({ id: profileId, data }))
    dispatch(
      updateVCard({
        id: profileId,
        patch: {
          views: mapped.views,
          avatarImageUrl: mapped.avatarImageUrl,
          backgroundImageUrl: mapped.backgroundImageUrl,
          createdAt: mapped.createdAt,
          updatedAt: mapped.updatedAt,
          isActive: mapped.isActive,
          isDraft: mapped.isDraft,
          isPublic: mapped.isPublic,
        },
      })
    )

    if (alreadyHydratedPosts) {
      editorHydratedForIdRef.current = profileId
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const schemas = Object.values(VCARD_SECTION_SCHEMAS)
        const [blogPosts, faqPosts, ...sectionResults] = await Promise.all([
          listPosts({ id: profileId, postType: BLOG_POST_TYPE }).unwrap(),
          listPosts({ id: profileId, postType: FAQ_POST_TYPE }).unwrap(),
          ...schemas.map((schema) =>
            listPosts({ id: profileId, postType: schema.postTypeName })
              .unwrap()
              .catch(() => [])
          ),
        ])
        if (cancelled) return

        const generalPosts = mapApiPostsToGeneralPosts(blogPosts)
        const faqs = mapApiPostsToFaqs(faqPosts)
        const sectionPosts: Record<string, VCardSectionPostItem[]> = {}
        schemas.forEach((schema, index) => {
          sectionPosts[schema.postTypeName] = mapApiPostsToSectionPosts(sectionResults[index] || [])
        })
        postsHydratedForId.current = profileId
        postsSnapshotRef.current = { generalPosts, faqs, sectionPosts }

        // Always merge into the latest local draft (skills/education/etc. edited during
        // the posts fetch). Never reset collections from the stale `mapped` snapshot.
        const latest = editDataRef.current || mappedData
        const withPosts = {
          ...latest,
          generalPosts,
          faqs,
          sectionPosts,
        }
        editDataRef.current = withPosts
        dispatch(
          replaceVCardData({
            id: profileId,
            data: withPosts,
          })
        )
        editorHydratedForIdRef.current = profileId
      } catch {
        editorHydratedForIdRef.current = profileId
      }
    })()
    return () => {
      cancelled = true
    }
  }, [remoteProfile, isCreateMode, dispatch, listPosts])

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
    }
  }, [isCreateMode, createDraft, record])

  const markDirty = useCallback((bucket: DirtyBucket) => {
    dirtyBucketsRef.current.add(bucket)
    saveGateRef.current.dirty = true
    setSaveStatus('dirty')
    setSaveError(null)
  }, [])

  const persistDirtyBuckets = useCallback(
    async (profileId: string, data: VCardData, buckets: Set<DirtyBucket>) => {
      const tasks: Promise<unknown>[] = []

      if (buckets.has('profile')) {
        tasks.push(updateProfileCard({ id: profileId, body: mapVCardDataToProfilePayload(data) }).unwrap())
      }
      if (buckets.has('education')) {
        tasks.push(
          replaceEducation({
            id: profileId,
            items: (data.education || []).map((e) => ({
              institute: e.institute,
              degree: e.degree,
              fromDate: e.fromDate || null,
              toDate: e.toDate || null,
              tillNow: e.tillNow,
            })),
          }).unwrap()
        )
      }
      if (buckets.has('experience')) {
        tasks.push(
          replaceExperiences({
            id: profileId,
            items: (data.experience || []).map((e) => ({
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
      if (buckets.has('services')) {
        tasks.push(
          replaceServices({
            id: profileId,
            items: (data.services || []).map((s) => ({
              title: s.title,
              description: s.description,
              imageUrl: s.featuredImage,
              reviewUrl: s.url,
              status: s.active ? 1 : 0,
            })),
          }).unwrap()
        )
      }
      if (buckets.has('portfolio')) {
        tasks.push(
          replacePortfolios({
            id: profileId,
            items: (data.portfolio || []).map((p) => ({
              title: p.title,
              description: p.description,
              imageUrl: p.imageUrl,
              attachmentUrl: p.attachments?.url || null,
              attachmentName: p.attachments?.name || null,
              url: p.url,
              status: p.active ? 1 : 0,
            })),
          }).unwrap()
        )
      }
      if (buckets.has('reviews')) {
        tasks.push(
          replaceReviews({
            id: profileId,
            items: (data.reviews || []).map((r) => ({
              author: r.author,
              text: r.text,
              rating: r.rating,
              status: 1,
            })),
          }).unwrap()
        )
      }
      if (buckets.has('skills')) {
        tasks.push(
          replaceSkills({
            id: profileId,
            items: skillGroupsToApiItems(data.skills || []),
          }).unwrap()
        )
      }
      if (buckets.has('socialLinks')) {
        tasks.push(
          replaceSocialLinks({
            id: profileId,
            items: (data.social?.customLinks || []).map((l) => ({
              name: l.name,
              url: l.url,
            })),
          }).unwrap()
        )
      }

      await Promise.all(tasks)

      if (buckets.has('posts')) {
        const synced = await loadAndSyncSectionPosts({
          profileId,
          blogPosts: data.generalPosts || [],
          faqs: data.faqs || [],
          sectionPosts: data.sectionPosts || {},
          listPosts,
          createPost,
          updatePost,
          deletePost,
        })

        const generalPosts = mapApiPostsToGeneralPosts(synced.blog)
        const faqs = mapApiPostsToFaqs(synced.faqs)
        const sectionPosts: Record<string, VCardSectionPostItem[]> = {}
        for (const [postTypeName, apiPosts] of Object.entries(synced.sectionPosts || {})) {
          sectionPosts[postTypeName] = mapApiPostsToSectionPosts(apiPosts)
        }
        postsHydratedForId.current = profileId
        postsSnapshotRef.current = { generalPosts, faqs, sectionPosts }

        const next = {
          ...data,
          generalPosts,
          faqs,
          sectionPosts,
        }
        editDataRef.current = next
        dispatch(
          replaceVCardData({
            id: profileId,
            data: next,
          })
        )
      }
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
      if (dirtyBucketsRef.current.size === 0) return

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
        await persistDirtyBuckets(cardId, data, buckets)
        invalidatePublicTags()

        if (dirtyBucketsRef.current.size > 0 || pendingResaveRef.current) {
          pendingResaveRef.current = false
          if (dirtyBucketsRef.current.size > 0) {
            saveGateRef.current.dirty = true
            setSaveStatus('dirty')
            continue
          }
        }
        setSaveStatus('saved')
        return
      } catch (err) {
        for (const bucket of buckets) dirtyBucketsRef.current.add(bucket)
        saveGateRef.current.dirty = true
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
  }, [isCreateMode, cardId, persistDirtyBuckets, invalidatePublicTags])

  const scheduleAutosave = useCallback(() => {
    if (isCreateMode) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null
      void runPersist().catch(() => {
        // Status/error already set in runPersist.
      })
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [isCreateMode, runPersist])

  const flushSave = useCallback(async () => {
    if (isCreateMode) return
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    await runPersist()
  }, [isCreateMode, runPersist])

  const flushSaveRef = useRef(flushSave)
  useEffect(() => {
    flushSaveRef.current = flushSave
  }, [flushSave])

  useEffect(() => {
    if (isCreateMode) return

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

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
      void flushSaveRef.current()
    }
  }, [isCreateMode])

  const updateData = useCallback(
    (path: string, value: unknown) => {
      if (path === 'generalPosts') {
        postsSnapshotRef.current = {
          ...postsSnapshotRef.current,
          generalPosts: value as VCardData['generalPosts'],
        }
      } else if (path === 'faqs') {
        postsSnapshotRef.current = {
          ...postsSnapshotRef.current,
          faqs: value as VCardData['faqs'],
        }
      } else if (path === 'sectionPosts') {
        postsSnapshotRef.current = {
          ...postsSnapshotRef.current,
          sectionPosts: value as Record<string, VCardSectionPostItem[]>,
        }
      }
      if (isCreateMode) {
        setCreateDraft((prev) => {
          const next = setByPath(prev as unknown as Record<string, unknown>, path, value) as unknown as VCardData
          createDraftRef.current = next
          return next
        })
        return
      }
      if (!cardId) return
      const base = editDataRef.current ?? (record ? toVCardData(record) : null)
      if (!base) return
      const next = setByPath(base as unknown as Record<string, unknown>, path, value) as unknown as VCardData
      editDataRef.current = next
      dispatch(replaceVCardData({ id: cardId, data: next }))
      markDirty(dirtyBucketForPath(path))
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

        const assignedOwner = getCreateCardOwner()
        const publish = opts?.publish === true
        const createPayloadData: VCardData = {
          ...draft,
          isDraft: !publish,
          isPublic: publish,
        }
        const created = await createProfile({
          ...mapVCardDataToProfilePayload(createPayloadData),
          isDraft: !publish,
          isPublic: publish,
          ...(assignedOwner?.userId ? { ownerUserId: assignedOwner.userId } : {}),
        }).unwrap()
        clearCreateCardOwner()
        const mapped = mapApiProfileToVCardRecord(created)
        const seed = {
          ...toVCardData(mapped),
          ...draft,
          slug: mapped.slug || draft.slug,
          displaySettings: draft.displaySettings || mapped.displaySettings,
          isDraft: !publish,
          isPublic: publish,
        }
        dispatch(addVCard({ id: mapped.id, seed }))
        dispatch(
          updateVCard({
            id: mapped.id,
            patch: {
              isActive: publish,
              isDraft: !publish,
              isPublic: publish,
            },
          })
        )
        editDataRef.current = seed

        await persistCollections(created.id, seed)
        invalidatePublicTags()

        try {
          const order = seed.displaySettings?.editorNavOrder
          if (Array.isArray(order) && order.length) {
            localStorage.setItem(storageKeyForEditorNavOrder(created.id), JSON.stringify(order))
          }
        } catch {
          /* ignore */
        }

        if (!opts?.skipNavigate) {
          router.push(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, created.id))
        }
        return created.id as string
      }

      if (!cardId) throw new Error('No vCard selected')
      for (const bucket of ALL_DIRTY_BUCKETS) dirtyBucketsRef.current.add(bucket)
      saveGateRef.current.dirty = true
      setSaveStatus('dirty')
      await flushSave()
    },
    [isCreateMode, cardId, createProfile, persistCollections, invalidatePublicTags, dispatch, router, flushSave]
  )

  const value = useMemo(
    () => ({
      cardId,
      isCreateMode,
      vCardData,
      avatarImageUrl: record?.avatarImageUrl || '',
      updateData,
      updateMeta,
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
