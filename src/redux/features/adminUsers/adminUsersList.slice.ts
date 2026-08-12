import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminUserAccountStatus, AdminUserRow } from './adminUsers.api'

export type AdminUsersListRoleFilter = 'All' | 'vcard-owner' | 'corporate-owner'
export type AdminUsersListStatusFilter = 'All' | AdminUserAccountStatus

export type AdminUsersListState = {
  searchQuery: string
  debouncedQ: string
  roleFilter: AdminUsersListRoleFilter
  statusFilter: AdminUsersListStatusFilter
  skip: number
  users: AdminUserRow[]
  total: number
}

const initialState: AdminUsersListState = {
  searchQuery: '',
  debouncedQ: '',
  roleFilter: 'All',
  statusFilter: 'All',
  skip: 0,
  users: [],
  total: 0,
}

const adminUsersListSlice = createSlice({
  name: 'adminUsersList',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    setDebouncedQ(state, action: PayloadAction<string>) {
      state.debouncedQ = action.payload
    },
    setRoleFilter(state, action: PayloadAction<AdminUsersListRoleFilter>) {
      state.roleFilter = action.payload
    },
    setStatusFilter(state, action: PayloadAction<AdminUsersListStatusFilter>) {
      state.statusFilter = action.payload
    },
    setSkip(state, action: PayloadAction<number>) {
      state.skip = action.payload
    },
    setTotal(state, action: PayloadAction<number>) {
      state.total = action.payload
    },
    replaceUsers(state, action: PayloadAction<AdminUserRow[]>) {
      state.users = action.payload
    },
    appendUsers(state, action: PayloadAction<AdminUserRow[]>) {
      const seen = new Set(state.users.map((u) => u.id))
      const next = action.payload.filter((u) => !seen.has(u.id))
      if (next.length) state.users.push(...next)
    },
    resetListToStart(state) {
      state.skip = 0
      state.users = []
      state.total = 0
    },
    resetFilters(state) {
      state.searchQuery = ''
      state.debouncedQ = ''
      state.roleFilter = 'All'
      state.statusFilter = 'All'
      state.skip = 0
      state.users = []
      state.total = 0
    },
  },
})

export const {
  setSearchQuery,
  setDebouncedQ,
  setRoleFilter,
  setStatusFilter,
  setSkip,
  setTotal,
  replaceUsers,
  appendUsers,
  resetListToStart,
  resetFilters,
} = adminUsersListSlice.actions

export default adminUsersListSlice.reducer
