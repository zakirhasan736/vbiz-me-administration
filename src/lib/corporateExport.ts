import type { VCardRecord } from '@/types/vcard'

export function exportCorporateCardsCsv(cards: VCardRecord[], filenamePrefix = 'vBiz_Corporate_Metrics') {
  const headers = ['ID', 'Full Name', 'Designation', 'Company', 'Status', 'Views', 'Slug']
  const rows = cards.map((card) => [
    card.id,
    card.personal.fullName || '',
    card.personal.designation || '',
    card.personal.company || '',
    card.isActive ? 'active' : 'inactive',
    String(card.views || 0),
    card.slug || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportCardsJson(cards: VCardRecord[], filenamePrefix = 'vcards-export') {
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(cards, null, 2))}`
  const link = document.createElement('a')
  link.href = dataStr
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
}
