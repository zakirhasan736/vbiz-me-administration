import { CardScopeProvider, type CardScopeMode } from '@/lib/card-scope'
import { setAiCardAgentOpen } from '@/lib/dashboardTour'
import { AUTOSAVE_DEBOUNCE_MS, AUTOSAVE_MAX_MS } from '@/lib/vcardAutosave'
import { useVCard, VCardProvider } from '@/lib/VCardContext'
import type { DesignSettingsState } from '@/redux/features/designSettings/designSettings.slice'
import type { ApiProfile } from '@/redux/features/profiles/profiles.api'
import type { VCardsState } from '@/redux/features/vcards/vcards.slice'
import { createDefaultVCardData, type VCardRecord } from '@/types/vcard'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type VCardApi = ReturnType<typeof useVCard>
type TestState = {
  designSettings: DesignSettingsState
  vcards: VCardsState
}

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: null as TestState | null,
  routerPush: vi.fn(),
  createProfile: vi.fn(),
  createProfileUnwrap: vi.fn(),
  updateProfileCard: vi.fn(),
  updateProfileCardUnwrap: vi.fn(),
  collectionMutation: vi.fn(),
  collectionMutationUnwrap: vi.fn(),
  useGetProfileQuery: vi.fn(),
  listQuery: vi.fn(),
  listQueryUnwrap: vi.fn(),
  createPostMutation: vi.fn(),
  updatePostMutation: vi.fn(),
  deletePostMutation: vi.fn(),
  flushAboutMeUpsert: vi.fn(),
  hasAboutMeDraftContent: vi.fn(),
  getCreateCardOwner: vi.fn(),
  clearCreateCardOwner: vi.fn(),
  notifyError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    replace: vi.fn(),
  }),
}))

vi.mock('@/hooks/redux', () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: <T,>(selector: (state: TestState) => T) => {
    if (!mocks.state) throw new Error('Test Redux state was not initialized')
    return selector(mocks.state)
  },
}))

vi.mock('@/lib/aboutMeDraft', () => ({
  hasAboutMeDraftContent: mocks.hasAboutMeDraftContent,
}))

vi.mock('@/lib/aboutMePersist', () => ({
  flushAboutMeUpsert: mocks.flushAboutMeUpsert,
}))

vi.mock('@/lib/admin/createCardOwner', () => ({
  clearCreateCardOwner: mocks.clearCreateCardOwner,
  getCreateCardOwner: mocks.getCreateCardOwner,
}))

vi.mock('@/lib/toast/toast', () => ({
  notify: {
    error: mocks.notifyError,
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/redux/features/profiles/profiles.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/redux/features/profiles/profiles.api')>()
  const mutation = () => [mocks.collectionMutation, {}]
  const postMutation = (fn: typeof mocks.createPostMutation) => () => [fn, {}]
  const listQuery = () => [mocks.listQuery]

  return {
    ...actual,
    useCreateProfileMutation: () => [mocks.createProfile, { isLoading: false }],
    useUpdateProfileCardMutation: () => [mocks.updateProfileCard],
    useReplaceEducationMutation: mutation,
    useReplaceExperiencesMutation: mutation,
    useReplaceServicesMutation: mutation,
    useReplacePortfoliosMutation: mutation,
    useReplaceReviewsMutation: mutation,
    useReplaceSkillsMutation: mutation,
    useReplaceSocialLinksMutation: mutation,
    useLazyListProfilePostsQuery: listQuery,
    useCreateProfilePostMutation: postMutation(mocks.createPostMutation),
    useUpdateProfilePostMutation: postMutation(mocks.updatePostMutation),
    useDeleteProfilePostMutation: postMutation(mocks.deletePostMutation),
    useLazyListProfileBlogsQuery: listQuery,
    useLazyListEditorSectionsQuery: listQuery,
    useCreateProfileBlogMutation: postMutation(mocks.createPostMutation),
    useUpdateProfileBlogMutation: postMutation(mocks.updatePostMutation),
    useDeleteProfileBlogMutation: postMutation(mocks.deletePostMutation),
    useLazyListProfileTabItemsQuery: listQuery,
    useCreateProfileTabItemMutation: postMutation(mocks.createPostMutation),
    useUpdateProfileTabItemMutation: postMutation(mocks.updatePostMutation),
    useDeleteProfileTabItemMutation: postMutation(mocks.deletePostMutation),
    useGetProfileQuery: mocks.useGetProfileQuery,
  }
})

const designSettings: DesignSettingsState = {
  vcardPrimaryColor: '#eed677',
  vcardAccentColor: '#eed677',
  dashboardAccent: 'amber',
  fontFamily: 'inter',
  profileTemplate: 'v3',
  layoutStyle: 'classic',
  buttonStyle: 'solid',
  cornerStyle: 'round',
}

function personal(overrides: Partial<ReturnType<typeof createDefaultVCardData>['personal']>) {
  return {
    ...createDefaultVCardData().personal,
    ...overrides,
  }
}

function makeRecord(id = 'card-1', overrides: Partial<ReturnType<typeof createDefaultVCardData>> = {}): VCardRecord {
  return {
    ...createDefaultVCardData(overrides),
    id,
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
    views: 0,
    saves: 0,
    avatarImageUrl: '',
    backgroundImageUrl: '',
    isActive: true,
    isDraft: false,
  }
}

function makeState(record: VCardRecord | null): TestState {
  return {
    designSettings,
    vcards: {
      byId: record ? { [record.id]: record } : {},
      ids: record ? [record.id] : [],
      slugToId: record?.slug ? { [record.slug]: record.id } : {},
    },
  }
}

function makeCreatedProfile(payload: {
  name?: unknown
  slug?: unknown
  isDraft?: unknown
  isPublic?: unknown
}): ApiProfile {
  return {
    id: 'created-card',
    name: String(payload.name ?? ''),
    email: '',
    slug: String(payload.slug ?? ''),
    companyName: '',
    designation: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    prof: '',
    dob: null,
    isDraft: payload.isDraft === true,
    isPublic: payload.isPublic === true,
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
    viewCount: 0,
    saveCount: 0,
    clickCount: 0,
    socialClicks: [],
    settings: [],
    socialLinks: [],
    education: [],
    experiences: [],
    services: [],
    portfolios: [],
    galleries: [],
    reviews: [],
    skillTags: [],
  }
}

function ProviderProbe({ onValue }: { onValue: (value: VCardApi) => void }) {
  const value = useVCard()

  useEffect(() => {
    onValue(value)
  }, [onValue, value])

  return null
}

async function renderProvider({ mode, cardId }: { mode: CardScopeMode; cardId: string | null }) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  let latest: VCardApi | null = null

  await act(async () => {
    root.render(
      <CardScopeProvider cardId={cardId} mode={mode}>
        <VCardProvider>
          <ProviderProbe onValue={(value) => (latest = value)} />
        </VCardProvider>
      </CardScopeProvider>
    )
  })

  if (!latest) throw new Error('VCardProvider did not render')

  return {
    get api() {
      if (!latest) throw new Error('VCardProvider is unmounted')
      return latest
    },
    root,
    container,
  }
}

async function cleanupRendered(rendered?: { root: Root; container: HTMLDivElement }) {
  if (!rendered) return
  await act(async () => {
    rendered.root.unmount()
  })
  rendered.container.remove()
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('VCardProvider autosave and creation', () => {
  let rendered: Awaited<ReturnType<typeof renderProvider>> | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setAiCardAgentOpen(false)
    document.body.innerHTML = ''
    mocks.state = null
    mocks.dispatch.mockReset()
    mocks.routerPush.mockReset()
    mocks.createProfile.mockReset()
    mocks.createProfileUnwrap.mockReset()
    mocks.updateProfileCard.mockReset()
    mocks.updateProfileCardUnwrap.mockReset()
    mocks.collectionMutation.mockReset()
    mocks.collectionMutationUnwrap.mockReset()
    mocks.useGetProfileQuery.mockReset()
    mocks.listQuery.mockReset()
    mocks.listQueryUnwrap.mockReset()
    mocks.createPostMutation.mockReset()
    mocks.updatePostMutation.mockReset()
    mocks.deletePostMutation.mockReset()
    mocks.flushAboutMeUpsert.mockReset()
    mocks.hasAboutMeDraftContent.mockReset()
    mocks.getCreateCardOwner.mockReset()
    mocks.clearCreateCardOwner.mockReset()
    mocks.notifyError.mockReset()

    mocks.useGetProfileQuery.mockReturnValue({ data: undefined, isFetching: false })
    mocks.updateProfileCard.mockImplementation((args) => ({
      unwrap: () => mocks.updateProfileCardUnwrap(args),
    }))
    mocks.updateProfileCardUnwrap.mockResolvedValue(undefined)
    mocks.collectionMutation.mockImplementation((args) => ({
      unwrap: () => mocks.collectionMutationUnwrap(args),
    }))
    mocks.collectionMutationUnwrap.mockResolvedValue(undefined)
    mocks.listQuery.mockImplementation(() => ({
      unwrap: () => mocks.listQueryUnwrap(),
    }))
    mocks.listQueryUnwrap.mockResolvedValue({ blogs: [], tabs: {} })
    mocks.createPostMutation.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }))
    mocks.updatePostMutation.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }))
    mocks.deletePostMutation.mockImplementation(() => ({ unwrap: () => Promise.resolve({}) }))
    mocks.createProfile.mockImplementation((args) => ({
      unwrap: () => mocks.createProfileUnwrap(args),
    }))
    mocks.createProfileUnwrap.mockImplementation((args) => Promise.resolve(makeCreatedProfile(args)))
    mocks.flushAboutMeUpsert.mockResolvedValue(undefined)
    mocks.hasAboutMeDraftContent.mockReturnValue(false)
    mocks.getCreateCardOwner.mockReturnValue(null)
  })

  afterEach(async () => {
    await cleanupRendered(rendered)
    rendered = undefined
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces edit-mode profile saves and writes the latest edited data', async () => {
    mocks.state = makeState(
      makeRecord('card-1', {
        slug: 'existing-card',
        personal: personal({ fullName: 'Old Name', email: 'old@example.com' }),
      })
    )
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Ada Lovelace')
    })

    expect(mocks.updateProfileCard).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)
    expect(mocks.updateProfileCard).toHaveBeenCalledWith({
      id: 'card-1',
      body: expect.objectContaining({
        name: 'Ada Lovelace',
        slug: 'existing-card',
      }),
    })
  })

  it('does not save each keystroke and checkpoints at the max wait while typing continues', async () => {
    mocks.state = makeState(makeRecord('card-1', { personal: personal({ fullName: 'A' }) }))
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Ad')
      vi.advanceTimersByTime(1000)
      rendered!.api.updateData('personal.fullName', 'Ada')
      vi.advanceTimersByTime(1000)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).not.toHaveBeenCalled()

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Ada L')
      vi.advanceTimersByTime(AUTOSAVE_MAX_MS)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)
    expect(mocks.updateProfileCard).toHaveBeenCalledWith({
      id: 'card-1',
      body: expect.objectContaining({ name: 'Ada L' }),
    })
  })

  it('autosaves card SEO metadata with the profile payload', async () => {
    mocks.state = makeState(makeRecord('card-1', { personal: personal({ fullName: 'Ada Lovelace' }) }))
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('seo.metaTitle', 'Ada Lovelace | Digital Business Card')
      rendered!.api.updateData('seo.metaDescription', 'Contact Ada Lovelace and explore professional services.')
      rendered!.api.updateData('seo.metaKeywords', ['ada lovelace', 'web design'])
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    const body = mocks.updateProfileCard.mock.calls[0]?.[0]?.body
    expect(body.settings).toMatchObject({
      seo_meta_title: 'Ada Lovelace | Digital Business Card',
      seo_meta_description: 'Contact Ada Lovelace and explore professional services.',
    })
    expect(JSON.parse(body.settings.seo_meta_keywords_json)).toEqual([
      'vbizme',
      'vbiz me',
      'virtual card',
      'digital business card',
      'online business card',
      'ada lovelace',
      'web design',
    ])
  })

  it('flushes edit-mode changes immediately when Save now runs', async () => {
    mocks.state = makeState(makeRecord('card-1', { personal: personal({ fullName: 'Old Name' }) }))
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('personal.company', 'Vbiz Labs')
      await rendered!.api.flushSave()
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)
    expect(mocks.updateProfileCard).toHaveBeenCalledWith({
      id: 'card-1',
      body: expect.objectContaining({
        companyName: 'Vbiz Labs',
      }),
    })
  })

  it('runs a follow-up edit-mode save when another change lands during an active save', async () => {
    let releaseFirstSave: (() => void) | undefined
    const firstSave = new Promise<void>((resolve) => {
      releaseFirstSave = resolve
    })

    mocks.updateProfileCardUnwrap.mockImplementationOnce(() => firstSave)
    mocks.state = makeState(
      makeRecord('card-1', { personal: personal({ fullName: 'Old Name', company: 'Old Company' }) })
    )
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'First Save Name')
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)

    await act(async () => {
      rendered!.api.updateData('personal.company', 'Second Save Company')
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)

    await act(async () => {
      releaseFirstSave?.()
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).toHaveBeenCalledTimes(2)
    expect(mocks.updateProfileCard).toHaveBeenLastCalledWith({
      id: 'card-1',
      body: expect.objectContaining({
        name: 'First Save Name',
        companyName: 'Second Save Company',
      }),
    })
  })

  it('does not autosave an empty newly added section item until the user types', async () => {
    mocks.state = makeState(makeRecord('card-1', { personal: personal({ fullName: 'Ada' }) }))
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.updateData('sectionPosts', {
        Events: [
          {
            id: 'sec_draft_1',
            title: '',
            description: '',
            url: '',
            featuredImage: '',
            date: '',
            rating: '',
            location: '',
            active: true,
          },
        ],
      })
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 50)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).not.toHaveBeenCalled()
    expect(mocks.createPostMutation).not.toHaveBeenCalled()
    expect(rendered!.api.saveStatus).not.toBe('saving')
  })

  it('autosaves a complete create-mode card as a private draft and opens its real editor', async () => {
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'New Card Owner')
      rendered!.api.updateData('personal.dob', '1990-07-18')
      rendered!.api.updateData('personal.email', 'owner@example.com')
      rendered!.api.updateData('personal.phone', '+1 202 555 0101')
      rendered!.api.updateData('slug', 'new-card-owner')
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1)
      await flushMicrotasks()
    })

    expect(mocks.updateProfileCard).not.toHaveBeenCalled()
    expect(mocks.createProfile).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
      await flushMicrotasks()
    })

    expect(mocks.createProfile).toHaveBeenCalledTimes(1)
    expect(mocks.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Card Owner',
        slug: 'new-card-owner',
        isDraft: true,
        isPublic: false,
      })
    )
    expect(mocks.clearCreateCardOwner).toHaveBeenCalledTimes(1)
    expect(mocks.routerPush).toHaveBeenCalledWith('/vcards/edit/home?cardId=created-card')
  })

  it('waits until the AI wizard closes before autosaving its complete draft', async () => {
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })
    setAiCardAgentOpen(true)

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'AI Card Owner')
      rendered!.api.updateData('personal.dob', '1990-07-18')
      rendered!.api.updateData('personal.email', 'ai@example.com')
      rendered!.api.updateData('personal.phone', '+1 202 555 0101')
      rendered!.api.updateData('slug', 'ai-card-owner')
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    expect(mocks.createProfile).not.toHaveBeenCalled()

    await act(async () => {
      setAiCardAgentOpen(false)
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
      await flushMicrotasks()
    })

    expect(mocks.createProfile).toHaveBeenCalledTimes(1)
    expect(mocks.routerPush).toHaveBeenCalledWith('/vcards/edit/home?cardId=created-card')
  })

  it('uses one create request when Save is triggered twice concurrently', async () => {
    let releaseCreate: (() => void) | undefined
    const createResult = new Promise<ApiProfile>((resolve) => {
      releaseCreate = () => resolve(makeCreatedProfile({ name: 'One Card', slug: 'one-card', isDraft: true }))
    })
    mocks.createProfileUnwrap.mockReturnValueOnce(createResult)
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'One Card')
      rendered!.api.updateData('personal.dob', '1990-07-18')
      rendered!.api.updateData('personal.email', 'owner@example.com')
      rendered!.api.updateData('personal.phone', '+1 202 555 0101')
      rendered!.api.updateData('slug', 'one-card')
    })

    let first!: Promise<string | void>
    let second!: Promise<string | void>
    await act(async () => {
      first = rendered!.api.saveVCard({ skipNavigate: true })
      second = rendered!.api.saveVCard({ skipNavigate: true })
      await flushMicrotasks()
    })

    expect(mocks.createProfile).toHaveBeenCalledTimes(1)

    await act(async () => {
      releaseCreate?.()
      await Promise.all([first, second])
    })

    expect(await first).toBe('created-card')
    expect(await second).toBe('created-card')
    expect(mocks.clearCreateCardOwner).toHaveBeenCalledTimes(1)
  })

  it('reuses the real profile id when a child save fails after creation', async () => {
    mocks.collectionMutationUnwrap.mockRejectedValueOnce(new Error('services unavailable'))
    mocks.updateProfileCardUnwrap.mockImplementation(({ body }) => Promise.resolve(makeCreatedProfile(body)))
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Recoverable Card')
      rendered!.api.updateData('personal.dob', '1990-07-18')
      rendered!.api.updateData('personal.email', 'owner@example.com')
      rendered!.api.updateData('personal.phone', '+1 202 555 0101')
      rendered!.api.updateData('slug', 'recoverable-card')
    })

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow('services unavailable')
    expect(mocks.createProfile).toHaveBeenCalledTimes(1)
    expect(mocks.clearCreateCardOwner).not.toHaveBeenCalled()

    await expect(rendered.api.saveVCard({ skipNavigate: true })).resolves.toBe('created-card')
    expect(mocks.createProfile).toHaveBeenCalledTimes(1)
    expect(mocks.updateProfileCard).toHaveBeenCalledWith({
      id: 'created-card',
      body: expect.objectContaining({ name: 'Recoverable Card', slug: 'recoverable-card' }),
    })
    expect(mocks.clearCreateCardOwner).toHaveBeenCalledTimes(1)
  })

  it('keeps About Me dirty and reports an error when its save fails', async () => {
    mocks.flushAboutMeUpsert.mockRejectedValueOnce(new Error('about save failed'))
    mocks.state = makeState(makeRecord('card-1', { personal: personal({ fullName: 'Ada' }) }))
    rendered = await renderProvider({ mode: 'edit', cardId: 'card-1' })

    await act(async () => {
      rendered!.api.markAboutMeDirty()
    })

    let saveError: unknown
    await act(async () => {
      try {
        await rendered!.api.flushSave()
      } catch (error) {
        saveError = error
      }
    })

    expect(saveError).toBeInstanceOf(Error)
    expect((saveError as Error).message).toBe('about save failed')
    expect(rendered.api.saveStatus).toBe('error')
    expect(rendered.api.saveError).toBe('about save failed')
  })

  it('requires a name and public slug before creating a draft', async () => {
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow(
      'Please enter your name before creating the vCard.'
    )

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Missing Slug')
    })

    expect(rendered.api.vCardData.slug).toBe('missing-slug')

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow(
      'Please enter an email before creating the vCard.'
    )

    await act(async () => {
      rendered!.api.updateData('slug', 'missing-email')
    })

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow(
      'Please enter an email before creating the vCard.'
    )

    await act(async () => {
      rendered!.api.updateData('personal.email', 'owner@example.com')
    })

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow(
      'Please enter a phone number before creating the vCard.'
    )

    await act(async () => {
      rendered!.api.updateData('personal.phone', '+1 202 555 0101')
    })

    await expect(rendered.api.saveVCard({ skipNavigate: true })).rejects.toThrow(
      'Please enter a date of birth before creating the vCard.'
    )
    expect(mocks.createProfile).not.toHaveBeenCalled()
  })

  it('autofills an empty slug from the personal name and does not overwrite a filled slug', async () => {
    mocks.state = makeState(null)
    rendered = await renderProvider({ mode: 'create', cardId: null })

    await act(async () => {
      rendered!.api.updateData('personal.fullName', 'Ada Lovelace')
    })
    expect(rendered.api.vCardData.slug).toBe('ada-lovelace')

    await act(async () => {
      rendered!.api.updateData('slug', 'custom-url')
      rendered!.api.updateData('personal.fullName', 'Ada Byron')
    })
    expect(rendered.api.vCardData.slug).toBe('custom-url')
    expect(rendered.api.vCardData.personal.fullName).toBe('Ada Byron')
  })
})
