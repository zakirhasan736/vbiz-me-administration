/** Open Graph / link-preview snapshot for a photo gallery page. */

export type GalleryLinkPreview = {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

const TITLE_MAX = 300
const DESCRIPTION_MAX = 500
const SITE_MAX = 200
const URL_MAX = 2000

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => fromCodePoint(Number(dec)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0?39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function clip(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return (match?.[1] ?? match?.[2] ?? '').trim()
}

function resolveHttpUrl(raw: string, base: string): string {
  const trimmed = decodeEntities(raw).trim()
  if (!trimmed || trimmed.startsWith('data:')) return ''
  try {
    const url = new URL(trimmed, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString().slice(0, URL_MAX)
  } catch {
    return ''
  }
}

function readMetaMap(html: string): Map<string, string> {
  const map = new Map<string, string>()
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const key = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase()
    const content = attr(tag, 'content')
    if (!key || !content || map.has(key)) continue
    map.set(key, decodeEntities(content))
  }
  return map
}

function readDocumentTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? decodeEntities(match[1]) : ''
}

function readLinkImage(html: string, pageUrl: string): string {
  const tags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const rel = attr(tag, 'rel').toLowerCase().split(/\s+/)
    if (!rel.includes('image_src')) continue
    const href = resolveHttpUrl(attr(tag, 'href'), pageUrl)
    if (href) return href
  }
  return ''
}

function isSkippableImage(url: string): boolean {
  return /\.svg(\?|#|$)/i.test(url) || /(?:favicon|sprite|spacer|pixel|1x1|blank\.gif)/i.test(url)
}

function readFirstContentImage(html: string, pageUrl: string): string {
  const pattern = /<img\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    const tag = match[0]
    const src = resolveHttpUrl(attr(tag, 'src') || attr(tag, 'data-src'), pageUrl)
    if (!src || isSkippableImage(src)) continue
    return src
  }
  return ''
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Pull the share-card fields out of a gallery page.
 * Preference: Open Graph, then Twitter card, then the first real image on the page.
 */
export function parseGalleryLinkPreview(html: string, pageUrl: string): GalleryLinkPreview {
  const meta = readMetaMap(html)
  const image =
    resolveHttpUrl(meta.get('og:image') || '', pageUrl) ||
    resolveHttpUrl(meta.get('og:image:secure_url') || '', pageUrl) ||
    resolveHttpUrl(meta.get('twitter:image') || meta.get('twitter:image:src') || '', pageUrl) ||
    readLinkImage(html, pageUrl) ||
    readFirstContentImage(html, pageUrl)

  const siteName = clip(meta.get('og:site_name') || hostnameOf(pageUrl), SITE_MAX)
  const title = clip(
    meta.get('og:title') || meta.get('twitter:title') || readDocumentTitle(html) || siteName,
    TITLE_MAX
  )
  const description = clip(
    meta.get('og:description') || meta.get('twitter:description') || meta.get('description') || '',
    DESCRIPTION_MAX
  )

  return {
    url: pageUrl.slice(0, URL_MAX),
    title,
    description,
    image,
    siteName,
  }
}
