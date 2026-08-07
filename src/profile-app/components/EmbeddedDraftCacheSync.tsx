'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { AboutMeQueryResult } from '@/interfaces/api/aboutMe.interface'
import type { DynamicPostsQueryResult } from '@/interfaces/api/dynamicPosts.interface'
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
  VCardSectionPostItem,
  VCardServiceEntry,
  VCardSkillGroup,
} from '@/types/vcard'
import { useEffect } from 'react'

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

function toDynamicResult(sectionName: string, items: VCardSectionPostItem[]): DynamicPostsQueryResult {
  return {
    sectionTitle: sectionName,
    posts: items
      .filter((p) => p.active !== false)
      .map((p) => ({
        id: p.id,
        title: p.title || '',
        description: p.description || '',
        featuredImage: p.featuredImage || '',
        generalInfoUrl: p.url || '',
        date: p.date || '',
        attachments: [],
      })),
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
}: EmbeddedDraftCacheSyncProps) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!embedded || !cardOwnerId) return
    const profileId = cardOwnerId

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

    const reviewDraft = sectionPosts?.[PUBLIC_SECTION_NAMES.reviews]
    if (reviewDraft) {
      const slides = reviewDraft
        .filter((p) => p.active !== false)
        .map((p, index) => ({
          id: index + 1,
          title: p.title,
          plainDescription: p.description,
          htmlDescription: p.description,
          image: p.featuredImage,
          linkUrl: p.url || null,
          isLinkCard: Boolean(p.url?.trim()),
        }))
      const reviewsResult: ReviewsQueryResult = {
        sectionTitle: 'Reviews',
        slides,
        leaveReviewUrl: null,
        reviewCount: slides.length,
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
        status: p.active ? 1 : 0,
      })),
      customSections: [],
    }
    dispatch(profileAiDataApi.util.upsertQueryData('getProfileAiData', profileId, aiData))

    // Keep preview nav in sync with draft collections (e.g. Skills tab before/after save).
    dispatch(
      navBarLinksApi.util.upsertQueryData(
        'getNavBarLinks',
        profileId,
        buildDraftNavBarLinks({
          sectionPosts,
          generalPosts,
          faqs,
          education,
          experience,
          skills,
          services,
          portfolio,
          about,
        })
      )
    )
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
    dispatch,
  ])

  return null
}
