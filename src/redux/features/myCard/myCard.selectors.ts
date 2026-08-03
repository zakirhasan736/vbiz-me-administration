import type { RootState } from '@/redux/store'
import type { VCardRecord } from '@/types/vcard'
import type { MyCardData } from '@interfaces/api/myCard'
import { createSelector } from '@reduxjs/toolkit'
import type { MyCardCacheEntry } from './myCard.slice'

const selectMyCardState = (state: RootState) => state.myCard

export const selectActiveProfileSlug = createSelector([selectMyCardState], (myCard) => myCard.activeSlug)

export const selectMyCardBySlug = createSelector(
  [selectMyCardState, (_state: RootState, slug: string) => slug.trim()],
  (myCard, slug): MyCardCacheEntry | null => {
    if (!slug) return null
    return myCard.bySlug[slug] ?? null
  }
)

export const selectMyCardRawBySlug = createSelector(
  [selectMyCardBySlug],
  (entry): MyCardData | null => entry?.raw ?? null
)

export const selectMyCardRecordBySlug = createSelector(
  [selectMyCardBySlug],
  (entry): VCardRecord | null => entry?.record ?? null
)

export const selectProfileMediaBySlug = createSelector([selectMyCardRawBySlug], (raw) => {
  if (!raw) return null
  return {
    profile: raw.profile_media,
    intro: raw.intro_video,
    background: raw.background_media,
    audio: raw.background_audio,
  }
})

export const selectProfileFeaturesBySlug = createSelector([selectMyCardRawBySlug], (raw) => raw?.features ?? null)

export const selectProfileActionButtonsBySlug = createSelector(
  [selectMyCardRawBySlug],
  (raw) => raw?.action_buttons ?? null
)

export const selectProfileIdentityBySlug = createSelector([selectMyCardRawBySlug], (raw) => {
  if (!raw) return null
  const { profile } = raw
  return {
    id: profile.id,
    name: profile.name,
    slug: profile.slug,
    profession: profile.profession,
    company: profile.company_name,
    designation: profile.designation,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
  }
})
