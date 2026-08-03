import { I18N_CONFIG, LANG_CODE_MAP, selectedLanguageStorageKey } from '@/lib/i18n/config'

export function googleTranslateCookieValueKey(cardId: string) {
  return `googtrans_value_${cardId}`
}

export function buildGoogleTransCookieValue(langCode: string, fallback: string = I18N_CONFIG.fallback): string {
  const googleLangCode = LANG_CODE_MAP[langCode] || langCode
  return `/${fallback}/${googleLangCode}`
}

export function readPersistedLanguage(cardId: string, fallback: string = I18N_CONFIG.fallback): string {
  if (typeof window === 'undefined') return fallback
  try {
    return localStorage.getItem(selectedLanguageStorageKey(cardId)) || fallback
  } catch {
    return fallback
  }
}

export function readPersistedGoogleTransValue(cardId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(googleTranslateCookieValueKey(cardId))
  } catch {
    return null
  }
}

/** Persist language + exact googtrans cookie value for instant restore on next visit. */
export function persistLanguageChoice(
  cardId: string,
  langCode: string,
  fallback: string = I18N_CONFIG.fallback
): string | null {
  const storageKey = selectedLanguageStorageKey(cardId)
  const cookieValueKey = googleTranslateCookieValueKey(cardId)

  localStorage.setItem(storageKey, langCode)

  let cookieValue: string | null = null
  if (langCode === fallback) {
    localStorage.removeItem(cookieValueKey)
  } else {
    cookieValue = buildGoogleTransCookieValue(langCode, fallback)
    localStorage.setItem(cookieValueKey, cookieValue)
  }

  // Mirror under URL slug so the pre-React bootstrap can restore before card scope is set.
  if (typeof window !== 'undefined') {
    const pathMatch = window.location.pathname.match(/^\/([^/]+)/)
    const slug = pathMatch?.[1]
    if (slug && slug !== cardId) {
      localStorage.setItem(selectedLanguageStorageKey(slug), langCode)
      if (cookieValue) {
        localStorage.setItem(googleTranslateCookieValueKey(slug), cookieValue)
      } else {
        localStorage.removeItem(googleTranslateCookieValueKey(slug))
      }
    }
  }

  return cookieValue
}

function cookieSecurityFlags(): string {
  if (typeof window === 'undefined') return ';SameSite=Lax'
  const isSecure = window.location.protocol === 'https:'
  return isSecure ? ';SameSite=None;Secure' : ';SameSite=Lax'
}

function cookieExpiry(): string {
  return ';expires=Fri, 31 Dec 9999 23:59:59 GMT'
}

export function clearGoogleTransCookies() {
  if (typeof window === 'undefined') return

  const host = window.location.hostname
  const root = host.includes('.') ? host.substring(host.indexOf('.') + 1) : host
  const domains = [host, `.${host}`, root, `.${root}`]
  const secureFlag = cookieSecurityFlags()

  domains.forEach((dom) => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${dom}${secureFlag}`
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${secureFlag}`
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
  })
}

export function setGoogleTransCookie(cookieValue: string) {
  if (typeof window === 'undefined') return

  const host = window.location.hostname
  const flags = `${cookieSecurityFlags()}${cookieExpiry()}`

  document.cookie = `googtrans=${cookieValue}; path=/; domain=${host}${flags}`
  document.cookie = `googtrans=${cookieValue}; path=/${flags}`
}

export function reloadForTranslation() {
  if (typeof window === 'undefined') return
  const cleanUrl = window.location.origin + window.location.pathname + window.location.search
  window.location.href = cleanUrl
}

/** Runs before React — restores googtrans cookie and preloads Google Translate when needed. */
export const TRANSLATION_EARLY_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var FALLBACK = 'en';
    var GOOGLE_SCRIPT = 'https://translate.google.com/translate_a/element.js';
    function resolveCardId() {
      var match = location.pathname.match(/^\\/([^/]+)/);
      if (match && match[1] && match[1] !== 'api' && match[1] !== '_next') {
        return decodeURIComponent(match[1]);
      }
      var params = new URLSearchParams(location.search);
      return params.get('id') || params.get('card') || params.get('cardId') || '';
    }
    function cookieFlags() {
      var secure = location.protocol === 'https:' ? ';SameSite=None;Secure' : ';SameSite=Lax';
      return ';path=/' + secure + ';expires=Fri, 31 Dec 9999 23:59:59 GMT';
    }
    var cardId = resolveCardId();
    if (!cardId) return;
    var googKey = 'googtrans_value_' + cardId;
    var langKey = 'selectedLanguage_' + cardId;
    var googValue = localStorage.getItem(googKey);
    var lang = localStorage.getItem(langKey) || FALLBACK;
    var LANG_MAP = {en:'en',es:'es',fr:'fr',de:'de',it:'it',pt:'pt',ru:'ru',ja:'ja',ko:'ko','zh-CN':'zh-CN',ar:'ar',hi:'hi',ur:'ur',pl:'pl',vi:'vi'};
    if (!googValue && lang && lang !== FALLBACK) {
      var googleLang = LANG_MAP[lang] || lang;
      googValue = '/' + FALLBACK + '/' + googleLang;
    }
    if (!googValue || googValue === '/' + FALLBACK + '/' + FALLBACK) return;

    document.cookie = 'googtrans=' + googValue + cookieFlags();

    if (!document.querySelector('link[rel="preconnect"][href="https://translate.google.com"]')) {
      var preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://translate.google.com';
      document.head.appendChild(preconnect);
    }

    if (!document.getElementById('google_translate_element')) {
      var host = document.createElement('div');
      host.id = 'google_translate_element';
      host.style.cssText = 'position:absolute;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
      document.documentElement.appendChild(host);
    }

    window.googleTranslateElementInit = function () {
      try {
        if (!window.google || !window.google.translate) return;
        new window.google.translate.TranslateElement({
          pageLanguage: FALLBACK,
          autoDisplay: false
        }, 'google_translate_element');
      } catch (e) {}
    };

    if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
      var script = document.createElement('script');
      script.async = true;
      script.src = GOOGLE_SCRIPT + '?cb=googleTranslateElementInit';
      (document.head || document.documentElement).appendChild(script);
    }
  } catch (e) {}
})();
`.trim()
