import type { VCardRecord } from '@/types/vcard'
import { CreateVCardCard } from './CreateVCardCard'
import { VCardGridCard } from './VCardGridCard'
import { VCardTeamCard } from './VCardTeamCard'

type VCardsGridProps = {
  cards: VCardRecord[]
  onOpenQr: (url: string, name?: string) => void
  onPanel?: (card: VCardRecord) => void
  onNotice?: (card: VCardRecord) => void
  noticeVersion?: number
  canCreate?: boolean
  showLimitPlaceholder?: boolean
  isPersonal?: boolean
  onTrends?: (card: VCardRecord) => void
}

export function VCardsGrid({
  cards,
  onOpenQr,
  onPanel,
  onNotice,
  noticeVersion = 0,
  canCreate = true,
  showLimitPlaceholder = false,
  isPersonal = false,
  onTrends,
}: VCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) =>
        isPersonal ? (
          <VCardTeamCard
            key={card.id}
            card={card}
            onOpenQr={onOpenQr}
            onPanel={onPanel ?? (() => undefined)}
            onNotice={onNotice ?? (() => undefined)}
            noticeVersion={noticeVersion}
            canDuplicate={canCreate}
            duplicateDisabledReason="Single card owners can create only one vCard"
            onTrends={onTrends ? () => onTrends(card) : undefined}
          />
        ) : (
          <VCardGridCard key={card.id} card={card} onOpenQr={onOpenQr} isPersonal={isPersonal} />
        )
      )}
      {canCreate ? <CreateVCardCard canCreate /> : showLimitPlaceholder ? <CreateVCardCard canCreate={false} /> : null}
    </div>
  )
}
