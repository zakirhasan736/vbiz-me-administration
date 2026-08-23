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
import { LIVE_AGENT_PUBLIC_PLACEMENT, LIVE_AGENT_V2_PUBLIC_PLACEMENT } from '@/profile-app/lib/liveAgentPlacement'
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

  it('matches template-services public-card AI Assistance placement', () => {
    expect(LIVE_AGENT_PUBLIC_PLACEMENT).toBe(
      'top-1/2 right-3 -translate-y-1/2 md:top-auto md:right-6 md:bottom-6 md:translate-y-0 lg:right-10 lg:bottom-10'
    )
    expect(LIVE_AGENT_V2_PUBLIC_PLACEMENT).toBe(
      'right-3 top-1/2 -translate-y-1/2 md:right-6 md:top-auto md:bottom-[60px] md:translate-y-0 lg:right-10 lg:bottom-[60px]'
    )
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

  it('keeps existing-card AI analysis off the live editor until tabs are approved', () => {
    const wizard = readFileSync(
      resolve(process.cwd(), 'src/components/vcard/create-agent/AiCardAgentWizard.tsx'),
      'utf8'
    )
    const client = readFileSync(resolve(process.cwd(), 'src/lib/ai/cardAgentClient.ts'), 'utf8')
    const provider = readFileSync(
      resolve(process.cwd(), 'src/components/vcard/create-agent/CreateAgentUiProvider.tsx'),
      'utf8'
    )
    const previewEditor = readFileSync(
      resolve(process.cwd(), 'src/components/vcard/create-agent/LaunchTabReviewModal.tsx'),
      'utf8'
    )
    expect(wizard).toContain("extractForm.set('builderMode', isEdit ? 'update' : 'create')")
    expect(wizard).toContain("extractForm.set('profileId', profileId)")
    expect(wizard).toContain('if (!editorUnlockedRef.current) return')
    expect(wizard).toContain('formatCardAgentError')
    expect(wizard).not.toContain('I hit a problem:')
    expect(client).toContain("'NETWORK_ERROR'")
    expect(client).toContain('x-vbiz-request-id')
    expect(provider).toContain('cardLoading={Boolean(isEdit && loading)}')
    expect(provider).toContain('profileId={isEdit ? cardId || undefined : undefined}')
    expect(wizard).toContain('Fill selected tab: {coachSectionLabel}')
    expect(wizard).toContain('Continue — finish later in editor')
    expect(wizard).toContain('coachSectionOptions.map')
    expect(wizard).toContain("!['faqs', 'blogs', 'skills'].includes(section)")
    expect(wizard).toContain('Generate up to 5 with AI')
    expect(wizard).toContain('Import real reviews with AI')
    expect(previewEditor).toContain("{ key: 'rating', label: 'Rating (1–5)', type: 'number' }")
    expect(previewEditor).toContain("{ key: 'skills', label: 'Skills (comma separated)', type: 'tags' }")
    expect(previewEditor).toContain("{ key: 'featuredImage', label: 'Featured image URL' }")
    expect(previewEditor).toContain("{ key: 'answer', label: 'Answer', type: 'textarea' }")
  })
})
