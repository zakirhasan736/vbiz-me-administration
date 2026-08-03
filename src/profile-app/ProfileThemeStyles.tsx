'use client'

import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { buildV3ThemeCss } from '@/lib/v3Theme'
import { useMemo } from 'react'

function buildProfileThemeCss(design: ResolvedProfileDesign): string {
  const { primaryColor, accentColor } = design
  // Prefer live CSS variables (updated per light/dark mode by CardThemeStyles)
  // with template/API-resolved colors as fallbacks.
  const accent = `var(--vbiz-accent, ${accentColor})`
  const primary = `var(--vbiz-primary, ${primaryColor})`
  const v3Css = design.profileTemplate === 'v3' ? buildV3ThemeCss(design) : ''

  return `
    .vbiz-profile-root .text-\\[\\#eab308\\],
    .vbiz-profile-root .text-\\[\\#ca8a04\\],
    .vbiz-profile-root .text-\\[\\#eed677\\] {
      color: ${accent} !important;
    }
    .vbiz-profile-root .bg-\\[\\#eab308\\],
    .vbiz-profile-root .bg-\\[\\#ca8a04\\] {
      background-color: ${accent} !important;
    }
    .vbiz-profile-root .from-\\[\\#eab308\\] {
      --tw-gradient-from: ${accent} !important;
      --tw-gradient-to: color-mix(in srgb, ${accent} 70%, black) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .vbiz-profile-root .to-\\[\\#ca8a04\\] {
      --tw-gradient-to: color-mix(in srgb, ${accent} 75%, black) !important;
    }
    .vbiz-profile-root .border-\\[\\#eab308\\],
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/20,
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/30,
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/50 {
      border-color: color-mix(in srgb, ${accent} 50%, transparent) !important;
    }
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/5,
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/10,
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/20 {
      background-color: color-mix(in srgb, ${accent} 15%, transparent) !important;
    }
    .vbiz-profile-root .fill-\\[\\#eab308\\] {
      fill: ${accent} !important;
    }
    .vbiz-profile-root .text-yellow-500,
    .vbiz-profile-root .border-yellow-500 {
      color: ${accent} !important;
      border-color: ${accent} !important;
    }
    .vbiz-profile-root .bg-yellow-500\\/10 {
      background-color: color-mix(in srgb, ${accent} 15%, transparent) !important;
    }
    .vbiz-profile-root .selection\\:bg-yellow-500\\/30::selection {
      background-color: color-mix(in srgb, ${accent} 30%, transparent) !important;
    }
    .vbiz-profile-root .shadow-\\[0_0_8px_\\#eab308\\] {
      box-shadow: 0 0 8px ${accent} !important;
    }
    .vbiz-profile-root .shadow-\\[0_20px_40px_-15px_rgba\\(234\\,179\\,8\\,0\\.3\\)\\] {
      box-shadow: 0 20px 40px -15px color-mix(in srgb, ${accent} 30%, transparent) !important;
    }
    .vbiz-profile-root .hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .dark\\:hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .group-hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .group-hover\\/link\\:text-\\[\\#eab308\\]:hover {
      color: ${accent} !important;
    }
    .vbiz-profile-root .hover\\:border-\\[\\#eab308\\]\\/50:hover {
      border-color: color-mix(in srgb, ${accent} 50%, transparent) !important;
    }
    .vbiz-profile-root .group-hover\\:bg-\\[\\#eab308\\]:hover {
      background-color: ${accent} !important;
    }
    .vbiz-profile-root .vbiz-primary-bg {
      background-color: ${primary} !important;
    }
    .vbiz-profile-root .vbiz-primary-text {
      color: ${primary} !important;
    }
    .vbiz-profile-root .vbiz-accent-bg {
      background-color: ${accent} !important;
    }
    .vbiz-profile-root .vbiz-accent-text {
      color: ${accent} !important;
    }
    .vbiz-profile-v1 .bg-\\[\\#dcc969\\],
    .vbiz-profile-root .bg-\\[\\#dcc969\\] {
      background-color: ${accent} !important;
    }
    .vbiz-profile-v1 .text-\\[\\#dcc969\\],
    .vbiz-profile-root .text-\\[\\#dcc969\\] {
      color: ${accent} !important;
    }
    .vbiz-profile-v1 .border-\\[\\#dcc969\\],
    .vbiz-profile-root .border-\\[\\#dcc969\\] {
      border-color: ${accent} !important;
    }
    .vbiz-profile-v1 .selection\\:bg-\\[\\#dcc969\\]\\/30::selection,
    .vbiz-profile-root .selection\\:bg-\\[\\#dcc969\\]\\/30::selection {
      background-color: color-mix(in srgb, ${accent} 30%, transparent) !important;
    }
    ${v3Css}
  `
}

/** Overrides hardcoded accent classes inside the profile app shell. */
export function ProfileThemeStyles({ design }: { design: ResolvedProfileDesign }) {
  const css = useMemo(() => buildProfileThemeCss(design), [design])

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
