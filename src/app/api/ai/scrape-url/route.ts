import { GoogleGenAI, Type } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = body?.url as string | undefined
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()
    if (!apiKey) {
      const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com'
      return NextResponse.json({
        fullName: host
          .split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        title: 'Founder & Product Lead',
        company: host,
        bio: `Professional profile generated from ${host}. Customize this demo content to match your brand.`,
        email: `hello@${host}`,
        phone: '+1 (555) 010-2000',
        location: 'Remote / Global',
        website: url.startsWith('http') ? url : `https://${url}`,
        themeColor: 'indigo',
      })
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'vbiz-me-administration' } },
    })

    const prompt = `Analyze the website or company at this URL or domain: "${url}". 
Using Google Search grounding, find detailed and accurate business or professional information about this company or person and return a JSON object populated with vCard details.
The JSON object must strictly match this structure:
{
  "fullName": "Name of person or company/brand",
  "title": "Professional title or tagline",
  "company": "Company name",
  "bio": "A professional 2-3 sentence biography or company summary",
  "email": "Contact email if available or leave empty",
  "phone": "Phone number if available or leave empty",
  "location": "City, Country or address if available",
  "website": "${url}",
  "themeColor": "emerald"
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            bio: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            website: { type: Type.STRING },
            themeColor: { type: Type.STRING },
          },
        },
      },
    })

    const textResult = response.text || '{}'
    return NextResponse.json(JSON.parse(textResult))
  } catch (err: unknown) {
    console.error('Error in /api/ai/scrape-url:', err)
    const message = err instanceof Error ? err.message : 'Failed to parse website details'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
