'use client'

import { useLivePreview } from '@/components/vcard/LivePreviewProvider'
import { useAppSelector } from '@/hooks/redux'
import { useGoogleFont } from '@/hooks/useGoogleFont'
import { useVCard } from '@/lib/VCardContext'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { getDefaultThemeConfig } from '@/lib/theme/cardThemeContract'
import { applyEditorSettingsToThemeConfig } from '@/lib/theme/resolveCardTheme'
import { getNavItemById } from '@/lib/vcardNavbar'
import { ProfileApp } from '@/profile-app/ProfileApp'
import { ProfileThemeShell } from '@/profile-app/components/ProfileThemeShell'
import '@/profile-app/profile-app.css'
import { vCardDataToProfileProps } from '@/profile-app/profilePublicProps'
import { ProfileThemeProvider } from '@/profile-app/providers/ProfileThemeProvider'
import { preloadProfileSections, preloadProfileTemplate } from '@/profile-app/sections/preloadProfileSections'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { selectVCardById } from '@/redux/features/vcards/vcards.slice'
import type { VCardData } from '@/types/vcard'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type LivePreviewProfileProps = {
  previewTheme: 'light' | 'dark'
  onPreviewThemeChange: (theme: 'light' | 'dark') => void
  previewActive: boolean
}

/** Empty create drafts still look like a real card in the phone, without writing placeholders to the editor. */
function withPreviewPlaceholders(data: VCardData): VCardData {
  if (data.personal.fullName.trim()) return data
  return {
    ...data,
    personal: {
      ...data.personal,
      fullName: 'Your Name',
    },
  }
}

function LivePreviewProfileInner({ previewTheme, onPreviewThemeChange, previewActive }: LivePreviewProfileProps) {
  const { editorSectionId } = useLivePreview()
  const { vCardData, cardId } = useVCard()
  const designSettings = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s) => (cardId ? selectVCardById(s, cardId) : null))

  const previewData = useMemo(() => withPreviewPlaceholders(vCardData), [vCardData])

  const earlyTemplate: ProfileTemplateId =
    (vCardData.appearance?.profileTemplate as ProfileTemplateId | undefined) ?? designSettings.profileTemplate ?? 'v3'
  const themeConfig = useMemo(
    () =>
      applyEditorSettingsToThemeConfig(
        vCardData.themeConfig ?? getDefaultThemeConfig(earlyTemplate),
        vCardData.theme,
        vCardData.appearance
      ),
    [vCardData.themeConfig, vCardData.theme, vCardData.appearance, earlyTemplate]
  )
  const fromApi = true

  const profileProps = useMemo(() => {
    const base = vCardDataToProfileProps(previewData, designSettings, {
      id: cardId ?? 'preview',
      avatarImageUrl: record?.avatarImageUrl,
      themeConfig,
      themeFromApi: fromApi,
      appearance: previewData.appearance,
    })
    const design = resolveProfileDesign(designSettings, previewData.theme, previewData.appearance, {
      themeConfig,
    })
    return {
      ...base,
      design,
      themeConfig,
      themeFromApi: fromApi,
      profileViews: record?.views ?? 0,
      actionButtons: {
        view_counter: {
          enabled: true,
          count: record?.views ?? 0,
          label: 'Views',
        },
      },
      profileSlug: previewData.slug?.trim() || undefined,
    }
  }, [previewData, designSettings, cardId, record?.avatarImageUrl, record?.views, themeConfig, fromApi])

  useGoogleFont(profileProps.design?.fontFamily)

  const template: ProfileTemplateId = profileProps.design?.profileTemplate ?? earlyTemplate
  const designTheme: 'light' | 'dark' = profileProps.design?.darkMode ? 'dark' : 'light'
  const lastDesignThemeRef = useRef<'light' | 'dark' | null>(null)

  useLayoutEffect(() => {
    if (lastDesignThemeRef.current === designTheme) return
    lastDesignThemeRef.current = designTheme
    onPreviewThemeChange(designTheme)
  }, [designTheme, onPreviewThemeChange])

  const [previewSectionId, setPreviewSectionId] = useState(editorSectionId)
  const [prevEditorSectionId, setPrevEditorSectionId] = useState(editorSectionId)
  if (editorSectionId !== prevEditorSectionId) {
    setPrevEditorSectionId(editorSectionId)
    setPreviewSectionId(editorSectionId)
  }

  const handleSectionChange = useCallback((sectionId: string) => {
    setPreviewSectionId(sectionId)
  }, [])

  useEffect(() => {
    preloadProfileTemplate(template)
    const contentKey = getNavItemById(previewSectionId)?.profileContent
    if (contentKey) preloadProfileSections([contentKey], template)
  }, [template, previewSectionId])

  return (
    <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template} forcedMode={previewTheme}>
      <ProfileThemeProvider themeConfig={themeConfig} fromApi={fromApi}>
        <ProfileApp
          key={template}
          {...profileProps}
          embedded
          previewActive={previewActive}
          sectionId={previewSectionId}
          onSectionChange={handleSectionChange}
          previewTheme={previewTheme}
          onPreviewThemeChange={onPreviewThemeChange}
        />
      </ProfileThemeProvider>
    </ProfileThemeShell>
  )
}

export default memo(LivePreviewProfileInner)
