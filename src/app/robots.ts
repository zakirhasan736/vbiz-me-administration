import { getSiteOrigin } from '@/lib/seo/siteOrigin'
import type { MetadataRoute } from 'next'

/**
 * Crawl policy:
 * - Index public cards under /vCard/ and the plain-text AI index at /llms.txt
 * - Keep admin, auth, and API routes out of the index
 * - AI crawlers get the same public cards. They are not blocked.
 */
const PUBLIC_PATHS = ['/vcard/', '/vCard/', '/llms.txt', '/sitemap.xml']

const PRIVATE_PATHS = [
  '/api/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/set-password',
  '/verify-email',
  '/admin',
  '/vcards',
  '/crm',
  '/events',
  '/settings',
  '/teamvcard',
  '/1-on-1',
]

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'Amazonbot',
]

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()

  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_PATHS,
        disallow: [...PRIVATE_PATHS, '/_next/'],
      },
      {
        userAgent: 'Googlebot',
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ''),
  }
}
