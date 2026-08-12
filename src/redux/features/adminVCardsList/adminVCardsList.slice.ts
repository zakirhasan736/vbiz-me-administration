import type { AdminProfileRow } from '@/redux/features/adminProfiles/adminProfiles.api'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type AdminVCardsListState = {
  searchQuery: string
  debouncedQ: string
  professionFilter: string
  statusFilter: string
  lifecycleTab: 'active' | 'draft'
  showAll: boolean
  accumulatedItems: AdminProfileRow[]
  listSyncKey: string
  total: number
}

const initialState: AdminVCardsListState = {
  searchQuery: '',
  debouncedQ: '',
  professionFilter: 'All',
  statusFilter: 'All',
  lifecycleTab: 'active',
  showAll: false,
  accumulatedItems: [],
  listSyncKey: '',
  total: 0,
}

function dedupeAppend(prev: AdminProfileRow[], next: AdminProfileRow[]): AdminProfileRow[] {
  const seen = new Set(prev.map((item) => item.id))
  const unique = next.filter((item) => !seen.has(item.id))
  return unique.length > 0 ? [...prev, ...unique] : prev
}

const adminVCardsListSlice = createSlice({
  name: 'adminVCardsList',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    setDebouncedQ(state, action: PayloadAction<string>) {
      state.debouncedQ = action.payload
    },
    setProfessionFilter(state, action: PayloadAction<string>) {
      state.professionFilter = action.payload
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload
    },
    setLifecycleTab(state, action: PayloadAction<'active' | 'draft'>) {
      state.lifecycleTab = action.payload
    },
    setShowAll(state, action: PayloadAction<boolean>) {
      state.showAll = action.payload
    },
    setListSnapshot(
      state,
      action: PayloadAction<{
        items: AdminProfileRow[]
        total: number
        listSyncKey: string
      }>
    ) {
      state.accumulatedItems = action.payload.items
      state.total = action.payload.total
      state.listSyncKey = action.payload.listSyncKey
    },
    replaceItems(state, action: PayloadAction<{ items: AdminProfileRow[]; total?: number; listSyncKey?: string }>) {
      state.accumulatedItems = action.payload.items
      if (typeof action.payload.total === 'number') state.total = action.payload.total
      if (typeof action.payload.listSyncKey === 'string') state.listSyncKey = action.payload.listSyncKey
    },
    appendItems(state, action: PayloadAction<AdminProfileRow[]>) {
      state.accumulatedItems = dedupeAppend(state.accumulatedItems, action.payload)
    },
    setTotal(state, action: PayloadAction<number>) {
      state.total = action.payload
    },
    clearFilters(state) {
      state.searchQuery = ''
      state.debouncedQ = ''
      state.professionFilter = 'All'
      state.statusFilter = 'All'
    },
    resetList() {
      return initialState
    },
  },
})

export const {
  setSearchQuery,
  setDebouncedQ,
  setProfessionFilter,
  setStatusFilter,
  setLifecycleTab,
  setShowAll,
  setListSnapshot,
  replaceItems,
  appendItems,
  setTotal,
  clearFilters,
  resetList,
} = adminVCardsListSlice.actions

export default adminVCardsListSlice.reducer
