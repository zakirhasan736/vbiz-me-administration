import { expect, test, type APIRequestContext } from '@playwright/test'

const SITEMAP_URL = process.env.SCHEMA_SITEMAP_URL || 'https://app.vbizme.com/sitemap.xml'
const PRODUCTION_ORIGIN = 'https://app.vbizme.com'

type Issue = { url: string; problems: string[] }

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function attr(html: string, tag: string, attrName: string, attrValue: string, read: string): string {
  const pattern = new RegExp(
    `<${tag}\\b[^>]*${attrName}=["']${attrValue}["'][^>]*${read}=["']([^"']*)["'][^>]*>|<${tag}\\b[^>]*${read}=["']([^"']*)["'][^>]*${attrName}=["']${attrValue}["'][^>]*>`,
    'i'
  )
  const match = html.match(pattern)
  return decodeHtml(match?.[1] || match?.[2] || '')
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

function nodesOf(data: unknown): Record<string, unknown>[] {
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  if (Array.isArray(record['@graph'])) {
    return record['@graph'].filter((node): node is Record<string, unknown> => Boolean(node) && typeof node === 'object')
  }
  return [record]
}

function schemaProblems(html: string, pageUrl: string): string[] {
  const problems: string[] = []
  const slug = decodeURIComponent(new URL(pageUrl).pathname.split('/').filter(Boolean)[1] || '')
  const canonical = attr(html, 'link', 'rel', 'canonical', 'href')
  const description = attr(html, 'meta', 'name', 'description', 'content')
  const ogTitle = attr(html, 'meta', 'property', 'og:title', 'content')
  const ogDescription = attr(html, 'meta', 'property', 'og:description', 'content')
  const ogUrl = attr(html, 'meta', 'property', 'og:url', 'content')
  const ogImage = attr(html, 'meta', 'property', 'og:image', 'content')
  const robots = attr(html, 'meta', 'name', 'robots', 'content')

  if (!canonical) problems.push('missing canonical')
  else {
    let canonicalPath = ''
    try {
      canonicalPath = new URL(canonical).pathname
    } catch {
      problems.push('canonical is not a URL')
    }
    const parts = canonicalPath.split('/').filter(Boolean)
    if (parts[0] !== 'vCard') problems.push(`canonical is ${canonicalPath || canonical}, expected /vCard/`)
    if (decodeURIComponent(parts[1] || '') !== slug) problems.push('canonical slug does not match the URL')
  }
  if (!description) problems.push('missing meta description')
  if (!ogTitle) problems.push('missing og:title')
  if (!ogDescription) problems.push('missing og:description')
  if (!ogUrl) problems.push('missing og:url')
  else if (canonical && ogUrl !== canonical) problems.push('og:url does not match canonical')
  if (!ogImage) problems.push('missing og:image')
  else if (!isHttpUrl(ogImage)) problems.push('og:image is not an absolute URL')
  if (/noindex/i.test(robots)) problems.push('public sitemap URL is noindex')
  if (!/<h1[\s>]/i.test(html)) problems.push('missing h1')

  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  if (!scripts.length) {
    problems.push('missing JSON-LD script')
    return problems
  }

  const nodes: Record<string, unknown>[] = []
  scripts.forEach((match, index) => {
    try {
      nodes.push(...nodesOf(JSON.parse(match[1])))
    } catch {
      problems.push(`JSON-LD script ${index + 1} is not valid JSON`)
    }
  })

  const page = nodes.find((node) => node['@type'] === 'ProfilePage')
  if (!page) {
    problems.push('JSON-LD has no ProfilePage')
    return problems
  }
  if (canonical && page.url !== canonical) problems.push('ProfilePage url does not match canonical')
  const entity = page.mainEntity
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    problems.push('ProfilePage has no mainEntity')
    return problems
  }
  const main = entity as Record<string, unknown>
  const entityType = String(main['@type'] || '')
  if (entityType !== 'Person' && entityType !== 'LocalBusiness') {
    problems.push(`mainEntity type is ${entityType || 'missing'}`)
  }
  if (!String(main.name || '').trim()) problems.push('mainEntity name is empty')
  if (entityType === 'Person' && (main.review || main.aggregateRating)) {
    problems.push('Person includes review markup the vocabulary does not allow')
  }
  if (main.image && !isHttpUrl(String(main.image))) problems.push('mainEntity image is not an absolute URL')
  if (main.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(main.email)))
    problems.push('mainEntity email is not an email')
  const sameAs = Array.isArray(main.sameAs) ? main.sameAs : page.sameAs
  if (Array.isArray(sameAs)) {
    for (const url of sameAs) {
      if (!isHttpUrl(String(url))) problems.push(`sameAs is not a web address: ${String(url).slice(0, 80)}`)
    }
  }

  const reviews = [
    ...(Array.isArray(page.review) ? page.review : []),
    ...(Array.isArray(main.review) ? main.review : []),
  ] as Record<string, unknown>[]
  const aggregate = (entityType === 'LocalBusiness' ? main.aggregateRating : page.aggregateRating) as
    Record<string, unknown> | undefined
  if (aggregate && typeof aggregate === 'object') {
    const rating = Number(aggregate.ratingValue)
    const count = Number(aggregate.reviewCount)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) problems.push('aggregateRating is outside 1-5')
    if (count !== reviews.length) problems.push(`reviewCount ${count} does not match ${reviews.length} reviews`)
  }
  reviews.forEach((review, index) => {
    const author = review.author as { name?: string } | undefined
    if (!author?.name) problems.push(`review ${index + 1} has no author`)
    const rating = Number((review.reviewRating as { ratingValue?: unknown } | undefined)?.ratingValue)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) problems.push(`review ${index + 1} rating is outside 1-5`)
    const reviewed = review.itemReviewed as { '@id'?: string } | undefined
    if (!reviewed?.['@id']) problems.push(`review ${index + 1} has no itemReviewed`)
  })

  for (const node of nodes) {
    if (node['@type'] === 'FAQPage') {
      const questions = Array.isArray(node.mainEntity) ? node.mainEntity : []
      if (!questions.length) problems.push('FAQPage has no questions')
      questions.forEach((question, index) => {
        const row = question as { name?: string; acceptedAnswer?: { text?: string } }
        if (!row.name?.trim()) problems.push(`FAQ question ${index + 1} has no name`)
        if (!row.acceptedAnswer?.text?.trim()) problems.push(`FAQ question ${index + 1} has no answer`)
      })
    }
    if (node['@type'] === 'Product') {
      if (!String(node.name || '').trim()) problems.push('Product has no name')
      const offer = node.offers as { price?: string; priceCurrency?: string } | undefined
      if (!offer?.price || !offer.priceCurrency) problems.push(`Product ${String(node.name || '')} has no price offer`)
      if (node.image && !isHttpUrl(String(node.image))) problems.push(`Product image is not an absolute URL`)
    }
  }

  return problems
}

function looksRateLimited(status: number, html: string): boolean {
  if (status === 429 || status >= 500) return true
  return status === 200 && !/application\/ld\+json/i.test(html)
}

async function readCard(request: APIRequestContext, url: string): Promise<{ status: number; html: string }> {
  let lastStatus = 0
  let lastHtml = ''
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.get(url, { timeout: 60_000 })
    lastStatus = response.status()
    lastHtml = await response.text()
    if (!looksRateLimited(lastStatus, lastHtml)) return { status: lastStatus, html: lastHtml }
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
  }
  return { status: lastStatus, html: lastHtml }
}

test('every public card URL has valid schema', async ({ request, baseURL }) => {
  const sitemap = await request.get(SITEMAP_URL)
  expect(sitemap.ok()).toBeTruthy()
  const xml = await sitemap.text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1]))
  expect(locs.length).toBeGreaterThan(0)

  const origin = (baseURL || PRODUCTION_ORIGIN).replace(/\/$/, '')
  const urls = locs.map((loc) => loc.replace(PRODUCTION_ORIGIN, origin))
  const issues: Issue[] = []
  let cursor = 0

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor]
      cursor += 1
      const current = cursor
      try {
        const { status, html } = await readCard(request, url)
        if (status !== 200) {
          issues.push({ url, problems: [`HTTP ${status}`] })
        } else {
          const problems = schemaProblems(html, url)
          if (problems.length) issues.push({ url, problems })
        }
      } catch (error) {
        issues.push({ url, problems: [error instanceof Error ? error.message : 'request failed'] })
      }
      if (current % 20 === 0 || current === urls.length) {
        console.log(`schema ${current}/${urls.length} issues ${issues.length}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  await Promise.all(Array.from({ length: 1 }, () => worker()))

  const summary = issues
    .slice(0, 30)
    .map((issue) => `${issue.url}\n  - ${issue.problems.join('\n  - ')}`)
    .join('\n')
  expect(issues, `${issues.length} card(s) failed schema checks\n${summary}`).toEqual([])
})
