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
    ],
  },
  reactCompiler: true,
}

export default nextConfig
