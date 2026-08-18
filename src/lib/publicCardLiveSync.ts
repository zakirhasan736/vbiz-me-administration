'use client'

import { useSyncExternalStore } from 'react'

export const PUBLIC_CARD_LIVE_CHANNEL = 'vbiz-public-card-settings'
export const PUBLIC_CARD_LIVE_STORAGE_KEY = 'vbiz_public_card_settings_rev'
/** How often an open public card re-reads settings/theme while the tab is visible. */
export const PUBLIC_CARD_LIVE_POLL_MS = 8000

export type PublicCardLiveEvent = {
  type: 'card-settings-saved'
  profileId?: string
  slug?: string
  at: number
}

/** Tell open public-card tabs (and the service worker) that Card Settings just saved. */
export function broadcastPublicCardSettingsSaved(payload: { profileId?: string; slug?: string }) {
  const event: PublicCardLiveEvent = {
    type: 'card-settings-saved',
    at: Date.now(),
    ...payload,
  }

  try {
    const channel = new BroadcastChannel(PUBLIC_CARD_LIVE_CHANNEL)
    channel.postMessage(event)
    channel.close()
  } catch {
    /* BroadcastChannel unavailable */
  }

  try {
    localStorage.setItem(PUBLIC_CARD_LIVE_STORAGE_KEY, JSON.stringify(event))
  } catch {
    /* private mode / quota */
  }

  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'BUST_PUBLIC_CARD_CACHE' })
  } catch {
    /* no SW */
  }
}

export function subscribePublicCardSettingsSaved(onEvent: (event: PublicCardLiveEvent) => void): () => void {
  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(PUBLIC_CARD_LIVE_CHANNEL)
    channel.onmessage = (message) => {
      const data = message.data as PublicCardLiveEvent | undefined
      if (data?.type === 'card-settings-saved') onEvent(data)
    }
  } catch {
    channel = null
  }

  const onStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== PUBLIC_CARD_LIVE_STORAGE_KEY || !storageEvent.newValue) return
    try {
      const parsed = JSON.parse(storageEvent.newValue) as PublicCardLiveEvent
      if (parsed?.type === 'card-settings-saved') onEvent(parsed)
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('storage', onStorage)
  return () => {
    channel?.close()
    window.removeEventListener('storage', onStorage)
  }
}

function subscribeDocumentVisible(onStoreChange: () => void) {
  document.addEventListener('visibilitychange', onStoreChange)
  window.addEventListener('focus', onStoreChange)
  return () => {
    document.removeEventListener('visibilitychange', onStoreChange)
    window.removeEventListener('focus', onStoreChange)
  }
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    subscribeDocumentVisible,
    () => document.visibilityState !== 'hidden',
    () => true
  )
}
