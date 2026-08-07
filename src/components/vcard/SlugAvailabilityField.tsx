'use client'

import { useCheckSlugQuery } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Check, Loader2, X } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

const DEBOUNCE_MS = 400
const MIN_SLUG_LENGTH = 1

function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

type SlugAvailabilityFieldProps = {
  value: string
  onChange: (slug: string) => void
  excludeId?: string | null
  variant?: 'personal' | 'settings'
  inputClassName?: string
  placeholder?: string
  icon?: ReactNode
}

export function SlugAvailabilityField({
  value,
  onChange,
  excludeId,
  variant = 'personal',
  inputClassName,
  placeholder = 'your-name',
  icon,
}: SlugAvailabilityFieldProps) {
  const [debouncedSlug, setDebouncedSlug] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(value), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])

  const canCheck = debouncedSlug.trim().length >= MIN_SLUG_LENGTH
  const isSettled = value === debouncedSlug

  const { data, isFetching, isError } = useCheckSlugQuery(
    { slug: debouncedSlug, excludeId: excludeId || undefined },
    { skip: !canCheck }
  )

  const handleChange = (raw: string) => {
    onChange(sanitizeSlug(raw))
  }

  const applySuggestion = () => {
    if (!data?.suggestion) return
    onChange(data.suggestion)
  }

  const showChecking = canCheck && (!isSettled || isFetching)
  const showAvailable = canCheck && isSettled && !isFetching && !isError && data?.available === true
  const showTaken = canCheck && isSettled && !isFetching && !isError && data?.available === false
  const suggestion = data?.suggestion && data.suggestion !== data.slug ? data.suggestion : null

  const statusBorder = showAvailable
    ? 'border-emerald-400/80 focus:border-emerald-500 focus:ring-emerald-500'
    : showTaken
      ? 'border-red-400/80 focus:border-red-500 focus:ring-red-500'
      : ''

  const input = (
    <input
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={cn(inputClassName, statusBorder)}
      autoComplete="off"
      spellCheck={false}
    />
  )

  return (
    <div className="w-full">
      {variant === 'settings' ? (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#070a13]',
            showAvailable && 'border-emerald-400/80 dark:border-emerald-500/40',
            showTaken && 'border-red-400/80 dark:border-red-500/40'
          )}
        >
          <span className="text-[.8125rem] font-medium text-slate-400">vbiz.me/</span>
          {input}
        </div>
      ) : (
        <div className="relative flex items-center">
          {icon ? (
            <div className="pointer-events-none absolute top-1/2 left-4 z-10 flex -translate-y-1/2 items-center text-slate-500/70">
              {icon}
            </div>
          ) : null}
          {input}
        </div>
      )}

      <div className="mt-2.5 space-y-1.5 pl-1">
        {variant === 'personal' && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Your card will be available at{' '}
            <span className="text-primary-600 dark:text-primary-400 font-mono">/v/{value || '…'}</span>. Letters,
            numbers, and hyphens only.
          </p>
        )}
        {variant === 'settings' && !showChecking && !showAvailable && !showTaken && (
          <p className="text-[.6875rem] font-medium text-slate-500 dark:text-slate-400">
            This will be your live URL. Use only lowercase letters, numbers, and dashes.
          </p>
        )}

        {showChecking && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking availability…
          </p>
        )}
        {showAvailable && (
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            Slug is available
          </p>
        )}
        {showTaken && (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <X className="h-3.5 w-3.5" />
              Slug is taken
            </p>
            {suggestion ? (
              <button
                type="button"
                onClick={applySuggestion}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-[12px] font-semibold underline-offset-2 hover:underline"
              >
                Use {suggestion}
              </button>
            ) : null}
          </div>
        )}
        {canCheck && isSettled && isError && (
          <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
            Couldn’t check availability. Try again in a moment.
          </p>
        )}
      </div>
    </div>
  )
}
