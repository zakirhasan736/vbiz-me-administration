'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { AboutMeQueryResult } from '@/interfaces/api/aboutMe.interface'
import type { DynamicPostListItem, DynamicPostsQueryResult } from '@/interfaces/api/dynamicPosts.interface'
import type { GalleryQueryResult } from '@/interfaces/api/gallery.interface'
import type { ProfileAiData } from '@/interfaces/api/profileAiData'
import type { ReviewsQueryResult } from '@/interfaces/api/reviews.interface'
import type { ServicesQueryResult } from '@/interfaces/api/services.interface'
import type { NavBarLinksData, PostTypeNavLink } from '@/interfaces/navbarLinks.interface'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { dynamicSectionApi } from '@/redux/features/dynamicSection/dynamicSection.api'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import { profileAiDataApi } from '@/redux/features/profileAiData/profileAiData.api'
import { aboutMeApi } from '@/redux/features/sections/aboutMe.api'
import { galleryApi } from '@/redux/features/sections/gallery.api'
import { reviewsApi } from '@/redux/features/sections/reviews.api'
import { servicesApi } from '@/redux/features/sections/services.api'
import type {
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPortfolioEntry,
  VCardReviewEntry,
  VCardSectionPostItem,
  VCardServiceEntry,
  VCardSkillGroup,
} from '@/types/vcard'
import { useEffect, useRef } from 'react'

function draftPostType(id: string, name: string, title: string): PostTypeNavLink {
  return {
    id: id as unknown as number,
    name,
    title,
    status: 'active',
    type_id: '',
    slug: id,
  }
}

function buildDraftNavBarLinks(input: {
  sectionPosts?: Record<string, VCardSectionPostItem[]>
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  skills?: VCardSkillGroup[]
  services?: VCardServiceEntry[]
  portfolio?: VCardPortfolioEntry[]
  reviews?: VCardReviewEntry[]
  about?: string
}): NavBarLinksData {
  const post_types: PostTypeNavLink[] = []
  const pushUnique = (item: PostTypeNavLink) => {
    if (post_types.some((t) => t.name.toLowerCase() === item.name.toLowerCase())) return
    post_types.push(item)
  }

  if ((input.about || '').trim()) pushUnique(draftPostType('about', 'About Me', 'About Me'))
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

  return {
    StaticLink: [{ id: 'home', title: 'Home', name: 'Home', post_type: 'static', active: true }],
    post_types,
  }
}

const DEFAULT_HOME_STATIC: NavBarLinksData['StaticLink'] = [
  { id: 'home', title: 'Home', name: 'Home', post_type: 'static', active: true },
]

/** Keep published API tabs and add any draft-only sections that already have content. */
function mergeNavBarLinks(api: NavBarLinksData | undefined, draft: NavBarLinksData): NavBarLinksData {
  const byName = new Map<string, PostTypeNavLink>()
  for (const item of api?.post_types ?? []) {
    byName.set(item.name.toLowerCase(), item)
  }
  for (const item of draft.post_types ?? []) {
    const key = item.name.toLowerCase()
    if (!byName.has(key)) byName.set(key, item)
  }
  return {
    StaticLink: api?.StaticLink?.length ? api.StaticLink : (draft.StaticLink ?? DEFAULT_HOME_STATIC),
    post_types: Array.from(byName.values()),
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
  cardOwnerId?: string
  about?: string
  sectionPosts?: Record<string, VCardSectionPostItem[]>
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  education?: VCardEducationEntry[]
  experience?: VCardExperienceEntry[]
  skills?: VCardSkillGroup[]
  services?: VCardServiceEntry[]
  portfolio?: VCardPortfolioEntry[]
  reviews?: VCardReviewEntry[]
}

/**
 * When the editor live preview is embedded, push draft collections into the public RTK
 * Query cache so section tabs reflect unsaved edits without hitting the network.
 */
export function EmbeddedDraftCacheSync({
  embedded,
  cardOwnerId,
  about,
  sectionPosts,
  generalPosts,
  faqs,
  education,
  experience,
  skills,
  services,
  portfolio,
  reviews,
}: EmbeddedDraftCacheSyncProps) {
  const dispatch = useAppDispatch()
  /** Pure API `/post-types` payload — kept so draft merges do not permanently overwrite published tabs. */
  const apiNavBaselineRef = useRef<{ profileId: string; loaded: boolean; data?: NavBarLinksData }>({
    profileId: '',
    loaded: false,
  })

  useEffect(() => {
    if (!embedded || !cardOwnerId) return
    const profileId = cardOwnerId
    let cancelled = false

    for (const [sectionName, items] of Object.entries(sectionPosts || {})) {
      if (!sectionName || !items) continue
      dispatch(
        dynamicSectionApi.util.upsertQueryData(
          'getDynamicSection',
          { profileId, sectionName },
          toDynamicResult(sectionName, items)
        )
      )
    }

    if (generalPosts) {
      dispatch(
        dynamicSectionApi.util.upsertQueryData(
          'getDynamicSection',
          { profileId, sectionName: PUBLIC_SECTION_NAMES.blog },
          generalPostsToDynamic(generalPosts)
        )
      )
    }

    if (faqs) {
      dispatch(
        dynamicSectionApi.util.upsertQueryData(
          'getDynamicSection',
          { profileId, sectionName: PUBLIC_SECTION_NAMES.faq },
          faqsToDynamic(faqs)
        )
      )
    }

    if (about !== undefined) {
      const aboutResult: AboutMeQueryResult = {
        sectionTitle: 'About Me',
        items: about.trim()
          ? [
              {
                id: 1,
                title: 'About Me',
                plainDescription: about,
                htmlDescription: about,
                introHtml: about,
                featuredImage: '',
                pillars: [],
                highlight: null,
                footer: null,
              },
            ]
          : [],
      }
      dispatch(aboutMeApi.util.upsertQueryData('getAboutMe', profileId, aboutResult))
    }

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
      dispatch(servicesApi.util.upsertQueryData('getServices', profileId, servicesResult))
    }

    if (portfolio) {
      const galleryResult: GalleryQueryResult = {
        sectionTitle: 'Gallery',
        items: portfolio
          .filter((p) => p.active)
          .map((p, index) => ({
            id: index + 1,
            title: p.title,
            imageUrl: p.imageUrl,
            createdAt: '',
          })),
      }
      dispatch(galleryApi.util.upsertQueryData('getGallery', profileId, galleryResult))
    }

    const reviewDraft = reviews
    if (reviewDraft) {
      const slides = reviewDraft
        .filter((r) => r.author?.trim() || r.text?.trim())
        .map((r, index) => {
          const rawRating = typeof r.rating === 'number' ? r.rating : Number(r.rating)
          const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5
          return {
            id: r.id || index + 1,
            title: r.author || 'Review',
            plainDescription: r.text || '',
            htmlDescription: r.text || '',
            image: '',
            linkUrl: null as string | null,
            isLinkCard: false,
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
      dispatch(reviewsApi.util.upsertQueryData('getReviews', profileId, reviewsResult))
    }

    const skillGroups = (skills || [])
      .map((g) => ({
        category: (g.type || '').trim(),
        skills: (g.skills || []).map((s) => String(s || '').trim()).filter(Boolean),
      }))
      .filter((g) => g.skills.length > 0)
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
      about: about || '',
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
      customSections: [],
    }
    dispatch(profileAiDataApi.util.upsertQueryData('getProfileAiData', profileId, aiData))

    const draftNav = buildDraftNavBarLinks({
      sectionPosts,
      generalPosts,
      faqs,
      education,
      experience,
      skills,
      services,
      portfolio,
      reviews,
      about,
    })

    // Merge draft tabs onto published API post-types (do not replace the catalog).
    void (async () => {
      if (apiNavBaselineRef.current.profileId !== profileId) {
        apiNavBaselineRef.current = { profileId, loaded: false, data: undefined }
      }
      if (!apiNavBaselineRef.current.loaded) {
        const result = await dispatch(
          navBarLinksApi.endpoints.getNavBarLinks.initiate(profileId, { forceRefetch: true })
        )
        if (cancelled) return
        apiNavBaselineRef.current = {
          profileId,
          loaded: true,
          data: 'data' in result ? result.data : undefined,
        }
      }
      if (cancelled) return
      dispatch(
        navBarLinksApi.util.upsertQueryData(
          'getNavBarLinks',
          profileId,
          mergeNavBarLinks(apiNavBaselineRef.current.data, draftNav)
        )
      )
    })()

    return () => {
      cancelled = true
    }
  }, [
    embedded,
    cardOwnerId,
    about,
    sectionPosts,
    generalPosts,
    faqs,
    education,
    experience,
    skills,
    services,
    portfolio,
    reviews,
    dispatch,
  ])

  return null
}
