import type { PublicCardSource } from '@/lib/seo/publicCardSource'
import { getSiteOrigin } from '@/lib/seo/siteOrigin'

export type LlmsIndexCard = {
  name: string
  url: string
  markdownUrl: string
  summary: string
}

const AI_SITE_ORIGIN = 'https://app.vbizme.com'

function isLocalHost(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value)
}

/** Origin advertised to crawlers. A local dev host must not become the public card address. */
export function resolveAiSiteOrigin(request?: { headers: Headers } | null): string {
  const host = request?.headers.get('x-forwarded-host') || request?.headers.get('host') || ''
  const proto = (request?.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim().replace(/:$/, '')
  const requestHost = host.split(',')[0].trim()
  if (requestHost && !isLocalHost(requestHost)) return `${proto}://${requestHost}`
  const configured = getSiteOrigin()
  if (configured && !isLocalHost(configured)) return configured
  return AI_SITE_ORIGIN
}

export function buildPublicCardMarkdown(source: PublicCardSource): string {
  const lines: string[] = [`# ${source.name}`, '']
  if (source.companyLine) lines.push(`> ${source.companyLine}`, '')
  if (source.about) lines.push(source.about, '')

  const contact = [
    source.address ? `- Address: ${source.address}` : '',
    source.phone ? `- Phone: ${source.phone}` : '',
    source.email ? `- Email: ${source.email}` : '',
    source.website ? `- Website: ${source.website}` : '',
  ].filter(Boolean)
  if (contact.length) lines.push('## Contact', '', ...contact, '')

  if (source.lines.length) {
    lines.push('## Details', '', ...source.lines.map((line) => `- ${line}`), '')
  }
  if (source.faqs.length) {
    lines.push('## FAQ', '')
    for (const faq of source.faqs) {
      lines.push(`### ${faq.question}`, '', faq.answer, '')
    }
  }
  if (source.reviews.length) {
    lines.push('## Reviews', '')
    for (const review of source.reviews) {
      lines.push(review.text ? `- ${review.author}: ${review.text}` : `- ${review.author}`, '')
    }
  }
  if (source.products.length) {
    lines.push('## Products', '')
    for (const product of source.products) {
      const price = product.price ? ` — ${product.price}` : ''
      const description = product.description ? `. ${product.description}` : ''
      lines.push(`- ${product.name}${price}${description}`)
    }
    lines.push('')
  }

  lines.push(`Public page: ${source.canonical}`)
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}

export function buildLlmsIndex(origin: string, cards: LlmsIndexCard[]): string {
  const lines = [
    '# vBiz Me',
    '',
    '> Public digital business cards. Each card is one person or business, with contact details, services, reviews, FAQs, and products when that card has them.',
    '',
    'The links below are plain-text versions of published cards. Draft cards are omitted. The public page for a card is the same path without `/llms.txt`.',
    '',
    `- [Sitemap](${origin}/sitemap.xml)`,
    '',
    '## Cards',
    '',
  ]

  for (const card of cards) {
    const summary = card.summary.trim()
    const note = summary ? `: ${summary}` : ''
    lines.push(`- [${card.name}](${card.markdownUrl})${note}`)
  }

  if (!cards.length) lines.push('- No published cards are listed yet.')
  return lines.join('\n').trim() + '\n'
}
