import type { ContactSaveMetadata, ContactSaveRecord } from '@/lib/contactSaves'
import type { AdminLeadRow } from '@/redux/features/adminLeads/adminLeads.api'

const EMPTY_METADATA: ContactSaveMetadata = {
  userAgent: '',
  language: '',
  platform: '',
  browser: '',
  device: '',
  screen: '',
  timezone: '',
  approximateLocation: '',
  referrer: '',
}

/** Map admin leads API row → ContactSaveRecord shape used by Saves/Notes panels. */
export function mapAdminLeadRow(row: AdminLeadRow): ContactSaveRecord & { kind?: string } {
  return {
    id: row.id,
    fullName: row.fullName || 'Unnamed',
    phoneNumber: row.phoneNumber || '',
    email: row.email || '',
    consent: row.consent ?? true,
    submittedAt: row.submittedAt,
    vCardId: row.vCardId,
    vCardSlug: row.vCardSlug || '',
    vCardName: row.vCardName || '',
    ownerId: row.ownerId || '',
    ownerName: row.ownerName || '',
    vCardDesignation: row.vCardDesignation || '',
    vCardProfession: row.vCardProfession || '',
    vCardCompany: row.vCardCompany || '',
    guestMessage: row.guestMessage,
    privateNotes: row.privateNotes,
    lastReply: row.lastReply,
    lastReplyAt: row.lastReplyAt,
    metadata: row.metadata
      ? {
          userAgent: row.metadata.userAgent || '',
          language: row.metadata.language || '',
          platform: row.metadata.platform || '',
          browser: row.metadata.browser || '',
          device: row.metadata.device || '',
          screen: row.metadata.screen || '',
          timezone: row.metadata.timezone || '',
          approximateLocation: row.metadata.approximateLocation || '',
          referrer: row.metadata.referrer || '',
        }
      : { ...EMPTY_METADATA },
    kind: row.kind,
  }
}
