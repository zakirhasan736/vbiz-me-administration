import type { VCardRecord } from '@/types/vcard'

export function filterVCardsByQuery(cards: VCardRecord[], query: string): VCardRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return cards
  return cards.filter(
    (card) =>
      card.personal.fullName.toLowerCase().includes(q) ||
      card.slug.toLowerCase().includes(q) ||
      card.personal.designation.toLowerCase().includes(q)
  )
}

export function formatViewCount(views: number): string {
  return views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views)
}

export function getVCardPublicPath(slug: string): string {
  const trimmed = slug.trim()
  return trimmed ? `/v/${encodeURIComponent(trimmed)}` : '#'
}

export function getVCardPublicUrl(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed || typeof window === 'undefined') return ''
  return `${window.location.origin}/v/${encodeURIComponent(trimmed)}`
}

export function downloadQrCanvasFromContainer(container: HTMLElement | null, filename = 'vcard-qr.png') {
  if (!container) return
  const canvas = container.querySelector('canvas')
  if (!canvas) return
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Failed to read image'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
