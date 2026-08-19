import {
  assistantProfilePath,
  buildAssistantSectionForm,
  buildAssistantTrainingForm,
  scopeAssistantSectionPayload,
  unwrapAssistantResponse,
} from '@/lib/assistantApi'
import { parseGeminiLiveToken } from '@/lib/gemini'
import { buildCardPayloadForPrompt } from '@/lib/liveAgent/languagePrompt'
import { isLiveAgentVisible } from '@/profile-app/components/LiveAgent'
import { DEFAULT_LIVE_AGENT_CARD } from '@/profile-app/lib/liveAgentPrompt'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('secure card assistant integration', () => {
  it('parses common live-token envelopes without a frontend Gemini key', () => {
    expect(
      parseGeminiLiveToken({
        success: true,
        data: { result: { token: 'one-use', model: 'live-model', expiresAt: '2099-01-01T00:00:00.000Z' } },
      })
    ).toEqual({ token: 'one-use', model: 'live-model', expiresAt: '2099-01-01T00:00:00.000Z' })

    const nextConfig = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8')
    const geminiClient = readFileSync(resolve(process.cwd(), 'src/lib/gemini.ts'), 'utf8')
    expect(`${nextConfig}\n${geminiClient}`).not.toContain('NEXT_PUBLIC_GEMINI_API_KEY')
    expect(geminiClient).toContain('response.status === 409')
  })

  it('bounds card-specific knowledge and includes all public tab context', () => {
    const payload = JSON.parse(
      buildCardPayloadForPrompt({
        ...DEFAULT_LIVE_AGENT_CARD,
        profileId: 'card-42',
        ownerName: 'Current owner',
        reviews: [{ author: 'A', text: 'Excellent' }],
        blogs: [{ title: 'Current post' }],
        faqs: [{ question: 'Current question' }],
        assistantContext: { businessBrief: 'B'.repeat(7000), knowledge: ['K'.repeat(4000)] },
      })
    )
    expect(payload.profileId).toBe('card-42')
    expect(payload.ownerName).toBe('Current owner')
    expect(payload.reviews).toHaveLength(1)
    expect(payload.blogs).toHaveLength(1)
    expect(payload.faqs).toHaveLength(1)
    expect(payload.assistantContext.businessBrief.length).toBeLessThanOrEqual(6001)
    expect(payload.assistantContext.knowledge[0].length).toBeLessThanOrEqual(3001)
  })

  it('gates the shared live-agent shell', () => {
    expect(isLiveAgentVisible(false)).toBe(false)
    expect(isLiveAgentVisible(true)).toBe(true)
  })

  it('builds tab-scoped multipart and applies only the requested section', () => {
    const form = buildAssistantSectionForm('services', ' pasted business ', [])
    expect(form.get('section')).toBe('services')
    expect(form.get('businessText')).toBe('pasted business')
    expect(form.get('text')).toBe('pasted business')
    expect(assistantProfilePath('profile 7', 'fill-section')).toBe('/profiles/profile%207/assistant/fill-section')
    expect(
      scopeAssistantSectionPayload('services', { services: [{ title: 'One' }], reviews: [{ author: 'No' }] })
    ).toEqual({ services: [{ title: 'One' }] })
  })

  it('builds the training multipart payload without storing content', () => {
    const form = buildAssistantTrainingForm(' private business brief ', [])
    expect(form.get('businessText')).toBe('private business brief')
    expect([...form.keys()]).toEqual(['businessText'])
    expect(unwrapAssistantResponse({ data: { items: [] } })).toEqual({ items: [] })
  })
})
