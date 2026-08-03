import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'
import { cardThemeVarRecord } from '@/lib/theme/cardThemeCssVars'

type ThemeLogMeta = {
  source: string
  mode: ThemeMode
  fromApi?: boolean
  template?: string
}

/** Dev-only: inspect resolved theme tokens in the browser console. */
export function logCardThemeSettings(config: CardThemeConfig, meta: ThemeLogMeta): void {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV === 'production') return

  const { mode, source, fromApi, template } = meta
  const activeColors = mode === 'light' ? config.colors.light : config.colors.dark
  const cssVars = cardThemeVarRecord(config, mode)

  console.groupCollapsed(
    `[vBiz Theme] ${source} · ${mode}${fromApi === false ? ' (defaults)' : fromApi ? ' (API)' : ''}`
  )
  if (template) console.log('template:', template)
  console.log('defaultMode:', config.colors.defaultMode)
  console.log('active page colors:', activeColors)
  console.log('light palette:', config.colors.light)
  console.log('dark palette:', config.colors.dark)
  console.log('components:', config.components)
  console.log('button styles:', {
    primary: config.components.button.primary.style,
    secondary: config.components.button.secondary.style,
    accent: config.components.button.accent.style,
  })
  console.log('social style:', config.components.socialIcon.style)
  console.log('appearance:', config.appearance)
  console.log('resolved CSS vars (sample):', {
    '--vbiz-primary': cssVars['--vbiz-primary'],
    '--vbiz-secondary': cssVars['--vbiz-secondary'],
    '--vbiz-accent': cssVars['--vbiz-accent'],
    '--vbiz-bg': cssVars['--vbiz-bg'],
    '--vbiz-surface': cssVars['--vbiz-surface'],
    '--vbiz-text': cssVars['--vbiz-text'],
    '--vbiz-text-muted': cssVars['--vbiz-text-muted'],
    '--vbiz-border': cssVars['--vbiz-border'],
    '--vbiz-btn-primary-fill': cssVars['--vbiz-btn-primary-fill'],
    '--vbiz-btn-secondary-fill': cssVars['--vbiz-btn-secondary-fill'],
    '--vbiz-btn-accent-fill': cssVars['--vbiz-btn-accent-fill'],
    '--vbiz-social-fill': cssVars['--vbiz-social-fill'],
    '--vbiz-social-fg': cssVars['--vbiz-social-fg'],
  })
  console.groupEnd()
}
