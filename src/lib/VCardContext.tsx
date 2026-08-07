'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useCardScopeId, useCardScopeMode } from '@/lib/card-scope'
import { designSettingsToVCardDefaults } from '@/lib/vcardDesignDefaults'
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
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface VCardContextType {
  cardId: string | null
  isCreateMode: boolean
  vCardData: VCardData
  updateData: (path: string, value: unknown) => void
  updateMeta: (patch: { avatarImageUrl?: string }) => void
  saveVCard: () => Promise<void>
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
  const [updateProfileCard, { isLoading: updating }] = useUpdateProfileCardMutation()
  const [replaceEducation] = useReplaceEducationMutation()
  const [replaceExperiences] = useReplaceExperiencesMutation()
  const [replaceServices] = useReplaceServicesMutation()
  const [replacePortfolios] = useReplacePortfoliosMutation()
  const [replaceSkills] = useReplaceSkillsMutation()
  const [replaceSocialLinks] = useReplaceSocialLinksMutation()
  const [listPosts] = useLazyListProfilePostsQuery()
  const [createPost] = useCreateProfilePostMutation()
  const [updatePost] = useUpdateProfilePostMutation()
  const [deletePost] = useDeleteProfilePostMutation()
  const postsHydratedForId = React.useRef<string | null>(null)
  const postsSnapshotRef = React.useRef<{
    generalPosts: VCardData['generalPosts']
    faqs: VCardData['faqs']
    sectionPosts: Record<string, VCardSectionPostItem[]>
  }>({
    generalPosts: [],
    faqs: [],
    sectionPosts: {},
  })

  useEffect(() => {
    if (!remoteProfile || isCreateMode) return
    const mapped = mapApiProfileToVCardRecord(remoteProfile)
    const alreadyHydrated = postsHydratedForId.current === mapped.id
    const mappedData = toVCardData(mapped)
    const data = alreadyHydrated
      ? {
          ...mappedData,
          generalPosts: postsSnapshotRef.current.generalPosts ?? [],
          faqs: postsSnapshotRef.current.faqs ?? [],
          sectionPosts: postsSnapshotRef.current.sectionPosts ?? {},
        }
      : mappedData

    dispatch(addVCard({ id: mapped.id, seed: data }))
    dispatch(replaceVCardData({ id: mapped.id, data }))
    dispatch(
      updateVCard({
        id: mapped.id,
        patch: {
          views: mapped.views,
          avatarImageUrl: mapped.avatarImageUrl,
          createdAt: mapped.createdAt,
          updatedAt: mapped.updatedAt,
          isActive: true,
        },
      })
    )

    if (alreadyHydrated) return

    let cancelled = false
    ;(async () => {
      try {
        const schemas = Object.values(VCARD_SECTION_SCHEMAS)
        const [blogPosts, faqPosts, ...sectionResults] = await Promise.all([
          listPosts({ id: mapped.id, postType: BLOG_POST_TYPE }).unwrap(),
          listPosts({ id: mapped.id, postType: FAQ_POST_TYPE }).unwrap(),
          ...schemas.map((schema) =>
            listPosts({ id: mapped.id, postType: schema.postTypeName })
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
        postsHydratedForId.current = mapped.id
        postsSnapshotRef.current = { generalPosts, faqs, sectionPosts }
        dispatch(
          replaceVCardData({
            id: mapped.id,
            data: {
              ...mappedData,
              generalPosts,
              faqs,
              sectionPosts,
            },
          })
        )
      } catch {
        // Posts load is best-effort; profile collections already mapped.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [remoteProfile, isCreateMode, dispatch, listPosts])

  const accountDefaultsSig = designDefaultsSignature(design)
  const [createDraft, setCreateDraft] = useState<VCardData>(() => buildCreateDraft(design))
  const [appliedDefaultsSig, setAppliedDefaultsSig] = useState(accountDefaultsSig)

  if (isCreateMode && accountDefaultsSig !== appliedDefaultsSig) {
    setAppliedDefaultsSig(accountDefaultsSig)
    const defaults = designSettingsToVCardDefaults(design)
    setCreateDraft((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...defaults.theme },
      appearance: defaults.appearance,
    }))
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
      portfolio: base.portfolio ?? [],
      skills: base.skills ?? [],
    }
  }, [isCreateMode, createDraft, record])

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
        setCreateDraft(
          (prev) => setByPath(prev as unknown as Record<string, unknown>, path, value) as unknown as VCardData
        )
        return
      }
      if (!cardId || !record) return
      const dataOnly = toVCardData(record)
      const next = setByPath(dataOnly as unknown as Record<string, unknown>, path, value) as unknown as VCardData
      dispatch(replaceVCardData({ id: cardId, data: next }))
    },
    [isCreateMode, cardId, dispatch, record]
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
      await Promise.all([
        replaceEducation({
          id: profileId,
          items: (data.education || []).map((e) => ({
            institute: e.institute,
            degree: e.degree,
            fromDate: e.fromDate || null,
            toDate: e.toDate || null,
            tillNow: e.tillNow,
          })),
        }),
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
        }),
        replaceServices({
          id: profileId,
          items: (data.services || []).map((s) => ({
            title: s.title,
            description: s.description,
            imageUrl: s.featuredImage,
            reviewUrl: s.url,
            status: s.active ? 1 : 0,
          })),
        }),
        replacePortfolios({
          id: profileId,
          items: (data.portfolio || []).map((p) => ({
            title: p.title,
            description: p.description,
            imageUrl: p.imageUrl,
            url: p.url,
            status: p.active ? 1 : 0,
          })),
        }),
        replaceSkills({
          id: profileId,
          items: skillGroupsToApiItems(data.skills || []),
        }),
        replaceSocialLinks({
          id: profileId,
          items: (data.social?.customLinks || []).map((l) => ({
            name: l.name,
            url: l.url,
          })),
        }),
      ])

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

      return synced
    },
    [
      replaceEducation,
      replaceExperiences,
      replaceServices,
      replacePortfolios,
      replaceSkills,
      replaceSocialLinks,
      listPosts,
      createPost,
      updatePost,
      deletePost,
    ]
  )

  const saveVCard = useCallback(async () => {
    if (isCreateMode) {
      const slug = createDraft.slug.trim()
      const name = createDraft.personal.fullName.trim()
      if (!name) throw new Error('Please enter your name before creating the vCard.')
      if (!slug) throw new Error('Please set a public URL slug before creating the vCard.')

      const created = await createProfile(mapVCardDataToProfilePayload(createDraft)).unwrap()
      const mapped = mapApiProfileToVCardRecord(created)
      dispatch(addVCard({ id: mapped.id, seed: toVCardData(mapped) }))

      await persistCollections(created.id, createDraft)
      dispatch(
        publicApi.util.invalidateTags([
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
        ])
      )

      router.push('/vcards')
      return
    }

    if (!cardId || !record) throw new Error('No vCard selected')
    const data = toVCardData(record)
    await updateProfileCard({ id: cardId, body: mapVCardDataToProfilePayload(data) }).unwrap()
    const synced = await persistCollections(cardId, data)

    const generalPosts = mapApiPostsToGeneralPosts(synced.blog)
    const faqs = mapApiPostsToFaqs(synced.faqs)
    const sectionPosts: Record<string, VCardSectionPostItem[]> = {}
    for (const [postTypeName, apiPosts] of Object.entries(synced.sectionPosts || {})) {
      sectionPosts[postTypeName] = mapApiPostsToSectionPosts(apiPosts)
    }
    postsHydratedForId.current = cardId
    postsSnapshotRef.current = { generalPosts, faqs, sectionPosts }

    dispatch(
      replaceVCardData({
        id: cardId,
        data: {
          ...data,
          generalPosts,
          faqs,
          sectionPosts,
        },
      })
    )
    dispatch(
      publicApi.util.invalidateTags([
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
      ])
    )
  }, [
    isCreateMode,
    createDraft,
    cardId,
    record,
    createProfile,
    updateProfileCard,
    persistCollections,
    dispatch,
    router,
  ])

  const value = useMemo(
    () => ({
      cardId,
      isCreateMode,
      vCardData,
      updateData,
      updateMeta,
      saveVCard,
      loading: isFetching || creating || updating,
    }),
    [cardId, isCreateMode, vCardData, updateData, updateMeta, saveVCard, isFetching, creating, updating]
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
