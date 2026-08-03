'use client'

import { FALLBACK_LANGUAGES, I18N_CONFIG } from '@/lib/i18n/config'
import { applyTranslation, getActiveLanguage, resetToEnglish, type BackendLanguage } from '@/lib/i18n/translation'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

/** Shared language picker — used by v1, v2, v3 profile templates. */
export function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; theme?: string }) {
  const [languages, setLanguages] = useState<BackendLanguage[]>(FALLBACK_LANGUAGES)
  const [fallbackLang, setFallbackLang] = useState<string>(I18N_CONFIG.fallback)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isApplying, setIsApplying] = useState(false)
  const [selected, setSelected] = useState<string>(I18N_CONFIG.fallback)

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => setSelected(getActiveLanguage(fallbackLang)), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, fallbackLang])

  useEffect(() => {
    if (!isOpen) return

    const fetchLanguages = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(I18N_CONFIG.languagesApiPath)
        if (res.ok) {
          const data = await res.json()
          if (data.languages?.length > 0) {
            setLanguages(data.languages)
          }
          if (data.fallback) {
            setFallbackLang(data.fallback)
          }
        }
      } catch (err) {
        console.error('Error fetching languages from backend API:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchLanguages()
  }, [isOpen])

  const triggerHaptic = (duration = 10) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(duration)
      }
    } catch {
      /* ignore */
    }
  }

  const handleApply = () => {
    triggerHaptic(20)
    const active = getActiveLanguage(fallbackLang)
    if (selected === active) {
      onClose()
      return
    }

    setIsApplying(true)
    if (selected === fallbackLang) {
      resetToEnglish()
    } else {
      applyTranslation(selected, fallbackLang)
    }
    // Page reloads — modal stays in applying state until navigation.
  }

  const handleReset = () => {
    triggerHaptic(25)
    setIsApplying(true)
    resetToEnglish()
    setSelected(fallbackLang)
    // Page reloads.
  }

  const panel = (
    <div className="notranslate relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="vbiz-modal-hero relative border-b p-6 pb-8 text-center">
        <h2 className="vbiz-title mb-1.5 font-sans text-xl font-black tracking-tight uppercase md:text-2xl">
          Select Language
        </h2>
        <p className="vbiz-description text-xs font-bold md:text-sm">Choose your preferred language</p>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(10)
            onClose()
          }}
          className="vbiz-modal-close absolute top-5 right-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all active:scale-95"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="vbiz-pin h-8 w-8 animate-spin" />
            <p className="vbiz-description text-xs font-bold">Loading languages from server...</p>
          </div>
        ) : (
          <div className="no-scrollbar grid max-h-[340px] grid-cols-2 gap-3 overflow-y-auto pr-1 select-none">
            {languages.map((lang) => {
              const isSelected = selected === lang.code
              return (
                <div
                  key={lang.code}
                  onClick={() => {
                    triggerHaptic(10)
                    setSelected(lang.code)
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200 active:scale-98 ${
                    isSelected ? 'vbiz-modal-row-selected scale-[1.02] font-semibold shadow-md' : 'vbiz-modal-row'
                  }`}
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-black tracking-wider transition-all ${
                      isSelected ? 'bg-black/15 text-inherit' : 'vbiz-pill-icon border px-1.5 py-0.5 text-[11px]'
                    }`}
                  >
                    {lang.flagCode}
                  </span>
                  <span className="text-[13px] leading-tight font-medium select-none">{lang.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="vbiz-modal-footer flex flex-col items-center gap-3 border-t p-6 pt-3 pb-5">
        <button
          type="button"
          disabled={isLoading || isApplying}
          onClick={handleApply}
          className="vbiz-modal-btn-accent flex w-[85%] cursor-pointer items-center justify-center gap-2 rounded-full py-3.5 text-xs font-extrabold tracking-wider uppercase transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 md:text-sm"
        >
          {isApplying ? (
            <>
              <Loader2 size={16} className="animate-spin" strokeWidth={3} /> RELOADING…
            </>
          ) : (
            <>
              <Check size={16} strokeWidth={3} /> APPLY LANGUAGE
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isApplying}
          onClick={handleReset}
          className="vbiz-pin mt-1 cursor-pointer text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:opacity-80 active:scale-95 disabled:opacity-50"
        >
          Reset to English
        </button>
      </div>
    </div>
  )

  return (
    <ProfileModalShell
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="vbiz-modal-backdrop fixed inset-0 z-150 flex items-end justify-center p-0 backdrop-blur-md sm:items-center sm:p-4"
      panelClassName="w-full rounded-t-2xl sm:max-w-md sm:rounded-2xl"
    >
      {panel}
    </ProfileModalShell>
  )
}
