'use client'

import { useProfileNavScroll } from '@/profile-app/hooks/useProfileNavScroll'
import { cn } from '@/utils/cn'
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useCallback, useEffect, useState } from 'react'

interface Tab {
  id: string
  icon: LucideIcon
  label: string
}

interface NavigationProps {
  tabs: Tab[]
  activeTab: string
  setActiveTab: (id: string) => void
  theme?: string
  /** Persist horizontal scroll position per profile slug. */
  slugForPersistence?: string
}

export const Navigation: React.FC<NavigationProps> = ({ tabs, activeTab, setActiveTab, slugForPersistence }) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const { scrollRef, scrollClassName, canScrollLeft, canScrollRight, scrollToEdge, scrollTabIntoView, didDragRef } =
    useProfileNavScroll(slugForPersistence, 'v3', activeTab, 'tab-btn')

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setIsOverflowing(el.scrollWidth > el.clientWidth + 2)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    checkOverflow()
    el.addEventListener('scroll', checkOverflow)
    window.addEventListener('resize', checkOverflow)
    const timer = window.setTimeout(checkOverflow, 250)

    return () => {
      el.removeEventListener('scroll', checkOverflow)
      window.removeEventListener('resize', checkOverflow)
      window.clearTimeout(timer)
    }
  }, [tabs, activeTab, checkOverflow, scrollRef])

  const handleTabClick = (tabId: string) => {
    if (didDragRef.current) return

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    setActiveTab(tabId)
    scrollTabIntoView(tabId, 'tab-btn')
  }

  return (
    <div className="relative flex w-full min-w-0 items-center">
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToEdge('left')}
            className="vbiz-nav-scroll-btn absolute left-0 z-30 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all active:scale-90"
            title="Scroll left"
            aria-label="Scroll navigation left"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Profile navigation"
        aria-orientation="horizontal"
        className={cn(
          'vbiz-floating-nav-scroll mask-edges gap-3 px-6 py-0.5 md:gap-3.5 md:px-2',
          isOverflowing ? 'justify-start' : 'justify-center',
          scrollClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isHovered = hoveredTab === tab.id

          return (
            <motion.button
              layout="position"
              key={tab.id}
              type="button"
              role="tab"
              onClick={() => handleTabClick(tab.id)}
              id={`tab-btn-${tab.id}`}
              aria-current={isActive ? 'page' : undefined}
              aria-selected={isActive}
              data-active={isActive ? 'true' : 'false'}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className="vbiz-nav-tab focus-visible:ring-gold/60 relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition-all duration-300 outline-none focus-visible:ring-1 active:scale-95 md:h-12 md:w-12 md:rounded-[14px]"
              title={tab.label}
              aria-label={tab.label}
            >
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverIndicator"
                  className="vbiz-nav-tab-hover-bg absolute inset-0 rounded-[12px] border md:rounded-[14px]"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="vbiz-nav-tab-active-bg absolute inset-0 rounded-[12px] border shadow-sm md:rounded-[14px]"
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <tab.icon
                  size={20}
                  className="vbiz-nav-tab-icon h-5 w-5 transition-colors duration-200 md:h-5 md:w-5"
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.25 : 0}
                />
              </div>

              {isActive && (
                <span className="vbiz-nav-tab-dot absolute bottom-[2px] left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 animate-pulse rounded-full md:hidden" />
              )}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToEdge('right')}
            className="vbiz-nav-scroll-btn absolute right-0 z-30 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all active:scale-90"
            title="Scroll right"
            aria-label="Scroll navigation right"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
