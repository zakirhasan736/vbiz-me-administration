import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Expose Gemini key to client bundle (required for Live Agent WebSocket in browser). */
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '',
    /** Matches Vite reference app (`define process.env.GEMINI_API_KEY`). */
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '',
  },
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
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
