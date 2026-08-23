'use client'

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

function isIosDevice() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOs
}

function isAndroidDevice() {
  if (typeof window === 'undefined') return false
  return /Android/i.test(window.navigator.userAgent)
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return media || iosStandalone
}

function readStoredPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') return null
  return window.__vbizPwa?.prompt ?? null
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(readStoredPrompt)
  const [isInstalled, setIsInstalled] = useState(
    () => isStandaloneDisplay() || (typeof window !== 'undefined' && window.__vbizPwa?.installed === true)
  )
  const [isIos] = useState(() => isIosDevice())
  const [isAndroid] = useState(() => isAndroidDevice())
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      if (window.__vbizPwa) {
        window.__vbizPwa.available = true
        window.__vbizPwa.prompt = event as BeforeInstallPromptEvent
      }
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canNativeInstall = Boolean(deferredPrompt) && !isInstalled

  const promptInstall = useCallback(async () => {
    const event = deferredPrompt ?? readStoredPrompt()
    if (!event) return { ok: false as const, reason: 'unavailable' as const }
    setInstalling(true)
    try {
      await event.prompt()
      const choice = await event.userChoice
      setDeferredPrompt(null)
      if (window.__vbizPwa) window.__vbizPwa.prompt = null
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
    installing,
    promptInstall,
  }
}
