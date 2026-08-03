'use client'

import { useEffect, useState } from 'react'

/** Scroll to top on home tab; scroll to content pane on other tabs (v2 reference behavior). */
export function useProfileSectionScroll(activeSectionId: string) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (activeSectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const el = document.getElementById('content-pane')
    if (!el) return

    const y = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  }, [activeSectionId])

  return { isScrolled }
}
