'use client'

import { RequestOneOnOneModal } from '@/components/public/RequestOneOnOneModal'
import { isVideoUrl } from '@/lib/mediaUrl'
import { writeContactFlowAsked } from '@/lib/push/config'
import {
  clearHomeScreenPromptAfterContact,
  homeScreenPromptAfterContactPending,
  isCardOnHomeScreen,
} from '@/lib/pwa/pwaInstallEnv'
import { DoneModal } from '@/profile-app/components/DoneModal'
import { InfoModal } from '@/profile-app/components/InfoModal'
import { NotificationAskModal } from '@/profile-app/components/NotificationAskModal'
import { NotificationFollowModal } from '@/profile-app/components/NotificationFollowModal'
import { NotificationSettingsModal } from '@/profile-app/components/NotificationSettingsModal'
import { SaveCardPwaModal } from '@/profile-app/components/SaveCardPwaModal'
import { SaveContactModal } from '@/profile-app/components/SaveContactModal'
import { SaveToWalletModal } from '@/profile-app/components/SaveToWalletModal'
import { ShareModal } from '@/profile-app/components/ShareModal'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const NotepadModal = dynamic(
  () => import('@/profile-app/v3/components/NotepadModal').then((m) => ({ default: m.NotepadModal })),
  { ssr: false }
)

export type ProfileHomeModalId =
  | 'contact'
  | 'pwa'
  | 'follow'
  | 'notification'
  | 'done'
  | 'settings'
  | 'notepad'
  | 'share'
  | 'info'
  | 'wallet'
  | 'one_on_one'
  | null

type ProfileHomeModalsProps = {
  activeModal: ProfileHomeModalId
  onClose: () => void
  onSetModal: (modal: ProfileHomeModalId) => void
  theme?: string
  cardOwnerId?: string
  cardSlug?: string
  ownerName?: string
  avatarUrl?: string | null
}

/** Shared home-screen modals opened by CTA buttons across v1, v2, and v3. */
export function ProfileHomeModals({
  activeModal,
  onClose,
  onSetModal,
  theme,
  cardOwnerId,
  cardSlug = 'preview',
  ownerName,
  avatarUrl,
}: ProfileHomeModalsProps) {
  const ownerId = cardOwnerId ?? '91'
  const stillAvatar = avatarUrl && !isVideoUrl(avatarUrl) ? avatarUrl : null
  const [pwaOpenedAfterContactSave, setPwaOpenedAfterContactSave] = useState(false)
  const [returnTick, setReturnTick] = useState(0)
  const promptPending = homeScreenPromptAfterContactPending()
  const alreadyOnHomeScreen = isCardOnHomeScreen()

  if (promptPending && alreadyOnHomeScreen) {
    clearHomeScreenPromptAfterContact()
  }

  const offerAfterDownload = promptPending && !alreadyOnHomeScreen && returnTick >= 0
  if (offerAfterDownload && !pwaOpenedAfterContactSave) {
    setPwaOpenedAfterContactSave(true)
  }

  useEffect(() => {
    const onPageShow = () => setReturnTick((tick) => tick + 1)
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const closePwaModal = () => {
    clearHomeScreenPromptAfterContact()
    setPwaOpenedAfterContactSave(false)
    onClose()
  }

  return (
    <>
      <NotepadModal
        isOpen={activeModal === 'notepad'}
        onClose={onClose}
        cardOwnerId={cardOwnerId ?? 'michaelangelo_casanova'}
        ownerName={ownerName}
      />
      <SaveContactModal
        isOpen={activeModal === 'contact'}
        onClose={onClose}
        onSuccess={() => {
          if (isCardOnHomeScreen()) {
            clearHomeScreenPromptAfterContact()
            onClose()
            return
          }
          setPwaOpenedAfterContactSave(true)
          onSetModal('pwa')
        }}
        profileId={cardOwnerId}
        cardSlug={cardSlug}
        ownerName={ownerName}
      />
      <RequestOneOnOneModal
        open={activeModal === 'one_on_one'}
        onClose={onClose}
        profileId={ownerId}
        cardName={ownerName}
      />
      <SaveCardPwaModal
        isOpen={activeModal === 'pwa' || pwaOpenedAfterContactSave}
        onClose={closePwaModal}
        ownerName={ownerName}
        avatarUrl={stillAvatar}
        cardSlug={cardSlug}
        contactJustSaved={pwaOpenedAfterContactSave}
      />
      <NotificationFollowModal
        isOpen={activeModal === 'follow'}
        onClose={onClose}
        cardOwnerId={ownerId}
        cardSlug={cardSlug}
        ownerName={ownerName}
      />
      <NotificationAskModal
        isOpen={activeModal === 'notification'}
        onClose={() => {
          writeContactFlowAsked(ownerId, false)
          onClose()
        }}
        cardOwnerId={ownerId}
        cardSlug={cardSlug}
        ownerName={ownerName}
        onAccept={(preferences) => {
          writeContactFlowAsked(ownerId, true, preferences)
          onSetModal('done')
        }}
      />
      <NotificationSettingsModal
        isOpen={activeModal === 'settings'}
        onClose={onClose}
        cardSlug={cardSlug}
        onReEnable={() => onSetModal('follow')}
      />
      <DoneModal isOpen={activeModal === 'done'} onClose={onClose} />
      <ShareModal isOpen={activeModal === 'share'} onClose={onClose} />
      <InfoModal isOpen={activeModal === 'info'} onClose={onClose} theme={theme} />
      <SaveToWalletModal
        isOpen={activeModal === 'wallet'}
        onClose={onClose}
        cardSlug={cardSlug}
        ownerName={ownerName}
      />
    </>
  )
}
