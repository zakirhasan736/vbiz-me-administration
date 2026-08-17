'use client'

import { useLivePreview } from '@/components/vcard/LivePreviewProvider'
import { useAppSelector } from '@/hooks/redux'
import { useGoogleFont } from '@/hooks/useGoogleFont'
import { useVCard } from '@/lib/VCardContext'
import { resolveProfileDesign } from '@/lib/resolvedProfileDesign'
import { getNavItemById } from '@/lib/vcardNavbar'
import { ProfileApp } from '@/profile-app/ProfileApp'
import { ProfileThemeShell } from '@/profile-app/components/ProfileThemeShell'
import { useResolvedProfileTheme } from '@/profile-app/hooks/useResolvedProfileTheme'
import '@/profile-app/profile-app.css'
import { vCardDataToProfileProps } from '@/profile-app/profilePublicProps'
import { ProfileThemeProvider } from '@/profile-app/providers/ProfileThemeProvider'
import { preloadProfileSections, preloadProfileTemplate } from '@/profile-app/sections/preloadProfileSections'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import { selectVCardById } from '@/redux/features/vcards/vcards.slice'
import { cn } from '@/utils/cn'
import { ChevronLeft, Minus, Moon, Sun, X } from 'lucide-react'
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

const MOBILE_SHEET_QUERY = '(max-width: 639px)'
const POSITION_STORAGE_KEY = 'vbiz_live_preview_offset'
const COLLAPSED_STORAGE_KEY = 'vbiz_live_preview_collapsed'
/** Visible strip left on screen when the phone is minimized to the edge. */
const COLLAPSED_RAIL = '3rem'

type Offset = { x: number; y: number }

const ZERO_OFFSET: Offset = { x: 0, y: 0 }

function readStoredOffset(): Offset {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return ZERO_OFFSET
    const parsed = JSON.parse(raw) as Partial<Offset>
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return ZERO_OFFSET
    return { x: parsed.x, y: parsed.y }
  } catch {
    return ZERO_OFFSET
  }
}

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return 0
  return Math.min(Math.max(value, min), max)
}

/** Phones get the full-screen sheet layout: no drag offset, no minimize rail. */
function useIsMobileSheet(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(MOBILE_SHEET_QUERY)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_SHEET_QUERY).matches,
    () => false
  )
}

export function VCardLivePreview() {
  const { isOpen, hasMounted, close, editorSectionId } = useLivePreview()
  const { vCardData, cardId } = useVCard()
  /** Keeps typing in the editor at high priority; the preview repaints right after. */
  const draft = useDeferredValue(vCardData)
  const designSettings = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s) => (cardId ? selectVCardById(s, cardId) : null))

  const earlyTemplate: ProfileTemplateId =
    (draft.appearance?.profileTemplate as ProfileTemplateId | undefined) ?? designSettings.profileTemplate ?? 'v3'

  const {
    themeConfig,
    appearance: settingsAppearance,
    fromApi,
  } = useResolvedProfileTheme({
    profileId: cardId ?? '',
    template: earlyTemplate,
    cardThemeConfig: draft.themeConfig ?? null,
  })

  const profileProps = useMemo(() => {
    const base = vCardDataToProfileProps(draft, designSettings, {
      id: cardId ?? 'preview',
      avatarImageUrl: record?.avatarImageUrl,
      themeConfig,
      themeFromApi: fromApi,
      appearance: {
        ...draft.appearance,
        ...settingsAppearance,
      },
    })
    const appearance = {
      ...draft.appearance,
      ...settingsAppearance,
    }
    const design = resolveProfileDesign(designSettings, draft.theme, appearance, {
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
      profileSlug: draft.slug?.trim() || undefined,
    }
  }, [draft, designSettings, cardId, record?.avatarImageUrl, record?.views, themeConfig, settingsAppearance, fromApi])

  useGoogleFont(profileProps.design?.fontFamily)

  const template: ProfileTemplateId = profileProps.design?.profileTemplate ?? earlyTemplate

  const designTheme: 'light' | 'dark' = profileProps.design?.darkMode ? 'dark' : 'light'
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(designTheme)
  const [prevDesignTheme, setPrevDesignTheme] = useState(designTheme)
  const [previewSectionId, setPreviewSectionId] = useState(editorSectionId)

  if (designTheme !== prevDesignTheme) {
    setPrevDesignTheme(designTheme)
    setPreviewTheme(designTheme)
  }

  /** Follow the editor route, but as a transition so the current section stays painted. */
  const lastEditorSectionRef = useRef(editorSectionId)
  useEffect(() => {
    if (lastEditorSectionRef.current === editorSectionId) return
    lastEditorSectionRef.current = editorSectionId
    startTransition(() => setPreviewSectionId(editorSectionId))
  }, [editorSectionId])

  const handleSectionChange = useCallback((sectionId: string) => {
    startTransition(() => setPreviewSectionId(sectionId))
  }, [])

  // Warm the template shell and the section the phone will land on, before the first open.
  useEffect(() => {
    preloadProfileTemplate(template)
    const contentKey = getNavItemById(previewSectionId)?.profileContent
    if (contentKey) preloadProfileSections([contentKey], template)
  }, [template, previewSectionId])

  const isMobileSheet = useIsMobileSheet()
  const phoneRef = useRef<HTMLDivElement>(null)
  const [storedOffset, setStoredOffset] = useState<Offset>(() =>
    typeof window === 'undefined' ? ZERO_OFFSET : readStoredOffset()
  )
  const [storedCollapsed, setStoredCollapsed] = useState(() =>
    typeof window === 'undefined' ? false : readStoredCollapsed()
  )
  const [isDragging, setIsDragging] = useState(false)
  const offset = isMobileSheet ? ZERO_OFFSET : storedOffset
  const isCollapsed = !isMobileSheet && storedCollapsed
  const offsetRef = useRef(offset)

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  /** Only the mobile sheet blocks page scroll — on desktop you keep editing behind it. */
  useEffect(() => {
    if (!isOpen || !isMobileSheet) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen, isMobileSheet])

  /** A shrinking viewport must not park the phone off-screen. */
  useEffect(() => {
    if (isMobileSheet || isCollapsed) return
    const onResize = () => {
      const el = phoneRef.current
      const current = offsetRef.current
      if (!el || (current.x === 0 && current.y === 0)) return
      const rect = el.getBoundingClientRect()
      const anchorLeft = rect.left - current.x
      const anchorTop = rect.top - current.y
      const margin = 12
      const next = {
        x: clamp(current.x, margin - anchorLeft, window.innerWidth - margin - rect.width - anchorLeft),
        y: clamp(current.y, margin - anchorTop, window.innerHeight - margin - rect.height - anchorTop),
      }
      if (next.x !== current.x || next.y !== current.y) setStoredOffset(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isMobileSheet, isCollapsed])

  /** Drag bounds are captured on pointer down so moves never depend on a committed render. */
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origin: Offset
    minX: number
    maxX: number
    minY: number
    maxY: number
    last: Offset
  } | null>(null)

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = phoneRef.current
      if (isMobileSheet || event.button !== 0 || !el) return
      event.currentTarget.setPointerCapture(event.pointerId)

      const origin = offsetRef.current
      const rect = el.getBoundingClientRect()
      const anchorLeft = rect.left - origin.x
      const anchorTop = rect.top - origin.y
      const margin = 12

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin,
        minX: margin - anchorLeft,
        maxX: window.innerWidth - margin - rect.width - anchorLeft,
        minY: margin - anchorTop,
        maxY: window.innerHeight - margin - rect.height - anchorTop,
        last: origin,
      }
      setIsDragging(true)
    },
    [isMobileSheet]
  )

  const onHandlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const next = {
      x: clamp(drag.origin.x + (event.clientX - drag.startX), drag.minX, drag.maxX),
      y: clamp(drag.origin.y + (event.clientY - drag.startY), drag.minY, drag.maxY),
    }
    drag.last = next
    setStoredOffset(next)
  }, [])

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(drag.last))
    } catch {
      /* ignore */
    }
  }, [])

  const setCollapsed = useCallback((next: boolean) => {
    setStoredCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  // Nothing is rendered until the eye icon is used the first time; after that the
  // tree stays mounted so reopening keeps scroll position, section, and theme.
  if (!hasMounted) return null

  const collapseShift = isCollapsed ? ` + (100% - ${COLLAPSED_RAIL})` : ''
  const phoneTransform = `translate3d(calc(${offset.x}px${collapseShift}), ${offset.y}px, 0)`

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-100 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-0',
        'transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
        isOpen ? 'visible opacity-100' : 'invisible translate-y-6 opacity-0 sm:translate-x-8 sm:translate-y-0'
      )}
      inert={!isOpen}
      aria-hidden={!isOpen}
    >
      {/* Dimmer for the mobile sheet only — never closes the preview on click. */}
      <div
        className="pointer-events-none absolute inset-0 bg-slate-900/40 backdrop-blur-md sm:hidden dark:bg-black/60"
        aria-hidden
      />

      {/* Dock owns the position and drag transform so chrome can sit outside the phone. */}
      <div
        style={{ transform: phoneTransform }}
        className={cn(
          'pointer-events-none relative z-100 flex min-w-0 flex-col',
          'h-[min(92dvh,820px)] max-h-[92dvh] w-[min(100%,420px)]',
          'sm:fixed sm:right-6 sm:bottom-20 sm:h-[min(720px,calc(100dvh-6rem))] sm:max-h-[calc(100dvh-6rem)] sm:w-[min(420px,calc(100vw-3rem))] md:right-8 md:bottom-24',
          isDragging ? 'duration-0' : 'transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]'
        )}
      >
        {/* Close sits outside the bezel, on the phone's top-left corner. */}
        <button
          type="button"
          onClick={close}
          aria-label="Close preview"
          title="Close preview (Esc)"
          className="pointer-events-auto absolute -top-3.5 -left-2 z-110 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-700 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:-top-4 sm:-left-4 dark:border-white/15 dark:bg-[#0b0f19] dark:text-zinc-100 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div
          ref={phoneRef}
          className={cn(
            'vbiz-preview-phone pointer-events-auto relative flex h-full w-full min-w-0 flex-col overflow-hidden',
            'rounded-4xl border-6 border-slate-200/80 bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)]',
            'min-[400px]:rounded-[40px] min-[400px]:border-8 sm:rounded-[48px] sm:border-10',
            'dark:border-[#1e2333] dark:bg-[#0b0f19]'
          )}
          role="dialog"
          aria-label="Live profile preview"
        >
          {/* The dynamic island doubles as the drag handle so the phone can be moved off a field. */}
          <div className="pointer-events-none absolute inset-x-0 top-2 z-30 hidden h-7 justify-center sm:flex">
            <div
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn(
                'pointer-events-auto flex h-full w-[min(120px,32%)] max-w-30 touch-none items-center justify-between rounded-full bg-slate-800 px-3 shadow-sm dark:bg-black',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              title="Drag to move the preview"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-60" />
              <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-700/50 dark:bg-white/10">
                <div className="h-1 w-1 rounded-full bg-slate-900 dark:bg-black" />
              </div>
            </div>
          </div>

          <div className="absolute top-3.5 right-3.5 z-50 flex items-center gap-1.5 sm:top-3 sm:right-4">
            <button
              type="button"
              onClick={() => setPreviewTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={previewTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {previewTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Minimize preview to the edge"
              title="Minimize preview"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-colors hover:bg-white sm:flex dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <Minus className="h-4.5 w-4.5" />
            </button>
          </div>

          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand live preview"
              title="Expand live preview"
              className="absolute top-1/2 left-0 z-50 hidden h-24 w-12 -translate-y-1/2 items-center justify-center rounded-r-2xl border-y border-r border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur sm:flex dark:border-white/10 dark:bg-[#0b0f19]/95 dark:text-slate-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div
            className={cn(
              'vbiz-preview-frame vbiz-preview-scrollbar isolate min-h-0 flex-1 transform-[translateZ(0)] overflow-x-hidden overflow-y-auto overscroll-contain',
              isCollapsed && 'pointer-events-none'
            )}
          >
            <ProfileThemeShell config={themeConfig} fromApi={fromApi} template={template} forcedMode={previewTheme}>
              <ProfileThemeProvider themeConfig={themeConfig} fromApi={fromApi}>
                <ProfileApp
                  {...profileProps}
                  embedded
                  previewActive={isOpen && !isCollapsed}
                  sectionId={previewSectionId}
                  onSectionChange={handleSectionChange}
                  previewTheme={previewTheme}
                  onPreviewThemeChange={setPreviewTheme}
                />
              </ProfileThemeProvider>
            </ProfileThemeShell>
          </div>
        </div>
      </div>
    </div>
  )
}
