'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  setLayoutStyle,
  setProfileTemplate,
  type ProfileTemplateId,
} from '@/redux/features/designSettings/designSettings.slice'
import type { VCardAppearance } from '@/types/vcard'
import { cn } from '@/utils/cn'

const TEMPLATES: { id: ProfileTemplateId; title: string; description: string }[] = [
  {
    id: 'v3',
    title: 'Ocean Profile',
    description: 'Redesign home hero, notepad, and floating navigation (public default).',
  },
  {
    id: 'v2',
    title: 'Link in Bio',
    description: 'Bento dashboard home, cover video, and categorized floating navigation.',
  },
  {
    id: 'v1',
    title: 'Classic Profile',
    description: 'Geometric grid background, typewriter home, and compact icon dock navigation.',
  },
]

type ProfileTemplateLayoutSettingsProps = {
  /** Compact cards for vCard editor; roomy cards for account settings. */
  variant?: 'default' | 'compact'
  /** Template + layout under one heading with layout directly below templates. */
  mergeLayout?: boolean
  /** Show layout strategy (classic / hero) — only applies to Link in Bio (v2). */
  showLayout?: boolean
  /**
   * account — Profile Settings defaults for all new vCards.
   * vcard — This card only (pass appearance + onAppearanceChange from VCardContext).
   */
  scope?: 'account' | 'vcard'
  appearance?: VCardAppearance
  onAppearanceChange?: (patch: Partial<VCardAppearance>) => void
}

export function ProfileTemplateLayoutSettings({
  variant = 'default',
  mergeLayout = false,
  showLayout = true,
  scope = 'account',
  appearance: appearanceProp,
  onAppearanceChange,
}: ProfileTemplateLayoutSettingsProps) {
  const dispatch = useAppDispatch()
  const accountAppearance = useAppSelector((s) => ({
    profileTemplate: s.designSettings.profileTemplate ?? 'v2',
    layoutStyle: s.designSettings.layoutStyle,
    buttonStyle: s.designSettings.buttonStyle,
    cornerStyle: s.designSettings.cornerStyle,
  }))

  const isVCardScope = scope === 'vcard' && appearanceProp && onAppearanceChange
  const profileTemplate = isVCardScope ? appearanceProp.profileTemplate : accountAppearance.profileTemplate
  const layoutStyle = isVCardScope ? appearanceProp.layoutStyle : accountAppearance.layoutStyle

  const setTemplate = (id: ProfileTemplateId) => {
    if (isVCardScope) {
      const next = { ...appearanceProp, profileTemplate: id }
      if (id === 'v1' && next.layoutStyle === 'hero') {
        next.layoutStyle = 'classic'
      }
      onAppearanceChange(next)
      return
    }
    dispatch(setProfileTemplate(id))
  }

  const setLayout = (style: string) => {
    if (isVCardScope) {
      onAppearanceChange({ ...appearanceProp, layoutStyle: style })
      return
    }
    dispatch(setLayoutStyle(style))
  }

  const isCompact = variant === 'compact'

  const sectionTitle = mergeLayout ? 'Template & layout' : 'Profile template'

  return (
    <div className={mergeLayout ? 'space-y-5' : 'space-y-8'}>
      <div id="tour-card-template-picker" data-tour-id="tour-card-template-picker">
        <h4 className={cn('mb-4 font-black text-slate-900 dark:text-white', isCompact ? 'text-[14px]' : 'text-[15px]')}>
          {sectionTitle}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplate(tpl.id)}
              className={cn(
                'group relative overflow-hidden rounded-3xl border p-6 text-left transition-all',
                profileTemplate === tpl.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)]'
                  : 'hover:border-primary-500/30 border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/2'
              )}
            >
              {profileTemplate === tpl.id && (
                <div className="bg-primary-500 absolute top-4 right-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
              <div
                className={cn(
                  'relative mb-4 flex w-full flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-slate-800',
                  tpl.id === 'v2' ? 'h-24' : 'h-20'
                )}
              >
                {tpl.id === 'v2' ? (
                  <>
                    <div className="h-6 w-full rounded bg-slate-200 dark:bg-slate-600" />
                    <div className="mx-auto h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-500" />
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-3 rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3 rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-3 rounded bg-slate-100 dark:bg-slate-700" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-0.5 opacity-40">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-2 border border-slate-200 dark:border-slate-600" />
                      ))}
                    </div>
                    <div className="bg-yellow-primary/60 mx-auto mt-1 h-2 w-12 rounded-full" />
                  </>
                )}
              </div>
              <p className="mb-1 text-[15px] font-bold text-slate-900 dark:text-white">{tpl.title}</p>
              <p className="text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                {tpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {showLayout && (
        <div className={mergeLayout ? 'mt-5' : undefined}>
          {!mergeLayout && <div className="h-px w-full bg-slate-200/50 dark:bg-white/5" />}
          <div className={mergeLayout ? '' : 'mt-8 space-y-8'}>
            {!mergeLayout && (
              <h4
                className={cn(
                  'mb-1 font-black text-slate-900 dark:text-white',
                  isCompact ? 'text-[14px]' : 'text-[15px]'
                )}
              >
                Layout
              </h4>
            )}
            <p
              className={cn(
                'font-medium text-slate-500 dark:text-slate-400',
                mergeLayout ? 'mb-3 text-[12px]' : 'mb-4 text-[12px]'
              )}
            >
              {profileTemplate === 'v2'
                ? 'Applies to Link in Bio header and cover video.'
                : 'Classic template uses its own shell; layout applies when you switch to Link in Bio.'}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLayout('classic')}
                className={cn(
                  'group relative overflow-hidden rounded-[20px] border p-5 text-left transition-all',
                  layoutStyle === 'classic'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/2'
                )}
              >
                {layoutStyle === 'classic' && (
                  <div className="bg-primary-500 absolute top-3 right-3 h-4 w-4 rounded-full">
                    <div className="m-auto mt-1.5 h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
                <p className="text-[14px] font-bold text-slate-900 dark:text-white">Classic Stack</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Centered avatar and content.</p>
              </button>
              <button
                type="button"
                onClick={() => setLayout('hero')}
                disabled={profileTemplate !== 'v2'}
                className={cn(
                  'group relative overflow-hidden rounded-[20px] border p-5 text-left transition-all',
                  layoutStyle === 'hero'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/2',
                  profileTemplate !== 'v2' && 'cursor-not-allowed opacity-50'
                )}
              >
                {layoutStyle === 'hero' && (
                  <div className="bg-primary-500 absolute top-3 right-3 h-4 w-4 rounded-full">
                    <div className="m-auto mt-1.5 h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
                <p className="text-[14px] font-bold text-slate-900 dark:text-white">Hero Cover</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                  Tall cover video with left-aligned header.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
