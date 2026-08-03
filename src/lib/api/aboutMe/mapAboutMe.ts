import type {
  AboutMeFooter,
  AboutMeHighlight,
  AboutMeItem,
  AboutMeListItem,
  AboutMePillar,
  AboutMeQueryResult,
  AboutMeSectionResponse,
} from '@/interfaces/api/aboutMe.interface'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isActiveStatus(status: number | string): boolean {
  return String(status).trim() === '1'
}

function toPlainDescription(description: string | null): { plain: string; html: string } {
  const html = description?.trim() ?? ''
  if (!html) return { plain: '', html: '' }
  return { plain: stripHtml(html), html }
}

function extractH3InnerBlocks(html: string): string[] {
  return (html.match(/<h3[^>]*>[\s\S]*?<\/h3>/gi) ?? []).map((block) => block.replace(/<\/?h3[^>]*>/gi, '').trim())
}

function extractStrongText(html: string): string {
  const match = html.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
  return match ? stripHtml(match[1]) : ''
}

function removeFirstStrong(html: string): string {
  return html
    .replace(/<strong[^>]*>[\s\S]*?<\/strong>/i, '')
    .replace(/^[\s\u00a0]+/i, '')
    .trim()
}

function parsePillar(inner: string): AboutMePillar | null {
  const plain = stripHtml(inner)
  if (!plain.includes('🔹')) return null

  const cleaned = plain.replace(/^🔹\s*/, '').trim()
  const dashSplit = cleaned.split(/\s*[–—-]\s*/)
  if (dashSplit.length >= 2) {
    return {
      title: dashSplit[0].trim(),
      description: dashSplit.slice(1).join(' - ').trim(),
    }
  }

  return { title: cleaned, description: '' }
}

function parseHighlightBlock(html: string): AboutMeHighlight | null {
  const trimmed = html.trim()
  if (!trimmed) return null

  const title = extractStrongText(trimmed)
  const bodyHtml = removeFirstStrong(trimmed) || trimmed
  const plain = stripHtml(bodyHtml)

  return {
    title: title || stripHtml(trimmed).split(/\s+/).slice(0, 3).join(' '),
    html: bodyHtml,
    plain,
  }
}

function parseFooterBlocks(blocks: string[]): AboutMeFooter | null {
  if (blocks.length === 0) return null

  return {
    headline: stripHtml(blocks[0] ?? ''),
    subheadline: stripHtml(blocks[1] ?? ''),
    tagline: stripHtml(blocks[2] ?? ''),
  }
}

function parseAboutMeDescription(html: string): {
  introHtml: string
  pillars: AboutMePillar[]
  highlight: AboutMeHighlight | null
  footer: AboutMeFooter | null
} {
  const h3Blocks = extractH3InnerBlocks(html)
  if (h3Blocks.length === 0) {
    return {
      introHtml: html.trim(),
      pillars: [],
      highlight: null,
      footer: null,
    }
  }

  const pillars: AboutMePillar[] = []
  const contentBlocks: string[] = []

  for (const inner of h3Blocks) {
    const pillar = parsePillar(inner)
    if (pillar) {
      pillars.push(pillar)
      continue
    }
    contentBlocks.push(inner)
  }

  const introHtml = contentBlocks[0]?.trim() ?? ''
  const highlight = contentBlocks[1] ? parseHighlightBlock(contentBlocks[1]) : null
  const footer = parseFooterBlocks(contentBlocks.slice(2))

  return { introHtml, pillars, highlight, footer }
}

function resolveFeaturedImage(item: AboutMeItem): string {
  const featured = item.featured_image?.trim() ?? ''
  if (featured) return featured

  const attachmentUrl = item.attachments?.find((attachment) => attachment.url?.trim())?.url?.trim()
  return attachmentUrl ?? ''
}

export function mapAboutMeItemToListItem(item: AboutMeItem): AboutMeListItem {
  const { plain, html } = toPlainDescription(item.description)
  const parsed = parseAboutMeDescription(html)

  return {
    id: item.id,
    title: item.title.trim() || 'About Me',
    plainDescription: plain,
    htmlDescription: html,
    introHtml: parsed.introHtml || html,
    featuredImage: resolveFeaturedImage(item),
    pillars: parsed.pillars,
    highlight: parsed.highlight,
    footer: parsed.footer,
  }
}

export function normalizeAboutMeResponse(response: AboutMeSectionResponse): AboutMeQueryResult {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to load about me content')
  }

  const sectionTitle = response.post_type?.title?.trim() || response.data.postType?.title?.trim() || 'About Me'

  const items = (response.data.items ?? []).filter((item) => isActiveStatus(item.status)).map(mapAboutMeItemToListItem)

  return { sectionTitle, items }
}
