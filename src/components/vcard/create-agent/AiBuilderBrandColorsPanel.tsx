'use client'

import { ColorSwatchInput, useLiveCssColor } from '@/components/vcard/HexColorControl'
import {
  describeBrandThemeSource,
  shouldApplyBrandThemeConfig,
  type ThemeRecommendation,
} from '@/lib/ai/themeFromRecommendation'
import type { CardThemeConfig, ThemeMode } from '@/lib/theme/cardThemeContract'
import { patchModeBrandColor } from '@/lib/theme/resolveCardTheme'
import { cn } from '@/utils/cn'
import { Palette } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function RoleColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const live = useLiveCssColor(value || '#000000', onChange)
  return (
    <label className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 dark:border-white/10 dark:bg-slate-950/50">
      <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/15">
          <ColorSwatchInput label={label} swatch={live.swatch} onChange={live.onPicker} overlay />
        </span>
        <input
          type="text"
          aria-label={`${label} hex`}
          value={live.text}
          onChange={(e) => live.onTextChange(e.target.value)}
          onPaste={live.onPaste}
          onBlur={live.onBlur}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
    </label>
  )
}

export function AiBuilderBrandColorsPanel({
  themeConfig,
  recommendation,
  onThemeConfigChange,
}: {
  themeConfig: CardThemeConfig
  recommendation: ThemeRecommendation | null
  onThemeConfigChange: (next: CardThemeConfig) => void
}) {
  const [mode, setMode] = useState<ThemeMode>(themeConfig.colors.defaultMode === 'light' ? 'light' : 'dark')
  const [open, setOpen] = useState(true)
  const configRef = useRef(themeConfig)
  useEffect(() => {
    configRef.current = themeConfig
  }, [themeConfig])

  const set = themeConfig.colors[mode]
  const picked = shouldApplyBrandThemeConfig(recommendation)
  const sourceNote = describeBrandThemeSource(recommendation)

  const patchRole = (role: 'primary' | 'secondary' | 'accent', value: string) => {
    const next = patchModeBrandColor(configRef.current, mode, role, value)
    configRef.current = next
    onThemeConfigChange(next)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Palette className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black text-slate-900 dark:text-white">Brand colors</span>
          <span className="block text-[10px] font-semibold text-slate-500">
            Global Color · Primary / Secondary / Accent
            {picked ? ` · from ${recommendation?.source || 'brand'}` : ' · defaults'}
          </span>
        </span>
        <span
          className={cn(
            'rounded-lg px-2 py-0.5 text-[10px] font-black',
            picked
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {picked ? 'Picked' : 'Default'}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3 dark:border-white/10">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{sourceNote}</p>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            {(['dark', 'light'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1.5 text-[10px] font-black capitalize transition-colors',
                  mode === id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <RoleColorField label="Primary" value={set.primary} onChange={(v) => patchRole('primary', v)} />
            <RoleColorField label="Secondary" value={set.secondary} onChange={(v) => patchRole('secondary', v)} />
            <RoleColorField label="Accent" value={set.accent} onChange={(v) => patchRole('accent', v)} />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-5 w-5 rounded-md border border-slate-200 shadow-inner"
              style={{ background: set.primary }}
            />
            <span
              className="h-5 w-5 rounded-md border border-slate-200 shadow-inner"
              style={{ background: set.secondary }}
            />
            <span
              className="h-5 w-5 rounded-md border border-slate-200 shadow-inner"
              style={{ background: set.accent }}
            />
            <span className="text-[10px] font-semibold text-slate-400">
              Preview · saved into Card Settings → Theme → Global Color
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
