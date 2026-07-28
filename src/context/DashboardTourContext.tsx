'use client'

import { useAuth } from '@/components/auth/Auth'
import {
  attachTourScrollLock,
  DASHBOARD_TOUR_STEPS,
  isMobileNavViewport,
  isTourCompleted,
  markTourCompleted,
  requestTourRemeasure,
  resolveTourBackDestination,
  routeMatchesStep,
  scrollTourTargetIntoView,
  shouldScrollTourStep,
  type DashboardTourStep,
  type EditorTourAssist,
  type SettingsTourAssist,
} from '@/lib/dashboardTour'
import {
  buildEditorSectionPath,
  buildEditorSettingsPath,
  DEFAULT_EDITOR_SECTION,
  type EditorBasePath,
  type SettingsTabId,
} from '@/lib/vcardEditorRoutes'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type DashboardTourContextValue = {
  isActive: boolean
  currentStep: DashboardTourStep | null
  currentStepIndex: number
  totalSteps: number
  editorAssist: EditorTourAssist
  settingsAssist: SettingsTourAssist
  next: () => void
  back: () => void
  skip: () => void
  startTour: () => void
  canGoBack: boolean
  registerMobileNavOpener: (fn: () => void) => void
}

const DashboardTourContext = createContext<DashboardTourContextValue | null>(null)

export function useDashboardTour() {
  const ctx = useContext(DashboardTourContext)
  if (!ctx) {
    return {
      isActive: false,
      currentStep: null,
      currentStepIndex: -1,
      totalSteps: DASHBOARD_TOUR_STEPS.length,
      editorAssist: {} as EditorTourAssist,
      settingsAssist: {} as SettingsTourAssist,
      next: () => {},
      back: () => {},
      skip: () => {},
      startTour: () => {},
      canGoBack: false,
      registerMobileNavOpener: () => {},
    }
  }
  return ctx
}

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(-1)
  const [started, setStarted] = useState(false)
  const mobileNavOpenerRef = useRef<(() => void) | null>(null)

  const finishTour = useCallback(() => {
    if (user?.uid) markTourCompleted(user.uid)
    setStepIndex(-1)
    setStarted(false)
  }, [user])

  const skip = useCallback(() => {
    finishTour()
  }, [finishTour])

  const next = useCallback(() => {
    const step = DASHBOARD_TOUR_STEPS[stepIndex]
    if (step?.nextNavigate) {
      router.push(step.nextNavigate)
    }

    const nextIndex = stepIndex + 1
    if (nextIndex >= DASHBOARD_TOUR_STEPS.length) {
      finishTour()
      return
    }
    setStepIndex(nextIndex)
  }, [stepIndex, router, finishTour])

  const back = useCallback(() => {
    if (stepIndex <= 0) return

    const prevIndex = stepIndex - 1
    const destination = resolveTourBackDestination(stepIndex, pathname)

    if (destination) {
      router.push(destination)
    }

    setStepIndex(prevIndex)
    requestAnimationFrame(() => requestTourRemeasure())
  }, [stepIndex, pathname, router])

  const registerMobileNavOpener = useCallback((fn: () => void) => {
    mobileNavOpenerRef.current = fn
  }, [])

  const startTour = useCallback(() => {
    if (!user?.uid) return

    setStarted(true)
    setStepIndex(0)

    const firstStep = DASHBOARD_TOUR_STEPS[0]
    if (firstStep?.route && !routeMatchesStep(pathname, firstStep)) {
      router.push(firstStep.route)
    }
  }, [user?.uid, pathname, router])

  useEffect(() => {
    if (loading || !user?.uid || started) return
    if (isTourCompleted(user.uid)) return

    const timer = window.setTimeout(() => {
      setStarted(true)
      setStepIndex(0)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [loading, user?.uid, started])

  const currentStep = stepIndex >= 0 ? (DASHBOARD_TOUR_STEPS[stepIndex] ?? null) : null
  const isActive = stepIndex >= 0 && stepIndex < DASHBOARD_TOUR_STEPS.length

  useEffect(() => {
    if (!isActive) return

    document.body.setAttribute('data-vbiz-tour-active', 'true')

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const main = document.getElementById('main-scroll')
    const prevMainOverflow = main?.style.overflow ?? ''

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (main) {
      main.style.overflowY = 'auto'
      main.style.minHeight = '0'
    }

    const detachScrollLock = attachTourScrollLock()

    return () => {
      detachScrollLock()
      document.body.removeAttribute('data-vbiz-tour-active')
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      if (main) {
        main.style.overflowY = prevMainOverflow || ''
        main.style.minHeight = ''
      }
    }
  }, [isActive])

  useLayoutEffect(() => {
    if (!isActive || !currentStep) return
    if (currentStep.openMobileNav && isMobileNavViewport()) {
      mobileNavOpenerRef.current?.()
      requestAnimationFrame(() => requestTourRemeasure())
    }
  }, [isActive, currentStep, stepIndex])

  useEffect(() => {
    if (!isActive) return
    requestAnimationFrame(() => requestTourRemeasure())
  }, [isActive, pathname, stepIndex])

  useEffect(() => {
    if (!isActive || !currentStep || !currentStep.target) return
    if (currentStep.route && !routeMatchesStep(pathname, currentStep)) return
    if (!shouldScrollTourStep(currentStep)) return

    const target = currentStep.target
    const route = currentStep.route
    const scrollTarget = () => scrollTourTargetIntoView(target, route)

    const raf = requestAnimationFrame(scrollTarget)
    const timers = [150, 400, 800, 1200].map((ms) => window.setTimeout(scrollTarget, ms))

    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
    }
  }, [isActive, currentStep, pathname, stepIndex])

  useEffect(() => {
    if (!isActive || !currentStep) return

    const basePath: EditorBasePath | null = pathname.startsWith('/vcards/edit')
      ? '/vcards/edit'
      : pathname.startsWith('/vcards/create')
        ? '/vcards/create'
        : null

    if (!basePath) return

    const cardId = searchParams.get('cardId')

    if (currentStep.id === 'editor-settings' && pathname.includes('/settings')) {
      router.push(buildEditorSectionPath(basePath, DEFAULT_EDITOR_SECTION, cardId))
      return
    }

    if (!currentStep.editorAssist) return

    const { settingsOpen, settingsTab, activeNavId } = currentStep.editorAssist

    if (settingsOpen) {
      const href = buildEditorSettingsPath(basePath, (settingsTab as SettingsTabId | undefined) ?? 'info', cardId)
      if (pathname !== href.split('?')[0]) {
        router.push(href)
      }
      return
    }

    if (activeNavId) {
      const href = buildEditorSectionPath(basePath, activeNavId, cardId)
      if (pathname !== href.split('?')[0]) {
        router.push(href)
      }
    }
  }, [isActive, currentStep, pathname, router, searchParams])

  const editorAssist = useMemo(() => currentStep?.editorAssist ?? {}, [currentStep])
  const settingsAssist = useMemo(() => currentStep?.settingsAssist ?? {}, [currentStep])

  const value = useMemo(
    (): DashboardTourContextValue => ({
      isActive,
      currentStep,
      currentStepIndex: stepIndex,
      totalSteps: DASHBOARD_TOUR_STEPS.length,
      editorAssist,
      settingsAssist,
      next,
      back,
      skip,
      startTour,
      canGoBack: stepIndex > 0,
      registerMobileNavOpener,
    }),
    [
      isActive,
      currentStep,
      stepIndex,
      editorAssist,
      settingsAssist,
      next,
      back,
      skip,
      startTour,
      registerMobileNavOpener,
    ]
  )

  return <DashboardTourContext.Provider value={value}>{children}</DashboardTourContext.Provider>
}
