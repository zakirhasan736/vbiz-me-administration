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
      return { ...state, ...action.payload }
    },
  },
})

export const { setUser, logout, updateUser, updateAuthState } = userSlice.actions
export default userSlice.reducer
