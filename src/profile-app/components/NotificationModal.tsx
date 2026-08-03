'use client'

import {
  FORCE_NOTIFICATION_DELAY_MS,
  isProfileExperienceSettled,
  notifyProfileExperienceSettled,
  PROFILE_EXPERIENCE_SETTLED_EVENT,
} from '@/lib/push/notificationExperience'
import { shouldAutoShowNotificationPrompt } from '@/lib/push/notificationRouting'
import { NotificationFollowModal } from '@/profile-app/components/NotificationFollowModal'
import { readFollowState } from '@/profile-app/lib/pushNotifications'
import { useCallback, useEffect, useState } from 'react'

type NotificationModalProps = {
  cardOwnerId?: string
  cardSlug?: string
  ownerName?: string
  /** Start the first-visit timer only after preloader / intro is done */
  enabled?: boolean
}

/** Auto first-visit follow prompt — per profile slug, all templates. */
export function NotificationModal({
  cardOwnerId = '91',
  cardSlug = 'preview',
  ownerName = 'Michaelangelo Casanova',
  enabled = true,
}: NotificationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [experienceSettled, setExperienceSettled] = useState(() =>
    typeof window !== 'undefined' ? isProfileExperienceSettled() : false
  )

  const settle = useCallback(() => {
    notifyProfileExperienceSettled()
  }, [])

  useEffect(() => {
    const onSettled = () => setExperienceSettled(true)
    window.addEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
    return () => window.removeEventListener(PROFILE_EXPERIENCE_SETTLED_EVENT, onSettled)
  }, [])

  useEffect(() => {
    if (!enabled || !experienceSettled || !cardSlug.trim()) return

    // Fast path: already enabled for this card — never schedule the popup.
    if (readFollowState(cardSlug)?.following) {
      settle()
      return
    }

    let cancelled = false
    let timer: number | undefined

    const schedule = async () => {
      const shouldShow = await shouldAutoShowNotificationPrompt(cardSlug)
      if (cancelled) return
      if (!shouldShow) {
        settle()
        return
      }

      timer = window.setTimeout(() => {
        if (!cancelled) setIsOpen(true)
      }, FORCE_NOTIFICATION_DELAY_MS)
    }

    void schedule()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [enabled, experienceSettled, cardSlug, settle])

  const handleClose = () => {
    setIsOpen(false)
    settle()
  }

  return (
    <NotificationFollowModal
      isOpen={isOpen}
      onClose={handleClose}
      cardOwnerId={cardOwnerId}
      cardSlug={cardSlug}
      ownerName={ownerName}
    />
  )
}
