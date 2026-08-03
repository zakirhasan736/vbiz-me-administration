/** Shared Google Translate DOM styles (no imports from translation runtime). */
export function injectTranslateStyles() {
  if (typeof document === 'undefined') return
  const styleId = 'google-translate-custom-styles'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    #google_translate_element {
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      opacity: 0 !important;
    }
    .goog-te-banner-frame,
    .goog-te-banner,
    .goog-te-balloon-frame,
    .goog-te-gadget,
    .goog-te-gadget-simple,
    .skiptranslate {
      display: none !important;
    }
    body {
      top: 0 !important;
    }
    font[style*="background-color"] {
      background-color: transparent !important;
      box-shadow: none !important;
    }
    .vbiz-translate-switching {
      cursor: wait !important;
    }
    .vbiz-translate-switching * {
      pointer-events: none !important;
    }
  `
  document.head.appendChild(style)
}
