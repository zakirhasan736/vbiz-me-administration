'use client'

import type { ProfileHomeModalId } from '@/profile-app/components/ProfileHomeModals'
import { useEffect } from 'react'

type ProfileHomeModalEventsOptions = {
  cardSlug?: string
}

/** Wire global CTA custom events to profile home modal state (all templates). */
export function useProfileHomeModalEvents(
  setActiveModal: (modal: ProfileHomeModalId) => void,
  _options?: ProfileHomeModalEventsOptions
) {
  useEffect(() => {
    const handleSaveContact = () => setActiveModal('contact')
    const handleOpenNotepad = () => setActiveModal('notepad')
    const handleOpenMyInfo = () => setActiveModal('info')
    const handleOpenShare = () => setActiveModal('share')
    const handleOpenWallet = () => setActiveModal('wallet')
    const handleOpenPwa = () => setActiveModal('pwa')
    const handleOpenFollow = () => setActiveModal('follow')

    window.addEventListener('saveContactAction', handleSaveContact)
    window.addEventListener('openNotepadAction', handleOpenNotepad)
    window.addEventListener('openMyInfoModal', handleOpenMyInfo)
    window.addEventListener('openShareModal', handleOpenShare)
    window.addEventListener('openWalletModal', handleOpenWallet)
    window.addEventListener('openPwaInstallModal', handleOpenPwa)
    window.addEventListener('openFollowModal', handleOpenFollow)

    return () => {
      window.removeEventListener('saveContactAction', handleSaveContact)
      window.removeEventListener('openNotepadAction', handleOpenNotepad)
      window.removeEventListener('openMyInfoModal', handleOpenMyInfo)
      window.removeEventListener('openShareModal', handleOpenShare)
      window.removeEventListener('openWalletModal', handleOpenWallet)
      window.removeEventListener('openPwaInstallModal', handleOpenPwa)
      window.removeEventListener('openFollowModal', handleOpenFollow)
    }
  }, [setActiveModal])
}
