'use client'

import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'
import { buildCardThemeStyleSheet } from '@/lib/theme/cardThemeCssVars'
import { logCardThemeSettings } from '@/lib/theme/logCardThemeSettings'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

function readDocumentThemeMode(fallback: ThemeMode): ThemeMode {
  if (typeof document === 'undefined') return fallback
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribeToDocumentTheme(onStoreChange: () => void) {
  const root = document.documentElement
  const observer = new MutationObserver(onStoreChange)
  observer.observe(root, { attributes: true, attributeFilter: ['class'] })
  window.addEventListener('storage', onStoreChange)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onStoreChange)
  }
}

/**
 * Injects dynamic theme CSS variables (primary/secondary/accent, light+dark,
 * button & social styles) scoped to `.vbiz-profile-root`.
 *
 * Follows the live light/dark toggle on `<html class="dark">` so API colors
 * for each mode are applied as the user switches themes.
 * Template defaults are already merged into `config` before this renders.
 */
export function CardThemeStyles({
  config,
  mode: modeProp,
  fromApi,
  template,
}: {
  config?: CardThemeConfig | null
  /** Initial / controlled mode. Live document class wins when present. */
  mode?: ThemeMode
  /** When false, theme is template defaults (not settings API). */
  fromApi?: boolean
  template?: string
}) {
  const fallback = modeProp ?? config?.colors.defaultMode ?? 'dark'
  const mode = useSyncExternalStore(
    subscribeToDocumentTheme,
    () => readDocumentThemeMode(fallback),
    () => fallback
  )

  const css = useMemo(() => (config ? buildCardThemeStyleSheet(config, mode) : ''), [config, mode])

  const themeFingerprint = useMemo(() => {
    if (!config) return 'none'
    const b = config.components.button
    const s = config.components.socialIcon
    return [
      config.version,
      config.colors.defaultMode,
      config.appearance.cornerStyle,
      config.appearance.buttonStyle,
      b.primary.style,
      b.secondary.style,
      b.accent.style,
      s.style,
      s.cornerRadius,
    ].join('|')
  }, [config])

  useEffect(() => {
    if (!config) return
    logCardThemeSettings(config, { source: 'CardThemeStyles', mode, fromApi, template })
  }, [config, mode, fromApi, template, themeFingerprint])

  if (!css) return null
  return (
    <style key={themeFingerprint} data-vbiz-card-theme="" data-mode={mode} dangerouslySetInnerHTML={{ __html: css }} />
  )
}
