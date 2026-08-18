type LooseItem = Record<string, unknown>

function asItems(raw: unknown): LooseItem[] {
  if (!raw || typeof raw !== 'object') return []
  const root = raw as { data?: { items?: unknown }; items?: unknown }
  const items = root.data?.items ?? root.items
  return Array.isArray(items)
    ? items.filter((item): item is LooseItem => Boolean(item) && typeof item === 'object')
    : []
}

function mediaFields(item: LooseItem) {
  return {
    id: item.id ?? null,
    title: item.title ?? item.author ?? item.name ?? null,
    featured_image: item.featured_image ?? item.featuredImage ?? null,
    imageUrl: item.imageUrl ?? null,
    attachments: item.attachments ?? null,
    gallery: item.gallery ?? null,
    url: item.url ?? null,
    general_info_url: item.general_info_url ?? null,
    video_url: item.video_url ?? null,
    review_link: item.review_link ?? null,
    status: item.status ?? null,
  }
}

/** Temporary: copy the logged JSON from DevTools and paste it in chat. */
export function reportPublicSectionMedia(section: string, raw: unknown, mapped?: unknown) {
  if (typeof window === 'undefined') return
  const items = asItems(raw).map(mediaFields)
  const report = {
    section,
    href: window.location.href,
    itemCount: items.length,
    items,
    mapped,
    raw,
  }
  const paste = JSON.stringify(report, null, 2)
  console.group(`[vBiz MEDIA REPORT] ${section}`)
  console.log('Copy this JSON and paste it in chat:')
  console.log(paste)
  console.log('items', items)
  console.log('mapped', mapped)
  console.log('raw', raw)
  console.groupEnd()
  try {
    window.sessionStorage.setItem(`vbiz-media-report:${section}`, paste)
  } catch {
    /* ignore quota / private mode */
  }
}
