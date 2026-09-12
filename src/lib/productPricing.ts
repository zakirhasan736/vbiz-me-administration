/** Display helpers for See Products price / offer price. */

export function formatProductPriceLabel(value?: string | null): string {
  return String(value || '').trim()
}

export function resolveProductPricing(input: { price?: string | null; offerPrice?: string | null }): {
  listPrice: string
  salePrice: string
  hasOffer: boolean
} {
  const listPrice = formatProductPriceLabel(input.price)
  const salePrice = formatProductPriceLabel(input.offerPrice)
  const hasOffer = Boolean(salePrice) && salePrice !== listPrice
  return { listPrice, salePrice, hasOffer }
}
