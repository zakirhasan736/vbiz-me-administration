import { cleanupGoogleTranslateChrome } from '@/lib/i18n/googleTranslateRuntime'
import { afterEach, describe, expect, it } from 'vitest'

describe('cleanupGoogleTranslateChrome', () => {
  afterEach(() => {
    document.body.className = ''
    document.body.innerHTML = ''
  })

  it('removes Google chrome but keeps in-page translated text React owns', () => {
    document.body.classList.add('translated-ltr')
    document.body.innerHTML = `
      <p>Hello <font class="goog-text-highlight">world</font></p>
      <iframe class="goog-te-banner-frame skiptranslate"></iframe>
      <div id="goog-gt-tt"></div>
    `

    cleanupGoogleTranslateChrome()

    expect(document.body.classList.contains('translated-ltr')).toBe(false)
    expect(document.querySelector('.goog-te-banner-frame')).toBeNull()
    expect(document.getElementById('goog-gt-tt')).toBeNull()
    expect(document.querySelector('.goog-text-highlight')?.textContent).toBe('world')
  })
})
