import { mapMyCardToVCardRecord } from '@/lib/api/myCard/mapMyCard'
import { myCardApi } from '@/redux/api/myCardApi'
import type { VCardRecord } from '@/types/vcard'
import type { MyCardData } from '@interfaces/api/myCard'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type MyCardCacheEntry = {
  slug: string
  raw: MyCardData
  record: VCardRecord
  updatedAt: string
}

export type MyCardState = {
  activeSlug: string | null
  bySlug: Record<string, MyCardCacheEntry>
}

const initialState: MyCardState = {
  activeSlug: null,
  bySlug: {},
}

function cacheEntry(slug: string, raw: MyCardData): MyCardCacheEntry {
  return {
    slug,
    raw,
    record: mapMyCardToVCardRecord(raw),
    updatedAt: new Date().toISOString(),
  }
}

const myCardSlice = createSlice({
  name: 'myCard',
  initialState,
  reducers: {
    setActiveProfileSlug(state, action: { payload: string }) {
      const slug = action.payload.trim()
      if (!slug) return
      state.activeSlug = slug
    },
    clearMyCardCache(state) {
      state.activeSlug = null
      state.bySlug = {}
    },
    /** Hydrate from server-prefetched payload without a network round-trip. */
    hydrateMyCard(state, action: PayloadAction<{ slug: string; raw: MyCardData }>) {
      const slug = action.payload.slug.trim()
      if (!slug) return
      state.activeSlug = slug
      state.bySlug[slug] = cacheEntry(slug, action.payload.raw)
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(myCardApi.endpoints.getMyCardBySlug.matchFulfilled, (state, action) => {
      const slug = action.meta.arg.originalArgs.trim()
      if (!slug) return
      state.activeSlug = slug
      state.bySlug[slug] = cacheEntry(slug, action.payload)
    })
  },
})

export const { setActiveProfileSlug, clearMyCardCache, hydrateMyCard } = myCardSlice.actions
export default myCardSlice.reducer
