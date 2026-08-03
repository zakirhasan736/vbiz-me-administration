'use client'

import { isVideoUrl } from '@/lib/mediaUrl'
import { notifyProfileExperienceSettled } from '@/lib/push/notificationExperience'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { cleanProfileFieldValue } from '@/profile-app/lib/profileHomeData'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

/** Minimum time the brand splash stays up, so it never flickers on fast loads. */
const MIN_VISIBLE_MS = 650

function resolveBrandName(fullName: string, company: string): string {
  const brand = company.trim() || fullName.trim()
  return brand ? cleanProfileFieldValue(brand) : 'vBiz'
}

function resolveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Branded splash on every fresh visit / hard reload.
 * Colors from theme tokens (primary / secondary / accent / text).
 */
export function ProfileBrandPreloader() {
  const { isNavLoading, visibleTabs, navItems } = useProfileNavigation()
  const { personal, homeMedia, embedded } = useProfileDisplay()

  const navReady = !isNavLoading && (visibleTabs.length > 0 || navItems.length === 0)
  const [visible, setVisible] = useState(() => !embedded)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (embedded || !navReady || !minElapsed) return
    const timer = window.setTimeout(() => {
      setVisible(false)
      notifyProfileExperienceSettled()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [embedded, navReady, minElapsed])

  const brandName = useMemo(
    () => resolveBrandName(personal.fullName, personal.company),
    [personal.fullName, personal.company]
  )
  const initials = useMemo(() => resolveInitials(brandName), [brandName])
  const logo = homeMedia.profileMedia?.trim() ?? ''
  const showLogoImage = Boolean(logo) && !isVideoUrl(logo)
  const tagline = (personal.profession || personal.designation || '').trim()

  if (embedded) return null

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="brand-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="vbiz-preloader fixed inset-0 z-[190] flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative flex h-24 w-24 items-center justify-center"
            >
              <motion.span
                aria-hidden
                className="vbiz-preloader-ring absolute inset-0 border-2 opacity-35"
                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="vbiz-preloader-logo relative flex h-24 w-24 items-center justify-center overflow-hidden text-2xl font-black">
                {showLogoImage ? (
                  <Image src={logo} alt={brandName} width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <span className="notranslate">{initials}</span>
                )}
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-1.5 overflow-hidden">
              <motion.h1
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="vbiz-title notranslate max-w-[80vw] truncate text-center text-2xl font-black tracking-tight"
              >
                {brandName}
              </motion.h1>
              {tagline ? (
                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="vbiz-pin max-w-[70vw] truncate text-center text-xs font-semibold tracking-[0.25em] uppercase opacity-80"
                >
                  {tagline}
                </motion.p>
              ) : null}
            </div>

            <div className="vbiz-preloader-progress-track mt-2 h-[3px] w-40 overflow-hidden rounded-full">
              <motion.div
                className="vbiz-preloader-progress-bar h-full w-1/2 rounded-full"
                animate={{ x: ['-100%', '220%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
