import type { DynamicPostListItem } from '@/interfaces/api/dynamicPosts.interface'

function extractHrefFromHtml(html: string): string {
  const match = html.match(/href=["']([^"']+)["']/i)
  return match?.[1]?.trim() ?? ''
}

export function resolveCalendarItemUrl(item: DynamicPostListItem): string {
  const generalInfoUrl = item.generalInfoUrl.trim()
  if (generalInfoUrl) return generalInfoUrl

  const attachmentUrl = item.attachments.find((attachment) => attachment.url?.trim())?.url?.trim()
  if (attachmentUrl) return attachmentUrl

  const featuredImage = item.featuredImage.trim()
  if (featuredImage) return featuredImage

  return extractHrefFromHtml(item.description)
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1]?.toLowerCase() === 'x'
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)

      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return match

      try {
        return String.fromCodePoint(codePoint)
      } catch {
        return match
      }
    }

    return HTML_ENTITIES[entity.toLowerCase()] ?? match
  })
}

export function stripHtml(html: string): string {
  let decoded = html

  // Editor/API payloads can contain raw, entity-encoded, or double-encoded rich text.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = decodeHtmlEntities(decoded)
    if (next === decoded) break
    decoded = next
  }

  return decoded
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<(script|style|template)\b[^>]*>[^]*?<\/\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<\/\s*(?:p|div|li|ol|ul|blockquote|h[1-6])\s*>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
