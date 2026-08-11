import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * OpenAI calls were moved to the Express backend so the API key never lives in Next.js.
 * Clients must call `${NEXT_PUBLIC_API_URL}/ai/card-agent/*` with a Bearer token.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'AI Card Agent runs on the API server. Use /api/v1/ai/card-agent/* with your auth token. Set OPENAI_API_KEY on the backend only.',
    },
    { status: 410 }
  )
}
