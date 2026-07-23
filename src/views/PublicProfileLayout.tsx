'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { CardScopeProvider } from '@/lib/card-scope'
import { ProfileApp } from '@/profile-app/ProfileApp'
import '@/profile-app/profile-app.css'
import { vCardRecordToProfileProps } from '@/profile-app/profilePublicProps'
import { seedDemoIfEmpty, selectVCardById, selectVCardIdBySlug } from '@/redux/features/vcards/vcards.slice'
import { useEffect, useMemo, type ReactNode } from 'react'

type Props = {
  slug: string
  children: ReactNode
}

/**
 * Stable per-slug layout. Cover video is detached in `ProfileApp` (`ProfileCoverHost`).
 * Only route `children` (section content) swap on navigation.
 */
export default function PublicProfileLayout({ slug, children }: Props) {
  const dispatch = useAppDispatch()
  const cardId = useAppSelector((s) => selectVCardIdBySlug(s, slug))
  const record = useAppSelector((s) => (cardId ? selectVCardById(s, cardId) : null))
  const designSettings = useAppSelector((s) => s.designSettings)

  useEffect(() => {
    dispatch(seedDemoIfEmpty())
  }, [dispatch])

  const vcardCount = useAppSelector((s) => s.vcards.ids.length)

  const profileProps = useMemo(
    () => (record ? vCardRecordToProfileProps(record, designSettings) : null),
    [record, designSettings]
  )

  if (!cardId || !record || !profileProps) {
    if (vcardCount === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm font-medium text-zinc-500 dark:bg-[#09090b]">
          Loading profile…
        </div>
      )
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-[#09090b]">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">vCard not found</p>
        <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          No saved card matches <span className="font-mono text-zinc-900 dark:text-zinc-200">{slug}</span>. Create one
          from My vCards, set its URL slug, then open View again.
        </p>
      </div>
    )
  }

  return (
    <CardScopeProvider cardId={cardId}>
      <ProfileApp {...profileProps} profileSlug={slug}>
        {children}
      </ProfileApp>
    </CardScopeProvider>
  )
}
