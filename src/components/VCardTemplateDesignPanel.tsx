'use client'

import { ProfileTemplateLayoutSettings } from '@/components/ProfileTemplateLayoutSettings'
import { useGoogleFont, useGoogleFonts } from '@/hooks/useGoogleFont'
import {
  fontFamilyDisplayName,
  fontFamilyToStack,
  isPresetFontFamily,
  PRESET_FONT_OPTIONS,
  type PresetFontOption,
} from '@/lib/fonts'
import { useGetGoogleFontsQuery } from '@/redux/features/fonts/fonts.api'
import type { ButtonShadowId, VCardAppearance } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Loader2, Search, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const BUTTON_SHADOW_OPTIONS: { id: ButtonShadowId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'soft', label: 'Soft' },
  { id: 'strong', label: 'Strong' },
  { id: 'hard', label: 'Hard' },
]

const BUTTON_SHADOW_PREVIEW_CLASS: Record<ButtonShadowId, string> = {
  none: 'shadow-none',
  soft: 'shadow-[0_4px_14px_-4px_rgba(0,0,0,0.18)]',
  strong: 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.35)]',
  hard: 'shadow-[5px_5px_0_0_rgba(15,23,42,0.85)]',
}

const PRESET_FONT_IDS = PRESET_FONT_OPTIONS.map((f) => f.id)

function FontOptionCard({
  selected,
  onClick,
  title,
  description,
  stack,
}: {
  selected: boolean
  onClick: () => void
  title: string
  description: string
  stack: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-5 overflow-hidden rounded-3xl border p-6 text-left transition-all hover:shadow-md',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)]'
          : 'hover:border-primary-500/30 border-slate-200/80 bg-slate-50/30 dark:border-white/10 dark:bg-slate-800/20'
      )}
    >
      {selected && (
        <div className="from-primary-500/5 pointer-events-none absolute inset-0 bg-linear-to-br to-transparent" />
      )}
      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] transition-colors',
          selected ? 'border-primary-500' : 'group-hover:border-primary-400 border-slate-300/80 dark:border-slate-600'
        )}
      >
        {selected && <div className="bg-primary-500 h-2.5 w-2.5 rounded-full shadow-sm" />}
      </div>
      <div className="flex-1">
        <p className="mb-1.5 text-[18px] font-black text-slate-900 dark:text-white" style={{ fontFamily: stack }}>
          Aa — {title}
        </p>
        <p className="text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </button>
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
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all duration-200',
        selected
          ? 'border-primary-600 bg-primary-600/5 dark:border-primary-500/30 dark:bg-primary-500/15 shadow-sm'
          : 'hover:border-primary-500/50 border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5'
      )}
    >
      {isPro && (
        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <Zap className="text-primary-600 fill-primary-600 dark:text-primary-400 dark:fill-primary-400 h-2.5 w-2.5" />
        </div>
      )}
      <div className="mb-2 flex h-12 w-full items-center justify-center">{children}</div>
      <span
        className={cn(
          'text-[.75rem] font-semibold',
          selected ? 'dark:text-primary-400 text-slate-900' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {label}
      </span>
    </button>
  )
}

type VCardTemplateDesignPanelProps = {
  appearance: VCardAppearance
  onAppearanceChange: (patch: Partial<VCardAppearance>) => void
  fontFamily: string
  onFontFamilyChange: (fontId: string) => void
}

export function VCardTemplateDesignPanel({
  appearance,
  onAppearanceChange,
  fontFamily,
  onFontFamilyChange,
}: VCardTemplateDesignPanelProps) {
  const buttonStyle = appearance.buttonStyle || 'solid'
  const cornerStyle = appearance.cornerStyle || 'round'
  const buttonShadow: ButtonShadowId = appearance.buttonShadow ?? 'none'

  const [fontQuery, setFontQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(fontQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [fontQuery])

  useGoogleFonts(PRESET_FONT_IDS)
  useGoogleFont(fontFamily)

  const {
    data: fontResults = [],
    isFetching: fontsLoading,
    isError: fontsError,
  } = useGetGoogleFontsQuery({
    q: debouncedQuery || undefined,
    limit: 24,
  })

  const resultFamiliesKey = fontResults.map((f) => f.family).join('|')
  const resultFamilies = useMemo(() => (resultFamiliesKey ? resultFamiliesKey.split('|') : []), [resultFamiliesKey])
  useGoogleFonts(resultFamilies)

  const customSelected = !isPresetFontFamily(fontFamily)

  const setBtnStyle = (label: string) => {
    onAppearanceChange({ buttonStyle: label.toLowerCase() })
  }

  const setBtnRadius = (label: string) => {
    const mapped = label === 'Square' ? 'square' : label === 'Rounder' ? 'soft' : label === 'Full' ? 'pill' : 'round'
    onAppearanceChange({ cornerStyle: mapped })
  }

  const btnStyleLabel = buttonStyle.charAt(0).toUpperCase() + buttonStyle.slice(1)
  const btnRadiusLabel =
    cornerStyle === 'square' ? 'Square' : cornerStyle === 'soft' ? 'Rounder' : cornerStyle === 'pill' ? 'Full' : 'Round'

  return (
    <div className="mb-8 space-y-8" data-tour-id="tour-card-template-design">
      <ProfileTemplateLayoutSettings
        variant="compact"
        scope="vcard"
        mergeLayout
        appearance={appearance}
        onAppearanceChange={onAppearanceChange}
      />

      <div className="space-y-6 border-t border-slate-200/60 pt-8 dark:border-white/10">
        <SettingSection title="Button style">
          <div className="grid grid-cols-3 gap-4">
            <OptionCard label="Solid" selected={btnStyleLabel === 'Solid'} onClick={() => setBtnStyle('Solid')}>
              <div className="flex h-7 w-16 items-center justify-center rounded-lg bg-slate-200 dark:bg-[#1e2333]">
                <div className="h-1.5 w-6 rounded-full bg-slate-400/80" />
              </div>
            </OptionCard>
            <OptionCard label="Glass" selected={btnStyleLabel === 'Glass'} onClick={() => setBtnStyle('Glass')} isPro>
              <div className="flex h-7 w-16 items-center justify-center rounded-lg border border-black/20 bg-black/5 shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-white/5">
                <div className="h-1.5 w-6 rounded-full bg-white/30" />
              </div>
            </OptionCard>
            <OptionCard label="Outline" selected={btnStyleLabel === 'Outline'} onClick={() => setBtnStyle('Outline')}>
              <div className="flex h-7 w-16 items-center justify-center rounded-lg border-2 border-slate-600 bg-transparent">
                <div className="h-1.5 w-6 rounded-full bg-slate-600" />
              </div>
            </OptionCard>
          </div>
        </SettingSection>

        <SettingSection title="Corner roundness">
          <div className="grid grid-cols-4 gap-4">
            <OptionCard label="Square" selected={btnRadiusLabel === 'Square'} onClick={() => setBtnRadius('Square')}>
              <div className="h-6 w-6 border-t-[.1875rem] border-l-[.1875rem] border-slate-400" />
            </OptionCard>
            <OptionCard label="Round" selected={btnRadiusLabel === 'Round'} onClick={() => setBtnRadius('Round')}>
              <div className="h-6 w-6 rounded-tl-md border-t-[.1875rem] border-l-[.1875rem] border-slate-400" />
            </OptionCard>
            <OptionCard label="Rounder" selected={btnRadiusLabel === 'Rounder'} onClick={() => setBtnRadius('Rounder')}>
              <div className="h-6 w-6 rounded-tl-xl border-t-[.1875rem] border-l-[.1875rem] border-slate-400" />
            </OptionCard>
            <OptionCard label="Full" selected={btnRadiusLabel === 'Full'} onClick={() => setBtnRadius('Full')}>
              <div className="h-6 w-6 rounded-tl-full border-t-[.1875rem] border-l-[.1875rem] border-slate-400" />
            </OptionCard>
          </div>
        </SettingSection>

        <SettingSection title="Button shadow">
          <div className="grid grid-cols-4 gap-4">
            {BUTTON_SHADOW_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                selected={buttonShadow === option.id}
                onClick={() => onAppearanceChange({ buttonShadow: option.id })}
              >
                <div className="flex h-12 w-full items-center justify-center">
                  <div
                    className={cn(
                      'h-7 w-14 rounded-lg bg-slate-300 dark:bg-slate-500',
                      BUTTON_SHADOW_PREVIEW_CLASS[option.id]
                    )}
                  />
                </div>
              </OptionCard>
            ))}
          </div>
        </SettingSection>
      </div>

      <div className="border-t border-slate-200/60 pt-8 dark:border-white/10">
        <h4 className="mb-6 text-[15px] font-black text-slate-900 dark:text-white">Typography</h4>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {customSelected && (
            <FontOptionCard
              selected
              onClick={() => onFontFamilyChange(fontFamily)}
              title={fontFamilyDisplayName(fontFamily)}
              description="Selected Google Font for this card."
              stack={fontFamilyToStack(fontFamily)}
            />
          )}
          {PRESET_FONT_OPTIONS.map((font: PresetFontOption) => (
            <FontOptionCard
              key={font.id}
              selected={fontFamily === font.id}
              onClick={() => onFontFamilyChange(font.id)}
              title={font.name}
              description={font.desc}
              stack={font.stack}
            />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            {debouncedQuery ? 'Search results' : 'Suggested fonts'}
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={fontQuery}
              onChange={(e) => setFontQuery(e.target.value)}
              placeholder="Search Google Fonts…"
              className="focus:border-primary-500 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-10 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/40 dark:border-white/10 dark:bg-slate-900/40">
            {fontsLoading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading fonts…
              </div>
            )}
            {!fontsLoading && fontsError && (
              <p className="px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                Could not load Google Fonts. Check that the backend has GOOGLE_FONTS_API_KEY set.
              </p>
            )}
            {!fontsLoading && !fontsError && fontResults.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-500">No fonts found.</p>
            )}
            {!fontsLoading &&
              !fontsError &&
              fontResults.map((font) => {
                const selected = fontFamily === font.family
                return (
                  <button
                    key={font.family}
                    type="button"
                    onClick={() => onFontFamilyChange(font.family)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 border-b border-slate-200/60 px-4 py-2.5 text-left last:border-b-0 dark:border-white/5',
                      selected
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                        : 'hover:bg-white dark:hover:bg-white/5'
                    )}
                  >
                    <span
                      className="text-sm font-semibold text-slate-900 dark:text-white"
                      style={{ fontFamily: fontFamilyToStack(font.family) }}
                    >
                      {font.family}
                    </span>
                    <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      {font.category}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[.875rem] font-bold text-slate-900 dark:text-white">{title}</h3>
      {children}
    </div>
  )
}
