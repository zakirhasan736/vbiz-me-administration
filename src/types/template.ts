export type CardTemplateId = 'v1' | 'v2' | 'v3'

export type CardTemplateStatus = 'active' | 'inactive'

export type CardTemplate = {
  id: CardTemplateId
  name: string
  description: string
  status: CardTemplateStatus
  sortOrder: number
  uses: number
  createdAt: string
  updatedAt: string
}

export type UpdateCardTemplatePayload = {
  name?: string
  description?: string
  status?: CardTemplateStatus
}
