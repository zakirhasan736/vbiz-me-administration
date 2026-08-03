'use client'

import { NotificationModal } from '@/profile-app/components/NotificationModal'
import { useProfileIntroContext } from '@/profile-app/providers/ProfileIntroProvider'

/** Auto force-notification prompt — same v3 behavior on every template shell. */
export function ProfileForceNotification({
  cardOwnerId = '91',
  cardSlug = 'preview',
  ownerName = 'Michaelangelo Casanova',
  embedded = false,
}: {
  cardOwnerId?: string
  cardSlug?: string
  ownerName?: string
  embedded?: boolean
}) {
  const { introAllowed } = useProfileIntroContext()

  if (embedded) return null

  return (
    <NotificationModal cardOwnerId={cardOwnerId} cardSlug={cardSlug} ownerName={ownerName} enabled={introAllowed} />
  )
}
