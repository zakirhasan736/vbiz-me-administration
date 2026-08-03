/**
 * Lazy-loaded section components — only the active nav tab's chunk is fetched.
 * Home sections stay eager (first paint); all other tabs load on demand.
 */
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyNamed(loader: () => Promise<Record<string, ComponentType<any>>>, exportName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => loader().then((mod) => ({ default: mod[exportName] }))) as ComponentType<any>
}

export const HomeSectionV1 = lazyNamed(() => import('@/profile-app/components/HomeSection'), 'HomeSection')
export const HomeSectionV2 = lazyNamed(() => import('@/profile-app/components/HomeSectionV2'), 'HomeSectionV2')
export const HomeHero = lazyNamed(() => import('@/profile-app/v3/components/HomeHero'), 'HomeHero')

export const AboutSection = lazyNamed(() => import('@/profile-app/components/AboutSection'), 'AboutSection')
export const MissionSection = lazyNamed(() => import('@/profile-app/components/MissionSection'), 'MissionSection')
export const ServicesSection = lazyNamed(() => import('@/profile-app/components/ServicesSection'), 'ServicesSection')
export const AdditionalServicesSection = lazyNamed(
  () => import('@/profile-app/components/AdditionalServicesSection'),
  'AdditionalServicesSection'
)
export const BlogSection = lazyNamed(() => import('@/profile-app/components/BlogSection'), 'BlogSection')
export const PostsSection = lazyNamed(() => import('@/profile-app/components/PostsSection'), 'PostsSection')
export const ImageGallerySection = lazyNamed(
  () => import('@/profile-app/components/ImageGallerySection'),
  'ImageGallerySection'
)
export const VideosSection = lazyNamed(() => import('@/profile-app/components/VideosSection'), 'VideosSection')
export const VideoLinksSection = lazyNamed(
  () => import('@/profile-app/components/VideoLinksSection'),
  'VideoLinksSection'
)
export const WhyChooseUsSection = lazyNamed(
  () => import('@/profile-app/components/WhyChooseUsSection'),
  'WhyChooseUsSection'
)
export const ExplainerSection = lazyNamed(() => import('@/profile-app/components/ExplainerSection'), 'ExplainerSection')
export const ReviewsSection = lazyNamed(() => import('@/profile-app/components/ReviewsSection'), 'ReviewsSection')
export const CertificationsLicensingSection = lazyNamed(
  () => import('@/profile-app/components/CertificationsLicensingSection'),
  'CertificationsLicensingSection'
)
export const EducationSection = lazyNamed(() => import('@/profile-app/components/EducationSection'), 'EducationSection')
export const ExperienceSection = lazyNamed(
  () => import('@/profile-app/components/ExperienceSection'),
  'ExperienceSection'
)
export const PublicCardsSection = lazyNamed(
  () => import('@/profile-app/components/PublicCardsSection'),
  'PublicCardsSection'
)
export const ClientsSection = lazyNamed(() => import('@/profile-app/components/ClientsSection'), 'ClientsSection')
export const MeetOurTeamSection = lazyNamed(
  () => import('@/profile-app/components/MeetOurTeamSection'),
  'MeetOurTeamSection'
)
export const JoinMyTeamSection = lazyNamed(
  () => import('@/profile-app/components/JoinMyTeamSection'),
  'JoinMyTeamSection'
)
export const CalendarSection = lazyNamed(() => import('@/profile-app/components/CalendarSection'), 'CalendarSection')
export const EventsSection = lazyNamed(() => import('@/profile-app/components/EventsSection'), 'EventsSection')
export const BookingSection = lazyNamed(() => import('@/profile-app/components/BookingSection'), 'BookingSection')
export const MenuSection = lazyNamed(() => import('@/profile-app/components/MenuSection'), 'MenuSection')
export const SalesPersonSection = lazyNamed(
  () => import('@/profile-app/components/SalesPersonSection'),
  'SalesPersonSection'
)
export const SeeProductsSection = lazyNamed(
  () => import('@/profile-app/components/SeeProductsSection'),
  'SeeProductsSection'
)
export const FAQSection = lazyNamed(() => import('@/profile-app/components/FAQSection'), 'FAQSection')
export const BbbAccreditationSection = lazyNamed(
  () => import('@/profile-app/components/BbbAccreditationSection'),
  'BbbAccreditationSection'
)
export const DcpSection = lazyNamed(() => import('@/profile-app/components/DcpSection'), 'DcpSection')
export const HomeSolarSection = lazyNamed(() => import('@/profile-app/components/HomeSolarSection'), 'HomeSolarSection')
export const ResiliencyProductsSection = lazyNamed(
  () => import('@/profile-app/components/ResiliencyProductsSection'),
  'ResiliencyProductsSection'
)
export const PropertyListingSection = lazyNamed(
  () => import('@/profile-app/components/PropertyListingSection'),
  'PropertyListingSection'
)
export const MediaPressSection = lazyNamed(
  () => import('@/profile-app/components/MediaPressSection'),
  'MediaPressSection'
)
export const AnnouncementSection = lazyNamed(
  () => import('@/profile-app/components/AnnouncementSection'),
  'AnnouncementSection'
)
export const BreakfastSection = lazyNamed(() => import('@/profile-app/components/BreakfastSection'), 'BreakfastSection')
export const DinnerSection = lazyNamed(() => import('@/profile-app/components/DinnerSection'), 'DinnerSection')
export const LunchSection = lazyNamed(() => import('@/profile-app/components/LunchSection'), 'LunchSection')
export const InventorySection = lazyNamed(() => import('@/profile-app/components/InventorySection'), 'InventorySection')
export const LicensingSection = lazyNamed(() => import('@/profile-app/components/LicensingSection'), 'LicensingSection')
export const InsuranceLicenseSection = lazyNamed(
  () => import('@/profile-app/components/InsuranceLicenseSection'),
  'InsuranceLicenseSection'
)
export const EmptyNavSection = lazyNamed(() => import('@/profile-app/components/EmptyNavSection'), 'EmptyNavSection')
