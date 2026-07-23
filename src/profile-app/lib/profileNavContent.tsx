'use client'

import type { ProfileNavContentKey } from '@/lib/vcardNavbar'
import { getNavItemById } from '@/lib/vcardNavbar'
import { AboutSection } from '@/profile-app/components/AboutSection'
import { EducationSection } from '@/profile-app/components/EducationSection'
import { EmptyNavSection } from '@/profile-app/components/EmptyNavSection'
import { ExperienceSection } from '@/profile-app/components/ExperienceSection'
import { FAQSection } from '@/profile-app/components/FAQSection'
import { GeneralPostsSection } from '@/profile-app/components/GeneralPostsSection'
import { HomeSection as HomeSectionV1 } from '@/profile-app/components/HomeSection'
import { HomeSectionV2 } from '@/profile-app/components/HomeSectionV2'
import { ImageGallerySection } from '@/profile-app/components/ImageGallerySection'
import { PublicCardsSection } from '@/profile-app/components/PublicCardsSection'
import { ServicesSection } from '@/profile-app/components/ServicesSection'
import {
  AdditionalServicesSection,
  CalendarSection,
  CertificatesSection,
  ClientsSection,
  ExplainerSection,
  MeetOurTeamSection,
  MissionSection,
  ReviewsSection,
} from '@/profile-app/components/SimpleSections'
import { VideoLinksSection } from '@/profile-app/components/VideoLinksSection'

export function renderProfileNavContent(tabId: string, options?: { template?: 'v1' | 'v2' }) {
  const item = getNavItemById(tabId)
  const contentKey: ProfileNavContentKey = item?.profileContent ?? 'empty'
  const title = item?.label ?? tabId
  const template = options?.template ?? 'v2'

  switch (contentKey) {
    case 'home':
      return template === 'v1' ? <HomeSectionV1 key={tabId} /> : <HomeSectionV2 key={tabId} />
    case 'about':
      return <AboutSection key={tabId} />
    case 'mission':
      return <MissionSection key={tabId} />
    case 'services':
      return <ServicesSection key={tabId} />
    case 'additional':
      return <AdditionalServicesSection key={tabId} />
    case 'blog':
      return <GeneralPostsSection key={tabId} />
    case 'gallery':
      return <ImageGallerySection key={tabId} />
    case 'videos':
    case 'video-links':
      return <VideoLinksSection key={tabId} />
    case 'explainer':
      return <ExplainerSection key={tabId} />
    case 'reviews':
      return <ReviewsSection key={tabId} />
    case 'certificates':
      return <CertificatesSection key={tabId} />
    case 'education':
      return <EducationSection key={tabId} />
    case 'work':
      return <ExperienceSection key={tabId} />
    case 'public-cards':
      return <PublicCardsSection key={tabId} />
    case 'clients':
      return <ClientsSection key={tabId} />
    case 'meet-team':
      return <MeetOurTeamSection key={tabId} />
    case 'calendar':
      return <CalendarSection key={tabId} />
    case 'faq':
      return <FAQSection key={tabId} template={template} />
    case 'empty':
    default:
      return <EmptyNavSection key={tabId} title={title} />
  }
}
