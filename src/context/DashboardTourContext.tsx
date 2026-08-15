'use client'

import { useAppSelector } from '@/hooks/redux'
import {
  attachTourScrollLock,
  CREATE_CARD_TOUR_STEPS,
  DASHBOARD_TOUR_STEPS,
  getTourSteps,
  isMobileNavViewport,
  isTourCompleted,
  markTourDone,
  requestTourRemeasure,
  resolveTourBackDestination,
  routeMatchesStep,
  scrollTourTargetIntoView,
  shouldScrollTourStep,
  type DashboardTourStep,
  type EditorTourAssist,
  type SettingsTourAssist,
  type TourKey,
} from '@/lib/dashboardTour'
import { useAuth } from '@/providers/AuthProvider'
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
  activeTourKey: TourKey | null
  currentStep: DashboardTourStep | null
  currentStepIndex: number
  totalSteps: number
  editorAssist: EditorTourAssist
  settingsAssist: SettingsTourAssist
  next: () => void
  back: () => void
  skip: () => void
  startTour: (key?: TourKey) => void
  canGoBack: boolean
  registerMobileNavOpener: (fn: () => void) => void
  registerActivateTab: (fn: ((tab: string) => void) | null) => void
}

const DashboardTourContext = createContext<DashboardTourContextValue | null>(null)

export function useDashboardTour() {
  const ctx = useContext(DashboardTourContext)
  if (!ctx) {
    return {
      isActive: false,
      activeTourKey: null as TourKey | null,
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
      registerActivateTab: () => {},
    }
  }
  return ctx
}

function isEditorPath(pathname: string) {
  return pathname.startsWith('/vcards/create') || pathname.startsWith('/vcards/edit')
}

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const role = useAppSelector((state) => state.user.user?.role)
  const isVcardOwner = role === 'vcard-owner'
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAiAgentOpen = searchParams.get('agent') === '1'
  const [tourKey, setTourKey] = useState<TourKey | null>(null)
  const [stepIndex, setStepIndex] = useState(-1)
  const [started, setStarted] = useState(false)
  const mobileNavOpenerRef = useRef<(() => void) | null>(null)
  const activateTabRef = useRef<((tab: string) => void) | null>(null)
  const dashboardAutoStarted = useRef(false)
  const createAutoStarted = useRef(false)

  const steps = useMemo(() => (tourKey ? getTourSteps(tourKey) : []), [tourKey])

  const softDismissTour = useCallback(() => {
    setStepIndex(-1)
    setTourKey(null)
    setStarted(false)
  }, [])

  const finishTour = useCallback(() => {
    if (tourKey) markTourDone(tourKey)
    softDismissTour()
  }, [tourKey, softDismissTour])

  const skip = useCallback(() => {
    finishTour()
  }, [finishTour])

  const next = useCallback(() => {
    const step = steps[stepIndex]
    if (step?.nextNavigate) {
      router.push(step.nextNavigate)
    }

    const nextIndex = stepIndex + 1
    if (nextIndex >= steps.length) {
      finishTour()
      return
    }
    setStepIndex(nextIndex)
  }, [stepIndex, steps, router, finishTour])

  const back = useCallback(() => {
    if (stepIndex <= 0) return

    const prevIndex = stepIndex - 1
    const destination = resolveTourBackDestination(steps, stepIndex, pathname)

    if (destination) {
      router.push(destination)
    }

    setStepIndex(prevIndex)
    requestAnimationFrame(() => requestTourRemeasure())
  }, [stepIndex, steps, pathname, router])

  const registerMobileNavOpener = useCallback((fn: () => void) => {
    mobileNavOpenerRef.current = fn
  }, [])

  const registerActivateTab = useCallback((fn: ((tab: string) => void) | null) => {
    activateTabRef.current = fn
  }, [])

  const startTour = useCallback(
    (key: TourKey = 'dashboard') => {
      if (key === 'dashboard' && !isVcardOwner) return

      setTourKey(key)
      setStarted(true)
      setStepIndex(0)

      if (key === 'dashboard' && pathname !== '/') {
        router.push('/')
      }
    },
    [isVcardOwner, pathname, router]
  )

  // Dashboard auto-start (vcard-owner on home only)
  useEffect(() => {
    if (loading || !user?.uid || started || dashboardAutoStarted.current) return
    if (!isVcardOwner) return
    if (pathname !== '/') return
    if (isTourCompleted('dashboard', user.uid)) return

    dashboardAutoStarted.current = true
    const timer = window.setTimeout(() => {
      setTourKey('dashboard')
      setStarted(true)
      setStepIndex(0)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [loading, user?.uid, started, isVcardOwner, pathname])

  // Create-card auto-start on editor routes (skip when Card Studio / AI agent is open)
  useEffect(() => {
    if (loading || !user?.uid || started || createAutoStarted.current) return
    if (!isEditorPath(pathname)) return
    if (isTourCompleted('create_card', user.uid)) return

    // AI create path: do not auto-start; keep tour incomplete so "Take a tour" still works
    if (isAiAgentOpen) {
      createAutoStarted.current = true
      return
    }

    createAutoStarted.current = true
    const timer = window.setTimeout(() => {
      setTourKey('create_card')
      setStarted(true)
      setStepIndex(0)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [loading, user?.uid, started, pathname, isAiAgentOpen])

  // Soft-dismiss create-card tour when AI agent opens (adjust during render; no markTourDone)
  if (isAiAgentOpen && tourKey === 'create_card' && started) {
    setStepIndex(-1)
    setTourKey(null)
    setStarted(false)
  }

  const currentStep = stepIndex >= 0 ? (steps[stepIndex] ?? null) : null
  const isActive = Boolean(tourKey) && stepIndex >= 0 && stepIndex < steps.length

  // activateTab for create-card steps
  useEffect(() => {
    if (!isActive || !currentStep?.activateTab) return
    activateTabRef.current?.(currentStep.activateTab)
    const t = window.setTimeout(() => requestTourRemeasure(), 220)
    return () => window.clearTimeout(t)
  }, [isActive, currentStep, stepIndex])

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
    const delay = currentStep.activateTab ? 220 : 40
    const scrollTarget = () => scrollTourTargetIntoView(target, route)

    const timers = [delay, delay + 150, delay + 400, delay + 800].map((ms) => window.setTimeout(scrollTarget, ms))

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [isActive, currentStep, pathname, stepIndex])

  const editorAssist = useMemo(() => currentStep?.editorAssist ?? {}, [currentStep])
  const settingsAssist = useMemo(() => currentStep?.settingsAssist ?? {}, [currentStep])

  const value = useMemo(
    (): DashboardTourContextValue => ({
      isActive,
      activeTourKey: tourKey,
      currentStep,
      currentStepIndex: stepIndex,
      totalSteps:
        steps.length || (tourKey === 'create_card' ? CREATE_CARD_TOUR_STEPS.length : DASHBOARD_TOUR_STEPS.length),
      editorAssist,
      settingsAssist,
      next,
      back,
      skip,
      startTour,
      canGoBack: stepIndex > 0,
      registerMobileNavOpener,
      registerActivateTab,
    }),
    [
      isActive,
      tourKey,
      currentStep,
      stepIndex,
      steps.length,
      editorAssist,
      settingsAssist,
      next,
      back,
      skip,
      startTour,
      registerMobileNavOpener,
      registerActivateTab,
    ]
  )

  return <DashboardTourContext.Provider value={value}>{children}</DashboardTourContext.Provider>
}
