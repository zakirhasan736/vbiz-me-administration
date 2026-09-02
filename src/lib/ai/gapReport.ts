import { getAboutMeDraft, isAboutMeDescriptionFilled } from '@/lib/aboutMeDraft'
import { isAiContentNavId } from '@/lib/createCardTabs'
import type { VCardData } from '@/types/vcard'

export type GapItem = {
  id: string
  tab: string
  navId: string
  field: string
  severity: 'required' | 'recommended' | 'optional'
  title: string
  explanation: string
  howToProvide: string
}

function empty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (Array.isArray(value)) return value.length === 0
  return false
}

type ChecklistItem = {
  id: string
  weight: number
  filled: boolean
  gap?: GapItem
}

/** Deterministic gap report from current draft (no LLM required). */
export function buildGapReport(
  data: VCardData,
  enabledNavIds: string[] = ['home']
): { score: number; gaps: GapItem[]; nextBest: GapItem | null } {
  const nav = new Set(enabledNavIds.length ? enabledNavIds : ['home'])
  const items: ChecklistItem[] = []

  const add = (filled: boolean, weight: number, gap: GapItem) => {
    if (!isAiContentNavId(gap.navId)) return
    if (!nav.has(gap.navId) && gap.navId !== 'home') return
    items.push({ id: gap.id, weight, filled, gap: filled ? undefined : gap })
  }

  add(!empty(data.personal?.fullName), 4, {
    id: 'personal.fullName',
    tab: 'Personal Info',
    navId: 'home',
    field: 'fullName',
    severity: 'required',
    title: 'Display name',
    explanation: 'Your public card needs a name or brand title so visitors know who they are contacting.',
    howToProvide: 'Reply with the person or business name, or paste a short bio.',
  })
  add(!empty(data.personal?.dob), 4, {
    id: 'personal.dob',
    tab: 'Personal Info',
    navId: 'home',
    field: 'dob',
    severity: 'required',
    title: 'Date of birth',
    explanation: 'Date of birth is required for every new card and must be provided by the owner.',
    howToProvide: 'Reply with the owner’s date of birth in YYYY-MM-DD format. AI cannot infer or generate it.',
  })
  add(!empty(data.slug), 3, {
    id: 'slug',
    tab: 'Personal Info',
    navId: 'home',
    field: 'slug',
    severity: 'required',
    title: 'Public URL slug',
    explanation: 'The slug becomes your shareable link (e.g. /vCard/your-name).',
    howToProvide: 'Reply with a short lowercase URL (letters, numbers, hyphens).',
  })
  add(isAboutMeDescriptionFilled(getAboutMeDraft().descriptionHtml) || !empty(data.personal?.about), 3, {
    id: 'about-me.description',
    tab: 'About Me',
    navId: 'about',
    field: 'about',
    severity: 'recommended',
    title: 'About Me story',
    explanation: 'A short story helps visitors trust you and understand what you do.',
    howToProvide: 'Paste 2–4 sentences about the business in About Me, or upload an about PDF/image.',
  })
  add(!empty(data.personal?.email), 4, {
    id: 'personal.email',
    tab: 'Personal Info',
    navId: 'home',
    field: 'email',
    severity: 'required',
    title: 'Email',
    explanation: 'Personal Info email is required at create and also powers the My Info Email button.',
    howToProvide: 'Reply with the public email visitors should use.',
  })
  add(!empty(data.personal?.phone), 4, {
    id: 'personal.phone',
    tab: 'Personal Info',
    navId: 'home',
    field: 'phone',
    severity: 'required',
    title: 'Phone',
    explanation: 'Personal Info phone is required at create and also powers My Info Call and Text.',
    howToProvide: 'Reply with the public phone number visitors should use.',
  })
  add(!empty(data.personal?.company) || !empty(data.personal?.designation), 2, {
    id: 'personal.company',
    tab: 'Personal Info',
    navId: 'home',
    field: 'company',
    severity: 'recommended',
    title: 'Company or title',
    explanation: 'Company name and headline help visitors understand who you are.',
    howToProvide: 'Reply with the business name and a short professional title.',
  })

  if (nav.has('services')) {
    add(!empty(data.services), 4, {
      id: 'services',
      tab: 'Services',
      navId: 'services',
      field: 'services',
      severity: 'recommended',
      title: 'Services list',
      explanation: 'List what you sell or offer so the card converts visitors.',
      howToProvide: 'Paste a bullet list of services, or upload a brochure (PDF/DOCX/image).',
    })
  }
  if (nav.has('skills')) {
    add(!empty(data.skills), 2, {
      id: 'skills',
      tab: 'Skill',
      navId: 'skills',
      field: 'skills',
      severity: 'recommended',
      title: 'Skills',
      explanation: 'Skills highlight expertise on the public profile.',
      howToProvide: 'List skills separated by commas or grouped categories.',
    })
  }
  if (nav.has('work')) {
    add(!empty(data.experience), 2, {
      id: 'experience',
      tab: 'Experience',
      navId: 'work',
      field: 'experience',
      severity: 'optional',
      title: 'Work experience',
      explanation: 'Roles and companies build credibility for professionals.',
      howToProvide: 'Paste a resume section or LinkedIn-style experience text.',
    })
  }
  if (nav.has('education')) {
    add(!empty(data.education), 2, {
      id: 'education',
      tab: 'Education',
      navId: 'education',
      field: 'education',
      severity: 'optional',
      title: 'Education',
      explanation: 'Schools and degrees appear on the resume-style profile.',
      howToProvide: 'Paste education history or upload a resume PDF.',
    })
  }
  if (nav.has('gallery')) {
    add(!empty(data.portfolio), 3, {
      id: 'portfolio',
      tab: 'Portfolio',
      navId: 'gallery',
      field: 'portfolio',
      severity: 'recommended',
      title: 'Portfolio projects',
      explanation: 'Case studies and projects prove your work.',
      howToProvide: 'Paste project titles + short descriptions, or upload a portfolio PDF.',
    })
  }
  if (nav.has('reviews')) {
    add(!empty(data.reviews), 2, {
      id: 'reviews',
      tab: 'Reviews',
      navId: 'reviews',
      field: 'reviews',
      severity: 'optional',
      title: 'Reviews / testimonials',
      explanation: 'Social proof increases trust on the public card.',
      howToProvide: 'Paste testimonials (author + quote), one per blank line or ---.',
    })
  }
  if (nav.has('blog')) {
    add(!empty(data.generalPosts), 2, {
      id: 'blogs',
      tab: 'Blogs and Media',
      navId: 'blog',
      field: 'blogs',
      severity: 'optional',
      title: 'Blogs and media posts',
      explanation: 'Articles keep your card fresh and improve SEO.',
      howToProvide: 'Paste article drafts or upload a DOC/PDF; AI will split them into posts.',
    })
  }
  if (nav.has('faq')) {
    add(!empty(data.faqs), 2, {
      id: 'faqs',
      tab: 'FAQs',
      navId: 'faq',
      field: 'faqs',
      severity: 'optional',
      title: 'FAQs',
      explanation: 'Answers common visitor questions directly on the card.',
      howToProvide: 'Paste Q&A pairs, or upload a FAQ document.',
    })
  }

  const socialCount = Object.values(data.social?.handles || {}).filter((v) => String(v || '').trim()).length
  add(socialCount > 0, 2, {
    id: 'social',
    tab: 'Personal',
    navId: 'home',
    field: 'social',
    severity: 'recommended',
    title: 'Social links',
    explanation: 'Social profiles let visitors follow and share your brand.',
    howToProvide: 'Add LinkedIn, Instagram, Facebook, or website handles.',
  })

  const total = items.reduce((s, i) => s + i.weight, 0) || 1
  const filled = items.reduce((s, i) => s + (i.filled ? i.weight : 0), 0)
  const score = Math.max(0, Math.min(100, Math.round((filled / total) * 100)))
  const gaps = items.filter((i) => !i.filled && i.gap).map((i) => i.gap!) as GapItem[]

  const nextBest =
    gaps.find((g) => g.severity === 'required') || gaps.find((g) => g.severity === 'recommended') || gaps[0] || null

  return { score, gaps, nextBest }
}

/** Map gap field → fill-section id */
export function gapFieldToSection(field: string): string {
  const map: Record<string, string> = {
    fullName: 'personal',
    dob: 'personal',
    email: 'personal',
    phone: 'personal',
    company: 'personal',
    about: 'personal',
    contact: 'personal',
    social: 'personal',
    slug: 'personal',
    services: 'services',
    skills: 'skills',
    experience: 'experience',
    education: 'education',
    portfolio: 'portfolio',
    reviews: 'reviews',
    generalPosts: 'blogs',
    blogs: 'blogs',
    faqs: 'faqs',
  }
  return map[field] || field || 'personal'
}
