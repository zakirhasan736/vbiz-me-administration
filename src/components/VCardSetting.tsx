'use client'

import { CanvaConnectRow } from '@/components/canva'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { Button, Switch } from '@/components/ui'
import { SlugAvailabilityField } from '@/components/vcard/SlugAvailabilityField'
import { VCardMediaField } from '@/components/vcard/VCardMediaField'
import { VCardTemplateDesignPanel } from '@/components/VCardTemplateDesignPanel'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { pushEditorPath } from '@/lib/editorShallowRoute'
import {
  MAX_MEDIA_UPLOAD_BYTES,
  MAX_MEDIA_UPLOAD_MB,
  MediaUploadError,
  uploadMediaWithProgress,
} from '@/lib/media/uploadMediaWithProgress'
import {
  inferMediaWallpaperStyle,
  patchThemeConfigWallpaper,
  PREMADE_GRADIENTS,
  resolveWallpaperConfig,
  wallpaperNeedsMedia,
  type WallpaperPatternId,
  type WallpaperStyleId,
} from '@/lib/theme/wallpaper'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import { useVCard } from '@/lib/VCardContext'
import { appearanceFromDesignSettings } from '@/lib/vcardDesignDefaults'
import {
  applyEnabledNavOrderToDisplaySettings,
  GENERAL_SETTINGS_FIELDS,
  getDisplaySettingsFromVCard,
  getFieldColorPreview,
  HOME_PAGE_FIELDS,
  ICON_FIELDS,
  MY_INFO_FIELDS,
  NAV_BAR_FIELDS,
  patchDisplayField,
  setCategoryEnableAll,
  SOCIAL_LINK_FIELDS,
  syncEditorNavOrderAfterNavVisibilityChange,
} from '@/lib/vcardDisplaySettings'
import { buildEditorSettingsPath, type EditorBasePath, type SettingsTabId } from '@/lib/vcardEditorRoutes'
import {
  getEditorNavLabel,
  getNavBarSettingKeysInOrder,
  NAV_BAR_NAV_ITEMS,
  navIdsAfterEnableAll,
} from '@/lib/vcardNavbar'
import { DEFAULT_COVER } from '@/profile-app/profilePublicProps'
import { useAuth } from '@/providers/AuthProvider'
import { isLocalTempId } from '@/redux/features/profiles/profiles.api'
import type { VCardAppearance } from '@/types/vcard'
import type { DisplayFieldConfig, VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { cn } from '@/utils/cn'
import {
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  Globe,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Loader2,
  Menu,
  Palette,
  Search,
  Settings2,
  Sparkles,
  Star,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const FIELD_PROFILE_IMAGE = 'Profile Image/Video'
const FIELD_BACKGROUND_MEDIA = 'Background Video/Image'
const MAX_PROFILE_IMAGE_BYTES = 15 * 1024 * 1024

const settingTabs = [
  { id: 'info', label: 'My Info Color Settings', icon: Palette },
  { id: 'social', label: 'Social and general Links', icon: Link2 },
  { id: 'icons', label: 'Icons', icon: Star },
  { id: 'general', label: 'General Settings', icon: Settings2 },
  { id: 'home', label: 'Home Page Settings', icon: Home },
  { id: 'navbar', label: 'Nav Bar settings', icon: Menu },
  { id: 'template', label: 'Template', icon: LayoutTemplate },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'ai-assistance', label: 'AI Assistance', icon: Bot },
]

const cardInputClasses =
  'w-full rounded-[.875rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[.8125rem] font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-800 dark:text-white'

const TABS_WITHOUT_ENABLE_ALL = new Set(['template', 'seo', 'ai-assistance'])
const FIELD_CARD_TABS = new Set(['info', 'social', 'icons', 'general', 'home', 'navbar'])

const settingTabTourIds: Record<string, string> = {
  home: 'tour-card-home-tab',
  navbar: 'tour-card-navbar-tab',
  template: 'tour-card-template-tab',
}

const settingContentTourIds: Record<string, string> = {
  home: 'tour-card-home-content',
  navbar: 'tour-card-navbar-content',
}

const CATEGORY_FIELDS: Record<string, readonly string[]> = {
  info: MY_INFO_FIELDS,
  social: SOCIAL_LINK_FIELDS,
  icons: ICON_FIELDS,
  general: GENERAL_SETTINGS_FIELDS,
  home: HOME_PAGE_FIELDS,
  navbar: NAV_BAR_FIELDS,
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-8 flex flex-col gap-3">
      <h3 className="text-[.875rem] font-bold text-slate-900 dark:text-white">{title}</h3>
      {children}
    </div>
  )
}

function OptionCard({
  label,
  selected,
  onClick,
  children,
}: {
  label: string
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all duration-200',
        selected
          ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 shadow-sm'
          : 'hover:border-primary-500/50 border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
      )}
    >
      <div className="mb-2 flex h-12 w-full items-center justify-center">{children}</div>
      <span
        className={cn(
          'text-[.75rem] font-semibold transition-colors',
          selected ? 'dark:text-primary-400 text-slate-900' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {label}
      </span>
    </button>
  )
}

const COLOR_COMMIT_MS = 500

function ColorPicker({
  label,
  value,
  onChange,
  defaultValue,
}: {
  label: string
  value?: string
  onChange?: (val: string) => void
  defaultValue?: string
}) {
  const [localValue, setLocalValue] = useState(value ?? defaultValue ?? '#000000')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const pending = pendingRef.current
    if (pending === null) return
    pendingRef.current = null
    onChangeRef.current?.(pending)
  }, [])

  useEffect(() => {
    return () => {
      flush()
    }
  }, [flush])

  useEffect(() => {
    if (value === undefined) return
    if (pendingRef.current !== null) return
    setLocalValue(value)
  }, [value])

  const handleChange = (val: string) => {
    setLocalValue(val)
    if (!onChangeRef.current) return
    pendingRef.current = val
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const pending = pendingRef.current
      if (pending === null) return
      pendingRef.current = null
      onChangeRef.current?.(pending)
    }, COLOR_COMMIT_MS)
  }

  return (
    <div
      className="hover:border-primary-500/50 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-white/10 dark:bg-[#070a13]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          flush()
        }
      }}
    >
      <span className="text-[.8125rem] font-semibold text-slate-900 dark:text-white">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="focus:text-primary-600 dark:focus:text-primary-400 w-20 bg-transparent text-right font-mono text-[.75rem] font-medium text-slate-500 uppercase outline-none dark:text-slate-400"
        />
        <div className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-slate-200 shadow-sm dark:border-white/20">
          <input
            type="color"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className="absolute -inset-2.5 h-14 w-14 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}

function Toggle({
  isPro = false,
  checked,
  onChange,
}: {
  isPro?: boolean
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      {isPro && (
        <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm">
          <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-3.5 w-3.5" />
        </div>
      )}
      <Switch checked={checked} onCheckedChange={onChange} size="sm" />
    </div>
  )
}

function TemplateDesigner() {
  const { user } = useAuth()
  const { vCardData, updateData, cardId, isCreateMode, avatarImageUrl, updateMeta } = useVCard()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()
  const accountDesign = useAppSelector((s) => s.designSettings)

  const cardAppearance: VCardAppearance = vCardData.appearance ?? appearanceFromDesignSettings(accountDesign)

  const patchAppearance = (patch: Partial<VCardAppearance>) => {
    updateData('appearance', { ...cardAppearance, ...patch })
  }

  const layoutStyle = cardAppearance.layoutStyle

  const profilePicUrl = getCustomValue(FIELD_PROFILE_IMAGE) || avatarImageUrl || ''
  const profileId = cardId && !isLocalTempId(cardId) ? cardId : undefined

  const profileImageInputRef = useRef<HTMLInputElement>(null)
  const profileUploadAbortRef = useRef<AbortController | null>(null)
  const [profileLocalPreview, setProfileLocalPreview] = useState<string | null>(null)
  const [profileUploading, setProfileUploading] = useState(false)
  const [profileUploadProgress, setProfileUploadProgress] = useState(0)
  const [profileUploadError, setProfileUploadError] = useState<string | null>(null)

  const profileDisplayUrl = profileLocalPreview || profilePicUrl

  const clearProfileLocalPreview = useCallback(() => {
    setProfileLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      profileUploadAbortRef.current?.abort()
      if (profileLocalPreview?.startsWith('blob:')) URL.revokeObjectURL(profileLocalPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

  const applyProfileImage = useCallback(
    (url: string | null) => {
      setCustomValue(FIELD_PROFILE_IMAGE, url || '')
      updateMeta({ avatarImageUrl: url || '' })
    },
    [setCustomValue, updateMeta]
  )

  const handleProfileImageUpload = useCallback(
    async (file: File) => {
      setProfileUploadError(null)

      if (file.size > MAX_PROFILE_IMAGE_BYTES) {
        setProfileUploadError('File size exceeds 15MB')
        return
      }

      profileUploadAbortRef.current?.abort()
      const controller = new AbortController()
      profileUploadAbortRef.current = controller

      clearProfileLocalPreview()
      const blobUrl = URL.createObjectURL(file)
      setProfileLocalPreview(blobUrl)
      setProfileUploading(true)
      setProfileUploadProgress(0)

      try {
        const result = await uploadMediaWithProgress({
          file,
          profileId: profileId || undefined,
          attachmentType: FIELD_PROFILE_IMAGE,
          signal: controller.signal,
          onProgress: setProfileUploadProgress,
        })
        clearProfileLocalPreview()
        applyProfileImage(result.url)
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof MediaUploadError ? err.message : err instanceof Error ? err.message : 'Upload failed'
        setProfileUploadError(message)
      } finally {
        if (profileUploadAbortRef.current === controller) profileUploadAbortRef.current = null
        setProfileUploading(false)
      }
    },
    [applyProfileImage, clearProfileLocalPreview, profileId]
  )

  const handleRemoveProfileImage = () => {
    profileUploadAbortRef.current?.abort()
    profileUploadAbortRef.current = null
    setProfileUploading(false)
    setProfileUploadProgress(0)
    setProfileUploadError(null)
    clearProfileLocalPreview()
    if (profileImageInputRef.current) profileImageInputRef.current.value = ''
    applyProfileImage(null)
  }

  const openProfileImagePicker = () => {
    if (!profileUploading) profileImageInputRef.current?.click()
  }

  const bgMediaUrl = getCustomValue(FIELD_BACKGROUND_MEDIA)
  const wallpaper = resolveWallpaperConfig(vCardData.themeConfig, bgMediaUrl, DEFAULT_COVER)
  const wallpaperStyle = wallpaper.style
  const templateId = cardAppearance.profileTemplate ?? 'v3'

  const patchWallpaper = useCallback(
    (patch: Parameters<typeof patchThemeConfigWallpaper>[1]) => {
      updateData('themeConfig', patchThemeConfigWallpaper(vCardData.themeConfig, patch, templateId))
    },
    [templateId, updateData, vCardData.themeConfig]
  )

  const setBackgroundMedia = useCallback(
    (url: string) => {
      setCustomValue(FIELD_BACKGROUND_MEDIA, url || '')
      const storedStyle = vCardData.themeConfig?.wallpaper?.style
      if (storedStyle && storedStyle !== 'image' && storedStyle !== 'video') return
      const next = inferMediaWallpaperStyle(url, DEFAULT_COVER)
      if (storedStyle === next) return
      updateData('themeConfig', patchThemeConfigWallpaper(vCardData.themeConfig, { style: next }, templateId))
    },
    [setCustomValue, templateId, updateData, vCardData.themeConfig]
  )

  const mediaAccept =
    wallpaperStyle === 'image' ? 'image/*' : wallpaperStyle === 'video' ? 'video/*' : 'image/*,video/*'

  return (
    <div className="col-span-1 mx-auto flex w-full max-w-2xl flex-col pb-12 lg:col-span-2">
      <VCardTemplateDesignPanel
        appearance={cardAppearance}
        onAppearanceChange={patchAppearance}
        fontFamily={vCardData.theme.fontFamily ?? 'inter'}
        onFontFamilyChange={(fontId) => updateData('theme.fontFamily', fontId)}
      />

      {layoutStyle === 'hero' && (
        <SettingSection title="Hero Background">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/2 dark:hover:bg-white/5">
              <ImageIcon className="h-5 w-5 text-slate-400" />
              <span className="text-[.875rem] font-semibold text-slate-600 dark:text-slate-300">Upload Hero Image</span>
              <input type="file" className="hidden" accept="image/*" />
            </label>
            <input
              type="text"
              placeholder="Or Hero video URL"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
            />
          </div>
        </SettingSection>
      )}

      {/* Identity Section */}
      <SettingSection title="Identity & URL">
        <div className="space-y-4">
          <div className="bg-primary-50 dark:bg-primary-500/5 border-primary-100 dark:border-primary-500/20 rounded-2xl border p-5">
            <div className="mb-3 flex items-center gap-3">
              <Globe className="text-primary-600 dark:text-primary-400 h-4 w-4" />
              <span className="text-[.8125rem] font-semibold text-slate-900 dark:text-white">Custom Profile Slug</span>
            </div>
            <SlugAvailabilityField
              value={vCardData.slug}
              onChange={(slug) => updateData('slug', slug)}
              excludeId={isCreateMode ? null : cardId}
              variant="settings"
              inputClassName="dark:text-primary-400 flex-1 bg-transparent text-[.8125rem] font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>
      </SettingSection>

      {/* Theme Colors */}
      <SettingSection title="Theme Colors">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorPicker
            label="Primary Theme Color"
            value={vCardData.theme.primaryColor}
            onChange={(val) => {
              updateData('theme.primaryColor', val)
            }}
          />
          <ColorPicker
            label="Accent Theme Color"
            value={vCardData.theme.accentColor}
            onChange={(val) => {
              updateData('theme.accentColor', val)
            }}
          />
        </div>
      </SettingSection>

      <SettingSection title="Canva Integration">
        <CanvaConnectRow userId={user?.uid} variant="status" />
      </SettingSection>

      {/* Profile image */}
      <SettingSection title="Profile image">
        <div className="flex w-full min-w-0 flex-col items-start gap-5 rounded-[20px] border border-slate-200/50 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:gap-6 sm:rounded-3xl sm:p-6 dark:border-white/5 dark:bg-white/2">
          <input
            ref={profileImageInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            disabled={profileUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleProfileImageUpload(file)
            }}
          />
          <button
            type="button"
            onClick={openProfileImagePicker}
            disabled={profileUploading}
            className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#0b0f19]"
          >
            {profileDisplayUrl ? (
              profileDisplayUrl.startsWith('blob:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileDisplayUrl}
                  alt="Profile"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Image
                  src={profileDisplayUrl}
                  alt="Profile"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  width={96}
                  height={96}
                />
              )
            ) : (
              <User className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            )}
            <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              <span className="text-[11px] font-bold tracking-wider text-white uppercase">Change</span>
            </div>
          </button>
          <div className="w-full min-w-0 sm:flex-1">
            <h4 className="mb-1 text-lg leading-tight font-black tracking-tight text-slate-900 sm:text-[20px] dark:text-white">
              Profile photo
            </h4>
            <p className="mb-4 text-[13px] font-medium text-slate-500 sm:text-[14px] dark:text-slate-400">
              Image only • Max 15MB
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10 px-4 font-bold sm:px-5"
                disabled={profileUploading}
                onClick={openProfileImagePicker}
              >
                {profileUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Upload new'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 px-4 font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 sm:px-5 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                disabled={profileUploading || !profilePicUrl}
                onClick={handleRemoveProfileImage}
              >
                Remove
              </Button>
            </div>
            {profileUploading ? (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  <span>Uploading…</span>
                  <span>{Math.min(100, Math.max(0, profileUploadProgress))}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-[width] duration-150 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, profileUploadProgress))}%` }}
                  />
                </div>
              </div>
            ) : null}
            {profileUploadError ? (
              <p className="mt-3 text-[12px] font-medium text-rose-600 dark:text-rose-400">{profileUploadError}</p>
            ) : null}
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Wallpaper style">
        <p className="mb-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          Choose how your public vCard cover is painted. Image and video reuse Background Video/Image.
        </p>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pt-2 pb-4">
          {(
            [
              {
                id: 'fill' as WallpaperStyleId,
                label: 'Fill',
                preview: <div className="h-12 w-12 rounded-[.625rem] bg-slate-200 dark:bg-[#1e2333]" />,
              },
              {
                id: 'gradient' as WallpaperStyleId,
                label: 'Gradient',
                preview: (
                  <div className="h-12 w-12 rounded-[.625rem] bg-linear-to-t from-[#B04C40] via-[#D1A0A6] to-[#A3C6D3]" />
                ),
              },
              {
                id: 'blur' as WallpaperStyleId,
                label: 'Blur',
                preview: <div className="h-12 w-12 rounded-[.625rem] bg-[#e2e4e9]" />,
              },
              {
                id: 'pattern' as WallpaperStyleId,
                label: 'Pattern',
                preview: (
                  <div className="grid h-12 w-12 grid-cols-3 grid-rows-3 gap-0.5 overflow-hidden rounded-[.625rem] bg-[#e2e4e9] p-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="rounded-xs bg-white dark:bg-[#0b0f19]" />
                    ))}
                  </div>
                ),
              },
              {
                id: 'image' as WallpaperStyleId,
                label: 'Image',
                preview: (
                  <div className="flex h-12 w-12 items-center justify-center rounded-[.625rem] bg-[#e2e4e9]">
                    <ImageIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </div>
                ),
              },
              {
                id: 'video' as WallpaperStyleId,
                label: 'Video',
                preview: (
                  <div className="flex h-12 w-12 items-center justify-center rounded-[.625rem] bg-[#e2e4e9]">
                    <svg
                      className="h-5 w-5 text-slate-500 dark:text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ),
              },
            ] as const
          ).map((opt) => (
            <OptionCard
              key={opt.id}
              label={opt.label}
              selected={wallpaperStyle === opt.id}
              onClick={() => patchWallpaper({ style: opt.id })}
            >
              {opt.preview}
            </OptionCard>
          ))}
        </div>

        {wallpaperStyle === 'fill' && (
          <div className="mb-4">
            <ColorPicker
              label="Fill color"
              value={wallpaper.fillColor || '#0a0a0a'}
              onChange={(fillColor) => patchWallpaper({ fillColor })}
            />
          </div>
        )}

        {wallpaperStyle === 'gradient' && (
          <>
            <SettingSection title="Gradient style">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => patchWallpaper({ gradientMode: 'custom' })}
                  className={cn(
                    'flex-1 rounded-2xl border py-4 text-sm font-semibold transition-all',
                    (wallpaper.gradientMode || 'custom') === 'custom'
                      ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
                  )}
                >
                  Custom
                </button>
                <button
                  type="button"
                  onClick={() => patchWallpaper({ gradientMode: 'premade' })}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all',
                    wallpaper.gradientMode === 'premade'
                      ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
                  )}
                >
                  Pre-made
                </button>
              </div>
            </SettingSection>

            {(wallpaper.gradientMode || 'custom') === 'custom' ? (
              <div className="mb-4 space-y-3">
                <ColorPicker
                  label="Gradient from"
                  value={wallpaper.gradientFrom || '#B04C40'}
                  onChange={(gradientFrom) => patchWallpaper({ gradientFrom })}
                />
                <ColorPicker
                  label="Gradient to"
                  value={wallpaper.gradientTo || '#A3C6D3'}
                  onChange={(gradientTo) => patchWallpaper({ gradientTo })}
                />
              </div>
            ) : (
              <SettingSection title="Gradient">
                <div className="no-scrollbar flex gap-4 overflow-x-auto pt-2 pb-2">
                  {PREMADE_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      title={g.id}
                      onClick={() =>
                        patchWallpaper({
                          premadeId: g.id,
                          gradientFrom: g.from,
                          gradientTo: g.to,
                          gradientMode: 'premade',
                        })
                      }
                      className={cn(
                        'h-12 w-12 shrink-0 rounded-full border-2 shadow-lg transition-transform hover:scale-110',
                        wallpaper.premadeId === g.id ? 'border-primary-500 scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundImage: g.css }}
                    />
                  ))}
                </div>
              </SettingSection>
            )}
          </>
        )}

        {wallpaperStyle === 'pattern' && (
          <div className="mb-4 space-y-4">
            <ColorPicker
              label="Pattern base color"
              value={wallpaper.fillColor || '#0a0a0a'}
              onChange={(fillColor) => patchWallpaper({ fillColor })}
            />
            <div className="flex gap-3">
              {(
                [
                  { id: 'dots' as WallpaperPatternId, label: 'Dots' },
                  { id: 'grid' as WallpaperPatternId, label: 'Grid' },
                  { id: 'diagonal' as WallpaperPatternId, label: 'Diagonal' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => patchWallpaper({ patternId: p.id })}
                  className={cn(
                    'flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all',
                    (wallpaper.patternId || 'dots') === p.id
                      ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {wallpaperNeedsMedia(wallpaperStyle) && (
          <VCardMediaField
            variant="inset"
            value={bgMediaUrl}
            onChange={(url) => setBackgroundMedia(url || '')}
            profileId={profileId}
            attachmentType={FIELD_BACKGROUND_MEDIA}
            accept={mediaAccept}
            maxBytes={MAX_MEDIA_UPLOAD_BYTES}
            selectPlaceholder="Select media file"
            subtitle={
              wallpaperStyle === 'blur'
                ? `Blurred cover media • Max ${MAX_MEDIA_UPLOAD_MB}MB`
                : wallpaperStyle === 'video'
                  ? `Video loop • Max ${MAX_MEDIA_UPLOAD_MB}MB`
                  : `Cover image • Max ${MAX_MEDIA_UPLOAD_MB}MB`
            }
            previewKind="auto"
            previewClassName="aspect-video max-h-56"
            placeholderImage="https://images.unsplash.com/photo-1555952517-2e8e729e0b44?auto=format&fit=crop&w=800&q=80"
          >
            <MediaSourceActions mode="both" onSelect={(asset) => setBackgroundMedia(asset.url)} />
          </VCardMediaField>
        )}
      </SettingSection>

      <div className="pt-20"></div>
    </div>
  )
}

const FieldCard: React.FC<{
  title: string
  config: DisplayFieldConfig
  onPatch: (patch: Partial<DisplayFieldConfig>) => void
  colorPreview: { text: string; bg: string; icon: string }
  showTextCol?: boolean
  showBgCol?: boolean
  iconColLabel?: string
  showInput?: boolean
  toggleLabel?: string
}> = ({
  title,
  config,
  onPatch,
  colorPreview,
  showTextCol = false,
  showBgCol = false,
  iconColLabel = '',
  showInput = false,
  toggleLabel = '',
}) => {
  return (
    <div className="relative flex h-full min-w-0 flex-col rounded-[1.25rem] border border-black/5 bg-white p-5 shadow-sm transition-all hover:border-black/10 hover:shadow-md dark:border-white/5 dark:bg-[#0b0f19] dark:hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="-m-1 hidden cursor-grab p-1 text-slate-400 transition-colors hover:text-slate-600 sm:block dark:text-slate-500 dark:hover:text-slate-300">
            <Menu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[.9375rem] font-bold text-slate-900 dark:text-white">{title}</h3>
            {toggleLabel ? (
              <p className="mt-0.5 text-[.75rem] font-medium text-slate-500 dark:text-slate-400">{toggleLabel}</p>
            ) : (
              <p className="mt-0.5 text-[.75rem] font-medium text-slate-500 dark:text-slate-400">
                Manage visibility and styling
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="cursor-grab p-1 text-slate-400 sm:hidden dark:text-slate-500">
            <Menu className="h-5 w-5" />
          </div>
          <Toggle checked={config.visible} onChange={(visible) => onPatch({ visible })} />
        </div>
      </div>

      {(showInput || showTextCol || showBgCol || iconColLabel) && (
        <div className="mt-5 flex flex-col gap-3">
          {showInput && (
            <input
              type="text"
              value={config.customValue ?? ''}
              onChange={(e) => onPatch({ customValue: e.target.value })}
              placeholder="Enter URL or value..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[.8125rem] font-medium text-slate-900 shadow-sm transition-shadow outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          )}

          {(showTextCol || showBgCol || iconColLabel) && (
            <div className="mt-1 flex flex-col gap-3">
              {showTextCol && (
                <ColorPicker
                  label="Text color"
                  value={config.textColor ?? colorPreview.text}
                  onChange={(textColor) => onPatch({ textColor })}
                />
              )}
              {showBgCol && (
                <ColorPicker
                  label="Background color"
                  value={config.backgroundColor ?? colorPreview.bg}
                  onChange={(backgroundColor) => onPatch({ backgroundColor })}
                />
              )}
              {iconColLabel && (
                <ColorPicker
                  label={iconColLabel}
                  value={config.iconColor ?? colorPreview.icon}
                  onChange={(iconColor) => onPatch({ iconColor })}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CardSeoPanel() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  const addKeyword = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    setKeywords((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setKeywordInput('')
  }

  const removeKeyword = (keyword: string) => {
    setKeywords((prev) => prev.filter((item) => item !== keyword))
  }

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    addKeyword(keywordInput)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-[.8125rem] leading-relaxed font-semibold text-slate-500">
        SEO for this specific card — only users who can open Card Settings can edit these fields.
      </p>
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/2">
        <h4 className="text-sm font-black text-slate-900 dark:text-white">Custom metadata</h4>
        <input type="text" placeholder="Meta title (Example: @yourname)" className={cardInputClasses} />
        <textarea
          placeholder="Meta description (Example: Make your link do more.)"
          className={cn(cardInputClasses, 'min-h-27.5 resize-none')}
        />
        <div
          className={cn(
            cardInputClasses,
            'focus-within:border-primary-500 focus-within:ring-primary-500 flex min-h-13 flex-wrap items-center gap-2 py-2.5 focus-within:ring-1'
          )}
        >
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-500/25 dark:bg-primary-500/10 dark:text-primary-300 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[.75rem] font-semibold"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="hover:bg-primary-100 hover:text-primary-900 dark:hover:bg-primary-500/20 dark:hover:text-primary-200 rounded-md p-0.5 transition-colors"
                aria-label={`Remove keyword ${keyword}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder={
              keywords.length > 0
                ? 'Add another keyword and press Enter'
                : 'Meta keywords (Example: business, networking, vcard)'
            }
            className="min-w-30 flex-1 bg-transparent py-1 text-[.8125rem] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  )
}

function AiAgentTrainModal({
  open,
  onClose,
  onTrained,
}: {
  open: boolean
  onClose: () => void
  onTrained: (summary: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [about, setAbout] = useState('')
  const [step, setStep] = useState<'form' | 'training' | 'done'>('form')

  if (!open) return null

  const handleTrain = () => {
    if (!about.trim() && files.length === 0) {
      alert('Upload a document or write about your business first.')
      return
    }
    setStep('training')
    window.setTimeout(() => {
      setStep('done')
      const summary =
        about.trim().slice(0, 120) || (files[0] ? `Trained from ${files[0].name}` : 'Business profile trained')
      window.setTimeout(() => {
        onTrained(summary)
        setStep('form')
        setFiles([])
        setAbout('')
        onClose()
      }, 900)
    }, 1600)
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-[1.75rem] sm:p-7 dark:border-white/10 dark:bg-[#0b0f19]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-3 pr-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/15">
            <Bot className="h-6 w-6 text-violet-600 dark:text-violet-300" />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Train AI Assistance</h3>
            <p className="text-[.75rem] font-semibold text-slate-500">
              Upload docs or describe your business — the assistant reads this and uses it when talking to guests.
            </p>
          </div>
        </div>

        {step === 'form' && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[.6875rem] font-black tracking-wider text-slate-400 uppercase">
                Information document upload
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center transition-colors hover:border-violet-400/50 dark:border-white/15 dark:bg-white/3"
              >
                <Upload className="mx-auto mb-2 h-6 w-6 text-violet-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Drop or choose files</p>
                <p className="mt-1 text-[.6875rem] font-semibold text-slate-400">PDF, DOC, DOCX, TXT</p>
              </button>
              {files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {files.map((f) => (
                    <li
                      key={f.name + f.size}
                      className="flex items-center gap-2 text-[.75rem] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                      <span className="truncate">{f.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-[.6875rem] font-black tracking-wider text-slate-400 uppercase">
                Write about your business
              </p>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Services, audience, tone, FAQs, offers — anything the agent should know…"
                className={cn(cardInputClasses, 'min-h-35 resize-none')}
              />
            </div>

            <button
              type="button"
              onClick={handleTrain}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-[.8125rem] font-black tracking-wider text-white uppercase hover:bg-violet-700 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> Read & train assistant
            </button>
          </div>
        )}

        {step === 'training' && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-violet-500" />
            <p className="text-sm font-black text-slate-900 dark:text-white">Reading & training…</p>
            <p className="mt-1 text-[.75rem] font-semibold text-slate-500">
              The assistant is learning how to talk about your business with guests.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
            <p className="text-sm font-black text-slate-900 dark:text-white">Assistant trained</p>
            <p className="mt-1 text-[.75rem] font-semibold text-slate-500">
              Ready to chat with guests using your business knowledge.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function CardAiAssistancePanel() {
  const { vCardData, updateData } = useVCard()
  const active = isAiAssistanceEnabled(vCardData.aiAssistanceEnabled)
  const [showTrain, setShowTrain] = useState(false)
  const [lastTrain, setLastTrain] = useState<string | null>(null)

  return (
    <div className="max-w-3xl space-y-5">
      <p className="text-[.8125rem] leading-relaxed font-semibold text-slate-500">
        AI Assistance talks with guests on this public vCard. Separate from Canva Integration. Turn it active, train
        with documents or a business brief, then guests can chat with your assistant.
      </p>

      <div className="rounded-2xl border border-violet-200/70 bg-linear-to-br from-violet-50/80 via-white to-indigo-50/40 p-5 dark:border-violet-500/25 dark:from-violet-500/10 dark:via-[#0b0f19] dark:to-indigo-500/5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white">AI Assistance</p>
              <p className="mt-0.5 text-[.75rem] font-semibold text-slate-500">
                {active
                  ? 'Active — guests can talk to your assistant on this card'
                  : 'Inactive — turn on so guests can chat with your assistant'}
              </p>
              {lastTrain && (
                <p className="mt-1 truncate text-[.6875rem] font-semibold text-violet-600 dark:text-violet-300">
                  Last train: {lastTrain}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateData('aiAssistanceEnabled', !active)}
            className={cn(
              'relative inline-flex h-8 w-14 shrink-0 items-center self-start rounded-full transition-colors sm:self-center',
              active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            )}
            title={active ? 'Deactivate AI Assistance' : 'Activate AI Assistance'}
          >
            <span
              className={cn(
                'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
                active ? 'translate-x-6.5' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!active}
            onClick={() => setShowTrain(true)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-[.6875rem] font-black tracking-wider uppercase',
              active
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Train with docs / business brief
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
        <p className="text-[.6875rem] font-black tracking-wider text-slate-400 uppercase">How it works</p>
        <ol className="list-decimal space-y-1.5 pl-4 text-[.75rem] font-semibold text-slate-600 dark:text-slate-300">
          <li>Turn AI Assistance Active for this card.</li>
          <li>Train with document uploads and/or write about your business.</li>
          <li>Guests chat with the assistant on your public vCard using that knowledge.</li>
        </ol>
      </div>

      <AiAgentTrainModal
        open={showTrain}
        onClose={() => setShowTrain(false)}
        onTrained={(summary) => setLastTrain(summary)}
      />
    </div>
  )
}

type TabSettingProps = {
  basePath: EditorBasePath
  settingsTab?: SettingsTabId
  cardId?: string
}

export function TabSetting({ basePath, settingsTab = 'info', cardId }: TabSettingProps) {
  const { vCardData, updateData } = useVCard()
  const display = getDisplaySettingsFromVCard(vCardData)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isActive: isTourActive, editorAssist, currentStep, startTour } = useDashboardTour()

  const activeTab = isTourActive && currentStep?.id && editorAssist.settingsTab ? editorAssist.settingsTab : settingsTab

  const patchDisplay = (next: VCardDisplaySettings) => updateData('displaySettings', next)

  const patchField = (key: string, patch: Partial<DisplayFieldConfig>) => {
    if (activeTab === 'navbar' && typeof patch.visible === 'boolean' && key !== 'Nav Background Color') {
      const withVisibility = patchDisplayField(display, key, patch)
      patchDisplay(syncEditorNavOrderAfterNavVisibilityChange(withVisibility, key, patch.visible))
      return
    }
    patchDisplay(patchDisplayField(display, key, patch))
  }

  const categoryKeys = CATEGORY_FIELDS[activeTab] ?? []
  const categoryAllEnabled =
    categoryKeys.length > 0 && categoryKeys.every((key) => display.fields[key]?.visible !== false)
  const contentTourId = settingContentTourIds[activeTab]

  const profileTemplate = (vCardData.appearance?.profileTemplate ?? 'v2') as 'v1' | 'v2'
  const colorPreview = {
    text: getFieldColorPreview('text', vCardData.theme, profileTemplate),
    bg: getFieldColorPreview('bg', vCardData.theme, profileTemplate),
    icon: getFieldColorPreview('icon', vCardData.theme, profileTemplate),
  }

  const renderFieldCards = (
    keys: readonly string[],
    options: { showTextCol?: boolean; showBgCol?: boolean; iconColLabel?: string; showInput?: boolean }
  ) =>
    keys.map((key) => (
      <FieldCard
        key={key}
        title={key}
        config={display.fields[key] ?? { visible: true }}
        onPatch={(patch) => patchField(key, patch)}
        colorPreview={colorPreview}
        {...options}
      />
    ))

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderFieldCards(MY_INFO_FIELDS, { showTextCol: true, showBgCol: true })
      case 'social':
        return renderFieldCards(SOCIAL_LINK_FIELDS, { showTextCol: true, showBgCol: true })
      case 'icons':
        return renderFieldCards(ICON_FIELDS, { iconColLabel: '@Color: MyInfo Icon' })
      case 'general':
        return renderFieldCards(GENERAL_SETTINGS_FIELDS, { showTextCol: true, showBgCol: true })
      case 'home':
        return renderFieldCards(HOME_PAGE_FIELDS, { showInput: true })
      case 'navbar':
        return getNavBarSettingKeysInOrder(display).map((key) => {
          const item = NAV_BAR_NAV_ITEMS.find((nav) => nav.label === key)
          const title = item ? vCardData.tabLabelOverrides?.[item.id]?.trim() || getEditorNavLabel(item) : key
          return (
            <FieldCard
              key={key}
              title={title}
              config={display.fields[key] ?? { visible: true }}
              onPatch={(patch) => patchField(key, patch)}
              colorPreview={colorPreview}
              showBgCol
            />
          )
        })
      case 'template':
        return <TemplateDesigner />
      case 'seo':
        return <CardSeoPanel />
      case 'ai-assistance':
        return <CardAiAssistancePanel />
      default:
        return null
    }
  }

  const headerSubtitle =
    activeTab === 'seo'
      ? 'Per-card SEO metadata for this public profile.'
      : activeTab === 'ai-assistance'
        ? 'Guest-facing assistant for this card — chats with visitors about your business.'
        : 'Configure how elements are displayed on your vCard. Changes take effect automatically.'

  const showEnableAll = !TABS_WITHOUT_ENABLE_ALL.has(activeTab)

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="relative flex min-h-212.5 w-full flex-col overflow-hidden rounded-[2.5rem] border border-black/10 bg-slate-100/80 shadow-sm backdrop-blur-2xl md:flex-row md:overflow-visible dark:border-white/10 dark:bg-[#0b0f19]/80">
        {/* Subtle inner top highlight */}
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-linear-to-r from-transparent via-white/20 to-transparent" />

        {/* Left Sidebar for Settings */}
        <div
          className={cn(
            'z-10 flex shrink-0 flex-col gap-2 border-b border-black/5 bg-transparent transition-all duration-300 md:sticky md:top-4 md:self-start md:border-r md:border-b-0 dark:border-white/5',
            isSidebarCollapsed ? 'w-full p-2 md:w-22.5 md:p-4' : 'w-full p-8 md:w-75'
          )}
        >
          <div
            className={cn(
              'mb-6 flex items-center transition-all duration-300',
              isSidebarCollapsed ? 'justify-center gap-0' : 'gap-4'
            )}
          >
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.125rem] border shadow-sm">
              <Settings2 className="text-primary-600 dark:text-primary-400 h-6 w-6" />
            </div>
            <h2
              className={cn(
                'text-[1.125rem] leading-tight font-black whitespace-nowrap text-slate-900 transition-all duration-300 dark:text-white',
                isSidebarCollapsed ? 'hidden' : 'opacity-100'
              )}
            >
              Card Settings
            </h2>
          </div>

          <div
            className={cn(
              'mt-4 mb-3 flex items-center px-2',
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <h3
              className={cn(
                'text-[.6875rem] font-black tracking-widest whitespace-nowrap text-slate-500 uppercase transition-all duration-300 dark:text-slate-400',
                isSidebarCollapsed ? 'hidden' : 'opacity-100'
              )}
            >
              Configuration
            </h3>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden shrink-0 cursor-pointer rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-black/5 md:flex dark:hover:bg-white/5"
              aria-label={isSidebarCollapsed ? 'Expand settings sidebar' : 'Collapse settings sidebar'}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {settingTabs.map((tab) => (
            <Link
              key={tab.id}
              href={buildEditorSettingsPath(basePath, tab.id as SettingsTabId, cardId)}
              prefetch={false}
              onClick={(event) => {
                if (event.defaultPrevented) return
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                pushEditorPath(buildEditorSettingsPath(basePath, tab.id as SettingsTabId, cardId))
              }}
              data-tour-id={settingTabTourIds[tab.id]}
              className={cn(
                'group relative flex w-full items-center overflow-hidden rounded-[1.25rem] px-5 py-4 text-left text-[.8438rem] font-bold transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-primary-600 border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 my-1 scale-[1.02] border text-white shadow-sm'
                  : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
                isSidebarCollapsed ? 'justify-center px-0' : 'gap-3.5'
              )}
              title={tab.label}
            >
              <tab.icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0',
                  activeTab === tab.id ? 'dark:text-primary-400 text-white' : 'text-slate-500'
                )}
              />
              <span
                className={cn(
                  'truncate whitespace-nowrap transition-all duration-300',
                  isSidebarCollapsed ? 'w-0 opacity-0 md:hidden' : 'opacity-100'
                )}
              >
                {tab.label}
              </span>
            </Link>
          ))}

          {!isTourActive ? (
            <button
              type="button"
              onClick={() => startTour('create_card')}
              title="Take a tour"
              className={cn(
                'group relative mt-1 flex w-full items-center overflow-hidden rounded-[1.25rem] border border-transparent px-5 py-4 text-left text-[.8438rem] font-bold text-slate-600 transition-all duration-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
                isSidebarCollapsed ? 'justify-center px-0' : 'gap-3.5'
              )}
            >
              <Compass className="h-4.5 w-4.5 shrink-0 text-slate-500" />
              <span
                className={cn(
                  'truncate whitespace-nowrap transition-all duration-300',
                  isSidebarCollapsed ? 'w-0 opacity-0 md:hidden' : 'opacity-100'
                )}
              >
                Take a tour
              </span>
            </button>
          ) : null}
        </div>

        {/* Right Content Area */}
        <div className="relative z-0 flex flex-1 flex-col bg-transparent pb-10">
          <div className="bg-primary-500/5 pointer-events-none absolute top-0 right-0 h-125 w-125 rounded-full blur-[9.375rem]" />

          <div id={contentTourId} data-tour-id={contentTourId} className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* Section header */}
            <div className="relative z-10 flex shrink-0 flex-col justify-between gap-6 p-4 sm:p-8 md:flex-row md:items-start md:p-10">
              <div className="relative z-10 max-w-xl">
                <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">
                  {settingTabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-[.875rem] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  {headerSubtitle}
                </p>
              </div>
              {showEnableAll && (
                <div className="relative z-10 flex items-center gap-4 self-start rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-white/5 dark:bg-[#070a13]">
                  <span className="text-[.8125rem] font-bold text-slate-900 dark:text-white">Enable All</span>
                  <Toggle
                    checked={activeTab === 'info' ? display.globalEnabled : categoryAllEnabled}
                    onChange={(enabled) => {
                      if (activeTab === 'info') {
                        patchDisplay(
                          setCategoryEnableAll({ ...display, globalEnabled: enabled }, MY_INFO_FIELDS, enabled)
                        )
                        return
                      }
                      const keys = CATEGORY_FIELDS[activeTab]
                      if (!keys) return
                      if (activeTab === 'navbar') {
                        patchDisplay(
                          applyEnabledNavOrderToDisplaySettings(display, navIdsAfterEnableAll(display, enabled))
                        )
                        return
                      }
                      patchDisplay(setCategoryEnableAll(display, keys, enabled))
                    }}
                  />
                </div>
              )}
            </div>

            {/* Scrollable Grid */}
            <div className="relative z-10 flex-1 px-4 pb-32 sm:px-8 md:px-10">
              <div
                className={cn(
                  'animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700',
                  activeTab === 'template'
                    ? ''
                    : FIELD_CARD_TABS.has(activeTab)
                      ? 'mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2'
                      : 'mx-auto flex w-full max-w-4xl flex-col gap-4'
                )}
              >
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
