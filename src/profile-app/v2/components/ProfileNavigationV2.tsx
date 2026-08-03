'use client'

import { getNavDisplayLabel } from '@/lib/vcardNavbar'
import { useProfileNavScroll } from '@/profile-app/hooks/useProfileNavScroll'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import { cn } from '@/utils/cn'
import { motion } from 'motion/react'
import { type KeyboardEvent } from 'react'

type ProfileNavigationV2Props = {
  slugForPersistence?: string
  embedded?: boolean
}

export function ProfileNavigationV2({ slugForPersistence, embedded }: ProfileNavigationV2Props) {
  const { visibleTabs, activeSectionId, goToSection } = useProfileNavigation()
  const { scrollRef: navScrollRef, scrollClassName: navScrollClassName } = useProfileNavScroll(
    slugForPersistence,
    'v2',
    activeSectionId,
    'tab'
  )

  return (
    <div
      className={cn(
        'vbiz-floating-nav sticky top-4 z-50 mb-8 flex w-full max-w-full justify-center px-3 sm:top-6 sm:px-0',
        embedded ? 'max-w-full' : ''
      )}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'vbiz-floating-nav-inner relative w-full max-w-full rounded-4xl border border-zinc-200/80 bg-white/80 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-3xl sm:rounded-full dark:border-zinc-700/50 dark:bg-zinc-900/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]',
          embedded ? 'max-w-[calc(100%-0.5rem)]' : ''
        )}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={navScrollRef}
            role="tablist"
            aria-label="Profile navigation"
            aria-orientation="horizontal"
            className={cn('vbiz-floating-nav-scroll mask-edges items-center gap-1.5 px-2 sm:gap-2', navScrollClassName)}
          >
            {visibleTabs.map((tab, index) => {
              const isActive = activeSectionId === tab.id
              const tabClassName = `vbiz-nav-tab relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:h-14 sm:w-14 ${
                isActive ? 'z-10 mx-0.5 shadow-[0_4px_15px_rgba(0,0,0,0.1)] sm:mx-1' : ''
              }`

              const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
                let nextIndex = index
                if (e.key === 'ArrowRight') {
                  nextIndex = (index + 1) % visibleTabs.length
                } else if (e.key === 'ArrowLeft') {
                  nextIndex = (index - 1 + visibleTabs.length) % visibleTabs.length
                } else if (e.key === 'Home') {
                  nextIndex = 0
                } else if (e.key === 'End') {
                  nextIndex = visibleTabs.length - 1
                }
                if (nextIndex !== index) {
                  e.preventDefault()
                  const nextId = visibleTabs[nextIndex].id
                  goToSection(nextId)
                  document.getElementById(`tab-${nextId}`)?.focus({ preventScroll: true })
                }
              }

              return (
                <motion.button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => goToSection(tab.id)}
                  onKeyDown={onKeyDown}
                  title={getNavDisplayLabel(tab)}
                  aria-label={getNavDisplayLabel(tab)}
                  className={tabClassName}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      initial={false}
                      className="vbiz-nav-tab-active-pill absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 1.5 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-center">
                    <tab.icon
                      strokeWidth={isActive ? 2.5 : 2}
                      className="vbiz-nav-tab-icon h-[18px] w-[18px] transition-colors duration-300 sm:h-[22px] sm:w-[22px]"
                    />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
