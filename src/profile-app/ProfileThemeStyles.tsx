'use client'

import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'

/** Overrides hardcoded accent classes inside the profile app shell. */
export function ProfileThemeStyles({ design }: { design: ResolvedProfileDesign }) {
  const { primaryColor, accentColor } = design

  const css = `
    .vbiz-profile-root .text-\\[\\#eab308\\],
    .vbiz-profile-root .text-\\[\\#ca8a04\\] {
      color: ${accentColor} !important;
    }
    .vbiz-profile-root .bg-\\[\\#eab308\\],
    .vbiz-profile-root .bg-\\[\\#ca8a04\\] {
      background-color: ${accentColor} !important;
    }
    .vbiz-profile-root .from-\\[\\#eab308\\] {
      --tw-gradient-from: ${accentColor} !important;
      --tw-gradient-to: color-mix(in srgb, ${accentColor} 70%, black) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .vbiz-profile-root .to-\\[\\#ca8a04\\] {
      --tw-gradient-to: color-mix(in srgb, ${accentColor} 75%, black) !important;
    }
    .vbiz-profile-root .border-\\[\\#eab308\\],
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/20,
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/30,
    .vbiz-profile-root .border-\\[\\#eab308\\]\\/50 {
      border-color: color-mix(in srgb, ${accentColor} 50%, transparent) !important;
    }
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/5,
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/10,
    .vbiz-profile-root .bg-\\[\\#eab308\\]\\/20 {
      background-color: color-mix(in srgb, ${accentColor} 15%, transparent) !important;
    }
    .vbiz-profile-root .fill-\\[\\#eab308\\] {
      fill: ${accentColor} !important;
    }
    .vbiz-profile-root .text-yellow-500,
    .vbiz-profile-root .border-yellow-500 {
      color: ${accentColor} !important;
      border-color: ${accentColor} !important;
    }
    .vbiz-profile-root .bg-yellow-500\\/10 {
      background-color: color-mix(in srgb, ${accentColor} 15%, transparent) !important;
    }
    .vbiz-profile-root .selection\\:bg-yellow-500\\/30::selection {
      background-color: color-mix(in srgb, ${accentColor} 30%, transparent) !important;
    }
    .vbiz-profile-root .shadow-\\[0_0_8px_\\#eab308\\] {
      box-shadow: 0 0 8px ${accentColor} !important;
    }
    .vbiz-profile-root .shadow-\\[0_20px_40px_-15px_rgba\\(234\\,179\\,8\\,0\\.3\\)\\] {
      box-shadow: 0 20px 40px -15px color-mix(in srgb, ${accentColor} 30%, transparent) !important;
    }
    .vbiz-profile-root .hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .dark\\:hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .group-hover\\:text-\\[\\#eab308\\]:hover,
    .vbiz-profile-root .group-hover\\/link\\:text-\\[\\#eab308\\]:hover {
      color: ${accentColor} !important;
    }
    .vbiz-profile-root .hover\\:border-\\[\\#eab308\\]\\/50:hover {
      border-color: color-mix(in srgb, ${accentColor} 50%, transparent) !important;
    }
    .vbiz-profile-root .group-hover\\:bg-\\[\\#eab308\\]:hover {
      background-color: ${accentColor} !important;
    }
    .vbiz-profile-root .vbiz-primary-bg {
      background-color: ${primaryColor} !important;
    }
    .vbiz-profile-root .vbiz-primary-text {
      color: ${primaryColor} !important;
    }
    .vbiz-profile-root .vbiz-accent-bg {
      background-color: ${accentColor} !important;
    }
    .vbiz-profile-root .vbiz-accent-text {
      color: ${accentColor} !important;
    }
    .vbiz-profile-v1 .bg-\\[\\#dcc969\\],
    .vbiz-profile-root .bg-\\[\\#dcc969\\] {
      background-color: ${accentColor} !important;
    }
    .vbiz-profile-v1 .text-\\[\\#dcc969\\],
    .vbiz-profile-root .text-\\[\\#dcc969\\] {
      color: ${accentColor} !important;
    }
    .vbiz-profile-v1 .border-\\[\\#dcc969\\],
    .vbiz-profile-root .border-\\[\\#dcc969\\] {
      border-color: ${accentColor} !important;
    }
    .vbiz-profile-v1 .selection\\:bg-\\[\\#dcc969\\]\\/30::selection,
    .vbiz-profile-root .selection\\:bg-\\[\\#dcc969\\]\\/30::selection {
      background-color: color-mix(in srgb, ${accentColor} 30%, transparent) !important;
    }
  `

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
