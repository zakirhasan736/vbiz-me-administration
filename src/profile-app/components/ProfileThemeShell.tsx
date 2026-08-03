'use client'

import type { CardThemeConfig } from '@/lib/theme/cardThemeContract'
import { CardThemeStyles } from '@/profile-app/components/CardThemeStyles'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type { ReactNode } from 'react'

type ProfileThemeShellProps = {
  config: CardThemeConfig
  fromApi?: boolean
  template: ProfileTemplateId
  children: ReactNode
}

/**
 * Injects live API theme CSS (colors, button types, corner style, social icons)
 * for the profile shell, preloaders, modals, and loading screens.
 */
export function ProfileThemeShell({ config, fromApi, template, children }: ProfileThemeShellProps) {
  const mode = config.colors.defaultMode ?? 'dark'

  return (
    <>
      <CardThemeStyles config={config} mode={mode} fromApi={fromApi} template={template} />
      {children}
    </>
  )
}
