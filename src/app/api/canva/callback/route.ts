import { handleCanvaOAuthCallback } from '@/lib/canva/callback-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const resultUrl = await handleCanvaOAuthCallback({
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    error_description: params.get('error_description') ?? undefined,
  })

  return NextResponse.redirect(new URL(resultUrl, request.url))
}
