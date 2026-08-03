import type { NavBarNavItem } from '@/lib/vcardNavbar'

/**
 * Default profile nav order when tabs have published data.
 * API `/post-types?profile_id=` may return items in any order — we sort to this list.
 * Tabs not listed here keep their relative API order at the end.
 */
export const CANONICAL_NAV_TAB_ORDER = [
  'home',
  'about',
  'services',
  'gallery',
  'videos',
  'explainer',
  'reviews',
  'certificates',
  'licensing',
  'insurance-license',
  'bbb',
  'dcp',
  'faq',
  'clients',
  'calendar',
  'booking',
  'contact-us',
  'mission',
  'blog',
  'additional',
  'press',
  'events',
  'join-team',
  'public-cards',
  'education',
  'work',
] as const

const NAV_ORDER_INDEX: Record<string, number> = Object.fromEntries(
  CANONICAL_NAV_TAB_ORDER.map((id, index) => [id, index])
)

/**
 * Produces a meaningful, duplicate-free tab list:
 * - one tab per section content (no duplicate "Reviews", "About", etc.),
 * - ordered by {@link CANONICAL_NAV_TAB_ORDER} (home first, then about, …),
 * - unrecognized sections keep their original order at the end.
 */
export function orderAndDedupeNavItems(items: NavBarNavItem[]): NavBarNavItem[] {
  const seen = new Set<string>()
  const deduped = items.filter((item) => {
    const key = item.profileContent === 'empty' ? `empty:${item.id}` : `content:${item.profileContent}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return deduped
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = NAV_ORDER_INDEX[a.item.id]
      const orderB = NAV_ORDER_INDEX[b.item.id]
      const rankA = orderA ?? Number.MAX_SAFE_INTEGER
      const rankB = orderB ?? Number.MAX_SAFE_INTEGER
      if (rankA !== rankB) return rankA - rankB
      return a.index - b.index
    })
    .map(({ item }) => item)
}
