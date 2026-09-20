'use client'

import {
  isAndroidDevice,
  isIosDevice,
  isSafariBrowser,
  isStandaloneDisplay,
  resolvePwaInstallSurface,
  type PwaInstallSurface,
} from '@/lib/pwa/pwaInstallEnv'
import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type VbizPwaBridge = {
  prompt: BeforeInstallPromptEvent | null
  installed: boolean
  available?: boolean
}

declare global {
  interface Window {
    __vbizPwa?: VbizPwaBridge
  }
}

function readStoredPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  return window.__vbizPwa?.prompt ?? null
}

function storePrompt(event: BeforeInstallPromptEvent | null) {
  if (typeof window === 'undefined') return
  window.__vbizPwa = window.__vbizPwa || { prompt: null, installed: false, available: false }
  window.__vbizPwa.prompt = event
  window.__vbizPwa.available = Boolean(event)
}

function capturePrompt(event: Event) {
  event.preventDefault()
  const promptEvent = event as BeforeInstallPromptEvent
  storePrompt(promptEvent)
  return promptEvent
}

async function ensurePublicCardServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const path = window.location.pathname
  if (!path.startsWith('/vCard/') && !path.startsWith('/v/')) return
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    await navigator.serviceWorker.ready
  } catch {
    /* install UI still works with manual browser steps */
  }
}

function waitForInstallPrompt(timeoutMs: number) {
  const existing = readStoredPrompt()
  if (existing) return Promise.resolve(existing)

  return new Promise<BeforeInstallPromptEvent | null>((resolve) => {
    let settled = false
    const finish = (value: BeforeInstallPromptEvent | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('vbiz-pwa-prompt', onCustom)
      resolve(value)
    }
    const onPrompt = (event: Event) => finish(capturePrompt(event))
    const onCustom = () => finish(readStoredPrompt())
    const timer = window.setTimeout(() => finish(readStoredPrompt()), timeoutMs)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('vbiz-pwa-prompt', onCustom)
  })
}

function listenStandaloneChange(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia('(display-mode: standalone)')
  const handler = () => onChange()
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }
  const legacy = media as MediaQueryList & {
    addListener?: (cb: () => void) => void
    removeListener?: (cb: () => void) => void
  }
  legacy.addListener?.(handler)
  return () => legacy.removeListener?.(handler)
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(readStoredPrompt)
  const [isInstalled, setIsInstalled] = useState(
    () => isStandaloneDisplay() || (typeof window !== 'undefined' && window.__vbizPwa?.installed === true)
  )
  const [isIos] = useState(() => isIosDevice())
  const [isAndroid] = useState(() => isAndroidDevice())
  const [isSafari] = useState(() => isSafariBrowser())
  const [surface] = useState<PwaInstallSurface>(() => resolvePwaInstallSurface())
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      setDeferredPrompt(capturePrompt(event))
    }

    const onStoredPrompt = () => {
      setDeferredPrompt(readStoredPrompt())
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      storePrompt(null)
      if (window.__vbizPwa) window.__vbizPwa.installed = true
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('vbiz-pwa-prompt', onStoredPrompt)
    window.addEventListener('appinstalled', onInstalled)
    const stopStandalone = listenStandaloneChange(() => {
      if (isStandaloneDisplay()) setIsInstalled(true)
    })
    void ensurePublicCardServiceWorker()
    const syncPrompt = window.setTimeout(() => {
      setDeferredPrompt(readStoredPrompt())
    }, 0)

    return () => {
      window.clearTimeout(syncPrompt)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('vbiz-pwa-prompt', onStoredPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      stopStandalone()
    }
  }, [])

  const canNativeInstall = Boolean(deferredPrompt || readStoredPrompt()) && !isInstalled && !isIos

  const promptInstall = useCallback(async () => {
    if (isIosDevice()) return { ok: false as const, reason: 'manual' as const }
    setInstalling(true)
    try {
      await ensurePublicCardServiceWorker()
      const event = deferredPrompt ?? readStoredPrompt() ?? (await waitForInstallPrompt(4000))
      if (!event?.prompt) return { ok: false as const, reason: 'unavailable' as const }
      setDeferredPrompt(event)
      await event.prompt()
      const choice = await event.userChoice
      setDeferredPrompt(null)
      storePrompt(null)
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        if (window.__vbizPwa) window.__vbizPwa.installed = true
        return { ok: true as const }
      }
      return { ok: false as const, reason: 'dismissed' as const }
    } catch {
      return { ok: false as const, reason: 'failed' as const }
    } finally {
      setInstalling(false)
    }
  }, [deferredPrompt])

  return {
    canNativeInstall,
    isInstalled,
    isIos,
    isAndroid,
    isSafari,
    surface,
    installing,
    promptInstall,
  }
}
