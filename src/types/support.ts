export type TicketChannel = 'feedback' | 'email' | 'ai' | 'support'
export type TicketType = 'issue' | 'feature' | 'satisfaction' | 'system_update' | 'help' | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketRole = 'single' | 'corporate' | 'admin'

export type SupportTicket = {
  id: string
  channel: TicketChannel
  type: TicketType
  status: TicketStatus
  subject: string
  details: string
  rating?: number
  fromRole: TicketRole
  fromName: string
  fromEmail?: string
  adminReply?: string
  blocked: boolean
  meta?: Record<string, string>
  createdById?: string
  createdAt: string
  updatedAt: string
}

export type SupportTicketListPage = {
  items: SupportTicket[]
  total: number
  skip: number
  limit: number
  openCount: number
}

export type SupportTicketListQuery = {
  status?: TicketStatus
  channel?: TicketChannel
  blocked?: boolean
  skip?: number
  limit?: number
}

export type CreateSupportTicketPayload = {
  channel: TicketChannel
  type: TicketType
  subject: string
  details: string
  rating?: number | null
  fromRole?: TicketRole
  fromName?: string
  fromEmail?: string | null
  meta?: Record<string, string> | null
}

export type UpdateSupportTicketPayload = {
  status?: TicketStatus
  adminReply?: string | null
  blocked?: boolean
}
