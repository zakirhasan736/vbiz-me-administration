/** Sync bridge so home background video can unmute inside the intro unmute click gesture. */

export const HOME_MEDIA_SOUND_EVENT = 'vbiz-home-media-sound'

export type HomeMediaSoundDetail = { unlocked: boolean }

export function publishHomeMediaSoundPreference(unlocked: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<HomeMediaSoundDetail>(HOME_MEDIA_SOUND_EVENT, {
      detail: { unlocked },
    })
  )
}
