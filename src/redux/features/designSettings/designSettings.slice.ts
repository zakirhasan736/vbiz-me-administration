import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type DashboardAccentId = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'

/** Profile shell: v1 = classic geometric, v2 = link-in-bio (default). */
export type ProfileTemplateId = 'v1' | 'v2'

export type DesignSettingsState = {
  vcardPrimaryColor: string
  vcardAccentColor: string
  dashboardAccent: DashboardAccentId
  fontFamily: string
  profileTemplate: ProfileTemplateId
  layoutStyle: string
  buttonStyle: string
  cornerStyle: string
}

const initialState: DesignSettingsState = {
  vcardPrimaryColor: '#6366f1',
  vcardAccentColor: '#f43f5e',
  dashboardAccent: 'indigo',
  fontFamily: 'inter',
  profileTemplate: 'v2',
  layoutStyle: 'classic',
  buttonStyle: 'solid',
  cornerStyle: 'round',
}

const designSettingsSlice = createSlice({
  name: 'designSettings',
  initialState,
  reducers: {
    setVcardBranding(state, action: PayloadAction<{ primary?: string; accent?: string }>) {
      if (action.payload.primary !== undefined) {
        state.vcardPrimaryColor = action.payload.primary
      }
      if (action.payload.accent !== undefined) {
        state.vcardAccentColor = action.payload.accent
      }
    },
    setDashboardAccent(state, action: PayloadAction<DashboardAccentId>) {
      state.dashboardAccent = action.payload
    },
    setFontFamily(state, action: PayloadAction<string>) {
      state.fontFamily = action.payload
    },
    setProfileTemplate(state, action: PayloadAction<ProfileTemplateId>) {
      state.profileTemplate = action.payload
      if (action.payload === 'v1' && state.layoutStyle === 'hero') {
        state.layoutStyle = 'classic'
      }
    },
    setLayoutStyle(state, action: PayloadAction<string>) {
      state.layoutStyle = action.payload
    },
    setButtonStyle(state, action: PayloadAction<string>) {
      state.buttonStyle = action.payload
    },
    setCornerStyle(state, action: PayloadAction<string>) {
      state.cornerStyle = action.payload
    },
    hydrateDesignSettings(_state, action: PayloadAction<Partial<DesignSettingsState>>) {
      return { ...initialState, ...action.payload }
    },
  },
})

export const {
  setVcardBranding,
  setDashboardAccent,
  setFontFamily,
  setProfileTemplate,
  setLayoutStyle,
  setButtonStyle,
  setCornerStyle,
} = designSettingsSlice.actions

export default designSettingsSlice.reducer
