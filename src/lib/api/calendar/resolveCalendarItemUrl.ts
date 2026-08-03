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

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
