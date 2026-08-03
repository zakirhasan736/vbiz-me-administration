'use client'

import { writeCardPushMedia } from '@/lib/push/cardPushMediaCache'
import { isVideoAvatarSrc, resolveNotificationAvatar } from '@/lib/push/resolveNotificationAvatar'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useEffect } from 'react'

function toAbsoluteMediaUrl(url: string) {
  const value = url.trim()
  if (!value) return ''
  try {
    return new URL(value, window.location.origin).href
  } catch {
    return value
  }
}

/**
 * Caches the current card owner's logo / avatar for push notifications.
 * Priority: company logo → profile photo → (video only for in-app toast).
 */
export function CardPushMediaSync() {
  const { cardSlug, personal, homeMedia, field, embedded } = useProfileDisplay()
  const companyIcon = field('Company/Office Icon').customValue
  const profileMedia = homeMedia.profileMedia?.trim() || ''
  const introVideo = homeMedia.introVideo?.trim() || ''
  const businessName = personal.fullName?.trim() || personal.company?.trim() || cardSlug || ''

  useEffect(() => {
    if (embedded || !cardSlug?.trim()) return

    const resolved = resolveNotificationAvatar({
      companyIcon,
      profileMedia: profileMedia
        ? {
            url: profileMedia,
            fallback_url: profileMedia,
          }
        : undefined,
      introVideo: introVideo
        ? {
            url: introVideo,
            fallback_url: introVideo,
            regular_video: isVideoAvatarSrc(introVideo) ? { url: introVideo } : undefined,
          }
        : undefined,
    })

    // OS notifications need a static image — company logo first, then avatar photo.
    const staticIcon = toAbsoluteMediaUrl(resolved.imageUrl)
    const videoUrl = toAbsoluteMediaUrl(resolved.videoUrl)
    if (!staticIcon && !videoUrl) return

    void writeCardPushMedia({
      slug: cardSlug,
      businessName: businessName || cardSlug,
      avatarImageUrl: staticIcon,
      avatarUrl: staticIcon,
      avatarVideoUrl: videoUrl,
      icon: staticIcon,
    })
  }, [embedded, cardSlug, companyIcon, profileMedia, introVideo, businessName])

  return null
}
