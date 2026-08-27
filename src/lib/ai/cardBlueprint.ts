import { setAboutMeDraft } from '@/lib/aboutMeDraft'
import { normalizeNavOrderWithPinnedEnds } from '@/lib/createCardTabs'
import { syncMyInfoFromPersonal } from '@/lib/vcardMyInfo'
import { normalizeServiceType } from '@/lib/vcardServices'
import type {
  VCardData,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPortfolioEntry,
  VCardReviewEntry,
  VCardServiceEntry,
  VCardSkillGroup,
} from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'
import { z } from 'zod'

const socialHandlesSchema = z
  .object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    website: z.string().optional(),
    whatsapp: z.string().optional(),
  })
  .partial()

export const cardBlueprintSchema = z.object({
  businessSummary: z.string(),
  suggestedSlug: z.string(),
  personal: z.object({
    fullName: z.string(),
    email: z.string().optional().default(''),
    dob: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    whatsapp: z.string().optional().default(''),
    designation: z.string().optional().default(''),
    company: z.string().optional().default(''),
    profession: z.string().optional().default(''),
    address: z.string().optional().default(''),
    website: z.string().optional().default(''),
    about: z.string().optional().default(''),
  }),
  socialHandles: socialHandlesSchema.optional().default({}),
  education: z
    .array(
      z.object({
        institute: z.string(),
        degree: z.string(),
        fromDate: z.string().optional().default(''),
        toDate: z.string().optional().default(''),
        tillNow: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        jobTitle: z.string(),
        description: z.string().optional().default(''),
        fromDate: z.string().optional().default(''),
        toDate: z.string().optional().default(''),
        tillNow: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  skills: z
    .array(
      z.object({
        type: z.string(),
        skills: z.array(z.string()),
      })
    )
    .optional()
    .default([]),
  services: z
    .array(
      z.object({
        type: z.string().optional().default('Other'),
        title: z.string(),
        description: z.string().optional().default(''),
        url: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  portfolio: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional().default(''),
        url: z.string().optional().default(''),
        imageUrl: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  reviews: z
    .array(
      z.object({
        author: z.string(),
        text: z.string(),
        rating: z.number().min(1).max(5).optional().default(5),
      })
    )
    .optional()
    .default([]),
  blogs: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional().default(''),
        category: z.string().optional().default('News'),
        url: z.string().optional().default(''),
        imageUrl: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional()
    .default([]),
  enabledTabs: z.array(z.string()).optional().default(['Personal']),
  recommendedTabs: z
    .array(
      z.object({
        tab: z.string(),
        reason: z.string(),
        priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
      })
    )
    .optional()
    .default([]),
  optionalFeatures: z
    .object({
      aiAssistance: z.boolean().optional().default(false),
      canva: z.boolean().optional().default(true),
      seo: z.boolean().optional().default(true),
      pushNotifications: z.boolean().optional().default(true),
      emailNotifications: z.boolean().optional().default(true),
    })
    .optional()
    .default({
      aiAssistance: false,
      canva: true,
      seo: true,
      pushNotifications: true,
      emailNotifications: true,
    }),
})

export type CardBlueprint = z.infer<typeof cardBlueprintSchema>

export const TAB_NAV_MAP: Record<string, string> = {
  Personal: 'home',
  Education: 'education',
  Experience: 'work',
  Skill: 'skills',
  Skills: 'skills',
  Services: 'services',
  Reviews: 'reviews',
  'News/Blogs': 'blog',
  Blog: 'blog',
  Blogs: 'blog',
  Profile: 'profile',
  Portfolio: 'gallery',
  'Certifications/Licenses': 'certificates',
  Resume: 'resume',
  'Content & media': 'content-media',
  'Global Connection': 'global-connection',
  'My Info': 'my-info',
  FAQ: 'faq',
  FAQs: 'faq',
  Faqs: 'faq',
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const MAX_LIST_ITEMS = 5

function mergeCappedList<T>(existing: T[] | undefined, incoming: T[], keyOf: (item: T) => string): T[] {
  const base = Array.isArray(existing) ? existing : []
  const seen = new Set(base.map(keyOf).filter(Boolean))
  const out = [...base]
  for (const item of incoming) {
    if (out.length >= MAX_LIST_ITEMS) break
    const key = keyOf(item)
    if (key && seen.has(key)) continue
    if (key) seen.add(key)
    out.push(item)
  }
  return out.slice(0, MAX_LIST_ITEMS)
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** Map GPT blueprint → editor draft + suggested nav ids. */
export function mapBlueprintToVCardData(
  blueprint: CardBlueprint,
  base?: VCardData
): {
  data: VCardData
  enabledNavIds: string[]
  recommendedTabs: CardBlueprint['recommendedTabs']
  optionalFeatures: CardBlueprint['optionalFeatures']
  businessSummary: string
} {
  const education: VCardEducationEntry[] = (blueprint.education || []).map((e) => ({
    id: uid('edu'),
    institute: e.institute,
    degree: e.degree,
    fromDate: e.fromDate || '',
    toDate: e.toDate || '',
    tillNow: Boolean(e.tillNow),
  }))

  const experience: VCardExperienceEntry[] = (blueprint.experience || []).map((e) => ({
    id: uid('exp'),
    company: e.company,
    jobTitle: e.jobTitle,
    description: e.description || '',
    fromDate: e.fromDate || '',
    toDate: e.toDate || '',
    tillNow: Boolean(e.tillNow),
  }))

  const skills: VCardSkillGroup[] = (blueprint.skills || []).map((s) => ({
    id: uid('skill'),
    type: s.type || 'General',
    skills: s.skills.filter(Boolean),
  }))

  const services: VCardServiceEntry[] = (blueprint.services || []).map((s) => ({
    id: uid('svc'),
    type: normalizeServiceType(s.type),
    title: s.title,
    description: s.description || '',
    url: s.url || '',
    featuredImage: '',
    active: true,
  }))

  const portfolio: VCardPortfolioEntry[] = (blueprint.portfolio || []).map((p) => ({
    id: uid('port'),
    type: 'Image',
    title: p.title,
    description: p.description || '',
    imageUrl: p.imageUrl || '',
    url: p.url || '',
    active: true,
  }))

  const reviews: VCardReviewEntry[] = (blueprint.reviews || []).map((r) => ({
    id: uid('rev'),
    author: r.author,
    text: r.text,
    rating: Math.min(5, Math.max(1, Math.round(r.rating || 5))),
    imageUrl: '',
    url: '',
  }))

  const generalPosts: VCardGeneralPost[] = (blueprint.blogs || []).map((b) => ({
    id: uid('blog'),
    category: b.category || 'News',
    title: b.title,
    description: b.description || '',
    customUrl: b.url || '',
    featuredImage: b.imageUrl || '',
    date: new Date().toISOString().slice(0, 10),
    active: true,
  }))

  const faqs: VCardFaqEntry[] = (blueprint.faqs || []).map((f) => ({
    id: uid('faq'),
    question: f.question,
    answer: f.answer,
    active: true,
  }))

  const slug =
    slugify(blueprint.suggestedSlug || blueprint.personal.fullName || blueprint.personal.company || 'my-card') ||
    `card-${Date.now().toString(36)}`

  const handles = { ...(blueprint.socialHandles || {}) }
  if (blueprint.personal.website && !handles.website) handles.website = blueprint.personal.website

  const data = createDefaultVCardData({
    ...base,
    slug,
    personal: {
      ...(base?.personal || createDefaultVCardData().personal),
      fullName: blueprint.personal.fullName || base?.personal.fullName || '',
      email: blueprint.personal.email || base?.personal.email || '',
      dob: blueprint.personal.dob || base?.personal.dob || '',
      phone: blueprint.personal.phone || base?.personal.phone || '',
      whatsapp: blueprint.personal.whatsapp || blueprint.personal.phone || base?.personal.whatsapp || '',
      designation: blueprint.personal.designation || base?.personal.designation || '',
      company: blueprint.personal.company || base?.personal.company || '',
      profession: blueprint.personal.profession || base?.personal.profession || '',
      address: blueprint.personal.address || base?.personal.address || '',
      website: blueprint.personal.website || base?.personal.website || '',
      about: blueprint.personal.about || base?.personal.about || '',
    },
    social: {
      handles: { ...(base?.social?.handles || {}), ...handles },
      customLinks: base?.social?.customLinks || [],
      games: base?.social?.games || {},
    },
    education: education.length ? education : base?.education || [],
    experience: experience.length ? experience : base?.experience || [],
    skills: skills.length ? skills : base?.skills || [],
    services: services.length ? services : base?.services || [],
    portfolio: portfolio.length ? portfolio : base?.portfolio || [],
    reviews: mergeCappedList(base?.reviews, reviews, (r) => `${r.author}|${r.text}`.trim().toLowerCase()),
    generalPosts: mergeCappedList(base?.generalPosts, generalPosts, (p) =>
      `${p.title}|${p.description}`.trim().toLowerCase()
    ),
    faqs: mergeCappedList(base?.faqs, faqs, (f) => `${f.question}|${f.answer}`.trim().toLowerCase()),
  })

  const synced = syncMyInfoFromPersonal(data)

  const aboutText = String(blueprint.personal.about || '').trim()
  if (aboutText) {
    setAboutMeDraft({
      descriptionHtml: aboutText.includes('<') ? aboutText : `<p>${aboutText}</p>`,
    })
  }

  const tabNames = new Set<string>(['Personal'])
  for (const name of blueprint.enabledTabs || []) {
    if (name && name !== 'Global Connection' && name !== 'My Info' && name !== 'Public Cards') tabNames.add(name)
  }
  if (education.length) tabNames.add('Education')
  if (experience.length) tabNames.add('Experience')
  if (skills.length) tabNames.add('Skill')
  if (services.length) tabNames.add('Services')
  if (portfolio.length) tabNames.add('Portfolio')
  if (reviews.length) tabNames.add('Reviews')
  if (generalPosts.length) tabNames.add('News/Blogs')
  if (faqs.length) tabNames.add('FAQs')
  // Profile mirrors personal — enable when we have a solid personal draft
  if (blueprint.personal.fullName && blueprint.personal.about) tabNames.add('Profile')

  const contentNavIds = Array.from(tabNames)
    .map((name) => TAB_NAV_MAP[name] || TAB_NAV_MAP[name.replace(/s$/, '')])
    .filter(Boolean)

  // AI cards: only suggested/content tabs + pinned Global Connection → My Info (never full manual default set)
  const uniqueNav = normalizeNavOrderWithPinnedEnds(contentNavIds)

  return {
    data: synced,
    enabledNavIds: uniqueNav,
    recommendedTabs: (blueprint.recommendedTabs || []).filter(
      (r) => r.tab !== 'Global Connection' && r.tab !== 'My Info' && r.tab !== 'Public Cards' && r.tab !== 'Personal'
    ),
    optionalFeatures: blueprint.optionalFeatures || {},
    businessSummary: blueprint.businessSummary || '',
  }
}

export const BLUEPRINT_JSON_INSTRUCTION = `Return a single JSON object matching this shape:
{
  "businessSummary": "2-3 sentence summary",
  "suggestedSlug": "url-friendly-slug",
  "personal": {
    "fullName": "", "email": "", "phone": "", "whatsapp": "",
    "designation": "", "company": "", "profession": "",
    "address": "", "website": "", "about": ""
  },
  "socialHandles": { "facebook": "", "instagram": "", "twitter": "", "linkedin": "", "youtube": "", "tiktok": "", "website": "" },
  "education": [{ "institute": "", "degree": "", "fromDate": "YYYY-MM-DD", "toDate": "", "tillNow": false }],
  "experience": [{ "company": "", "jobTitle": "", "description": "", "fromDate": "", "toDate": "", "tillNow": false }],
  "skills": [{ "type": "Core", "skills": ["Skill"] }],
  "services": [{ "type": "Web Development"|"App Design"|"SEO"|"Marketing"|"Other", "title": "", "description": "", "url": "" }],
  "portfolio": [{ "title": "", "description": "", "url": "" }],
  "reviews": [{ "author": "", "text": "", "rating": 5 }],
  "blogs": [{ "title": "", "description": "", "category": "News" }],
  "faqs": [{ "question": "", "answer": "" }],
  "enabledTabs": ["Personal", "Services", "Skill"],
  "recommendedTabs": [{ "tab": "Portfolio", "reason": "why", "priority": "high" }],
  "optionalFeatures": {
    "aiAssistance": false, "canva": true, "seo": true,
    "pushNotifications": true, "emailNotifications": true
  }
}
Only include arrays when you have credible content from the sources. When a website crawl includes services, portfolio, blog, FAQ, or review pages, populate those arrays with real extracted items. Never invent customer reviews. If no real reviews exist, return an empty reviews array. Creative wording is allowed for about, FAQs, and blog ideas, but never invent factual claims. Missing facts stay empty. Dates as YYYY-MM-DD when known.
enabledTabs = ONLY tabs that have content (do NOT dump a full default tab set). Always imply Personal is present. Never put Global Connection or My Info in enabledTabs — the product pins those last automatically. Use recommendedTabs for useful content tabs still missing data (Education, Experience, Skill, Services, Reviews, News/Blogs, Profile, Portfolio, Certifications/Licenses, FAQ).`
