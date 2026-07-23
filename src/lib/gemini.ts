/**
 * Gemini Live runs in the browser. Set the key in vibz/.env only:
 *   NEXT_PUBLIC_GEMINI_API_KEY=your_key
 * (GEMINI_API_KEY is also accepted — next.config mirrors it for the client bundle.)
 * Restart `next dev` after changing .env.
 */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim()
  return key || undefined
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey())
}
