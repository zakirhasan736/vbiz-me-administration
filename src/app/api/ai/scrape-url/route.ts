import { mapBlueprintToVCardData, type CardBlueprint } from '@/lib/ai/cardBlueprint'
import { baseUrl } from '@/redux/api/api'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Thin adapter — forwards to backend card-agent (OpenAI key stays on API server).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = String(body?.url || '').trim()
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const headerAuth = req.headers.get('authorization')
    if (!headerAuth) {
      return NextResponse.json(
        { error: 'Authorization required. Call this endpoint with your Bearer token.' },
        { status: 401 }
      )
    }

    const analyzeRes = await fetch(`${baseUrl}/ai/card-agent/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: headerAuth,
      },
      body: JSON.stringify({ websiteUrl: url }),
    })
    const analyzeJson = await analyzeRes.json()
    if (!analyzeRes.ok) {
      return NextResponse.json(
        {
          error:
            analyzeJson.message ||
            analyzeJson.error ||
            'Failed to analyze URL. Ensure OPENAI_API_KEY is set on the backend.',
        },
        { status: analyzeRes.status }
      )
    }

    const payload = analyzeJson.data || analyzeJson
    const blueprint = payload.blueprint as CardBlueprint
    const mapped = mapBlueprintToVCardData(blueprint)
    const personal = mapped.data.personal

    return NextResponse.json({
      fullName: personal.fullName || '',
      title: personal.designation || '',
      company: personal.company || '',
      bio: personal.about || '',
      email: personal.email || '',
      phone: personal.phone || '',
      location: personal.address || '',
      website: personal.website || url,
      themeColor: 'indigo',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse website details'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
