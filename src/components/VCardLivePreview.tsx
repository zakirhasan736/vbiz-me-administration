'use client'

import { useAppSelector } from '@/hooks/redux'
import { useVCard } from '@/lib/VCardContext'
import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { ProfileApp } from '@/profile-app/ProfileApp'
import { ProfileThemeShell } from '@/profile-app/components/ProfileThemeShell'
import { useResolvedProfileTheme } from '@/profile-app/hooks/useResolvedProfileTheme'
import '@/profile-app/profile-app.css'
import { vCardDataToProfileProps } from '@/profile-app/profilePublicProps'
import { ProfileThemeProvider } from '@/profile-app/providers/ProfileThemeProvider'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { selectVCardById } from '@/redux/features/vcards/vcards.slice'
import { cn } from '@/utils/cn'
import { Moon, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export function VCardLivePreview({
  isOpen,
  onClose,
  editorSectionId = DEFAULT_PROFILE_SECTION,
}: {
  isOpen: boolean
  onClose: () => void
  /** Sync preview nav with the editor route section. */
  editorSectionId?: string
}) {
  const { vCardData, cardId } = useVCard()
  const designSettings = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s) => (cardId ? selectVCardById(s, cardId) : null))

  const earlyTemplate: ProfileTemplateId =
    (vCardData.appearance?.profileTemplate as ProfileTemplateId | undefined) ?? designSettings.profileTemplate ?? 'v3'

  const {
    themeConfig,
    appearance: settingsAppearance,
    fromApi,
  } = useResolvedProfileTheme({
    profileId: cardId ?? '',
    template: earlyTemplate,
    cardThemeConfig: vCardData.themeConfig ?? null,
  })

  const profileProps = useMemo(() => {
    const base = vCardDataToProfileProps(vCardData, designSettings, {
      id: cardId ?? 'preview',
      avatarImageUrl: record?.avatarImageUrl,
      themeConfig,
      themeFromApi: fromApi,
      appearance: {
        ...vCardData.appearance,
        ...settingsAppearance,
      },
    })
    const appearance = {
      ...vCardData.appearance,
      ...settingsAppearance,
    }
    const design = resolveProfileDesign(designSettings, vCardData.theme, appearance, {
      themeConfig,
    })
    return {
      ...base,
      design,
      themeConfig,
      themeFromApi: fromApi,
    }
  }, [vCardData, designSettings, cardId, record?.avatarImageUrl, themeConfig, settingsAppearance, fromApi])

  const designTheme: 'light' | 'dark' = profileProps.design?.darkMode ? 'dark' : 'light'
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(designTheme)
  const [prevDesignTheme, setPrevDesignTheme] = useState(designTheme)
  const [previewSectionId, setPreviewSectionId] = useState(editorSectionId)
  const [prevEditorSectionId, setPrevEditorSectionId] = useState(editorSectionId)

  if (editorSectionId !== prevEditorSectionId) {
    setPrevEditorSectionId(editorSectionId)
    setPreviewSectionId(editorSectionId)
  }

  if (designTheme !== prevDesignTheme) {
    setPrevDesignTheme(designTheme)
    setPreviewTheme(designTheme)
  }

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null

  const template: ProfileTemplateId = profileProps.design?.profileTemplate ?? earlyTemplate

  return (
    <div className="pointer-events-none fixed inset-0 z-100 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-0">
      <div
        className="pointer-events-auto absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity sm:hidden dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          'vbiz-preview-phone pointer-events-auto relative z-100 flex w-full min-w-0 flex-col overflow-hidden',
          'h-[min(92dvh,820px)] max-h-[92dvh] w-[min(100%,420px)]',
          'rounded-4xl border-6 border-slate-200/80 bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)]',
          'animate-in slide-in-from-bottom-10 duration-500 ease-[0.23,1,0.32,1]',
          'sm:slide-in-from-right-10 min-[400px]:rounded-[40px] min-[400px]:border-8 sm:fixed sm:right-6 sm:bottom-20 sm:h-[min(720px,calc(100dvh-6rem))] sm:max-h-[calc(100dvh-6rem)] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-[48px] sm:border-10 md:right-8 md:bottom-24',
          'dark:border-[#1e2333] dark:bg-[#0b0f19]'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Live profile preview"
      >
        <button
          type="button"
          onClick={() => setPreviewTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={previewTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="absolute top-4 right-14 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-colors hover:bg-white sm:top-2 sm:right-4 dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {previewTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="absolute top-4 right-4 z-30 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/50 bg-white/80 text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/40 dark:text-slate-300"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-2 z-30 hidden h-7 justify-center sm:flex">
          <div className="flex h-full w-[min(120px,32%)] max-w-30 items-center justify-between rounded-full bg-slate-800 px-3 shadow-sm dark:bg-black">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-60" />
            <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-700/50 dark:bg-white/10">
              <div className="h-1 w-1 rounded-full bg-slate-900 dark:bg-black" />
            </div>
          </div>
        </div>

        <div className="vbiz-preview-frame vbiz-preview-scrollbar isolate min-h-0 flex-1 transform-[translateZ(0)] overflow-x-hidden overflow-y-auto overscroll-contain">
          <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template} forcedMode={previewTheme}>
            <ProfileThemeProvider themeConfig={themeConfig} fromApi={fromApi}>
              <ProfileApp
                {...profileProps}
                embedded
                sectionId={previewSectionId}
                onSectionChange={setPreviewSectionId}
                previewTheme={previewTheme}
                onPreviewThemeChange={setPreviewTheme}
              />
            </ProfileThemeProvider>
          </ProfileThemeShell>
        </div>
      </div>
    </div>
  )
}
