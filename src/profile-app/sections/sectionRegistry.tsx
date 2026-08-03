'use client'

import type { ProfileNavContentKey } from '@/lib/vcardNavbar'
import {
  AboutSection,
  AdditionalServicesSection,
  AnnouncementSection,
  BbbAccreditationSection,
  BlogSection,
  BookingSection,
  BreakfastSection,
  CalendarSection,
  CertificationsLicensingSection,
  ClientsSection,
  DcpSection,
  DinnerSection,
  EducationSection,
  EmptyNavSection,
  EventsSection,
  ExperienceSection,
  ExplainerSection,
  FAQSection,
  HomeHero,
  HomeSectionV1,
  HomeSectionV2,
  HomeSolarSection,
  ImageGallerySection,
  InsuranceLicenseSection,
  InventorySection,
  JoinMyTeamSection,
  LicensingSection,
  LunchSection,
  MediaPressSection,
  MeetOurTeamSection,
  MenuSection,
  MissionSection,
  PostsSection,
  PropertyListingSection,
  PublicCardsSection,
  ResiliencyProductsSection,
  ReviewsSection,
  SalesPersonSection,
  SeeProductsSection,
  ServicesSection,
  VideoLinksSection,
  VideosSection,
  WhyChooseUsSection,
} from '@/profile-app/sections/sectionLazyComponents'
import type { ReactNode } from 'react'

export type ProfileTemplateVariant = 'v1' | 'v2' | 'v3'

export type HomeHeroProps = {
  theme: 'light' | 'dark'
  onAction: (action: string) => void
  toggleTheme: () => void
}

type RenderSectionOptions = {
  contentKey: ProfileNavContentKey
  tabId: string
  title: string
  /** Exact `/post-types` nav `name` for `GET /dynamic-section/{name}?profile_id=`. */
  sectionName?: string
  template: ProfileTemplateVariant
  homeHeroProps?: HomeHeroProps
}

/** Maps profile nav content keys to lazy-loaded section components (one chunk per tab). */
export function renderProfileSection({
  contentKey,
  tabId,
  title,
  sectionName,
  template,
  homeHeroProps,
}: RenderSectionOptions): ReactNode {
  switch (contentKey) {
    case 'home':
      if ((template === 'v3' || template === 'v1') && homeHeroProps) {
        if (template === 'v3') {
          return (
            <HomeHero
              key={tabId}
              theme={homeHeroProps.theme}
              onAction={homeHeroProps.onAction}
              toggleTheme={homeHeroProps.toggleTheme}
            />
          )
        }
        return <HomeSectionV1 key={tabId} homeHeroProps={homeHeroProps} />
      }
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
      return <BlogSection key={tabId} sectionName={sectionName} />
    case 'post':
      return <PostsSection key={tabId} />
    case 'gallery':
      return <ImageGallerySection key={tabId} />
    case 'videos':
      return <VideosSection key={tabId} />
    case 'video-links':
      return <VideoLinksSection key={tabId} sectionName={sectionName} />
    case 'why-choose-us':
      return <WhyChooseUsSection key={tabId} />
    case 'explainer':
      return <ExplainerSection key={tabId} />
    case 'reviews':
      return <ReviewsSection key={tabId} />
    case 'certificates':
      return <CertificationsLicensingSection key={tabId} />
    case 'education':
      return <EducationSection key={tabId} sectionName={sectionName} />
    case 'work':
      return <ExperienceSection key={tabId} sectionName={sectionName} />
    case 'public-cards':
      return <PublicCardsSection key={tabId} />
    case 'clients':
      return <ClientsSection key={tabId} />
    case 'meet-team':
      return <MeetOurTeamSection key={tabId} sectionName={sectionName} />
    case 'join-my-team':
      return <JoinMyTeamSection key={tabId} />
    case 'calendar':
      return <CalendarSection key={tabId} />
    case 'events':
      return <EventsSection key={tabId} />
    case 'booking':
      return <BookingSection key={tabId} />
    case 'menu':
      return <MenuSection key={tabId} />
    case 'sales-person':
      return <SalesPersonSection key={tabId} sectionName={sectionName} />
    case 'see-products':
      return <SeeProductsSection key={tabId} />
    case 'faq':
      return <FAQSection key={tabId} sectionName={sectionName} />
    case 'bbb':
      return <BbbAccreditationSection key={tabId} />
    case 'dcp':
      return <DcpSection key={tabId} />
    case 'home-solar':
      return <HomeSolarSection key={tabId} />
    case 'resiliency-products':
      return <ResiliencyProductsSection key={tabId} />
    case 'property-listing':
      return <PropertyListingSection key={tabId} />
    case 'media-press':
      return <MediaPressSection key={tabId} />
    case 'announcement':
      return <AnnouncementSection key={tabId} />
    case 'breakfast':
      return <BreakfastSection key={tabId} />
    case 'dinner':
      return <DinnerSection key={tabId} />
    case 'lunch':
      return <LunchSection key={tabId} />
    case 'inventory':
      return <InventorySection key={tabId} />
    case 'licensing':
      return <LicensingSection key={tabId} sectionName={sectionName} />
    case 'insurance-license':
      return <InsuranceLicenseSection key={tabId} sectionName={sectionName} />
    case 'empty':
    default:
      return <EmptyNavSection key={tabId} title={title} />
  }
}
