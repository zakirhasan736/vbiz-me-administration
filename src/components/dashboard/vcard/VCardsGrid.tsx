import type { VCardRecord } from '@/types/vcard'
import { CreateVCardCard } from './CreateVCardCard'
import { VCardGridCard } from './VCardGridCard'

type VCardsGridProps = {
  cards: VCardRecord[]
  onOpenQr: (url: string) => void
}

export function VCardsGrid({ cards, onOpenQr }: VCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <VCardGridCard key={card.id} card={card} onOpenQr={onOpenQr} />
      ))}
      <CreateVCardCard />
    </div>
  )
}
