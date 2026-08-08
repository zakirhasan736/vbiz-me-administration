import {
  BadgeCheck,
  Briefcase,
  Contact,
  FileText,
  Globe2,
  GraduationCap,
  IdCard,
  Image as ImageIcon,
  Images,
  Layers,
  MessageSquareQuote,
  Newspaper,
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
}

/** Backoffice DEFAULT_ENABLED_TABS order — used for tour activateTab + defaults. */
export const CREATE_CARD_DEFAULT_TABS: CreateCardTabDef[] = [
  { name: 'Personal', navId: 'home', icon: User, description: 'Profile, contact details, media & socials' },
  { name: 'Education', navId: 'education', icon: GraduationCap, description: 'Degrees, schools, and years' },
  { name: 'Experience', navId: 'work', icon: Briefcase, description: 'Work history and roles' },
  { name: 'Skill', navId: 'skills', icon: Star, description: 'Skill groups and proficiency' },
  { name: 'Services', navId: 'services', icon: Layers, description: 'Offerings, pricing, and delivery' },
  { name: 'Reviews', navId: 'reviews', icon: MessageSquareQuote, description: 'Guest & client reviews' },
  { name: 'News/Blogs', navId: 'blog', icon: Newspaper, description: 'Articles, news, and blog posts' },
  { name: 'Profile', navId: 'profile', icon: IdCard, description: 'Public profile headline, bio & photo' },
  { name: 'Portfolio', navId: 'gallery', icon: ImageIcon, description: 'Projects and case studies' },
  {
    name: 'Certifications/Licenses',
    navId: 'certificates',
    icon: BadgeCheck,
    description: 'Credentials & licenses with documents',
  },
  { name: 'Resume', navId: 'resume', icon: FileText, description: 'Resume / CV document upload' },
  { name: 'Content & media', navId: 'content-media', icon: Images, description: 'Gallery, videos, and media library' },
  {
    name: 'Global Connection',
    navId: 'global-connection',
    icon: Globe2,
    description: 'Shared global contact directory',
    pinEnd: true,
  },
  {
    name: 'My Info',
    navId: 'my-info',
    icon: Contact,
    description: 'Call / text / email actions on public card',
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
  return CREATE_CARD_TAB_BY_NAV_ID[tab]
}

export function createCardTabNameToNavId(tab: string): string | null {
  return resolveCreateCardTabName(tab)?.navId ?? null
}

export function getCreateCardDisplayLabel(navId: string, fallback: string): string {
  return CREATE_CARD_TAB_BY_NAV_ID[navId]?.name ?? fallback
}

export function getDefaultCreateCardNavIds(): string[] {
  return CREATE_CARD_DEFAULT_TABS.map((t) => t.navId)
}
