'use client'

import { Button } from '@/components/ui'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import type {
  BannerModeColors,
  BannerVariant,
  CardThemeConfig,
  ContentCardModeColors,
  CornerStyle,
  FaqItemModeColors,
  ObjectFitMode,
  ObjectPositionMode,
  ReviewCardModeColors,
  ThemeMode,
  TopNavBarModeColors,
  TopNavVariant,
} from '@/lib/theme/cardThemeContract'
import { suggestBrandCompanions } from '@/lib/theme/colorAccessibility'
import { patchModeBrandColor } from '@/lib/theme/resolveCardTheme'
import {
  clearOneSectionStyleOverride,
  colorToHex,
  colorWithAlpha,
  deriveBannerMode,
  deriveContentCardMode,
  deriveFaqItemMode,
  deriveReviewCardMode,
  deriveTopNavBarMode,
  patchSectionStyleMode,
  readCssColor,
  type SectionStyleKey,
} from '@/lib/theme/sectionStyleDefaults'
import { notify } from '@/lib/toast/toast'
import { cn } from '@/utils/cn'
import { RotateCcw, Sparkles, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const COLOR_COMMIT_MS = 120

function ColorField({
  label,
  value,
  onChange,
  withOpacity = false,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  withOpacity?: boolean
}) {
  const [localValue, setLocalValue] = useState(value || '#000000')
  const [opacityOpen, setOpacityOpen] = useState(false)
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

  useEffect(() => () => flush(), [flush])

  useEffect(() => {
    if (pendingRef.current !== null) return
    setLocalValue(value || '#000000')
  }, [value])

  const handleChange = (val: string) => {
    setLocalValue(val)
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

  const parsed = readCssColor(localValue)
  const hex = parsed ? colorToHex(localValue) : '#000000'
  const alpha = parsed ? parsed.a : 1
  const alphaPct = Math.round(alpha * 100)

  const paint = (nextHex: string, nextAlpha: number) => {
    const safeHex = colorToHex(nextHex, '#000000')
    if (!withOpacity || nextAlpha >= 0.995) handleChange(safeHex)
    else handleChange(colorWithAlpha(safeHex, nextAlpha))
  }

  return (
    <div
      className="hover:border-primary-500/50 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-white/10 dark:bg-[#070a13]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) flush()
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[.8125rem] font-semibold text-slate-900 dark:text-white">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              'focus:text-primary-600 dark:focus:text-primary-400 bg-transparent text-right font-mono text-[.7rem] font-medium text-slate-500 outline-none dark:text-slate-400',
              withOpacity ? 'w-28 normal-case' : 'w-20 uppercase'
            )}
          />
          {withOpacity ? (
            <button
              type="button"
              onClick={() => setOpacityOpen((open) => !open)}
              className={cn(
                'rounded-lg border px-1.5 py-1 font-mono text-[10px] font-bold',
                opacityOpen
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
                  : 'border-slate-200 text-slate-500 dark:border-white/15 dark:text-slate-300'
              )}
              aria-pressed={opacityOpen}
              aria-label={`${label} opacity`}
            >
              {parsed ? `${alphaPct}%` : 'Opacity'}
            </button>
          ) : null}
          <div
            className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-slate-200 shadow-sm dark:border-white/20"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
          >
            <span className="absolute inset-0" style={{ backgroundColor: parsed ? localValue : hex }} />
            <input
              type="color"
              value={hex}
              onChange={(e) => (withOpacity ? paint(e.target.value, alpha) : handleChange(e.target.value))}
              className="absolute -inset-2.5 h-14 w-14 cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>
      {withOpacity && opacityOpen ? (
        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Opacity
          <input
            type="range"
            min={0}
            max={100}
            value={parsed ? alphaPct : 100}
            onChange={(e) => paint(hex, Number(e.target.value) / 100)}
            className="h-1.5 flex-1 accent-slate-700 dark:accent-slate-200"
          />
          <span className="w-8 text-right font-mono">{parsed ? alphaPct : 100}</span>
        </label>
      ) : null}
    </div>
  )
}

function ModeTabs({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-900">
      {(['light', 'dark'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[12px] font-bold capitalize transition-colors',
            mode === m
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function SuggestionChips({
  items,
  onPick,
}: {
  items: Array<{ label: string; value: string }>
  onPick: (value: string, label: string) => void
}) {
  if (!items.length) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <Sparkles className="h-3 w-3" /> Suggested
      </span>
      {items.map((item) => (
        <button
          key={`${item.label}-${item.value}`}
          type="button"
          onClick={() => onPick(item.value, item.label)}
          className="hover:border-primary-400 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
        >
          <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: item.value }} />
          {item.label}
        </button>
      ))}
    </div>
  )
}

export type ThemeConfigUpdater = (next: CardThemeConfig) => void

function syncFlatFromMode(
  themeConfig: CardThemeConfig,
  updateTheme: (path: string, value: string) => void,
  mode: ThemeMode
) {
  const set = themeConfig.colors[mode]
  updateTheme('theme.primaryColor', set.primary)
  updateTheme('theme.secondaryColor', set.secondary)
  updateTheme('theme.accentColor', set.accent)
}

/** Template Settings: light/dark Primary / Secondary / Accent + suggestions. */
export function ThemeBrandColorsPanel({
  themeConfig,
  onThemeConfigChange,
  onFlatThemePath,
  onReset,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
  onFlatThemePath: (path: string, value: string) => void
  onReset: () => void
}) {
  const [mode, setMode] = useState<ThemeMode>(themeConfig.colors.defaultMode === 'light' ? 'light' : 'dark')
  const set = themeConfig.colors[mode]
  const suggestions = useMemo(
    () => suggestBrandCompanions(set.primary, set.background, mode),
    [set.primary, set.background, mode]
  )

  const patchRole = (role: 'primary' | 'secondary' | 'accent', value: string) => {
    let next = patchModeBrandColor(themeConfig, mode, role, value)
    if (role === 'primary') {
      const companions = suggestBrandCompanions(value, next.colors[mode].background, mode)
      // Soft-suggest: only fill secondary/accent when still matching previous companions or identical to primary.
      const cur = themeConfig.colors[mode]
      if (cur.secondary === cur.primary || cur.secondary === suggestions.secondary) {
        next = patchModeBrandColor(next, mode, 'secondary', companions.secondary)
      }
      if (cur.accent === cur.primary || cur.accent === suggestions.accent) {
        next = patchModeBrandColor(next, mode, 'accent', companions.accent)
      }
    }
    onThemeConfigChange(next)
    if (mode === (themeConfig.colors.defaultMode === 'light' ? 'light' : 'dark')) {
      syncFlatFromMode(next, onFlatThemePath, mode)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Separate brand colors for light and dark. Picking Primary suggests companions and keeps text readable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModeTabs mode={mode} onChange={setMode} />
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset colors
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ColorField label="Primary" value={set.primary} onChange={(v) => patchRole('primary', v)} />
        <ColorField label="Secondary" value={set.secondary} onChange={(v) => patchRole('secondary', v)} />
        <ColorField label="Accent" value={set.accent} onChange={(v) => patchRole('accent', v)} />
      </div>
      <SuggestionChips
        items={[
          { label: 'Secondary', value: suggestions.secondary },
          { label: 'Accent', value: suggestions.accent },
        ]}
        onPick={(value, label) => {
          if (label === 'Secondary') patchRole('secondary', value)
          else patchRole('accent', value)
        }}
      />
    </div>
  )
}

function SectionResetRow({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex justify-end">
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
        Reset to global
      </Button>
    </div>
  )
}

function useSectionModeEditor(
  themeConfig: CardThemeConfig,
  onThemeConfigChange: ThemeConfigUpdater,
  key: SectionStyleKey
) {
  const [mode, setMode] = useState<ThemeMode>(themeConfig.colors.defaultMode === 'light' ? 'light' : 'dark')
  const colorSet = themeConfig.colors[mode]

  const patch = (fields: Record<string, unknown>) => {
    onThemeConfigChange(patchSectionStyleMode(themeConfig, key, mode, fields) as CardThemeConfig)
  }

  const reset = () => {
    onThemeConfigChange(clearOneSectionStyleOverride(themeConfig, key) as CardThemeConfig)
  }

  return { mode, setMode, colorSet, patch, reset }
}

/** General Settings: tab banner styles. */
export function BannerStylePanel({
  themeConfig,
  onThemeConfigChange,
  profileId,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
  profileId?: string
}) {
  const { mode, setMode, colorSet, patch, reset } = useSectionModeEditor(
    themeConfig,
    onThemeConfigChange,
    'sectionBanner'
  )
  const resolved = deriveBannerMode(colorSet, mode, themeConfig.components.sectionBanner?.[mode])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const setVariant = (variant: BannerVariant) => patch({ variant })

  const uploadBannerImage = async (file: File) => {
    setUploading(true)
    try {
      const result = await uploadMediaWithProgress({
        file,
        profileId: profileId || undefined,
        attachmentType: 'Banner Image',
      })
      patch({ variant: 'image', imageUrl: result.url })
    } catch (err) {
      const message =
        err instanceof MediaUploadError ? err.message : err instanceof Error ? err.message : 'Upload failed'
      notify.error(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-2 mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-[#070a13]/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tab banner styles</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Soft gradient: primary stays a light tint, secondary covers most of the banner. Use Opacity on fill colors.
          </p>
        </div>
        <ModeTabs mode={mode} onChange={setMode} />
      </div>
      <SectionResetRow onReset={reset} />
      <div className="flex flex-wrap gap-2">
        {(['gradient', 'solid', 'image'] as BannerVariant[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={cn(
              'rounded-xl border px-3 py-2 text-[12px] font-bold capitalize',
              (resolved.variant || 'gradient') === v
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
                : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['bg', 'Background', true],
            ['gradientFrom', 'Gradient from', true],
            ['gradientTo', 'Gradient to', true],
            ['border', 'Banner border', true],
            ['title', 'Title', false],
            ['description', 'Description', false],
            ['label', 'Label', false],
            ['text', 'Text', false],
            ['note', 'Note', false],
          ] as Array<[keyof BannerModeColors, string, boolean]>
        ).map(([field, label, withOpacity]) => (
          <ColorField
            key={field}
            label={label}
            withOpacity={withOpacity}
            value={String(resolved[field] || '#000000')}
            onChange={(v) => patch({ [field]: v })}
          />
        ))}
      </div>
      {(resolved.variant || 'gradient') === 'image' ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadBannerImage(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading…' : 'Upload banner image'}
          </Button>
          {resolved.imageUrl ? (
            <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{resolved.imageUrl}</span>
          ) : null}
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] dark:border-white/10 dark:bg-slate-900"
            value={resolved.imageFit || 'cover'}
            onChange={(e) => patch({ imageFit: e.target.value as ObjectFitMode })}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] dark:border-white/10 dark:bg-slate-900"
            value={resolved.imagePosition || 'center'}
            onChange={(e) => patch({ imagePosition: e.target.value as ObjectPositionMode })}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      ) : null}
    </div>
  )
}

export function ContentCardStylePanel({
  themeConfig,
  onThemeConfigChange,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
}) {
  const { mode, setMode, colorSet, patch, reset } = useSectionModeEditor(
    themeConfig,
    onThemeConfigChange,
    'contentCard'
  )
  const resolved = deriveContentCardMode(colorSet, themeConfig.components.contentCard?.[mode])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Services, blogs, portfolio, and similar content cards. Overrides follow light/dark separately.
        </p>
        <ModeTabs mode={mode} onChange={setMode} />
      </div>
      <SectionResetRow onReset={reset} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['bg', 'Card background'],
            ['border', 'Border'],
            ['title', 'Title'],
            ['text', 'Text'],
            ['description', 'Description'],
            ['icon', 'Icon'],
          ] as Array<[keyof ContentCardModeColors, string]>
        ).map(([field, label]) => (
          <ColorField
            key={field}
            label={label}
            value={String(resolved[field] || '#000000')}
            onChange={(v) => patch({ [field]: v })}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
          Image corners
          <select
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-slate-900"
            value={resolved.imageCorner || 'round'}
            onChange={(e) => patch({ imageCorner: e.target.value as CornerStyle })}
          >
            <option value="square">Square</option>
            <option value="soft">Soft</option>
            <option value="round">Round</option>
            <option value="pill">Pill</option>
          </select>
        </label>
        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
          Object fit
          <select
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-slate-900"
            value={resolved.imageFit || 'cover'}
            onChange={(e) => patch({ imageFit: e.target.value as ObjectFitMode })}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </label>
        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
          Object position
          <select
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-slate-900"
            value={resolved.imagePosition || 'center'}
            onChange={(e) => patch({ imagePosition: e.target.value as ObjectPositionMode })}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export function ReviewCardStylePanel({
  themeConfig,
  onThemeConfigChange,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
}) {
  const { mode, setMode, colorSet, patch, reset } = useSectionModeEditor(themeConfig, onThemeConfigChange, 'reviewCard')
  const resolved = deriveReviewCardMode(colorSet, themeConfig.components.reviewCard?.[mode])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Review cards, stars, and user chrome. Resets back to the global brand.
        </p>
        <ModeTabs mode={mode} onChange={setMode} />
      </div>
      <SectionResetRow onReset={reset} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['cardBg', 'Card background'],
            ['text', 'Text'],
            ['star', 'Star'],
            ['userName', 'User name'],
            ['userMeta', 'User meta'],
            ['sliderTrack', 'Slider track'],
            ['sliderFill', 'Slider fill'],
          ] as Array<[keyof ReviewCardModeColors, string]>
        ).map(([field, label]) => (
          <ColorField
            key={field}
            label={label}
            value={String(resolved[field] || '#000000')}
            onChange={(v) => patch({ [field]: v })}
          />
        ))}
      </div>
    </div>
  )
}

export function FaqItemStylePanel({
  themeConfig,
  onThemeConfigChange,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
}) {
  const { mode, setMode, colorSet, patch, reset } = useSectionModeEditor(themeConfig, onThemeConfigChange, 'faqItem')
  const resolved = deriveFaqItemMode(colorSet, themeConfig.components.faqItem?.[mode])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          FAQ question and answer surfaces. Follows global brand until you override.
        </p>
        <ModeTabs mode={mode} onChange={setMode} />
      </div>
      <SectionResetRow onReset={reset} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['questionBg', 'Question background'],
            ['questionFg', 'Question text'],
            ['answerBg', 'Answer background'],
            ['answerFg', 'Answer text'],
            ['border', 'Border'],
            ['icon', 'Icon'],
          ] as Array<[keyof FaqItemModeColors, string]>
        ).map(([field, label]) => (
          <ColorField
            key={field}
            label={label}
            value={String(resolved[field] || '#000000')}
            onChange={(v) => patch({ [field]: v })}
          />
        ))}
      </div>
    </div>
  )
}

/** General Settings: floating top navbar chrome. */
export function TopNavBarStylePanel({
  themeConfig,
  onThemeConfigChange,
}: {
  themeConfig: CardThemeConfig
  onThemeConfigChange: ThemeConfigUpdater
}) {
  const { mode, setMode, colorSet, patch, reset } = useSectionModeEditor(themeConfig, onThemeConfigChange, 'topNavBar')
  const resolved = deriveTopNavBarMode(colorSet, mode, themeConfig.components.topNavBar?.[mode])

  return (
    <div className="mt-2 mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-[#070a13]/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top navbar styles</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Bar background, item icons, and border. Defaults follow global Primary / Secondary / Accent for light and
            dark.
          </p>
        </div>
        <ModeTabs mode={mode} onChange={setMode} />
      </div>
      <SectionResetRow onReset={reset} />
      <div className="flex flex-wrap gap-2">
        {(['gradient', 'solid'] as TopNavVariant[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => patch({ variant: v })}
            className={cn(
              'rounded-xl border px-3 py-2 text-[12px] font-bold capitalize',
              (resolved.variant || 'gradient') === v
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
                : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'
            )}
          >
            {v === 'solid' ? 'Plane (solid)' : 'Gradient'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['bg', 'Navbar background'],
            ['gradientFrom', 'Gradient from'],
            ['gradientTo', 'Gradient to'],
            ['item', 'Nav item / icon'],
            ['itemActive', 'Active item / icon'],
            ['border', 'Navbar border'],
          ] as Array<[keyof TopNavBarModeColors, string]>
        ).map(([field, label]) => (
          <ColorField
            key={field}
            label={label}
            value={String(resolved[field] || '#000000')}
            onChange={(v) => patch({ [field]: v })}
          />
        ))}
      </div>
    </div>
  )
}
