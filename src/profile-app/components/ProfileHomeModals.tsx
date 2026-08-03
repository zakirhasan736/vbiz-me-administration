'use client'

import { writeContactFlowAsked } from '@/lib/push/config'
import { DoneModal } from '@/profile-app/components/DoneModal'
import { InfoModal } from '@/profile-app/components/InfoModal'
import { NotificationAskModal } from '@/profile-app/components/NotificationAskModal'
import { NotificationFollowModal } from '@/profile-app/components/NotificationFollowModal'
import { NotificationSettingsModal } from '@/profile-app/components/NotificationSettingsModal'
import { SaveContactModal } from '@/profile-app/components/SaveContactModal'
import { ShareModal } from '@/profile-app/components/ShareModal'
import dynamic from 'next/dynamic'

const NotepadModal = dynamic(
  () => import('@/profile-app/v3/components/NotepadModal').then((m) => ({ default: m.NotepadModal })),
  { ssr: false }
)

export type ProfileHomeModalId =
  'contact' | 'follow' | 'notification' | 'done' | 'settings' | 'notepad' | 'share' | 'info' | null

type ProfileHomeModalsProps = {
  activeModal: ProfileHomeModalId
  onClose: () => void
  onSetModal: (modal: ProfileHomeModalId) => void
  theme?: string
  cardOwnerId?: string
  cardSlug?: string
  ownerName?: string
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
}: ProfileHomeModalsProps) {
  const ownerId = cardOwnerId ?? '91'

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
        profileId={cardOwnerId}
        ownerName={ownerName}
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
    </>
  )
}
