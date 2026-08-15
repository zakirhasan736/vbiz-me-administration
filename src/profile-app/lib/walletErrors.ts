type WalletErrorPayload = {
  message?: string
  error?: string
}

export function walletHttpErrorMessage(
  status: number,
  payload?: WalletErrorPayload,
  wallet: 'Google Wallet' | 'Apple Wallet' = 'Google Wallet'
): string {
  if (status === 429) {
    return 'Too many requests from this card page. Wait about a minute, then tap Save again.'
  }
  if (status === 501) {
    return `${wallet} is not live on the API yet. Deploy the latest backend, then try again.`
  }
  if (status === 404) {
    return `${wallet} is not available on the live API yet. Deploy the latest backend, then try again.`
  }
  if (status === 503) {
    return payload?.message || payload?.error || `${wallet} is not configured on the server.`
  }
  return payload?.message || payload?.error || `Could not generate your ${wallet} pass.`
}
