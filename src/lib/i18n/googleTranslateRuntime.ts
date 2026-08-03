import { I18N_CONFIG, LANG_CODE_MAP, type TranslationConfig } from '@/lib/i18n/config'
import { injectTranslateStyles } from '@/lib/i18n/translateDomStyles'

let translateReadyPromise: Promise<boolean> | null = null
let pendingLangAfterInit: string | null = null

function googleLangCode(langCode: string): string {
  return LANG_CODE_MAP[langCode] || langCode
}

export function waitForGoogleTranslateCombo(timeoutMs = 2500): Promise<HTMLSelectElement | null> {
  if (typeof document === 'undefined') return Promise.resolve(null)

  const existing = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
      if (!combo) return
      observer.disconnect()
      resolve(combo)
    })

    observer.observe(document.body, { childList: true, subtree: true })
    window.setTimeout(() => {
      observer.disconnect()
      resolve(document.querySelector('.goog-te-combo') as HTMLSelectElement | null)
    }, timeoutMs)
  })
}

export async function triggerGoogleTranslate(
  langCode: string,
  fallback: string = I18N_CONFIG.fallback
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const combo = await waitForGoogleTranslateCombo()
  if (!combo) return false

  const target = langCode === fallback ? '' : googleLangCode(langCode)
  if (combo.value === target) {
    document.body.classList.remove('vbiz-translate-switching')
    return true
  }

  combo.value = target
  combo.dispatchEvent(new Event('change'))
  document.body.classList.remove('vbiz-translate-switching')
  window.dispatchEvent(new Event(I18N_CONFIG.languageChangeEvent))
  return true
}

function ensureTranslateElementHost() {
  if (document.getElementById(I18N_CONFIG.googleTranslateElementId)) return
  const host = document.createElement('div')
  host.id = I18N_CONFIG.googleTranslateElementId
  // Off-screen (not display:none) so Google still renders the .goog-te-combo.
  host.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;'
  host.setAttribute('aria-hidden', 'true')
  document.body.appendChild(host)
}

function mountGoogleWidget(config: TranslationConfig) {
  ensureTranslateElementHost()
  injectTranslateStyles()

  const host = document.getElementById(I18N_CONFIG.googleTranslateElementId)
  if (host) host.innerHTML = ''

  const fallback = config.fallback || I18N_CONFIG.fallback
  const includedLangs = config.languages.map((l) => l.code).join(',')

  new (
    window.google as {
      translate: { TranslateElement: new (...args: unknown[]) => unknown; InlineLayout: { SIMPLE: unknown } }
    }
  ).translate.TranslateElement(
    {
      pageLanguage: fallback,
      includedLanguages: includedLangs,
      layout: (window.google as { translate: { TranslateElement: { InlineLayout: { SIMPLE: unknown } } } }).translate
        .TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
    },
    I18N_CONFIG.googleTranslateElementId
  )
}

export function ensureGoogleTranslateLoaded(config: TranslationConfig, langCode?: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)

  if (langCode) {
    pendingLangAfterInit = langCode
  }

  const existingCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
  if (existingCombo) {
    translateReadyPromise = Promise.resolve(true)
    if (langCode) {
      void triggerGoogleTranslate(langCode, config.fallback || I18N_CONFIG.fallback)
    }
    return translateReadyPromise
  }

  if (translateReadyPromise) {
    return translateReadyPromise
  }

  translateReadyPromise = new Promise((resolve) => {
    const finish = async (ok: boolean) => {
      if (ok && pendingLangAfterInit) {
        await triggerGoogleTranslate(pendingLangAfterInit, config.fallback || I18N_CONFIG.fallback)
      }
      resolve(ok)
    }

    const runInit = async () => {
      try {
        mountGoogleWidget(config)
        const combo = await waitForGoogleTranslateCombo()
        await finish(Boolean(combo))
      } catch (error) {
        console.error('Google Translate init failed:', error)
        translateReadyPromise = null
        await finish(false)
      }
    }

    window.googleTranslateElementInit = () => {
      void runInit()
    }

    const existingScript = document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')
    if (existingScript) {
      if ((window as Window & { google?: { translate?: unknown } }).google?.translate) {
        void runInit()
        return
      }
      existingScript.addEventListener('load', () => void runInit(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = config.scriptUrl.includes('?')
      ? `${config.scriptUrl}&cb=googleTranslateElementInit`
      : `${config.scriptUrl}?cb=googleTranslateElementInit`
    script.onerror = () => {
      console.error('Failed to load Google Translate script')
      translateReadyPromise = null
      void finish(false)
    }
    document.head.appendChild(script)
  })

  return translateReadyPromise
}

export function resetGoogleTranslateRuntime() {
  translateReadyPromise = null
  pendingLangAfterInit = null
}
