export function corporateCardCreateBlockedReason(input: {
  canMutateVcards: boolean
  pausedMessage: string
  limit: number | null | undefined
  used: number
  remaining: number | null | undefined
}): string {
  if (!input.canMutateVcards) return input.pausedMessage
  if (input.limit == null || input.limit <= 0) {
    return 'No active package with card capacity. Upgrade your package to create cards.'
  }
  const remaining = input.remaining ?? Math.max(0, input.limit - input.used)
  return `Maximum of ${input.limit} corporate cards reached (${input.used} used, ${remaining} remaining). Existing cards were not removed.`
}
