import { pushNotification } from './notifications'

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
  createdAt: string
  updatedAt: string
  adminReply?: string
  meta?: Record<string, string>
}

export type AiChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

const TICKETS_KEY = 'vbiz_support_tickets'
const AI_CHAT_KEY = 'vbiz_admin_ai_chat'
export const SUPPORT_EVENT = 'vbiz_support_update'

export function loadTickets(): SupportTicket[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TICKETS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SupportTicket[]
  } catch {
    return []
  }
}

function persistTickets(list: SupportTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(list.slice(0, 300)))
  window.dispatchEvent(new Event(SUPPORT_EVENT))
}

export function createTicket(input: {
  channel: TicketChannel
  type: TicketType
  subject: string
  details: string
  rating?: number
  fromRole: TicketRole
  fromName: string
  fromEmail?: string
  meta?: Record<string, string>
  notifyAdmin?: boolean
}): SupportTicket {
  const now = new Date().toISOString()
  const ticket: SupportTicket = {
    id: `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    channel: input.channel,
    type: input.type,
    status: 'open',
    subject: input.subject,
    details: input.details,
    rating: input.rating,
    fromRole: input.fromRole,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    createdAt: now,
    updatedAt: now,
    meta: input.meta,
  }

  const list = loadTickets()
  list.unshift(ticket)
  persistTickets(list)

  if (input.notifyAdmin !== false && input.fromRole !== 'admin') {
    pushNotification({
      audience: 'admin',
      category: input.channel === 'feedback' ? 'feedback' : 'support',
      title:
        input.channel === 'feedback'
          ? 'New owner feedback'
          : input.channel === 'email'
            ? 'New email support request'
            : 'New support request',
      body: `${input.fromName} (${input.fromRole}): ${input.subject}`,
      href: '#support',
    })
  }

  return ticket
}

export function updateTicketStatus(id: string, status: TicketStatus, adminReply?: string) {
  const list = loadTickets()
  const idx = list.findIndex((t) => t.id === id)
  if (idx < 0) return false
  list[idx] = {
    ...list[idx],
    status,
    adminReply: adminReply !== undefined ? adminReply : list[idx].adminReply,
    updatedAt: new Date().toISOString(),
  }
  persistTickets(list)

  const t = list[idx]
  if (t.fromRole === 'single' || t.fromRole === 'corporate') {
    const hasReply = Boolean(adminReply && adminReply.trim())
    pushNotification({
      audience: t.fromRole,
      category: 'support',
      title: hasReply ? 'Admin support reply' : `Support ${status.replace('_', ' ')}`,
      body: hasReply
        ? `Admin replied on “${t.subject}”: ${adminReply!.slice(0, 120)}`
        : `Your ticket “${t.subject}” is now ${status.replace('_', ' ')}.`,
      href: '/',
      forceBrowser: true,
    })
  }
  return true
}

export function loadAiChat(): AiChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(AI_CHAT_KEY)
    if (!raw) {
      const welcome: AiChatMessage = {
        id: 'ai_welcome',
        role: 'assistant',
        text: 'Hi — I’m the vBiz support agent (demo). Ask about vCards, billing, leads, notifications, or account issues.',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(AI_CHAT_KEY, JSON.stringify([welcome]))
      return [welcome]
    }
    return JSON.parse(raw) as AiChatMessage[]
  } catch {
    return []
  }
}

function persistAiChat(messages: AiChatMessage[]) {
  localStorage.setItem(AI_CHAT_KEY, JSON.stringify(messages.slice(-80)))
  window.dispatchEvent(new Event(SUPPORT_EVENT))
}

export function getAiReply(userText: string): string {
  const q = userText.toLowerCase()
  if (/bill|quota|upgrade|package|price/.test(q)) {
    return 'For billing and card quotas: open Packages & Upgrades (Super Admin). Corporate seats are controlled by admin_corporate_quota. Owners see limits on their dashboard when near capacity.'
  }
  if (/lead|contact.?save|reply|note/.test(q)) {
    return 'Leads & contact saves appear under Leads & Notices (corporate) or Contacts Saved (single). Notes/replies are in the urgent panel; the contact table is details/export only.'
  }
  if (/notif|push|alert|bell/.test(q)) {
    return 'Owners and admins get an in-app notification inbox plus optional browser alerts. Enable alerts from the bell menu, and tune categories under Settings → Notifications.'
  }
  if (/vcard|card|create|duplicate|template/.test(q)) {
    return 'Create cards from My vCards / Team vCards or the dashboard Create button. Corporate has seat quotas; admin is notified when new cards are created. Templates are managed in the Admin Templates tab.'
  }
  if (/email|smtp|mail/.test(q)) {
    return 'Direct email support is demo-queued to support@vbiz.me and stored in the Support inbox. Connect a real SMTP provider later without changing the ticket UI.'
  }
  if (/login|auth|password|oauth/.test(q)) {
    return 'This demo uses mock auth. For production, wire Firebase/Auth providers in Auth.tsx and keep role switching via VCardContext.'
  }
  return 'Thanks — I’ve logged that as a help topic. Check the Ticket inbox for owner-submitted issues, or use Email Contact to queue a message to support@vbiz.me. For urgent product bugs, ask the owner to send Feedback with type “Issue”.'
}

export function sendAiMessage(text: string): AiChatMessage[] {
  const trimmed = text.trim()
  if (!trimmed) return loadAiChat()
  const messages = loadAiChat()
  const userMsg: AiChatMessage = {
    id: `ai_u_${Date.now()}`,
    role: 'user',
    text: trimmed,
    createdAt: new Date().toISOString(),
  }
  const reply: AiChatMessage = {
    id: `ai_a_${Date.now() + 1}`,
    role: 'assistant',
    text: getAiReply(trimmed),
    createdAt: new Date().toISOString(),
  }
  const next = [...messages, userMsg, reply]
  persistAiChat(next)
  return next
}

export function clearAiChat() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AI_CHAT_KEY)
  window.dispatchEvent(new Event(SUPPORT_EVENT))
}
