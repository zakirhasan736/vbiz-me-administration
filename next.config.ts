import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Capistrano-style `releases/*` leave sibling lockfiles; pin tracing to this app. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'app.vbizme.com',
      },
      {
        protocol: 'https',
        hostname: 'aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com',
      },
    ],
  },
  reactCompiler: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/vCard/:slug/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          // Supporting files are not pages; keep them out of Google's index and Search Console reports.
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/vCard/:slug/icon/:size',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/vCard/:slug/wallet-art',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
  async redirects() {
    return [
      // Bare /v used to fall through `:slug*` to an empty /vCard and 404 in Search Console.
      {
        source: '/v',
        destination: '/',
        permanent: true,
      },
      {
        source: '/v/:slug+',
        destination: '/vCard/:slug+',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
