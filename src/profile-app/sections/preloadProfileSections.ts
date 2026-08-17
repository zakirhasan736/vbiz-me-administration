import type { ProfileNavContentKey } from '@/lib/vcardNavbar'
import { preloadSectionComponent } from '@/profile-app/sections/sectionLazyComponents'
import type { ProfileTemplateVariant } from '@/profile-app/sections/sectionRegistry'

/**
 * Content key -> lazy component export name, mirroring `renderProfileSection`.
 * Used to warm chunks so switching tabs in the live preview never shows a fallback.
 */
const SECTION_EXPORT_NAMES: Record<ProfileNavContentKey, string> = {
  home: 'HomeHero',
  about: 'AboutSection',
  mission: 'MissionSection',
  services: 'ServicesSection',
  additional: 'AdditionalServicesSection',
  blog: 'BlogSection',
  post: 'PostsSection',
  videos: 'VideosSection',
  'video-links': 'VideoLinksSection',
  'why-choose-us': 'WhyChooseUsSection',
  gallery: 'ImageGallerySection',
  explainer: 'ExplainerSection',
  reviews: 'ReviewsSection',
  certificates: 'CertificationsLicensingSection',
  education: 'EducationSection',
  work: 'ExperienceSection',
  skills: 'SkillsSection',
  calendar: 'CalendarSection',
  events: 'EventsSection',
  booking: 'BookingSection',
  menu: 'MenuSection',
  'sales-person': 'SalesPersonSection',
  'see-products': 'SeeProductsSection',
  'public-cards': 'PublicCardsSection',
  clients: 'ClientsSection',
  'meet-team': 'MeetOurTeamSection',
  'join-my-team': 'JoinMyTeamSection',
  faq: 'FAQSection',
  bbb: 'BbbAccreditationSection',
  dcp: 'DcpSection',
  'home-solar': 'HomeSolarSection',
  'resiliency-products': 'ResiliencyProductsSection',
  'property-listing': 'PropertyListingSection',
  'media-press': 'MediaPressSection',
  announcement: 'AnnouncementSection',
  breakfast: 'BreakfastSection',
  dinner: 'DinnerSection',
  lunch: 'LunchSection',
  inventory: 'InventorySection',
  licensing: 'LicensingSection',
  'insurance-license': 'InsuranceLicenseSection',
  profile: 'EmptyNavSection',
  resume: 'EmptyNavSection',
  'content-media': 'EmptyNavSection',
  'global-connection': 'EmptyNavSection',
  'my-info': 'MyInfoSection',
  empty: 'EmptyNavSection',
}

const HOME_EXPORT_NAMES: Record<ProfileTemplateVariant, string> = {
  v1: 'HomeSectionV1',
  v2: 'HomeSectionV2',
  v3: 'HomeHero',
}

function whenIdle(task: () => void) {
  if (typeof window === 'undefined') return
  const idle = window.requestIdleCallback
  if (typeof idle === 'function') {
    idle(() => task(), { timeout: 1500 })
    return
  }
  window.setTimeout(task, 200)
}

/** Warms the active template shell chunk (`VBizProfileAppV1 | V2 | V3`). */
export function preloadProfileTemplate(template: string) {
  whenIdle(() => {
    if (template === 'v1') {
      void import('@/profile-app/VBizProfileAppV1').catch(() => undefined)
      void import('@/profile-app/components/HomeSection').catch(() => undefined)
      return
    }
    if (template === 'v2') {
      void import('@/profile-app/VBizProfileApp').catch(() => undefined)
      void import('@/profile-app/components/HomeSectionV2').catch(() => undefined)
      return
    }
    void import('@/profile-app/VBizProfileAppV3').catch(() => undefined)
    void import('@/profile-app/v3/components/HomeHero').catch(() => undefined)
  })
}

/** Warms every nav section chunk the card can show, on idle. */
export function preloadProfileSections(contentKeys: ProfileNavContentKey[], template: ProfileTemplateVariant = 'v3') {
  if (!contentKeys.length) return
  whenIdle(() => {
    const names = new Set<string>()
    for (const key of contentKeys) {
      names.add(key === 'home' ? HOME_EXPORT_NAMES[template] : SECTION_EXPORT_NAMES[key])
    }
    for (const name of names) preloadSectionComponent(name)
  })
}
