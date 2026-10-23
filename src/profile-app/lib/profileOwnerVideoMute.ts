/**
 * Shared mute preference for home "owner" profile videos.
 * Phone + desktop layouts both mount a player; one shared override keeps mute in sync
 * and prevents double/echo audio when both are unmuted after intro.
 */

let muteOverride: boolean | null = null
const listeners = new Set<() => void>()

export function subscribeOwnerVideoMute(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getOwnerVideoMuteOverride(): boolean | null {
  return muteOverride
}

/** `true` = force muted, `false` = force unmuted, `null` = follow intro unlock. */
export function setOwnerVideoMuteOverride(value: boolean | null) {
  if (muteOverride === value) return
  muteOverride = value
  listeners.forEach((listener) => listener())
}

export function resetOwnerVideoMuteOverride() {
  setOwnerVideoMuteOverride(null)
}
