'use client'

import { CanvaConnectRow } from '@/components/canva'
import { VCardTemplateDesignPanel } from '@/components/VCardTemplateDesignPanel'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { useVCard } from '@/lib/VCardContext'
import { appearanceFromDesignSettings } from '@/lib/vcardDesignDefaults'
import {
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
} from '@/lib/vcardDisplaySettings'
import { buildEditorSettingsPath, type EditorBasePath, type SettingsTabId } from '@/lib/vcardEditorRoutes'
import { useAuth } from '@/providers/AuthProvider'
import type { VCardAppearance } from '@/types/vcard'
import type { DisplayFieldConfig, VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { cn } from '@/utils/cn'
import {
  Globe,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Menu,
  Palette,
  Settings2,
  Star,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

const settingTabs = [
  { id: 'info', label: 'My Info Color Settings', icon: Palette },
  { id: 'social', label: 'Social and general Links', icon: Link2 },
  { id: 'icons', label: 'Icons', icon: Star },
  { id: 'general', label: 'General Settings', icon: Settings2 },
  { id: 'home', label: 'Home Page Settings', icon: Home },
  { id: 'navbar', label: 'Nav Bar settings', icon: Menu },
  { id: 'template', label: 'Template', icon: LayoutTemplate },
]

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
  isPro = false,
}: {
  label: string
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  isPro?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all duration-200',
        selected
          ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 shadow-sm'
          : 'hover:border-primary-500/50 border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
      )}
    >
      {isPro && (
        <div className="absolute top-2 right-2 mx-auto flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-2.5 w-2.5" />
        </div>
      )}
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
  const [localValue, setLocalValue] = useState(defaultValue || '#000000')
  const displayValue = value !== undefined ? value : localValue

  const handleChange = (val: string) => {
    if (onChange) {
      onChange(val)
    } else {
      setLocalValue(val)
    }
  }

  return (
    <div className="hover:border-primary-500/50 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-white/10 dark:bg-[#070a13]">
      <span className="text-[.8125rem] font-semibold text-slate-900 dark:text-white">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          className="focus:text-primary-600 dark:focus:text-primary-400 w-20 bg-transparent text-right font-mono text-[.75rem] font-medium text-slate-500 uppercase outline-none dark:text-slate-400"
        />
        <div className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-slate-200 shadow-sm dark:border-white/20">
          <input
            type="color"
            value={displayValue}
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
      <label className="group relative flex cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="peer peer-checked:bg-primary-600 h-6 w-11 rounded-full bg-slate-200 shadow-sm peer-hover:bg-slate-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 dark:peer-hover:bg-slate-600"></div>
      </label>
    </div>
  )
}

function TemplateDesigner() {
  const { user } = useAuth()
  const { vCardData, updateData } = useVCard()
  const accountDesign = useAppSelector((s) => s.designSettings)

  const cardAppearance: VCardAppearance = vCardData.appearance ?? appearanceFromDesignSettings(accountDesign)

  const patchAppearance = (patch: Partial<VCardAppearance>) => {
    updateData('appearance', { ...cardAppearance, ...patch })
  }

  const layoutStyle = cardAppearance.layoutStyle

  const [titleStyle, setTitleStyle] = useState('Text')
  const [titleSize, setTitleSize] = useState('Small')

  const [wallpaperStyle, setWallpaperStyle] = useState('Gradient')
  const [gradientStyle, setGradientStyle] = useState('Custom')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit!')
        return
      }
      setLogoFile(file)
    }
  }

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
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#070a13]">
              <span className="text-[.8125rem] font-medium text-slate-400">vbiz.me/</span>
              <input
                type="text"
                value={vCardData.slug}
                onChange={(e) => updateData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-name"
                className="dark:text-primary-400 flex-1 bg-transparent text-[.8125rem] font-semibold text-slate-900 outline-none"
              />
            </div>
            <p className="mt-2.5 ml-1 text-[.6875rem] font-medium text-slate-500 dark:text-slate-400">
              This will be your live URL. Use only lowercase letters, numbers, and dashes.
            </p>
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
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-slate-800">
            <svg className="h-6 w-6 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[.8125rem] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            + Add
          </button>
        </div>
      </SettingSection>

      <SettingSection title="Title">
        <input
          type="text"
          defaultValue="@zakirhossaib736"
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 shadow-sm transition-shadow outline-none focus:ring-1 dark:border-white/10 dark:bg-[#070a13] dark:text-white"
        />
      </SettingSection>

      <SettingSection title="Title style">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setTitleStyle('Text')}
              className={cn(
                'flex-1 rounded-2xl border py-4 text-sm font-semibold transition-all',
                titleStyle === 'Text'
                  ? 'border-primary-600 bg-primary-600/5 dark:text-primary-400 dark:bg-primary-500/15 dark:border-primary-500/30 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
              )}
            >
              Aa Text
            </button>
            <button
              onClick={() => setTitleStyle('Logo')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all',
                titleStyle === 'Logo'
                  ? 'border-primary-600 bg-primary-600/5 dark:text-primary-400 dark:bg-primary-500/15 dark:border-primary-500/30 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
              )}
            >
              <ImageIcon className="h-4 w-4" /> Logo
              <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-2.5 w-2.5" />
              </div>
            </button>
          </div>

          {titleStyle === 'Logo' && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <label className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-dashed border-black/10 bg-slate-50 transition-all hover:border-black/20 hover:bg-slate-100 dark:border-white/10 dark:bg-[#0b0f19] dark:hover:bg-[#27272a]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {logoFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="text-primary-600 dark:text-primary-400 h-8 w-8" />
                      <span className="max-w-50 truncate text-[.8125rem] font-bold text-slate-900 dark:text-white">
                        {logoFile.name}
                      </span>
                      <span className="text-[.6875rem] font-medium text-slate-500">Click to change</span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shadow-sm transition-transform group-hover:scale-110 dark:bg-slate-800">
                        <svg
                          className="h-5 w-5 text-slate-500 dark:text-slate-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                      </div>
                      <p className="mb-1 text-[.8125rem] text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-900 dark:text-white">Click to upload logo</span> or drag
                        and drop
                      </p>
                      <p className="mt-1 text-[.6875rem] font-medium tracking-widest text-slate-500 uppercase dark:text-slate-400">
                        SVG, PNG, JPG (MAX. 2MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/svg+xml,image/png,image/jpeg"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
          )}
        </div>
      </SettingSection>

      <div className="mt-2 mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-[.8125rem] font-bold text-slate-900 dark:text-white">Alternative title font</h3>
          <p className="text-[.6875rem] text-slate-500 dark:text-slate-400">Matches page font by default</p>
        </div>
        <Toggle isPro checked={false} onChange={() => {}} />
      </div>

      <div className="mb-10">
        <ColorPicker label="Title font color" defaultValue="#362630" />
      </div>

      {/* Button extras */}
      <div className="border-t border-black/10 pt-8 dark:border-white/10">
        <div className="mb-10 space-y-4">
          <ColorPicker label="Button color" defaultValue="#FFFFFF" />
          <ColorPicker label="Button text color" defaultValue="#362630" />
        </div>
      </div>

      {/* Typography colors */}
      <div className="border-t border-black/10 pt-8 dark:border-white/10">
        <div className="mb-10 space-y-4">
          <ColorPicker label="Page text color" defaultValue="#362630" />
        </div>

        <div className="mt-2 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[.8125rem] font-bold text-slate-900 dark:text-white">Alternative title font</h3>
            <p className="text-[.6875rem] text-slate-500 dark:text-slate-400">Matches page font by default</p>
          </div>
          <Toggle isPro checked={false} onChange={() => {}} />
        </div>

        <div className="mb-8 space-y-4">
          <ColorPicker label="Title color" defaultValue="#362630" />
        </div>

        <SettingSection title="Title size">
          <div className="flex gap-4">
            <button
              onClick={() => setTitleSize('Small')}
              className={cn(
                'flex-1 rounded-2xl border py-4 text-sm font-semibold transition-all',
                titleSize === 'Small'
                  ? 'border-primary-600 bg-primary-600/5 dark:text-primary-400 dark:bg-primary-500/15 dark:border-primary-500/30 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
              )}
            >
              Small
            </button>
            <button
              onClick={() => setTitleSize('Large')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all',
                titleSize === 'Large'
                  ? 'border-primary-600 bg-primary-600/5 dark:text-primary-400 dark:bg-primary-500/15 dark:border-primary-500/30 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
              )}
            >
              Large
              <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-2.5 w-2.5" />
              </div>
            </button>
          </div>
        </SettingSection>
      </div>

      {/* Wallpaper */}
      <div className="border-t border-black/10 pt-8 dark:border-white/10">
        <SettingSection title="Wallpaper style">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pt-2 pb-4">
            <OptionCard label="Fill" selected={wallpaperStyle === 'Fill'} onClick={() => setWallpaperStyle('Fill')}>
              <div className="h-12 w-12 rounded-[.625rem] bg-slate-200 dark:bg-[#1e2333]"></div>
            </OptionCard>
            <OptionCard
              label="Gradient"
              selected={wallpaperStyle === 'Gradient'}
              onClick={() => setWallpaperStyle('Gradient')}
            >
              <div className="h-12 w-12 rounded-[.625rem] bg-linear-to-t from-[#B04C40] via-[#D1A0A6] to-[#A3C6D3]"></div>
            </OptionCard>
            <OptionCard label="Blur" selected={wallpaperStyle === 'Blur'} onClick={() => setWallpaperStyle('Blur')}>
              <div className="h-12 w-12 rounded-[.625rem] bg-[#e2e4e9]"></div>
            </OptionCard>
            <OptionCard
              label="Pattern"
              selected={wallpaperStyle === 'Pattern'}
              onClick={() => setWallpaperStyle('Pattern')}
              isPro
            >
              <div className="grid h-12 w-12 grid-cols-3 grid-rows-3 gap-0.5 overflow-hidden rounded-[.625rem] bg-[#e2e4e9] p-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-xs bg-white dark:bg-[#0b0f19]" />
                ))}
              </div>
            </OptionCard>
            <OptionCard
              label="Image"
              selected={wallpaperStyle === 'Image'}
              onClick={() => setWallpaperStyle('Image')}
              isPro
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[.625rem] bg-[#e2e4e9]">
                <ImageIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
            </OptionCard>
            <OptionCard
              label="Video"
              selected={wallpaperStyle === 'Video'}
              onClick={() => setWallpaperStyle('Video')}
              isPro
            >
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
            </OptionCard>
          </div>
        </SettingSection>

        {wallpaperStyle === 'Gradient' && (
          <>
            <SettingSection title="Gradient style">
              <div className="flex gap-4">
                <button
                  onClick={() => setGradientStyle('Custom')}
                  className={cn(
                    'flex-1 rounded-2xl border py-4 text-sm font-semibold transition-all',
                    gradientStyle === 'Custom'
                      ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
                  )}
                >
                  Custom
                </button>
                <button
                  onClick={() => setGradientStyle('Pre-made')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all',
                    gradientStyle === 'Pre-made'
                      ? 'border-primary-600 bg-primary-600/5 dark:bg-primary-500/15 dark:text-primary-400 dark:border-primary-500/30 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
                  )}
                >
                  Pre-made
                  <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                    <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-2.5 w-2.5" />
                  </div>
                </button>
              </div>
            </SettingSection>

            {gradientStyle === 'Pre-made' && (
              <SettingSection title="Gradient">
                <div className="no-scrollbar flex gap-4 overflow-x-auto pt-2 pb-2">
                  {[
                    'from-[#DBA6CA] to-[#E5BDD9]',
                    'from-[#DF8C4C] to-[#EFC6A6]',
                    'from-[#CBEA8B] to-[#E3F2BE]',
                    'from-[#A9E88E] to-[#D5F0C6]',
                    'from-[#342F79] to-[#804253]',
                    'from-[#120F3B] to-[#51365F]',
                    'from-[#3F4882] to-[#B3709B]',
                    'bg-[linear-gradient(to_top,#B04C40,#D1A0A6,#A3C6D3)]',
                    'bg-[#B2462E]',
                  ].map((g, i) => (
                    <button
                      key={i}
                      className={cn(
                        'h-12 w-12 shrink-0 rounded-full transition-transform hover:scale-110',
                        g.startsWith('bg-') ? g : `bg-linear-to-tr ${g}`,
                        'border-2 border-transparent shadow-lg focus:border-white'
                      )}
                    />
                  ))}
                </div>
              </SettingSection>
            )}
          </>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h3 className="text-[.8125rem] font-bold text-slate-900 dark:text-white">Noise</h3>
            <p className="text-[.6875rem] text-slate-500 dark:text-slate-400">Add a subtle grain texture</p>
          </div>
          <Toggle checked={false} onChange={() => {}} />
        </div>
      </div>

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
    <div className="relative flex flex-col rounded-[1.25rem] border border-black/5 bg-white p-5 shadow-sm transition-all hover:border-black/10 hover:shadow-md dark:border-white/5 dark:bg-[#0b0f19] dark:hover:border-white/10">
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
        <div className="mt-5 flex flex-col gap-3 sm:pl-9">
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
            <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

type TabSettingProps = {
  basePath: EditorBasePath
  settingsTab?: SettingsTabId
  cardId?: string
}

export function TabSetting({ basePath, settingsTab = 'info', cardId }: TabSettingProps) {
  const { vCardData, updateData } = useVCard()
  const display = getDisplaySettingsFromVCard(vCardData)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isActive: isTourActive, editorAssist, currentStep } = useDashboardTour()

  const activeTab = isTourActive && currentStep?.id && editorAssist.settingsTab ? editorAssist.settingsTab : settingsTab

  const patchDisplay = (next: VCardDisplaySettings) => updateData('displaySettings', next)

  const patchField = (key: string, patch: Partial<DisplayFieldConfig>) => {
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
        return renderFieldCards(NAV_BAR_FIELDS, { showBgCol: true })
      case 'template':
        return <TemplateDesigner />
      default:
        return null
    }
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="relative flex min-h-212.5 w-full flex-col overflow-hidden rounded-[2.5rem] border border-black/10 bg-slate-100/80 shadow-sm backdrop-blur-2xl md:flex-row dark:border-white/10 dark:bg-[#0b0f19]/80">
        {/* Subtle inner top highlight */}
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-linear-to-r from-transparent via-white/20 to-transparent" />

        {/* Left Sidebar for Settings */}
        <div
          className={cn(
            'hidden-scrollbar z-10 flex shrink-0 flex-col gap-2 overflow-y-auto border-b border-black/5 bg-transparent transition-all duration-300 md:border-r md:border-b-0 dark:border-white/5',
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
        </div>

        {/* Right Content Area */}
        <div className="relative z-0 flex h-full flex-1 flex-col bg-transparent pb-10">
          <div className="bg-primary-500/5 pointer-events-none absolute top-0 right-0 h-125 w-125 rounded-full blur-[9.375rem]" />

          <div id={contentTourId} data-tour-id={contentTourId} className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* Sticky Header */}
            <div className="relative z-10 flex shrink-0 flex-col justify-between gap-6 p-4 sm:p-8 md:flex-row md:items-start md:p-10">
              <div className="relative z-10 max-w-xl">
                <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">
                  {settingTabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-[.875rem] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  Configure how elements are displayed on your vCard. Changes take effect automatically.
                </p>
              </div>
              {activeTab !== 'template' && (
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
                      if (keys) patchDisplay(setCategoryEnableAll(display, keys, enabled))
                    }}
                  />
                </div>
              )}
            </div>

            {/* Scrollable Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto scroll-smooth px-4 pb-32 sm:px-8 md:px-10">
              <div
                className={cn(
                  'animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700',
                  activeTab === 'template' ? '' : 'mx-auto flex w-full max-w-4xl flex-col gap-4'
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
