'use client'

import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { useAiCardAgentOpen } from '@/hooks/useAiCardAgentOpen'
import {
  attachTourScrollLock,
  CREATE_CARD_TOUR_STEPS,
  DASHBOARD_TOUR_STEPS,
  getTourSteps,
  hydrateCompletedTours,
  isMobileNavViewport,
  isTourCompleted,
  markTourDone,
  readAiCardAgentOpen,
  requestTourRemeasure,
  resolveTourBackDestination,
  routeMatchesStep,
  scrollTourTargetIntoView,
  shouldAutoStartTour,
  shouldScrollTourStep,
  TOUR_KEYS,
  type DashboardTourStep,
  type EditorTourAssist,
  type SettingsTourAssist,
  type TourKey,
} from '@/lib/dashboardTour'
import { persistCompletedToursRemote } from '@/lib/dashboardTourPersist'
import { useAuth } from '@/providers/AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
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
  const serverTours = useAppSelector((state) => state.user.user?.completedTours)
  const isVcardOwner = role === 'vcard-owner'
  const pathname = usePathname()
  const router = useRouter()
  const isAiAgentOpen = useAiCardAgentOpen()
  const [tourKey, setTourKey] = useState<TourKey | null>(null)
  const [stepIndex, setStepIndex] = useState(-1)
  const [started, setStarted] = useState(false)
  const [waitedUid, setWaitedUid] = useState('')
  const mobileNavOpenerRef = useRef<(() => void) | null>(null)
  const activateTabRef = useRef<((tab: string) => void) | null>(null)
  const dashboardAutoStarted = useRef(false)
  const createAutoStarted = useRef(false)

  const steps = useMemo(() => (tourKey ? getTourSteps(tourKey) : []), [tourKey])
  const toursReady = Array.isArray(serverTours) || Boolean(user?.uid && waitedUid === user.uid)

  const rememberTourOffered = useCallback(
    (key: TourKey) => {
      if (!user?.uid) return
      markTourDone(key, user.uid)
      persistCompletedToursRemote([key])
    },
    [user]
  )

  useEffect(() => {
    dashboardAutoStarted.current = false
    createAutoStarted.current = false
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || !Array.isArray(serverTours)) return
    hydrateCompletedTours(user.uid, serverTours)
    const missing = TOUR_KEYS.filter((key) => isTourCompleted(key, user.uid) && !serverTours.includes(key))
    if (missing.length) persistCompletedToursRemote(missing)
  }, [user?.uid, serverTours])

  useEffect(() => {
    if (Array.isArray(serverTours) || !user?.uid) return
    const token = user.uid
    const timer = window.setTimeout(() => setWaitedUid(token), 1800)
    return () => window.clearTimeout(timer)
  }, [serverTours, user?.uid])

  const softDismissTour = useCallback(() => {
    setStepIndex(-1)
    setTourKey(null)
    setStarted(false)
  }, [])

  const finishTour = useCallback(() => {
    if (tourKey) rememberTourOffered(tourKey)
    softDismissTour()
  }, [tourKey, rememberTourOffered, softDismissTour])

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
    requestAnimationFrame(() => requestTourRemeasure())
  }, [stepIndex, steps, router, finishTour])

  const back = useCallback(() => {
    if (stepIndex <= 0) return

    const prevIndex = stepIndex - 1
    const destination = resolveTourBackDestination(steps, stepIndex, pathname)

    if (destination && destination !== pathname) {
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
      if (key === 'create_card' && (isAiAgentOpen || readAiCardAgentOpen())) return

      setTourKey(key)
      setStarted(true)
      setStepIndex(0)

      if (key === 'dashboard' && pathname !== '/') {
        router.push('/')
      }
    },
    [isVcardOwner, isAiAgentOpen, pathname, router]
  )

  // Dashboard auto-start (vcard-owner on home only) — once per registered user
  useEffect(() => {
    if (loading || !user?.uid || !toursReady || started || dashboardAutoStarted.current) return
    if (!isVcardOwner) return
    if (pathname !== '/') return
    if (!shouldAutoStartTour('dashboard', user.uid, serverTours)) return

    dashboardAutoStarted.current = true
    const timer = window.setTimeout(() => {
      rememberTourOffered('dashboard')
      setTourKey('dashboard')
      setStarted(true)
      setStepIndex(0)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [loading, user?.uid, toursReady, started, isVcardOwner, pathname, serverTours, rememberTourOffered])

  // Create-card auto-start: wait while AI Card Studio is open, then run once
  useEffect(() => {
    if (loading || !user?.uid || !toursReady || started || createAutoStarted.current) return
    if (isStaffRole(role)) return
    if (!isEditorPath(pathname)) return
    if (!shouldAutoStartTour('create_card', user.uid, serverTours)) return
    if (isAiAgentOpen || readAiCardAgentOpen()) return

    const timer = window.setTimeout(() => {
      if (readAiCardAgentOpen() || createAutoStarted.current) return
      createAutoStarted.current = true
      rememberTourOffered('create_card')
      setTourKey('create_card')
      setStarted(true)
      setStepIndex(0)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [loading, user?.uid, toursReady, started, role, pathname, isAiAgentOpen, serverTours, rememberTourOffered])

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
