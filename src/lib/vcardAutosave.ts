import type {
  VCardCustomTab,
  VCardCustomTabItem,
  VCardData,
  VCardEducationEntry,
  VCardExperienceEntry,
  VCardFaqEntry,
  VCardGeneralPost,
  VCardPortfolioEntry,
  VCardReviewEntry,
  VCardSectionPostItem,
  VCardServiceEntry,
  VCardSkillGroup,
} from '@/types/vcard'

export const AUTOSAVE_DEBOUNCE_MS = 2000

const LOCAL_DRAFT_ID_RE = /^(pf_|sk_|post_|faq_|svc_|sec_|rev_|edu_|exp_|cert_|custom_item_)/

export function isEditorDraftId(id: string | undefined | null): boolean {
  return Boolean(id && LOCAL_DRAFT_ID_RE.test(id))
}

function blank(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (Array.isArray(value)) return value.length === 0
  return false
}

function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

export function isEmptySectionPost(item: VCardSectionPostItem): boolean {
  const metas = item.metas || {}
  return (
    blank(item.title) &&
    blank(item.description) &&
    blank(item.url) &&
    blank(item.featuredImage) &&
    blank(item.date) &&
    blank(item.location) &&
    blank(item.rating) &&
    Object.values(metas).every((value) => blank(value))
  )
}

export function isEmptyGeneralPost(item: VCardGeneralPost): boolean {
  return blank(item.title) && blank(item.description) && blank(item.customUrl) && blank(item.featuredImage)
}

export function isEmptyFaq(item: VCardFaqEntry): boolean {
  return blank(item.question) && blank(item.answer) && blank(item.featuredImage) && blank(item.url)
}

export function isEmptyEducation(item: VCardEducationEntry): boolean {
  return blank(item.institute) && blank(item.degree) && blank(item.fromDate) && blank(item.toDate)
}

export function isEmptyExperience(item: VCardExperienceEntry): boolean {
  return (
    blank(item.company) && blank(item.jobTitle) && blank(item.description) && blank(item.fromDate) && blank(item.toDate)
  )
}

export function isEmptyService(item: VCardServiceEntry): boolean {
  return blank(item.title) && blank(item.description) && blank(item.featuredImage) && blank(item.url)
}

export function isEmptyPortfolio(item: VCardPortfolioEntry): boolean {
  return (
    blank(item.title) && blank(item.description) && blank(item.imageUrl) && blank(item.url) && !item.attachments?.url
  )
}

export function isEmptyReview(item: VCardReviewEntry): boolean {
  return blank(item.author) && blank(item.text)
}

export function isEmptySkillGroup(item: VCardSkillGroup): boolean {
  return blank(item.type) && (item.skills || []).every((skill) => blank(skill))
}

export function isEmptyCustomTabItem(item: VCardCustomTabItem): boolean {
  return (
    blank(item.title) &&
    blank(item.description) &&
    blank(item.url) &&
    blank(item.mediaUrl) &&
    !(item.gallery || []).some((entry) => Boolean(entry.url?.trim()))
  )
}

function keepPersistable<T extends { id: string }>(items: T[] | undefined, isEmpty: (item: T) => boolean): T[] {
  return (items || []).filter((item) => !isEmpty(item) || !isEditorDraftId(item.id))
}

export function persistableSectionPosts(
  posts: Record<string, VCardSectionPostItem[]> | undefined
): Record<string, VCardSectionPostItem[]> {
  const next: Record<string, VCardSectionPostItem[]> = {}
  for (const [key, items] of Object.entries(posts || {})) {
    next[key] = keepPersistable(items, isEmptySectionPost)
  }
  return next
}

export function persistableCustomTabs(tabs: VCardCustomTab[] | undefined): VCardCustomTab[] {
  return (tabs || []).map((tab) => ({
    ...tab,
    items: keepPersistable(tab.items, isEmptyCustomTabItem),
  }))
}

export function persistableEducation(items: VCardEducationEntry[] | undefined) {
  return keepPersistable(items, isEmptyEducation)
}

export function persistableExperience(items: VCardExperienceEntry[] | undefined) {
  return keepPersistable(items, isEmptyExperience)
}

export function persistableServices(items: VCardServiceEntry[] | undefined) {
  return keepPersistable(items, isEmptyService)
}

export function persistablePortfolio(items: VCardPortfolioEntry[] | undefined) {
  return keepPersistable(items, isEmptyPortfolio)
}

export function persistableReviews(items: VCardReviewEntry[] | undefined) {
  return keepPersistable(items, isEmptyReview)
}

export function persistableSkills(items: VCardSkillGroup[] | undefined) {
  return keepPersistable(items, isEmptySkillGroup)
}

export function persistableGeneralPosts(items: VCardGeneralPost[] | undefined) {
  return keepPersistable(items, isEmptyGeneralPost)
}

export function persistableFaqs(items: VCardFaqEntry[] | undefined) {
  return keepPersistable(items, isEmptyFaq)
}

export function persistablePostsSlice(data: VCardData) {
  return {
    generalPosts: persistableGeneralPosts(data.generalPosts),
    faqs: persistableFaqs(data.faqs),
    sectionPosts: persistableSectionPosts(data.sectionPosts),
  }
}

export function hasPersistablePostsDelta(
  current: VCardData,
  snapshot: {
    generalPosts?: VCardGeneralPost[]
    faqs?: VCardFaqEntry[]
    sectionPosts?: Record<string, VCardSectionPostItem[]>
  }
): boolean {
  return (
    stableJson(persistablePostsSlice(current)) !==
    stableJson({
      generalPosts: persistableGeneralPosts(snapshot.generalPosts),
      faqs: persistableFaqs(snapshot.faqs),
      sectionPosts: persistableSectionPosts(snapshot.sectionPosts),
    })
  )
}

function persistableBucketSlice(data: VCardData, bucket: string): unknown {
  switch (bucket) {
    case 'education':
      return persistableEducation(data.education)
    case 'experience':
      return persistableExperience(data.experience)
    case 'services':
      return persistableServices(data.services)
    case 'portfolio':
      return persistablePortfolio(data.portfolio)
    case 'reviews':
      return persistableReviews(data.reviews)
    case 'skills':
      return persistableSkills(data.skills)
    case 'socialLinks':
      return (data.social?.customLinks || []).filter(
        (link) => !blank(link.name) || !blank(link.url) || !isEditorDraftId(link.id)
      )
    case 'posts':
      return persistablePostsSlice(data)
    case 'profile':
      return {
        personal: data.personal,
        slug: data.slug,
        isPublic: data.isPublic,
        isDraft: data.isDraft,
        appearance: data.appearance,
        theme: data.theme,
        themeConfig: data.themeConfig,
        displaySettings: data.displaySettings,
        extraFields: data.extraFields,
        myInfo: data.myInfo,
        seo: data.seo,
        aiAssistanceEnabled: data.aiAssistanceEnabled,
        social: {
          handles: data.social?.handles,
          games: data.social?.games,
        },
        customTabs: persistableCustomTabs(data.customTabs),
        tabLabelOverrides: data.tabLabelOverrides,
      }
    default:
      return data
  }
}

export function dirtyBucketForPath(
  path: string
): 'profile' | 'education' | 'experience' | 'services' | 'portfolio' | 'reviews' | 'skills' | 'socialLinks' | 'posts' {
  if (path === 'education' || path.startsWith('education.')) return 'education'
  if (path === 'experience' || path.startsWith('experience.')) return 'experience'
  if (path === 'services' || path.startsWith('services.')) return 'services'
  if (path === 'portfolio' || path.startsWith('portfolio.')) return 'portfolio'
  if (path === 'reviews' || path.startsWith('reviews.')) return 'reviews'
  if (path === 'skills' || path.startsWith('skills.')) return 'skills'
  if (path === 'social.customLinks' || path.startsWith('social.customLinks.')) return 'socialLinks'
  if (
    path === 'customTabs' ||
    path.startsWith('customTabs.') ||
    path === 'tabLabelOverrides' ||
    path.startsWith('tabLabelOverrides.')
  ) {
    return 'profile'
  }
  if (
    path === 'generalPosts' ||
    path.startsWith('generalPosts.') ||
    path === 'faqs' ||
    path.startsWith('faqs.') ||
    path === 'sectionPosts' ||
    path.startsWith('sectionPosts.')
  ) {
    return 'posts'
  }
  return 'profile'
}

/** True when the change should hit the network. Empty "+" drafts stay local until the user types. */
export function isSaveWorthyChange(path: string, prev: VCardData, next: VCardData): boolean {
  const bucket = dirtyBucketForPath(path)
  return stableJson(persistableBucketSlice(prev, bucket)) !== stableJson(persistableBucketSlice(next, bucket))
}

export function mergeLocalEmptyDrafts<T extends { id: string }>(
  localItems: T[] | undefined,
  savedItems: T[],
  isEmpty: (item: T) => boolean
): T[] {
  const empties = (localItems || []).filter((item) => isEditorDraftId(item.id) && isEmpty(item))
  if (!empties.length) return savedItems
  return [...savedItems, ...empties]
}

/** Clone only the path being written — avoid JSON-cloning the whole card on every keystroke. */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.')
  const root = Array.isArray(obj) ? [...obj] : { ...obj }
  let current: Record<string, unknown> = root as Record<string, unknown>
  let source: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextSource = source[key] && typeof source[key] === 'object' ? (source[key] as Record<string, unknown>) : {}
    const next = Array.isArray(nextSource) ? [...nextSource] : { ...nextSource }
    current[key] = next
    current = next as Record<string, unknown>
    source = nextSource
  }
  current[keys[keys.length - 1]] = value
  return root as Record<string, unknown>
}
