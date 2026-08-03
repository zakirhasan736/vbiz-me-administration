import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { cornerStyleToRadius, designToCssVars, fontFamilyToStack } from '@/lib/resolvedProfileDesign'
import type { CSSProperties } from 'react'

/** Darken accent for gradients and hover states. */
export function accentDark(accent: string, mix = 72): string {
  return `color-mix(in srgb, ${accent} ${mix}%, black)`
}

/** Lighten accent for hover highlights. */
export function accentLight(accent: string, mix = 12): string {
  return `color-mix(in srgb, ${accent} ${mix}%, white)`
}

/** CSS variables for v3 shell — set on `.vbiz-profile-v3` so Tailwind `gold` tokens follow API accent. */
export function v3DesignToCssVars(design: ResolvedProfileDesign): CSSProperties {
  const accent = design.accentColor
  const primary = design.primaryColor
  const dark = accentDark(accent)

  return {
    ...designToCssVars(design),
    ['--color-gold' as string]: accent,
    ['--color-gold-dark' as string]: dark,
    ['--vbiz-accent-dark' as string]: dark,
    ['--vbiz-accent-light' as string]: accentLight(accent),
    ['--vbiz-accent-muted' as string]: `color-mix(in srgb, ${accent} 70%, transparent)`,
    ['--vbiz-accent-subtle' as string]: `color-mix(in srgb, ${accent} 15%, transparent)`,
    ['--vbiz-accent-faint' as string]: `color-mix(in srgb, ${accent} 10%, transparent)`,
    ['--vbiz-accent-border' as string]: `color-mix(in srgb, ${accent} 55%, transparent)`,
    ['--vbiz-accent-shadow' as string]: `color-mix(in srgb, ${accent} 30%, transparent)`,
    ['--vbiz-accent-glow' as string]: `color-mix(in srgb, ${accent} 75%, transparent)`,
    ['--vbiz-primary-surface' as string]: `color-mix(in srgb, ${primary} 12%, #020914)`,
    fontFamily: fontFamilyToStack(design.fontFamily),
    ['--vbiz-radius' as string]: cornerStyleToRadius(design.cornerStyle),
  }
}

/** Runtime overrides for hardcoded hex / yellow / amber utilities used across v3 components. */
export function buildV3ThemeCss(design: ResolvedProfileDesign): string {
  // Prefer live theme tokens (light/dark from CardThemeStyles); design colors are fallbacks only.
  const accent = `var(--vbiz-accent, ${design.accentColor})`
  const dark = `var(--vbiz-accent-dark, ${accentDark(design.accentColor)})`
  const scope = '.vbiz-profile-v3'

  const gradientStops = `
    --tw-gradient-from: ${accent} !important;
    --tw-gradient-to: ${dark} !important;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
  `

  return `
    ${scope} {
      --color-gold: ${accent};
      --color-gold-dark: ${dark};
    }

    ${scope} .text-gold,
    ${scope} .text-\\[\\#eab308\\],
    ${scope} .text-\\[\\#eed677\\],
    ${scope} .text-\\[\\#ca8a04\\],
    ${scope} .text-yellow-400,
    ${scope} .text-yellow-500,
    ${scope} .text-amber-700,
    ${scope} .text-amber-800,
    ${scope} .text-amber-900,
    ${scope} .text-amber-950,
    ${scope} .dark\\:text-gold,
    ${scope} .dark\\:hover\\:text-gold:hover,
    ${scope} .group-hover\\:text-gold:hover,
    ${scope} .group-hover\\/link\\:text-gold:hover {
      color: ${accent} !important;
    }

    ${scope} .text-gold\\/70 { color: ${accent} !important; opacity: 0.7; }

    ${scope} .bg-gold,
    ${scope} .bg-\\[\\#eab308\\],
    ${scope} .bg-\\[\\#eed677\\],
    ${scope} .bg-\\[\\#ca8a04\\],
    ${scope} .bg-yellow-400,
    ${scope} .bg-yellow-500,
    ${scope} .hover\\:bg-gold:hover,
    ${scope} .hover\\:bg-yellow-400:hover,
    ${scope} .hover\\:bg-yellow-500:hover {
      background-color: ${accent} !important;
    }

    ${scope} .bg-gold\\/5,
    ${scope} .bg-gold\\/10,
    ${scope} .bg-gold\\/15,
    ${scope} .bg-gold\\/20,
    ${scope} .bg-\\[\\#eab308\\]\\/5,
    ${scope} .bg-\\[\\#eab308\\]\\/10,
    ${scope} .bg-\\[\\#eab308\\]\\/15,
    ${scope} .bg-\\[\\#eab308\\]\\/20,
    ${scope} .hover\\:bg-gold\\/5:hover,
    ${scope} .hover\\:bg-gold\\/10:hover,
    ${scope} .hover\\:bg-gold\\/20:hover {
      background-color: color-mix(in srgb, ${accent} 15%, transparent) !important;
    }

    ${scope} .border-gold,
    ${scope} .border-\\[\\#eab308\\],
    ${scope} .border-\\[\\#eed677\\],
    ${scope} .border-yellow-500,
    ${scope} .hover\\:border-gold:hover,
    ${scope} .focus\\:border-\\[\\#eab308\\]:focus,
    ${scope} .focus-visible\\:ring-gold\\/60:focus-visible {
      border-color: color-mix(in srgb, ${accent} 55%, transparent) !important;
    }

    ${scope} .border-gold\\/20,
    ${scope} .border-gold\\/30,
    ${scope} .border-gold\\/35,
    ${scope} .border-gold\\/40,
    ${scope} .border-gold\\/45,
    ${scope} .border-gold\\/50,
    ${scope} .border-gold\\/55,
    ${scope} .border-gold\\/80,
    ${scope} .border-\\[\\#eab308\\]\\/20,
    ${scope} .border-\\[\\#eab308\\]\\/30,
    ${scope} .dark\\:border-\\[\\#eab308\\]\\/20,
    ${scope} .dark\\:border-gold\\/20,
    ${scope} .hover\\:border-gold\\/30:hover {
      border-color: color-mix(in srgb, ${accent} 35%, transparent) !important;
    }

    ${scope} .from-gold,
    ${scope} .from-\\[\\#eab308\\],
    ${scope} .from-amber-700 {
      ${gradientStops}
    }

    ${scope} .to-gold,
    ${scope} .to-yellow-400,
    ${scope} .to-yellow-500,
    ${scope} .to-\\[\\#ca8a04\\],
    ${scope} .to-amber-950 {
      --tw-gradient-to: ${dark} !important;
    }

    ${scope} .from-gold.to-yellow-500,
    ${scope} .from-\\[\\#eab308\\].to-yellow-500 {
      --tw-gradient-from: ${accent} !important;
      --tw-gradient-to: ${dark} !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }

    ${scope} .from-amber-700.to-amber-950 {
      --tw-gradient-from: ${accent} !important;
      --tw-gradient-to: ${dark} !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }

    ${scope} .fill-gold,
    ${scope} .fill-\\[\\#eab308\\],
    ${scope} .fill-\\[\\#eed677\\] {
      fill: ${accent} !important;
    }

    ${scope} .shadow-gold\\/5 {
      --tw-shadow-color: color-mix(in srgb, ${accent} 12%, transparent) !important;
    }

    ${scope} [class*="shadow-[0_0_18px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_0_15px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_0_16px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_0_20px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_0_22px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_0_25px_rgba(238,214,119"],
    ${scope} [class*="shadow-[0_10px_30px_rgba(238,214,119"] {
      --tw-shadow-color: color-mix(in srgb, ${accent} 45%, transparent) !important;
    }

    ${scope} [class*="hover:shadow-[0_0_18px_rgba(238,214,119"]:hover,
    ${scope} [class*="hover:shadow-[0_0_15px_rgba(238,214,119"]:hover,
    ${scope} [class*="hover:shadow-[0_0_16px_rgba(238,214,119"]:hover,
    ${scope} [class*="hover:shadow-[0_0_20px_rgba(238,214,119"]:hover,
    ${scope} [class*="hover:shadow-[0_0_22px_rgba(238,214,119"]:hover,
    ${scope} [class*="hover:shadow-[0_0_25px_rgba(238,214,119"]:hover {
      --tw-shadow-color: color-mix(in srgb, ${accent} 55%, transparent) !important;
    }

    ${scope} .selection\\:bg-yellow-500\\/30::selection,
    ${scope} .selection\\:bg-gold\\/30::selection {
      background-color: color-mix(in srgb, ${accent} 30%, transparent) !important;
    }

    ${scope} .group:hover .group-hover\\:text-amber-900,
    ${scope} .group-hover\\:text-amber-900:hover {
      color: ${dark} !important;
    }

    ${scope} .vbiz-accent-text { color: ${accent} !important; }
    ${scope} .vbiz-accent-bg { background-color: ${accent} !important; }
    ${scope} .vbiz-accent-border { border-color: color-mix(in srgb, ${accent} 55%, transparent) !important; }
    ${scope} .vbiz-accent-gradient {
      background-image: linear-gradient(to right, ${accent}, ${dark}) !important;
    }
    ${scope} .vbiz-accent-gradient-br {
      background-image: linear-gradient(to bottom right, ${accent}, ${dark}) !important;
    }
    ${scope} .vbiz-accent-glow:hover {
      box-shadow: 0 0 18px color-mix(in srgb, ${accent} 65%, transparent) !important;
    }
  `
}
