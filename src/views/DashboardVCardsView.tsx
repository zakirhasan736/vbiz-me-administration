'use client'

import { QrCodeModal, VCardsGrid, VCardsListHeader } from '@/components/dashboard/vcard'
import { useAppDispatch } from '@/hooks/redux'
import { mapApiProfileToVCardRecord, useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import { replaceAllVCards } from '@/redux/features/vcards/vcards.slice'
import { filterVCardsByQuery } from '@/utils/vcard'
import { useEffect, useMemo, useState } from 'react'

const DashboardVCardsView = () => {
  const dispatch = useAppDispatch()
  const { data: profiles = [], isLoading, isError, refetch } = useGetProfilesQuery()

  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [query, setQuery] = useState('')

  const cards = useMemo(() => profiles.map(mapApiProfileToVCardRecord), [profiles])

  useEffect(() => {
    if (isLoading) return
    dispatch(replaceAllVCards(cards))
  }, [cards, dispatch, isLoading])

  const filtered = useMemo(() => filterVCardsByQuery(cards, query), [cards, query])

  const openQrModal = (url: string) => {
    setSelectedVCardUrl(url)
    setIsQrModalOpen(true)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <VCardsListHeader query={query} onQueryChange={setQuery} />

      {isLoading && <p className="mb-4 text-sm text-slate-500">Loading your vCards…</p>}
      {isError && (
        <p className="mb-4 text-sm text-rose-500">
          Could not load vCards from the server.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      <VCardsGrid cards={filtered} onOpenQr={openQrModal} />

      {isQrModalOpen && <QrCodeModal url={selectedVCardUrl} onClose={() => setIsQrModalOpen(false)} />}
    </div>
  )
}

export default DashboardVCardsView
