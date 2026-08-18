import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'

type ThemeLogMeta = {
  source: string
  mode: ThemeMode
  fromApi?: boolean
  template?: string
}

export function logCardThemeSettings(_config: CardThemeConfig, _meta: ThemeLogMeta): void {}
