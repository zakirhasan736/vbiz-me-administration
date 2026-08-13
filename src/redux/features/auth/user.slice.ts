import { IUser } from '@/interfaces/user.interface'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

type TAuthState = {
  user: Partial<IUser> | null
  isLoading: boolean
  token: string | null
}
const initialState: TAuthState = {
  user: null,
  isLoading: true,
  token: null,
}
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<Partial<IUser> | null>) {
      state.user = action.payload
      state.isLoading = false
    },
    logout(state) {
      state.user = null
      state.isLoading = false
      state.token = null
    },
    updateUser(state, action: PayloadAction<Partial<IUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    updateAuthState(state, action: PayloadAction<Partial<TAuthState>>) {
      const next = action.payload
      if ('user' in next && next.user !== undefined) state.user = next.user
      if ('token' in next && next.token !== undefined) state.token = next.token
      if ('isLoading' in next && typeof next.isLoading === 'boolean') {
        state.isLoading = next.isLoading
      }
    },
  },
})

export const { setUser, logout, updateAuthState, updateUser } = userSlice.actions
export default userSlice.reducer
