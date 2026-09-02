'use client'

import OwnerEventsView from '@/views/OwnerEventsView'
import { useSearchParams } from 'next/navigation'

export default function OwnerEventsPage() {
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profileId')

  return <OwnerEventsView initialProfileId={profileId} />
}
