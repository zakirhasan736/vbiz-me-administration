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
      if (state.byId[id]) {
        const cur = state.byId[id]
        state.byId[id] = {
          ...cur,
          ...createDefaultVCardData({
            ...action.payload?.seed,
            theme: { ...cur.theme, ...(action.payload?.seed?.theme || {}) },
            appearance: action.payload?.seed?.appearance || cur.appearance,
            personal: { ...cur.personal, ...(action.payload?.seed?.personal || {}) },
          }),
          id: cur.id,
          createdAt: cur.createdAt,
          updatedAt: new Date().toISOString(),
          views: cur.views,
          saves: cur.saves,
          avatarImageUrl: cur.avatarImageUrl,
          backgroundImageUrl: cur.backgroundImageUrl || '',
          isActive: cur.isActive,
        }
        reindexSlugs(state)
        return
      }
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
        backgroundImageUrl: '',
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
        backgroundImageUrl: cur.backgroundImageUrl || '',
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
    replaceAllVCards(state, action: PayloadAction<VCardRecord[]>) {
      state.byId = {}
      state.ids = []
      for (const card of action.payload) {
        state.byId[card.id] = card
        state.ids.push(card.id)
      }
      reindexSlugs(state)
    },
  },
})

export const { addVCard, updateVCard, replaceVCardData, removeVCard, replaceAllVCards } = vcardsSlice.actions

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
