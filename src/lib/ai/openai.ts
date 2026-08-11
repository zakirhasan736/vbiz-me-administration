/**
 * @deprecated OpenAI runs on vbiz-me-backend only.
 * Do not read OPENAI_API_KEY from the Next.js env — stealer/XSS cannot exfiltrate a key that isn’t here.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const MAX_FILES = 6

export function getOpenAiApiKey(): never {
  throw new Error(
    'OPENAI_API_KEY must be configured on the Express backend (.env), not in the admin app. Card agent calls go to /api/v1/ai/card-agent/*.'
  )
}
