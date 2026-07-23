'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { useDashboardTour } from '@/context/DashboardTourContext'
import {
  clearTourTargetHighlight,
  findVisibleTourTargetForStep,
  getTourTooltipViewportReserve,
  MOBILE_NAV_MAX_WIDTH,
  routeMatchesStep,
  scrollTourTargetIntoView,
  setTourTargetHighlight,
  shouldScrollTourStep,
  TOUR_REMEASURE_EVENT,
  TOUR_Z,
  type DashboardTourStep,
} from '@/lib/dashboardTour'
import { cn } from '@/utils/cn'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'

type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type TooltipPos = {
  top: number
  left: number
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const PADDING = 8
const TOOLTIP_GAP = 14
const TOOLTIP_WIDTH = 320
const TOOLTIP_OVERLAP_GAP = 8

const secondaryButtonClass =
  'flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-300 dark:hover:bg-[#252b3d]'

function measureSpotlight(step: DashboardTourStep): SpotlightRect | null {
  if (!step.target) return null

  const el = findVisibleTourTargetForStep(step)
  if (!el) return null

  // Measure the interactive parent (link/button) when target is an inner anchor span
  const measurable = el.closest<HTMLElement>('a, button, [role="button"]') ?? el

  const rect = measurable.getBoundingClientRect()
  return {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }
}

function computeTooltipPosition(
  spotlight: SpotlightRect | null,
  preferred: 'top' | 'bottom' | 'left' | 'right' | 'center'
): TooltipPos {
  if (preferred === 'center' || !spotlight) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      placement: 'center',
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 16
  const tooltipHeight = getTourTooltipViewportReserve()
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, vw - margin * 2)
  const isNarrow = vw <= MOBILE_NAV_MAX_WIDTH

  const sidePlacements = new Set(['left', 'right'])
  const allPlacements: Array<'bottom' | 'top' | 'right' | 'left'> = ['bottom', 'top', 'right', 'left']
  const order: Array<'bottom' | 'top' | 'right' | 'left'> =
    isNarrow && sidePlacements.has(preferred)
      ? [
          'bottom',
          'top',
          preferred as 'left' | 'right',
          ...allPlacements.filter((p) => p !== preferred && p !== 'bottom' && p !== 'top'),
        ]
      : [preferred as 'bottom' | 'top' | 'right' | 'left', ...allPlacements.filter((p) => p !== preferred)]

  const clampPosition = (top: number, left: number) => ({
    top: Math.max(margin, Math.min(top, vh - tooltipHeight - margin)),
    left: Math.max(margin, Math.min(left, vw - tooltipWidth - margin)),
  })

  const overlapsSpotlight = (top: number, left: number) => {
    const gap = TOOLTIP_OVERLAP_GAP
    return !(
      left + tooltipWidth + gap <= spotlight.left ||
      spotlight.left + spotlight.width + gap <= left ||
      top + tooltipHeight + gap <= spotlight.top ||
      spotlight.top + spotlight.height + gap <= top
    )
  }

  const rawPosition = (placement: 'bottom' | 'top' | 'right' | 'left') => {
    if (placement === 'bottom') {
      return {
        top: spotlight.top + spotlight.height + TOOLTIP_GAP,
        left: spotlight.left + spotlight.width / 2 - tooltipWidth / 2,
      }
    }

    if (placement === 'top') {
      return {
        top: spotlight.top - TOOLTIP_GAP - tooltipHeight,
        left: spotlight.left + spotlight.width / 2 - tooltipWidth / 2,
      }
    }

    if (placement === 'right') {
      return {
        top: spotlight.top + spotlight.height / 2 - tooltipHeight / 2,
        left: spotlight.left + spotlight.width + TOOLTIP_GAP,
      }
    }

    return {
      top: spotlight.top + spotlight.height / 2 - tooltipHeight / 2,
      left: spotlight.left - tooltipWidth - TOOLTIP_GAP,
    }
  }

  for (const placement of order) {
    const raw = rawPosition(placement)
    const { top, left } = clampPosition(raw.top, raw.left)

    if (!overlapsSpotlight(top, left)) {
      return { top, left, placement }
    }
  }

  const belowSpotlight = clampPosition(
    spotlight.top + spotlight.height + TOOLTIP_GAP,
    spotlight.left + spotlight.width / 2 - tooltipWidth / 2
  )

  return {
    ...belowSpotlight,
    placement: 'bottom',
  }
}

export function DashboardTourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, editorAssist, next, back, skip, canGoBack } =
    useDashboardTour()
  const pathname = usePathname()
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltip, setTooltip] = useState<TooltipPos>({ top: 0, left: 0, placement: 'center' })
  const [measuredVersion, setMeasuredVersion] = useState('')

  const assistKey = useMemo(() => JSON.stringify(editorAssist), [editorAssist])

  const layoutVersion = useMemo(() => {
    if (!isActive || !currentStep) return ''
    return `${currentStepIndex}:${pathname}:${currentStep.target ?? 'center'}:${assistKey}`
  }, [isActive, currentStep, currentStepIndex, pathname, assistKey])

  const ready = layoutVersion !== '' && measuredVersion === layoutVersion

  const updateLayout = useCallback((): boolean => {
    if (!currentStep) return false

    const prefersCenter = currentStep.placement === 'center' || !currentStep.target
    const nextSpotlight = prefersCenter ? null : measureSpotlight(currentStep)
    const useCenter = prefersCenter || !nextSpotlight
    const targetResolved = prefersCenter || Boolean(nextSpotlight)

    if (useCenter) {
      clearTourTargetHighlight()
    } else {
      setTourTargetHighlight(currentStep.target, currentStep.route)
    }

    setSpotlight(nextSpotlight)
    setTooltip(
      computeTooltipPosition(
        useCenter ? null : nextSpotlight,
        useCenter ? 'center' : (currentStep.placement ?? 'bottom')
      )
    )

    return targetResolved
  }, [currentStep])

  useLayoutEffect(() => {
    if (!isActive || !currentStep) {
      clearTourTargetHighlight()
      return
    }

    const version = layoutVersion
    const retryTimers: ReturnType<typeof setTimeout>[] = []

    const run = (attempt = 0) => {
      const finish = () => {
        const targetResolved = updateLayout()
        if (targetResolved) {
          setMeasuredVersion(version)
          return
        }

        if (attempt >= 24) {
          clearTourTargetHighlight()
          setSpotlight(null)
          setTooltip({
            top: window.innerHeight / 2,
            left: window.innerWidth / 2,
            placement: 'center',
          })
          setMeasuredVersion(version)
          return
        }

        retryTimers.push(setTimeout(() => run(attempt + 1), 150))
      }

      if (currentStep.target && shouldScrollTourStep(currentStep)) {
        scrollTourTargetIntoView(currentStep.target, currentStep.route)
        requestAnimationFrame(finish)
        return
      }

      finish()
    }

    const raf = requestAnimationFrame(run)
    return () => {
      cancelAnimationFrame(raf)
      retryTimers.forEach(clearTimeout)
    }
  }, [isActive, currentStep, currentStepIndex, pathname, layoutVersion, updateLayout])

  useEffect(() => {
    if (!isActive) return

    const onResize = () => updateLayout()
    const onRemeasure = () => updateLayout()
    window.addEventListener('resize', onResize)
    window.addEventListener(TOUR_REMEASURE_EVENT, onRemeasure)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener(TOUR_REMEASURE_EVENT, onRemeasure)
    }
  }, [isActive, updateLayout])

  if (!isActive || !currentStep) return null

  const routeOk = routeMatchesStep(pathname, currentStep)
  const isCenter = tooltip.placement === 'center'
  const isLastStep = currentStepIndex === totalSteps - 1
  const hasSpotlight = !isCenter && Boolean(spotlight)

  if (!routeOk) {
    return (
      <ModalPortal>
        <TourBackdrop />
      </ModalPortal>
    )
  }

  if (!ready) {
    return (
      <ModalPortal>
        <TourBackdrop />
        <TourCard
          tooltip={{ top: window.innerHeight / 2, left: window.innerWidth / 2, placement: 'center' }}
          stepNumber={currentStepIndex + 1}
          totalSteps={totalSteps}
          title={currentStep.title}
          description={currentStep.description}
          canGoBack={canGoBack}
          isLastStep={isLastStep}
          onSkip={skip}
          onBack={back}
          onNext={next}
        />
      </ModalPortal>
    )
  }

  return (
    <ModalPortal>
      {!hasSpotlight && <TourBackdrop />}

      {hasSpotlight && spotlight && (
        <>
          <TourSpotlightMask rect={spotlight} />
          <TourSpotlightRing rect={spotlight} />
        </>
      )}

      <TourCard
        tooltip={tooltip}
        stepNumber={currentStepIndex + 1}
        totalSteps={totalSteps}
        title={currentStep.title}
        description={currentStep.description}
        canGoBack={canGoBack}
        isLastStep={isLastStep}
        onSkip={skip}
        onBack={back}
        onNext={next}
      />
    </ModalPortal>
  )
}

function TourBackdrop() {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] dark:bg-black/60"
      style={{ zIndex: TOUR_Z.backdrop }}
      aria-hidden
    />
  )
}

function TourSpotlightMask({ rect }: { rect: SpotlightRect }) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const panelClass = 'pointer-events-auto fixed bg-slate-900/55 backdrop-blur-[2px] dark:bg-black/60'

  const top = rect.top
  const left = rect.left
  const right = left + rect.width
  const bottom = top + rect.height

  return (
    <>
      <div
        className={panelClass}
        style={{ zIndex: TOUR_Z.backdrop, top: 0, left: 0, width: vw, height: top }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ zIndex: TOUR_Z.backdrop, top: bottom, left: 0, width: vw, height: vh - bottom }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ zIndex: TOUR_Z.backdrop, top, left: 0, width: left, height: rect.height }}
        aria-hidden
      />
      <div
        className={panelClass}
        style={{ zIndex: TOUR_Z.backdrop, top, left: right, width: vw - right, height: rect.height }}
        aria-hidden
      />
    </>
  )
}

function TourSpotlightRing({ rect }: { rect: SpotlightRect }) {
  return (
    <div
      className="ring-primary-500/80 dark:ring-primary-400/80 pointer-events-none fixed rounded-xl ring-2 ring-offset-2 ring-offset-transparent transition-all duration-300"
      style={{
        zIndex: TOUR_Z.spotlightRing,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  )
}

function TourCard({
  tooltip,
  stepNumber,
  totalSteps,
  title,
  description,
  canGoBack,
  isLastStep,
  onSkip,
  onBack,
  onNext,
}: {
  tooltip: TooltipPos
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  canGoBack: boolean
  isLastStep: boolean
  onSkip: () => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div
      data-vbiz-tour-ui
      className={cn(
        'fixed w-[min(320px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl transition-all duration-300 dark:border-white/10 dark:bg-[#0b0f19]',
        tooltip.placement === 'center' && '-translate-x-1/2 -translate-y-1/2'
      )}
      style={{ zIndex: TOUR_Z.card, top: tooltip.top, left: tooltip.left }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-tour-title"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-primary-600 dark:text-primary-400 text-[11px] font-bold tracking-widest uppercase">
          Step {stepNumber} of {totalSteps}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          Skip tour
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <h3 id="dashboard-tour-title" className="mb-2 text-[17px] font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-5 text-[13px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">{description}</p>

      <div className={cn('flex gap-3', !canGoBack && 'flex-col')}>
        {canGoBack && (
          <button type="button" onClick={onBack} className={secondaryButtonClass}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className={cn(
            'bg-primary-600 hover:bg-primary-700 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98]',
            canGoBack ? 'flex-1' : 'w-full'
          )}
        >
          {isLastStep ? 'Finish tour' : 'Next'}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
