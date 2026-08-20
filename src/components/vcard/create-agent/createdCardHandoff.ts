type CreatedCardHandoffOptions = {
  isEdit: boolean
  cardId?: string | null
  onCreatedNavigate?: (cardId?: string) => void
  onClose: () => void
}

/**
 * A successful create must navigate without also running the modal close route
 * cleanup. The new edit route unmounts the create wizard by itself.
 */
export function completeCreatedCardHandoff({
  isEdit,
  cardId,
  onCreatedNavigate,
  onClose,
}: CreatedCardHandoffOptions): 'navigate' | 'close' {
  if (!isEdit && cardId && onCreatedNavigate) {
    onCreatedNavigate(cardId)
    return 'navigate'
  }
  onClose()
  return 'close'
}
