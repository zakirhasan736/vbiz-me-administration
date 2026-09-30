'use client'

import { HoistableStyle } from '@/lib/dom/HoistableStyle'
import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'
import { buildCardThemeStyleSheet } from '@/lib/theme/cardThemeCssVars'
import { logCardThemeSettings } from '@/lib/theme/logCardThemeSettings'
import { resolveBannerStyle, resolveTopNavBarStyle } from '@/lib/theme/sectionStyleDefaults'
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

function subscribeNoop() {
  return () => {}
}

/** Live light/dark mode from `<html class="dark">` — re-renders when the visitor toggles theme. */
export function useDocumentThemeMode(fallback: ThemeMode = 'dark'): ThemeMode {
  return useSyncExternalStore(
    subscribeToDocumentTheme,
    () => readDocumentThemeMode(fallback),
    () => fallback
  )
}

/**
 * Injects dynamic theme CSS variables (primary/secondary/accent, light+dark,
 * button & social styles) scoped to `.vbiz-profile-root`.
 *
 * Follows the live light/dark toggle on `<html class="dark">` so API colors
 * for each mode are applied as the user switches themes.
 * When `forcedMode` is set (editor phone preview), that mode wins and the
 * document class is ignored.
 * Template defaults are already merged into `config` before this renders.
 */
export function CardThemeStyles({
  config,
  mode: modeProp,
  forcedMode,
  fromApi,
  template,
}: {
  config?: CardThemeConfig | null
  /** Initial / controlled mode. Live document class wins when present (unless forcedMode). */
  mode?: ThemeMode
  /** Editor live preview: use this mode instead of `<html class="dark">`. */
  forcedMode?: ThemeMode
  /** When false, theme is template defaults (not settings API). */
  fromApi?: boolean
  template?: string
}) {
  const fallback = modeProp ?? config?.colors.defaultMode ?? 'dark'
  const documentMode = useSyncExternalStore(
    forcedMode ? subscribeNoop : subscribeToDocumentTheme,
    () => (forcedMode ? forcedMode : readDocumentThemeMode(fallback)),
    () => forcedMode ?? fallback
  )
  const mode = forcedMode ?? documentMode

  const css = useMemo(() => (config ? buildCardThemeStyleSheet(config, mode) : ''), [config, mode])

  const themeFingerprint = useMemo(() => {
    if (!config) return 'none'
    const b = config.components.button
    const s = config.components.socialIcon
    return [
      config.version,
      config.colors.defaultMode,
      config.colors.light.primary,
      config.colors.light.secondary,
      config.colors.light.accent,
      config.colors.light.background,
      config.colors.light.surface,
      config.colors.light.text,
      config.colors.dark.primary,
      config.colors.dark.secondary,
      config.colors.dark.accent,
      config.colors.dark.background,
      config.colors.dark.surface,
      config.colors.dark.text,
      config.appearance.profileTemplate,
      config.appearance.layoutStyle,
      config.appearance.cornerStyle,
      config.appearance.buttonStyle,
      config.appearance.fontFamily,
      config.appearance.buttonShadow,
      b.primary.style,
      b.secondary.style,
      b.accent.style,
      s.style,
      s.cornerRadius,
      JSON.stringify(config.components.sectionBanner ?? null),
      JSON.stringify(config.components.contentCard ?? null),
      JSON.stringify(config.components.reviewCard ?? null),
      JSON.stringify(config.components.faqItem ?? null),
      JSON.stringify(config.components.topNavBar ?? null),
    ].join('|')
  }, [config])

  useEffect(() => {
    if (!config) return
    logCardThemeSettings(config, { source: 'CardThemeStyles', mode, fromApi, template })
  }, [config, mode, fromApi, template, themeFingerprint])

  // Drive banner + top-nav CSS variants via data attributes on profile roots.
  useEffect(() => {
    if (!config || typeof document === 'undefined') return
    const set = config.colors[mode] ?? config.colors.dark
    const banner = resolveBannerStyle(set, mode, config.components.sectionBanner)
    const topNav = resolveTopNavBarStyle(set, mode, config.components.topNavBar)
    const bannerVariant = banner.variant || 'gradient'
    const navVariant = topNav.variant || 'gradient'
    const roots = document.querySelectorAll('.vbiz-profile-root')
    roots.forEach((el) => {
      el.setAttribute('data-banner-variant', bannerVariant)
      el.setAttribute('data-nav-variant', navVariant)
    })
    return () => {
      roots.forEach((el) => {
        if (el.getAttribute('data-banner-variant') === bannerVariant) el.removeAttribute('data-banner-variant')
        if (el.getAttribute('data-nav-variant') === navVariant) el.removeAttribute('data-nav-variant')
      })
    }
  }, [config, mode])

  if (!css) return null
  return <HoistableStyle href={forcedMode ? 'vbiz-card-theme-preview' : 'vbiz-card-theme'} css={css} />
}
