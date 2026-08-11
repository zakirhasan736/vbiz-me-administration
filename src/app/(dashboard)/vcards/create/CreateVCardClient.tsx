'use client'

import { useAppSelector } from '@/hooks/redux'
import { notify } from '@/lib/toast/toast'
import {
  DEFAULT_EDITOR_SECTION,
  buildEditorPath,
  buildEditorSectionPath,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import VCardEdit from '@/views/VCardEdit'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'

type Props = {
  segments?: string[]
}

export default function CreateVCardClient({ segments }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentQuery = searchParams.get('agent') === '1' ? 'agent=1' : ''
  const resetParam = searchParams.get('reset')
  const resetQuery = resetParam ? `reset=${encodeURIComponent(resetParam)}` : ''
  const createQuery = [agentQuery, resetQuery].filter(Boolean).join('&')
  const createQuerySuffix = createQuery ? `?${createQuery}` : ''
  const role = useAppSelector((state) => state.user.user?.role)
  const { data: profilesResult, isLoading } = useGetProfilesQuery({ limit: 100 })
  const parsed = parseEditorSegments(segments)
  const profiles = useMemo(() => profilesResult?.items ?? [], [profilesResult?.items])
  const capacity = profilesResult?.capacity
  const isPersonal = role === 'vcard-owner'
  const isCorporate = role === 'corporate-owner'
  const blockedByPersonalLimit = isPersonal && !isLoading && (capacity ? !capacity.canCreate : profiles.length >= 1)
  const blockedByCorporateLimit = isCorporate && !isLoading && capacity != null && !capacity.canCreate
  const blockedByLimit = blockedByPersonalLimit || blockedByCorporateLimit
  const toastShown = useRef(false)

  useEffect(() => {
    if (blockedByCorporateLimit) {
      if (!toastShown.current) {
        toastShown.current = true
        notify.warning(
          capacity && capacity.limit <= 0
            ? 'No active package with card capacity. Upgrade your package to create cards.'
            : `Maximum of ${capacity?.limit ?? 0} corporate cards reached`
        )
      }
      router.replace('/teamvcard')
      return
    }

    if (blockedByPersonalLimit) {
      const existingId = profiles[0]?.id
      if (existingId) {
        router.replace(buildEditorSectionPath('/vcards/edit', 'home', existingId))
      } else {
        router.replace('/vcards')
      }
      return
    }

    if (!segments || segments.length === 0) {
      router.replace(`${buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION })}${createQuerySuffix}`)
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(`${buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION })}${createQuerySuffix}`)
    }
  }, [
    createQuerySuffix,
    blockedByCorporateLimit,
    blockedByPersonalLimit,
    capacity,
    parsed.sectionId,
    profiles,
    router,
    segments,
  ])

  if (blockedByLimit || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
        {blockedByCorporateLimit
          ? 'Redirecting to Team vCards…'
          : blockedByPersonalLimit
            ? 'Redirecting to your existing vCard…'
            : 'Loading…'}
      </div>
    )
  }

  if (!segments || segments.length === 0 || !isValidEditorSection(parsed.sectionId)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
        Redirecting…
      </div>
    )
  }

  return <VCardEdit basePath="/vcards/create" segments={segments} />
}
