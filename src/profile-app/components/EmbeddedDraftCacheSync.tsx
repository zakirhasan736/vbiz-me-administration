'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { AboutMeQueryResult } from '@/interfaces/api/aboutMe.interface'
import type { DynamicPostListItem, DynamicPostsQueryResult } from '@/interfaces/api/dynamicPosts.interface'
import type { GalleryQueryResult } from '@/interfaces/api/gallery.interface'
import type { ProfileAiData } from '@/interfaces/api/profileAiData'
import type { ReviewsQueryResult } from '@/interfaces/api/reviews.interface'
import type { ServicesQueryResult } from '@/interfaces/api/services.interface'
import type { NavBarLinksData, PostTypeNavLink } from '@/interfaces/navbarLinks.interface'
import { getAboutMeDraft, hasAboutMeDraftContent, subscribeAboutMeDraft, type AboutMeDraft } from '@/lib/aboutMeDraft'
import { mapAboutMeItemToListItem } from '@/lib/api/aboutMe/mapAboutMe'
import { NAV_ITEM_BY_ID } from '@/lib/vcardNavbar'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { dynamicSectionApi } from '@/redux/features/dynamicSection/dynamicSection.api'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import { profileAiDataApi } from '@/redux/features/profileAiData/profileAiData.api'
import { aboutMeApi } from '@/redux/features/sections/aboutMe.api'
import { galleryApi } from '@/redux/features/sections/gallery.api'
import { reviewsApi } from '@/redux/features/sections/reviews.api'
import { servicesApi } from '@/redux/features/sections/services.api'
import type {
  VCardCustomTab,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPortfolioEntry,
  VCardReviewEntry,
  VCardSectionPostItem,
  VCardServiceEntry,
  VCardSkillGroup,
  VCardTabLabelOverrides,
} from '@/types/vcard'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function draftPostType(id: string, name: string, title: string): PostTypeNavLink {
  return {
    id,
    key: id,
    name,
    title,
    status: 'active',
    type_id: '',
    slug: id,
  }
}

/** Rewrite unchanged slices at least this often — below RTK Query's 60s unused-cache eviction. */
const SEED_REFRESH_MS = 30_000

function buildDraftNavBarLinks(input: {
  sectionPosts?: Record<string, VCardSectionPostItem[]>
  customTabs?: VCardCustomTab[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  skills?: VCardSkillGroup[]
  services?: VCardServiceEntry[]
  portfolio?: VCardPortfolioEntry[]
  reviews?: VCardReviewEntry[]
  aboutMeDraft?: AboutMeDraft
  editorNavOrder?: string[]
  tabLabelOverrides?: VCardTabLabelOverrides
}): NavBarLinksData {
  const selectedOrder = Array.isArray(input.editorNavOrder)
    ? input.editorNavOrder.filter((id): id is string => typeof id === 'string' && Boolean(id.trim()))
    : []

  if (selectedOrder.length) {
    const customById = new Map((input.customTabs || []).map((tab) => [tab.id, tab]))
    const overrides = input.tabLabelOverrides || {}
    const post_types = selectedOrder.map((id) => {
      const custom = customById.get(id)
      const def = NAV_ITEM_BY_ID[id]
      const title =
        (typeof overrides[id] === 'string' && overrides[id].trim()) ||
        custom?.label?.trim() ||
        def?.displayLabel ||
        def?.label ||
        id
      return draftPostType(id, id, title)
    })
    return { StaticLink: [], post_types }
  }

  const post_types: PostTypeNavLink[] = []
  const pushUnique = (item: PostTypeNavLink) => {
    if (post_types.some((t) => t.name.toLowerCase() === item.name.toLowerCase())) return
    post_types.push(item)
  }

  if (input.aboutMeDraft && hasAboutMeDraftContent(input.aboutMeDraft)) {
    pushUnique(draftPostType('about', 'About Me', 'About Me'))
  }
  if ((input.services || []).some((s) => s.active !== false && s.title?.trim())) {
    pushUnique(draftPostType('services', 'services', 'Services'))
  }
  if ((input.portfolio || []).some((p) => p.active !== false && (p.title?.trim() || p.imageUrl?.trim()))) {
    pushUnique(draftPostType('gallery', 'gallery', 'Gallery'))
  }
  if ((input.reviews || []).some((r) => r.author?.trim() || r.text?.trim())) {
    pushUnique(draftPostType('reviews', 'reviews', 'Reviews'))
  }
  if ((input.education || []).some((e) => e.institute?.trim() || e.degree?.trim())) {
    pushUnique(draftPostType('resume', 'Resume', 'Resume'))
  }
  if ((input.experience || []).some((e) => e.company?.trim() || e.jobTitle?.trim())) {
    pushUnique(draftPostType('work-experience', 'Work Experience', 'Work Experience'))
  }
  if ((input.skills || []).some((g) => (g.skills || []).some((s) => s.trim()))) {
    pushUnique(draftPostType('skills', 'skills', 'Skills'))
  }
  if ((input.generalPosts || []).some((p) => p.active !== false && p.title?.trim())) {
    pushUnique(draftPostType('blog', 'Blog', 'Blog'))
  }
  if ((input.faqs || []).some((f) => f.active !== false && f.question?.trim())) {
    pushUnique(draftPostType('faq', 'Faq', 'Faq'))
  }
  for (const [name, items] of Object.entries(input.sectionPosts || {})) {
    if (!name.trim() || !(items || []).some((p) => p.active !== false && (p.title?.trim() || p.description?.trim()))) {
      continue
    }
    pushUnique(draftPostType(name, name, name))
  }
  for (const tab of input.customTabs || []) {
    const title = tab.label?.trim() || 'Custom tab'
    if (!(tab.items || []).some((item) => item.active !== false && (item.title?.trim() || item.description?.trim()))) {
      continue
    }
    pushUnique(draftPostType(tab.id, tab.id, title))
  }

  return {
    StaticLink: [{ id: 'home', title: 'Home', name: 'Home', post_type: 'static', active: true }],
    post_types,
  }
}

function toDynamicResult(sectionName: string, items: VCardSectionPostItem[]): DynamicPostsQueryResult {
  return {
    sectionTitle: sectionName,
    posts: items
      .filter((p) => p.active !== false)
      .map((p) => {
        const metas = p.metas || {}
        const issuer = typeof metas.issuer === 'string' ? metas.issuer : ''
        const year = (typeof metas.year === 'string' && metas.year.trim()) || (p.date?.match(/^\d{4}/)?.[0] ?? '') || ''
        let attachments: DynamicPostListItem['attachments'] = []
        if (typeof metas.documents === 'string' && metas.documents.trim()) {
          try {
            const parsed = JSON.parse(metas.documents) as Array<{
              id?: string
              name?: string
              url?: string
            }>
            if (Array.isArray(parsed)) {
              attachments = parsed
                .filter((d) => d?.url?.trim())
                .map((d, index) => ({
                  id: d.id || index,
                  doc_name: d.name || 'Document',
                  attachment_type_id: 0,
                  url: d.url!.trim(),
                }))
            }
          } catch {
            attachments = []
          }
        }
        if (!attachments.length && p.featuredImage?.trim()) {
          attachments = [
            {
              id: 0,
              doc_name: 'Document',
              attachment_type_id: 0,
              url: p.featuredImage.trim(),
            },
          ]
        }
        return {
          id: p.id,
          title: p.title || '',
          description: p.description || '',
          featuredImage: p.featuredImage || '',
          generalInfoUrl: p.url || attachments[0]?.url || '',
          date: year || p.date || '',
          issuer,
          year,
          attachments,
        }
      }),
  }
}

function generalPostsToDynamic(posts: VCardGeneralPost[]): DynamicPostsQueryResult {
  return {
    sectionTitle: 'Blog',
    posts: posts
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        featuredImage: p.featuredImage || '',
        generalInfoUrl: p.customUrl || '',
        date: p.date || '',
        issuer: '',
        year: '',
        attachments: [],
      })),
  }
}

function faqsToDynamic(faqs: VCardFaqEntry[]): DynamicPostsQueryResult {
  return {
    sectionTitle: 'Faq',
    posts: faqs
      .filter((f) => f.active)
      .map((f) => ({
        id: f.id,
        title: f.question || '',
        description: f.answer || '',
        featuredImage: '',
        generalInfoUrl: '',
        date: '',
        issuer: '',
        year: '',
        attachments: [],
      })),
  }
}

type EmbeddedDraftCacheSyncProps = {
  embedded?: boolean
  previewActive?: boolean
  cardOwnerId?: string
  sectionPosts?: Record<string, VCardSectionPostItem[]>
  customTabs?: VCardCustomTab[]
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  skills?: VCardSkillGroup[]
  services?: VCardServiceEntry[]
  portfolio?: VCardPortfolioEntry[]
  reviews?: VCardReviewEntry[]
  editorNavOrder?: string[]
  tabLabelOverrides?: VCardTabLabelOverrides
}

function aboutMeDraftToQueryResult(draft: AboutMeDraft): AboutMeQueryResult {
  if (!hasAboutMeDraftContent(draft)) {
    return { sectionTitle: 'About Me', items: [] }
  }
  const title = draft.title.trim()
  return {
    sectionTitle: 'About Me',
    items: [
      mapAboutMeItemToListItem({
        id: 1,
        title,
        description: draft.descriptionHtml || null,
        profile_id: 0,
        post_type_id: 0,
        status: 1,
        created_at: '',
        updated_at: '',
        featured_image: draft.featuredMediaUrl.trim() || null,
      }),
    ],
  }
}

/**
 * When the editor live preview is embedded, push draft collections into the public RTK
 * Query cache so section tabs reflect unsaved edits without hitting the network.
 */
export function EmbeddedDraftCacheSync({
  embedded,
  previewActive = true,
  cardOwnerId,
  sectionPosts,
  customTabs,
  generalPosts,
  faqs,
  education,
  experience,
  skills,
  services,
  portfolio,
  reviews,
  editorNavOrder,
  tabLabelOverrides,
}: EmbeddedDraftCacheSyncProps) {
  const dispatch = useAppDispatch()
  const [aboutMeDraft, setAboutMeDraftState] = useState<AboutMeDraft>(() => getAboutMeDraft())
  /** Last payload written per cache slice — the draft object identity changes on every keystroke. */
  const signaturesRef = useRef<{ profileId: string; signatures: Map<string, { value: string; writtenAt: number }> }>({
    profileId: '',
    signatures: new Map(),
  })

  useEffect(() => subscribeAboutMeDraft(() => setAboutMeDraftState(getAboutMeDraft())), [])

  useLayoutEffect(() => {
    if (!embedded || !previewActive || !cardOwnerId) return
    const profileId = cardOwnerId

    if (signaturesRef.current.profileId !== profileId) {
      signaturesRef.current = { profileId, signatures: new Map() }
    }
    const signatures = signaturesRef.current.signatures
    const now = Date.now()

    /**
     * Skip the dispatch when this slice's mapped payload is unchanged. Unchanged slices are
     * still refreshed periodically so an unvisited section never loses its seeded entry to
     * RTK Query's unused-cache eviction.
     */
    const hasChanged = (key: string, signature: string) => {
      const previous = signatures.get(key)
      if (previous && previous.value === signature && now - previous.writtenAt < SEED_REFRESH_MS) return false
      signatures.set(key, { value: signature, writtenAt: now })
      return true
    }

    const upsertIfChanged = <T,>(key: string, payload: T, write: (value: T) => void) => {
      if (!hasChanged(key, JSON.stringify(payload))) return
      write(payload)
    }

    for (const [sectionName, items] of Object.entries(sectionPosts || {})) {
      if (!sectionName || !items) continue
      upsertIfChanged(`section:${sectionName}`, toDynamicResult(sectionName, items), (result) =>
        dispatch(dynamicSectionApi.util.upsertQueryData('getDynamicSection', { profileId, sectionName }, result))
      )
    }

    for (const tab of customTabs || []) {
      const sectionName = tab.id
      const result: DynamicPostsQueryResult = {
        sectionTitle: tab.label?.trim() || sectionName,
        posts: (tab.items || [])
          .filter((item) => item.active !== false)
          .map((item) => ({
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            featuredImage: item.mediaUrl || '',
            generalInfoUrl: item.url || '',
            date: '',
            issuer: '',
            year: '',
            attachments: item.mediaUrl
              ? [
                  {
                    id: item.id,
                    doc_name: item.mediaName || 'Media',
                    attachment_type_id: 0,
                    url: item.mediaUrl,
                  },
                ]
              : [],
          })),
      }
      upsertIfChanged(`custom:${sectionName}`, result, (value) =>
        dispatch(dynamicSectionApi.util.upsertQueryData('getDynamicSection', { profileId, sectionName }, value))
      )
    }

    if (generalPosts) {
      upsertIfChanged('blog', generalPostsToDynamic(generalPosts), (result) =>
        dispatch(
          dynamicSectionApi.util.upsertQueryData(
            'getDynamicSection',
            { profileId, sectionName: PUBLIC_SECTION_NAMES.blog },
            result
          )
        )
      )
    }

    if (faqs) {
      upsertIfChanged('faq', faqsToDynamic(faqs), (result) =>
        dispatch(
          dynamicSectionApi.util.upsertQueryData(
            'getDynamicSection',
            { profileId, sectionName: PUBLIC_SECTION_NAMES.faq },
            result
          )
        )
      )
    }

    const aboutResult = aboutMeDraftToQueryResult(aboutMeDraft)
    upsertIfChanged('about', aboutResult, (result) =>
      dispatch(aboutMeApi.util.upsertQueryData('getAboutMe', profileId, result))
    )

    if (services) {
      const servicesResult: ServicesQueryResult = {
        sectionTitle: 'Services',
        services: services
          .filter((s) => s.active)
          .map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            htmlDescription: s.description,
            featuredImage: s.featuredImage,
            url: s.url,
          })),
      }
      upsertIfChanged('services', servicesResult, (result) =>
        dispatch(servicesApi.util.upsertQueryData('getServices', profileId, result))
      )
    }

    if (portfolio) {
      const galleryResult: GalleryQueryResult = {
        sectionTitle: 'Gallery',
        items: portfolio
          .filter((p) => p.active)
          .map((p) => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl || p.attachments?.url || '',
            createdAt: '',
          })),
      }
      upsertIfChanged('gallery', galleryResult, (result) =>
        dispatch(galleryApi.util.upsertQueryData('getGallery', profileId, result))
      )
    }

    const reviewDraft = reviews
    if (reviewDraft) {
      const slides = reviewDraft
        .filter((r) => r.author?.trim() || r.text?.trim())
        .map((r, index) => {
          const rawRating = typeof r.rating === 'number' ? r.rating : Number(r.rating)
          const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5
          const linkUrl = r.url?.trim() || null
          return {
            id: r.id || index + 1,
            title: r.author || (linkUrl ? 'Leave a Review' : 'Review'),
            plainDescription: r.text || '',
            htmlDescription: r.text || '',
            image: r.imageUrl || '',
            linkUrl,
            isLinkCard: Boolean(linkUrl) && !(r.author?.trim() || r.text?.trim()),
            rating,
          }
        })
      const averageRating =
        slides.length > 0 ? Math.round((slides.reduce((sum, s) => sum + s.rating, 0) / slides.length) * 10) / 10 : 0
      const reviewsResult: ReviewsQueryResult = {
        sectionTitle: 'Reviews',
        slides,
        leaveReviewUrl: null,
        reviewCount: slides.length,
        averageRating,
      }
      upsertIfChanged('reviews', reviewsResult, (result) =>
        dispatch(reviewsApi.util.upsertQueryData('getReviews', profileId, result))
      )
    }

    const skillGroups = (skills || [])
      .map((g) => ({
        category: (g.type || '').trim(),
        skills: (g.skills || []).map((s) => String(s || '').trim()).filter(Boolean),
      }))
      .filter((g) => g.skills.length > 0)
    const aboutPlain =
      aboutResult.items[0]?.plainDescription ||
      aboutMeDraft.descriptionHtml
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const aiData: ProfileAiData = {
      slug: '',
      ownerName: '',
      title: '',
      profession: null,
      company: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      location: '',
      about: aboutPlain || '',
      socials: {
        facebook: null,
        instagram: null,
        twitter: null,
        linkedin: null,
        youtube: null,
        tiktok: null,
        rumble: null,
        truth: null,
      },
      skills: skillGroups,
      services: (services || []).map((s) => ({
        title: s.title,
        description: s.description,
      })),
      experience: (experience || []).map((e) => ({
        title: e.jobTitle,
        company: e.company,
        job_title: e.jobTitle,
        description: e.description,
        from_date: e.fromDate,
        to_date: e.tillNow ? null : e.toDate || null,
        current_status: e.tillNow ? 1 : 0,
      })),
      education: (education || []).map((e) => ({
        title: e.degree,
        institute: e.institute,
        from_date: e.fromDate,
        to_date: e.tillNow ? null : e.toDate || null,
        current_status: e.tillNow ? 1 : 0,
      })),
      portfolio: (portfolio || []).map((p) => ({
        title: p.title,
        description: p.description,
        url: p.url || null,
        imageUrl: p.imageUrl || null,
        attachmentUrl: p.attachments?.url || null,
        attachmentName: p.attachments?.name || null,
        status: p.active ? 1 : 0,
      })),
      customSections: (customTabs || []).flatMap((tab) =>
        (tab.items || [])
          .filter((item) => item.active !== false && (item.title?.trim() || item.description?.trim()))
          .map((item) => ({
            section: tab.label || 'Custom tab',
            title: item.title || '',
            summary: item.description || '',
            content: item.description || '',
            date: '',
          }))
      ),
    }
    upsertIfChanged('aiData', aiData, (result) =>
      dispatch(profileAiDataApi.util.upsertQueryData('getProfileAiData', profileId, result))
    )

    const draftNav = buildDraftNavBarLinks({
      sectionPosts,
      customTabs,
      generalPosts,
      faqs,
      education,
      experience,
      skills,
      services,
      portfolio,
      reviews,
      aboutMeDraft,
      editorNavOrder,
      tabLabelOverrides,
    })

    upsertIfChanged('nav', draftNav, (result) =>
      dispatch(navBarLinksApi.util.upsertQueryData('getNavBarLinks', profileId, result))
    )
  }, [
    embedded,
    previewActive,
    cardOwnerId,
    aboutMeDraft,
    sectionPosts,
    customTabs,
    generalPosts,
    faqs,
    education,
    experience,
    skills,
    services,
    portfolio,
    reviews,
    editorNavOrder,
    tabLabelOverrides,
    dispatch,
  ])

  return null
}
