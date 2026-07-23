import { DEFAULT_DEMO_FAQS } from '@/lib/vcardFaq'
import { createDefaultVCardData, type VCardData, type VCardRecord } from '@/types/vcard'
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type VCardsState = {
  byId: Record<string, VCardRecord>
  ids: string[]
  slugToId: Record<string, string>
}

const initialState: VCardsState = {
  byId: {},
  ids: [],
  slugToId: {},
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function reindexSlugs(state: VCardsState) {
  const next: Record<string, string> = {}
  for (const id of state.ids) {
    const slug = state.byId[id]?.slug?.trim()
    if (slug) next[slug] = id
  }
  state.slugToId = next
}

const vcardsSlice = createSlice({
  name: 'vcards',
  initialState,
  reducers: {
    addVCard(
      state,
      action: PayloadAction<
        | {
            id?: string
            seed?: Partial<VCardData>
            branding?: { primaryColor: string; accentColor: string; fontFamily?: string }
          }
        | undefined
      >
    ) {
      const id = action.payload?.id ?? newId()
      const now = new Date().toISOString()
      const branding = action.payload?.branding
      const data = createDefaultVCardData({
        ...action.payload?.seed,
        slug: action.payload?.seed?.slug?.trim() || `card-${id.slice(0, 8)}`,
        theme: {
          ...createDefaultVCardData().theme,
          ...(action.payload?.seed?.theme || {}),
          ...(branding
            ? {
                primaryColor: branding.primaryColor,
                accentColor: branding.accentColor,
                ...(branding.fontFamily ? { fontFamily: branding.fontFamily } : {}),
              }
            : {}),
        },
      })
      const record: VCardRecord = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        views: 0,
        saves: 0,
        avatarImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        isActive: true,
      }
      state.byId[id] = record
      state.ids.unshift(id)
      reindexSlugs(state)
    },
    updateVCard(state, action: PayloadAction<{ id: string; patch: Partial<VCardRecord> }>) {
      const cur = state.byId[action.payload.id]
      if (!cur) return
      const next = {
        ...cur,
        ...action.payload.patch,
        updatedAt: new Date().toISOString(),
      } as VCardRecord
      state.byId[action.payload.id] = next
      reindexSlugs(state)
    },
    replaceVCardData(state, action: PayloadAction<{ id: string; data: VCardData }>) {
      const cur = state.byId[action.payload.id]
      if (!cur) return
      state.byId[action.payload.id] = {
        ...cur,
        ...action.payload.data,
        id: cur.id,
        createdAt: cur.createdAt,
        updatedAt: new Date().toISOString(),
        views: cur.views,
        saves: cur.saves,
        avatarImageUrl: cur.avatarImageUrl,
        isActive: cur.isActive,
      }
      reindexSlugs(state)
    },
    removeVCard(state, action: PayloadAction<string>) {
      const id = action.payload
      delete state.byId[id]
      state.ids = state.ids.filter((x) => x !== id)
      reindexSlugs(state)
    },
    seedDemoIfEmpty(state) {
      if (state.ids.length > 0) return
      const id = newId()
      const now = new Date().toISOString()
      const data = createDefaultVCardData({
        slug: 'zakir',
        personal: {
          ...createDefaultVCardData().personal,
          fullName: 'Zakir Hosen',
          designation: 'FrontEnd Developer',
        },
        services: [
          {
            id: 'svc_demo_1',
            type: 'Web Development',
            title: 'Custom Web Apps',
            description: 'Full-stack builds from landing pages to dashboards, tailored to your brand.',
            url: '',
            featuredImage: '',
            active: true,
          },
          {
            id: 'svc_demo_2',
            type: 'App Design',
            title: 'UI/UX Design',
            description: 'Mobile-first interfaces with polished motion and accessible layouts.',
            url: '',
            featuredImage: '',
            active: true,
          },
        ],
        faqs: DEFAULT_DEMO_FAQS,
        generalPosts: [
          {
            id: 'post_demo_1',
            category: 'News',
            title: 'Impressions That Last — Connections That Matter',
            description:
              'Explore actionable insights into building a magnetic digital presence and turning passive networking into active business relationships.',
            customUrl: '',
            featuredImage: 'https://images.unsplash.com/photo-1555529733-0e67056058e1?q=80&w=1200&fit=crop',
            date: '2026-09-22',
            active: true,
          },
          {
            id: 'post_demo_2',
            category: 'Announcement',
            title: 'New vBiz profile features',
            description: 'Share updates, articles, and announcements directly from your vCard back office Blog tab.',
            customUrl: '',
            featuredImage: '',
            date: '2026-05-01',
            active: true,
          },
        ],
      })
      state.byId[id] = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        views: 1200,
        saves: 342,
        avatarImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        isActive: true,
      }
      state.ids = [id]
      reindexSlugs(state)
    },
  },
})

export const { addVCard, updateVCard, replaceVCardData, removeVCard, seedDemoIfEmpty } = vcardsSlice.actions

export default vcardsSlice.reducer

export function selectVCardById(state: { vcards: VCardsState }, id: string | null) {
  if (!id) return null
  return state.vcards.byId[id] ?? null
}

export function selectVCardIdBySlug(state: { vcards: VCardsState }, slug: string) {
  return state.vcards.slugToId[slug] ?? null
}

const selectVCardIds = (state: { vcards: VCardsState }) => state.vcards.ids
const selectVCardByIdMap = (state: { vcards: VCardsState }) => state.vcards.byId

export const selectVCardList = createSelector([selectVCardIds, selectVCardByIdMap], (ids, byId) =>
  ids.map((id) => byId[id]).filter((card): card is VCardRecord => Boolean(card))
)
