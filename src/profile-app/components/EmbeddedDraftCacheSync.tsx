'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { AboutMeQueryResult } from '@/interfaces/api/aboutMe.interface'
import type { DynamicPostsQueryResult } from '@/interfaces/api/dynamicPosts.interface'
import type { GalleryQueryResult } from '@/interfaces/api/gallery.interface'
import type { ProfileAiData } from '@/interfaces/api/profileAiData'
import type { ReviewsQueryResult } from '@/interfaces/api/reviews.interface'
import type { ServicesQueryResult } from '@/interfaces/api/services.interface'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import { dynamicSectionApi } from '@/redux/features/dynamicSection/dynamicSection.api'
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

    const skillNames = (skills || []).flatMap((g) => g.skills || [])
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
      skills: skillNames,
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
