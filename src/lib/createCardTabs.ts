import { assemblePublicNavOrder, PINNED_END_NAV_IDS as PINNED_ENDS } from '@/lib/publicNavOrder'
import {
  BadgeCheck,
  Briefcase,
  Contact,
  FileText,
  Film,
  Globe2,
  GraduationCap,
  IdCard,
  Image as ImageIcon,
  Images,
  Layers,
  MessageSquareQuote,
  Newspaper,
  ScrollText,
  Shield,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react'

export type CreateCardTabName = string

export type CreateCardTabDef = {
  name: CreateCardTabName
  /** Admin editor section id used in URL routes */
  navId: string
  icon: LucideIcon
  description: string
  pinEnd?: boolean
  /** AI should try to extract content for this tab when sources support it */
  aiPriority?: 'core' | 'content' | 'optional'
}

export const ALWAYS_ENABLED_NAV_IDS = ['home', 'about', 'public-cards', 'my-info'] as const

/** Default utility tabs shown at the end: Public Cards, then My Info. */
export const PINNED_END_NAV_IDS = PINNED_ENDS

/** Fixed product tabs. AI does not recommend, fill, or score these. */
export const AI_SYSTEM_NAV_IDS = ['public-cards', 'my-info'] as const

export function isAiContentNavId(navId: string): boolean {
  return !(AI_SYSTEM_NAV_IDS as readonly string[]).includes(navId)
}

/** Backoffice DEFAULT_ENABLED_TABS order — used for tour activateTab + manual create defaults. */
export const CREATE_CARD_DEFAULT_TABS: CreateCardTabDef[] = [
  {
    name: 'Personal',
    navId: 'home',
    icon: User,
    description: 'Profile, contact details, media & socials',
    aiPriority: 'core',
  },
  {
    name: 'About Me',
    navId: 'about',
    icon: User,
    description: 'Company story, bio, and featured media',
    aiPriority: 'core',
  },
  {
    name: 'Mission Statement',
    navId: 'mission',
    icon: ScrollText,
    description: 'Company mission and positioning',
    aiPriority: 'content',
  },
  {
    name: 'Services',
    navId: 'services',
    icon: Layers,
    description: 'Offerings, pricing, and delivery',
    aiPriority: 'content',
  },
  {
    name: 'Photos',
    navId: 'gallery',
    icon: ImageIcon,
    description: 'Projects, photos, and case studies',
    aiPriority: 'content',
  },
  {
    name: 'Videos',
    navId: 'videos',
    icon: Film,
    description: 'Intro and gallery videos',
    aiPriority: 'content',
  },
  {
    name: 'Reviews',
    navId: 'reviews',
    icon: MessageSquareQuote,
    description: 'Guest & client reviews',
    aiPriority: 'content',
  },
  {
    name: 'Better Business Bureau (BBB)',
    navId: 'bbb',
    icon: Shield,
    description: 'BBB accreditation and trust marks',
    aiPriority: 'content',
  },
  {
    name: 'FAQs',
    navId: 'faq',
    icon: MessageSquareQuote,
    description: 'Common questions and answers',
    aiPriority: 'content',
  },
  {
    name: 'Education',
    navId: 'education',
    icon: GraduationCap,
    description: 'Degrees, schools, and years',
    aiPriority: 'content',
  },
  {
    name: 'Experience',
    navId: 'work',
    icon: Briefcase,
    description: 'Work history and roles',
    aiPriority: 'content',
  },
  { name: 'Skill', navId: 'skills', icon: Star, description: 'Skill groups and proficiency', aiPriority: 'content' },
  {
    name: 'News/Blogs',
    navId: 'blog',
    icon: Newspaper,
    description: 'Articles, news, and blog posts',
    aiPriority: 'content',
  },
  {
    name: 'Profile',
    navId: 'profile',
    icon: IdCard,
    description: 'Public profile headline, bio & photo',
    aiPriority: 'content',
  },
  {
    name: 'Certifications/Licenses',
    navId: 'certificates',
    icon: BadgeCheck,
    description: 'Credentials & licenses with documents',
    aiPriority: 'content',
  },
  {
    name: 'Resume',
    navId: 'resume',
    icon: FileText,
    description: 'Resume / CV document upload',
    aiPriority: 'optional',
  },
  {
    name: 'Content & media',
    navId: 'content-media',
    icon: Images,
    description: 'Gallery, videos, and media library',
    aiPriority: 'optional',
  },
  {
    name: 'Public Cards',
    navId: 'public-cards',
    icon: Globe2,
    description: 'Directory of other public vBiz cards',
    pinEnd: true,
  },
  {
    name: 'My Info',
    navId: 'my-info',
    icon: Contact,
    description: 'Call / text / email actions — filled from Personal Info, not a separate AI section',
    pinEnd: true,
  },
]

export const CREATE_CARD_TAB_BY_NAME = Object.fromEntries(CREATE_CARD_DEFAULT_TABS.map((t) => [t.name, t])) as Record<
  string,
  CreateCardTabDef
>

export const CREATE_CARD_TAB_BY_NAV_ID = Object.fromEntries(
  CREATE_CARD_DEFAULT_TABS.map((t) => [t.navId, t])
) as Record<string, CreateCardTabDef>

export function resolveCreateCardTabName(tab: string): CreateCardTabDef | undefined {
  if (CREATE_CARD_TAB_BY_NAME[tab]) return CREATE_CARD_TAB_BY_NAME[tab]
  if (tab === 'FAQ' || tab === 'Faqs') return CREATE_CARD_TAB_BY_NAME.FAQs
  if (tab === 'Portfolio' || tab === 'Gallery') return CREATE_CARD_TAB_BY_NAV_ID.gallery
  if (tab === 'BBB' || tab === 'Better Business Bureau (BBB)') return CREATE_CARD_TAB_BY_NAV_ID.bbb
  return CREATE_CARD_TAB_BY_NAV_ID[tab]
}

export function createCardTabNameToNavId(tab: string): string | null {
  return resolveCreateCardTabName(tab)?.navId ?? null
}

export function getCreateCardDisplayLabel(navId: string, fallback: string): string {
  return CREATE_CARD_TAB_BY_NAV_ID[navId]?.name ?? fallback
}

/**
 * Sort selected nav ids by the default create-card catalog order (skip missing),
 * then pin Public Cards and My Info last. Does not add unselected catalog tabs.
 */
export function normalizeNavOrderWithPinnedEnds(navIds: string[]): string[] {
  return assemblePublicNavOrder(navIds)
}

/** Keep the user's chosen middle order; Public Cards and My Info stay last. */
export function normalizeNavOrderWithRequiredTabs(navIds: string[]): string[] {
  return assemblePublicNavOrder(navIds, { preserveCustom: true })
}

/** Full default set for manual create. */
export function getDefaultCreateCardNavIds(): string[] {
  return normalizeNavOrderWithPinnedEnds(CREATE_CARD_DEFAULT_TABS.map((t) => t.navId))
}

/**
 * Minimal seed for AI create: Personal, About Me, Public Cards, My Info.
 * Extra tabs come only from AI suggestions / extracted content.
 */
export function getAiSeedCreateCardNavIds(): string[] {
  return normalizeNavOrderWithPinnedEnds(['home', 'about', ...PINNED_END_NAV_IDS])
}

/** Tabs AI should try to fill when source data exists. */
export function getAiContentCandidateNavIds(): string[] {
  return CREATE_CARD_DEFAULT_TABS.filter((t) => t.aiPriority === 'core' || t.aiPriority === 'content').map(
    (t) => t.navId
  )
}

/** Human-readable catalog for AI prompts / chat. */
export function getCardTabCatalogForAi(): string {
  return CREATE_CARD_DEFAULT_TABS.map((t) => {
    const pin = t.pinEnd ? ' [ALWAYS LAST — do not remove]' : ''
    const prio = t.aiPriority ? ` (AI ${t.aiPriority})` : ''
    return `- ${t.name} (navId=${t.navId})${prio}${pin}: ${t.description}`
  }).join('\n')
}
