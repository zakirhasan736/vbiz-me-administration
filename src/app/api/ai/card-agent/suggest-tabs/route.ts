import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'AI Card Agent runs on the API server. Use /api/v1/ai/card-agent/* with your auth token. Set OPENAI_API_KEY on the backend only.',
    },
    { status: 410 }
  )
}
