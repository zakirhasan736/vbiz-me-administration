'use client'

import { QrCodeModal, VCardsGrid, VCardsListHeader } from '@/components/dashboard/vcard'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { seedDemoIfEmpty, selectVCardList } from '@/redux/features/vcards/vcards.slice'
import { filterVCardsByQuery } from '@/utils/vcard'
import { useEffect, useMemo, useState } from 'react'

const DashboardVCardsView = () => {
  const dispatch = useAppDispatch()
  const cards = useAppSelector(selectVCardList)

  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(seedDemoIfEmpty())
  }, [dispatch])

  const filtered = useMemo(() => filterVCardsByQuery(cards, query), [cards, query])

  const openQrModal = (url: string) => {
    setSelectedVCardUrl(url)
    setIsQrModalOpen(true)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <VCardsListHeader query={query} onQueryChange={setQuery} />

      <VCardsGrid cards={filtered} onOpenQr={openQrModal} />

      {isQrModalOpen && <QrCodeModal url={selectedVCardUrl} onClose={() => setIsQrModalOpen(false)} />}
    </div>
  )
}

export default DashboardVCardsView
