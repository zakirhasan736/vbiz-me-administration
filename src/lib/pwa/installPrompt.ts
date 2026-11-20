import { isStandaloneDisplay } from '@/lib/pwa/pwaInstallEnv'

type DeferredInstallPrompt = {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type VbizPwaWindow = Window & {
  __vbizPwa?: { prompt: DeferredInstallPrompt | null; installed: boolean; available: boolean }
}

/** Event fired by PwaInstallBootstrap when the browser offers an install prompt. */
export const PWA_PROMPT_EVENT = 'vbiz-pwa-prompt'

/**
 * True when this browser can install vBiz Me with one tap (Android Chrome, desktop
 * Chrome / Edge). iPhone never offers this — it uses Share → Add to Home Screen.
 */
export function canPromptInstall(): boolean {
  if (typeof window === 'undefined' || isStandaloneDisplay()) return false
  return Boolean((window as VbizPwaWindow).__vbizPwa?.prompt)
}

/** Show the browser's install dialog. Resolves true when the user installed. */
export async function promptInstall(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const state = (window as VbizPwaWindow).__vbizPwa
  const deferred = state?.prompt
  if (!deferred) return false
  try {
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (state) state.prompt = null // a deferred prompt can only be used once
    window.dispatchEvent(new Event(PWA_PROMPT_EVENT))
    return choice.outcome === 'accepted'
  } catch {
    return false
  }
}

/** useSyncExternalStore subscriber: re-check when an install prompt appears or is used. */
export function subscribeInstallPrompt(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PWA_PROMPT_EVENT, onChange)
  window.addEventListener('appinstalled', onChange)
  return () => {
    window.removeEventListener(PWA_PROMPT_EVENT, onChange)
    window.removeEventListener('appinstalled', onChange)
  }
}

/** Where alerts on this device are delivered from, for a short status line. */
export function deviceAppMode(): 'home_screen_app' | 'browser' {
  return isStandaloneDisplay() ? 'home_screen_app' : 'browser'
}
