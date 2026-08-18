'use client'

import { UserRound } from 'lucide-react'
import Image from 'next/image'

function legitimateImageUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

type ReviewAvatarProps = {
  imageUrl?: string | null
  alt?: string
  className?: string
  imageClassName?: string
}

export function ReviewAvatar({ imageUrl, alt, className = 'h-12 w-12', imageClassName = '' }: ReviewAvatarProps) {
  const src = imageUrl ? legitimateImageUrl(imageUrl) : null
  const label = alt?.trim() || 'Reviewer'

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700/50 dark:bg-zinc-800 dark:text-zinc-400 ${className}`}
    >
      {src ? (
        <Image
          width={100}
          height={100}
          src={src}
          alt={label}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <UserRound aria-hidden="true" className="h-1/2 w-1/2" />
      )}
    </div>
  )
}
