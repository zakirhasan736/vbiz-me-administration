import { buildTranslationConfig, LANGUAGE_MAP } from '@/lib/i18n/config'
import { NextResponse } from 'next/server'

export async function GET() {
  const config = buildTranslationConfig()
  const languages = Object.entries(LANGUAGE_MAP).map(([code, meta]) => ({
    code,
    flagCode: meta.flagCode,
    name: meta.name,
  }))

  return NextResponse.json({
    fallback: config.fallback,
    scriptUrl: config.scriptUrl,
    languages,
  })
}
