import { buildGapReport } from '@/lib/ai/gapReport'
import { checkAiRateLimit, clientKeyFromRequest } from '@/lib/ai/rateLimit'
import type { VCardData } from '@/types/vcard'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  draft: z.record(z.string(), z.unknown()),
  enabledNavIds: z.array(z.string()).optional().default(['home']),
})

export async function POST(req: NextRequest) {
  const limited = checkAiRateLimit(`gap:${clientKeyFromRequest(req)}`, 60)
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many AI requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    )
  }

  try {
    const body = bodySchema.parse(await req.json())
    const report = buildGapReport(body.draft as unknown as VCardData, body.enabledNavIds)
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to build gap report' },
      { status: 400 }
    )
  }
}
