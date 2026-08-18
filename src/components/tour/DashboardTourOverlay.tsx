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
import { ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type TooltipPos = {
  top?: number
  left: number
  bottom?: number
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'dock'
}

type TooltipSize = {
  width: number
  height: number
}

const PADDING = 8
const TOOLTIP_GAP = 14
const TOOLTIP_WIDTH = 340
const TOOLTIP_OVERLAP_GAP = 8
const VIEWPORT_MARGIN = 16
const DOCK_BOTTOM = 24

const secondaryButtonClass =
  'flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-300 dark:hover:bg-[#252b3d]'

/** Max dots before switching to first / siblings / last + ellipsis windowing. */
const TOUR_DOTS_ALL_THRESHOLD = 7

function getTourStepMarkers(stepNumber: number, totalSteps: number, siblingCount = 1): Array<number | 'ellipsis'> {
  if (totalSteps <= 0) return []
  if (totalSteps <= TOUR_DOTS_ALL_THRESHOLD) {
    return Array.from({ length: totalSteps }, (_, i) => i + 1)
  }

  const pages: Array<number | 'ellipsis'> = []
  const start = Math.max(2, stepNumber - siblingCount)
  const end = Math.min(totalSteps - 1, stepNumber + siblingCount)

  pages.push(1)
  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < totalSteps - 1) pages.push('ellipsis')
  if (totalSteps > 1) pages.push(totalSteps)

  return pages
}

function dockedTooltipPosition(): TooltipPos {
  return {
    bottom: DOCK_BOTTOM,
    left: window.innerWidth / 2,
    placement: 'dock',
  }
}

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

function sameSpotlight(a: SpotlightRect | null, b: SpotlightRect | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
}

function sameTooltip(a: TooltipPos, b: TooltipPos): boolean {
  return a.placement === b.placement && a.top === b.top && a.left === b.left && a.bottom === b.bottom
}

function computeTooltipPosition(
  spotlight: SpotlightRect | null,
  preferred: 'top' | 'bottom' | 'left' | 'right' | 'center',
  measured?: TooltipSize | null
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
  const margin = VIEWPORT_MARGIN
  const tooltipHeight = measured?.height ?? getTourTooltipViewportReserve()
  const tooltipWidth = Math.min(measured?.width ?? TOOLTIP_WIDTH, vw - margin * 2)
  const isNarrow = vw <= MOBILE_NAV_MAX_WIDTH

  if (tooltipHeight > vh - margin * 2) {
    return dockedTooltipPosition()
  }

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

  const fitsInViewport = (top: number, left: number) =>
    top >= margin - 0.5 &&
    left >= margin - 0.5 &&
    top + tooltipHeight <= vh - margin + 0.5 &&
    left + tooltipWidth <= vw - margin + 0.5

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

    if (fitsInViewport(top, left) && !overlapsSpotlight(top, left)) {
      return { top, left, placement }
    }
  }

  return dockedTooltipPosition()
}

export function DashboardTourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, editorAssist, next, back, skip, canGoBack } =
    useDashboardTour()
  const pathname = usePathname()
  const cardRef = useRef<HTMLDivElement>(null)
  const cardSizeRef = useRef<TooltipSize | null>(null)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltip, setTooltip] = useState<TooltipPos>({ top: 0, left: 0, placement: 'center' })
  const [measuredVersion, setMeasuredVersion] = useState('')

  const assistKey = useMemo(() => JSON.stringify(editorAssist), [editorAssist])

  const layoutVersion = useMemo(() => {
    if (!isActive || !currentStep) return ''
    return `${currentStepIndex}:${pathname}:${currentStep.target ?? 'center'}:${assistKey}`
  }, [isActive, currentStep, currentStepIndex, pathname, assistKey])

  const ready = layoutVersion !== '' && measuredVersion === layoutVersion

  useEffect(() => {
    cardSizeRef.current = null
  }, [layoutVersion])

  const updateLayout = useCallback(
    (measured?: TooltipSize | null): boolean => {
      if (!currentStep) return false

      const prefersCenter = currentStep.placement === 'center' || !currentStep.target
      const nextSpotlight = prefersCenter ? null : measureSpotlight(currentStep)
      const useCenter = prefersCenter || !nextSpotlight
      const targetResolved = prefersCenter || Boolean(nextSpotlight)
      const size = measured === undefined ? cardSizeRef.current : measured

      if (useCenter) {
        clearTourTargetHighlight()
      } else {
        setTourTargetHighlight(currentStep.target, currentStep.route)
      }

      const nextTooltip = computeTooltipPosition(
        useCenter ? null : nextSpotlight,
        useCenter ? 'center' : (currentStep.placement ?? 'bottom'),
        size
      )

      setSpotlight((prev) => (sameSpotlight(prev, nextSpotlight) ? prev : nextSpotlight))
      setTooltip((prev) => (sameTooltip(prev, nextTooltip) ? prev : nextTooltip))

      return targetResolved
    },
    [currentStep]
  )

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

  useLayoutEffect(() => {
    if (!ready || !isActive || !currentStep) return

    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const nextSize: TooltipSize = {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    }

    const prev = cardSizeRef.current
    const sizeChanged =
      !prev || Math.abs(prev.width - nextSize.width) > 1 || Math.abs(prev.height - nextSize.height) > 1

    if (!sizeChanged) return

    cardSizeRef.current = nextSize
    updateLayout(nextSize)
  }, [ready, isActive, currentStep, layoutVersion, updateLayout])

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
  const hasSpotlight = routeOk && ready && !isCenter && Boolean(spotlight)
  const cardTooltip =
    routeOk && ready
      ? tooltip
      : { top: window.innerHeight / 2, left: window.innerWidth / 2, placement: 'center' as const }

  return (
    <ModalPortal>
      {hasSpotlight && spotlight ? (
        <>
          <TourSpotlightMask rect={spotlight} />
          <TourSpotlightRing rect={spotlight} />
        </>
      ) : (
        <TourBackdrop />
      )}

      <TourCard
        cardRef={cardRef}
        tooltip={cardTooltip}
        stepNumber={currentStepIndex + 1}
        totalSteps={totalSteps}
        title={currentStep.title}
        description={currentStep.description}
        tips={currentStep.tips}
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
    <>
      <div
        className="pointer-events-none fixed rounded-xl border-2 border-indigo-500/90 shadow-[0_0_0_4px_rgba(79,70,229,0.15)] transition-all duration-300"
        style={{
          zIndex: TOUR_Z.spotlightRing,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
      <div
        className="pointer-events-none fixed animate-pulse rounded-xl ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-transparent"
        style={{
          zIndex: TOUR_Z.spotlightRing,
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />
      <div
        className="pointer-events-none fixed -translate-y-full rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-black tracking-wider text-white uppercase shadow-md"
        style={{
          zIndex: TOUR_Z.spotlightRing + 1,
          top: Math.max(8, rect.top - 8),
          left: rect.left,
        }}
      >
        Look here
      </div>
    </>
  )
}

function TourCard({
  cardRef,
  tooltip,
  stepNumber,
  totalSteps,
  title,
  description,
  tips,
  canGoBack,
  isLastStep,
  onSkip,
  onBack,
  onNext,
}: {
  cardRef?: RefObject<HTMLDivElement | null>
  tooltip: TooltipPos
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  tips?: string[]
  canGoBack: boolean
  isLastStep: boolean
  onSkip: () => void
  onBack: () => void
  onNext: () => void
}) {
  const isDocked = tooltip.placement === 'dock'
  const isCentered = tooltip.placement === 'center'

  return (
    <div
      ref={cardRef}
      data-vbiz-tour-ui
      className={cn(
        'pointer-events-auto fixed w-[min(340px,calc(100vw-32px))] rounded-2xl border border-indigo-200/60 bg-white p-5 shadow-xl transition-all duration-300 dark:border-indigo-500/20 dark:bg-[#0b0f19]',
        isCentered && '-translate-x-1/2 -translate-y-1/2',
        isDocked && '-translate-x-1/2'
      )}
      style={{
        zIndex: TOUR_Z.card,
        top: isDocked ? undefined : tooltip.top,
        bottom: isDocked ? tooltip.bottom : undefined,
        left: isDocked ? '50%' : tooltip.left,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-tour-title"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {getTourStepMarkers(stepNumber, totalSteps).map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="shrink-0 px-0.5 text-[10px] leading-none font-medium text-slate-400 dark:text-white/35"
                aria-hidden
              >
                …
              </span>
            ) : (
              <span
                key={item}
                className={cn(
                  'h-1.5 shrink-0 rounded-full transition-all',
                  item === stepNumber
                    ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                    : item < stepNumber
                      ? 'w-1.5 bg-indigo-400/70'
                      : 'w-1.5 bg-slate-200 dark:bg-white/15'
                )}
              />
            )
          )}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          Skip
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mb-1 text-[11px] font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
        Step {stepNumber} of {totalSteps}
      </p>
      <h3 id="dashboard-tour-title" className="mb-2 text-[17px] font-black text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-3 text-[13px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">{description}</p>

      {tips && tips.length > 0 && (
        <div className="mb-5 space-y-1.5 rounded-xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          {tips.map((tip) => (
            <p
              key={tip}
              className="flex items-start gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200/90"
            >
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}

      <div className={cn('flex gap-3', !canGoBack && 'flex-col', !tips?.length && 'mt-2')}>
        {canGoBack && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onBack()
            }}
            className={secondaryButtonClass}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onNext()
          }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]',
            canGoBack ? 'flex-1' : 'w-full'
          )}
        >
          {isLastStep ? 'Finish' : 'Next'}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
