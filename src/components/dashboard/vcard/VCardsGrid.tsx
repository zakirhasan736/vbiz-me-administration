import { noticeForCard, noticeTypeFromTeamNotice } from '@/lib/cardNotice'
import type { TeamNotice } from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { CreateVCardCard } from './CreateVCardCard'
import { VCardTeamCard } from './VCardTeamCard'

type VCardsGridProps = {
  cards: VCardRecord[]
  onOpenQr: (url: string, name?: string) => void
  onPanel?: (card: VCardRecord) => void
  onNotice?: (card: VCardRecord) => void
  noticeVersion?: number
  teamNotices?: TeamNotice[]
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
  teamNotices = [],
  canCreate = true,
  showLimitPlaceholder = false,
  isPersonal = false,
  onTrends,
}: VCardsGridProps) {
  const cardNodes = cards.map((card) => {
    const serverNotice = noticeForCard(card.id, teamNotices)
    return (
      <VCardTeamCard
        key={card.id}
        card={card}
        mode={isPersonal ? 'personal' : 'corporate'}
        badgeLabel={isPersonal ? 'Single' : 'Corporate'}
        onOpenQr={onOpenQr}
        onPanel={onPanel ?? (() => undefined)}
        onNotice={onNotice ?? (() => undefined)}
        noticeVersion={noticeVersion}
        cardNoticeText={serverNotice?.text ?? null}
        cardNoticeType={serverNotice ? noticeTypeFromTeamNotice(serverNotice) : null}
        canDuplicate={canCreate}
        duplicateDisabledReason={isPersonal ? 'Single card owners can create only one vCard' : 'Card limit reached'}
        onTrends={onTrends ? () => onTrends(card) : undefined}
      />
    )
  })

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {canCreate ? <CreateVCardCard canCreate /> : null}
      {cardNodes}
      {!canCreate && showLimitPlaceholder ? <CreateVCardCard canCreate={false} /> : null}
    </div>
  )
}
