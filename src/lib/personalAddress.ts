import type { VCardPersonal } from '@/types/vcard'

/** Join address parts for My Info / public location display. */
export function formatPersonalAddressLine(personal: Pick<VCardPersonal, 'address' | 'city' | 'state' | 'zipCode'>) {
  const cityState = [personal.city?.trim(), personal.state?.trim()].filter(Boolean).join(', ')
  return [personal.address?.trim(), cityState, personal.zipCode?.trim()].filter(Boolean).join(', ')
}

export function hasPersonalAddressParts(personal: Pick<VCardPersonal, 'address' | 'city' | 'state' | 'zipCode'>) {
  return Boolean(
    personal.address?.trim() || personal.city?.trim() || personal.state?.trim() || personal.zipCode?.trim()
  )
}
