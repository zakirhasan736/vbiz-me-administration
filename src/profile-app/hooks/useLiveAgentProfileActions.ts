'use client'

import {
  LIVE_AGENT_GO_TO_SECTION,
  LIVE_AGENT_OPEN_NOTEPAD,
  LIVE_AGENT_OPEN_SAVE_CONTACT,
  LIVE_AGENT_SAVE_CONTACT_LEGACY,
} from '@/profile-app/lib/liveAgentEvents'
import { useProfileNavigation } from '@/profile-app/providers/ProfileNavigationProvider'
import { useEffect } from 'react'

type SectionEventDetail = {
  sectionId?: string
}

/** Wires central live-agent custom events to profile UI (all templates). */
export function useLiveAgentProfileActions(onOpenSaveContact: () => void, onOpenNotepad?: () => void) {
  const { goToSection } = useProfileNavigation()

  useEffect(() => {
    const handleOpenSaveContact = () => onOpenSaveContact()
    const handleGoToSection = (event: Event) => {
      const sectionId = (event as CustomEvent<SectionEventDetail>).detail?.sectionId ?? 'home'
      goToSection(sectionId)
    }
    const handleOpenNotepad = () => onOpenNotepad?.()

    window.addEventListener(LIVE_AGENT_OPEN_SAVE_CONTACT, handleOpenSaveContact)
    window.addEventListener(LIVE_AGENT_SAVE_CONTACT_LEGACY, handleOpenSaveContact)
    window.addEventListener(LIVE_AGENT_GO_TO_SECTION, handleGoToSection)
    if (onOpenNotepad) {
      window.addEventListener(LIVE_AGENT_OPEN_NOTEPAD, handleOpenNotepad)
    }

    return () => {
      window.removeEventListener(LIVE_AGENT_OPEN_SAVE_CONTACT, handleOpenSaveContact)
      window.removeEventListener(LIVE_AGENT_SAVE_CONTACT_LEGACY, handleOpenSaveContact)
      window.removeEventListener(LIVE_AGENT_GO_TO_SECTION, handleGoToSection)
      if (onOpenNotepad) {
        window.removeEventListener(LIVE_AGENT_OPEN_NOTEPAD, handleOpenNotepad)
      }
    }
  }, [goToSection, onOpenNotepad, onOpenSaveContact])
}
