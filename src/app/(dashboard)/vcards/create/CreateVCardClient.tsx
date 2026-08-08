'use client'

import { useAppSelector } from '@/hooks/redux'
import {
  DEFAULT_EDITOR_SECTION,
  buildEditorPath,
  buildEditorSectionPath,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import VCardEdit from '@/views/VCardEdit'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  segments?: string[]
}

export default function CreateVCardClient({ segments }: Props) {
  const router = useRouter()
  const role = useAppSelector((state) => state.user.user?.role)
  const { data: profiles = [], isLoading } = useGetProfilesQuery()
  const parsed = parseEditorSegments(segments)
  const isPersonal = role === 'vcard-owner'
  const blockedByLimit = isPersonal && !isLoading && profiles.length >= 1

  useEffect(() => {
    if (blockedByLimit) {
      const existingId = profiles[0]?.id
      if (existingId) {
        router.replace(buildEditorSectionPath('/vcards/edit', 'home', existingId))
      } else {
        router.replace('/vcards')
      }
      return
    }

    if (!segments || segments.length === 0) {
      router.replace(buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION }))
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION }))
    }
  }, [blockedByLimit, parsed.sectionId, profiles, router, segments])

  if (blockedByLimit || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
        {blockedByLimit ? 'Redirecting to your existing vCard…' : 'Loading…'}
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
