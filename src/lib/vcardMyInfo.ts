import type { VCardMyInfo, VCardPersonal } from '@/types/vcard'

export const MY_INFO_SETTING_KEY = 'my_info_json'

export const DEFAULT_VCARD_MY_INFO: VCardMyInfo = {
  headline: 'Ready When You Are',
  showCall: true,
  showText: true,
  showEmail: true,
  callLabel: 'Call Now',
  textLabel: 'Shoot Me A Text',
  emailLabel: 'Email Me',
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  return fallback
}

/** Parse persisted `my_info_json` into editor/public My Info settings. */
export function parseMyInfoJson(raw?: string | null): VCardMyInfo {
  if (!raw?.trim()) return { ...DEFAULT_VCARD_MY_INFO }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_VCARD_MY_INFO }
    }
    const o = parsed as Partial<VCardMyInfo>
    return {
      headline: asString(o.headline, DEFAULT_VCARD_MY_INFO.headline),
      showCall: asBool(o.showCall, DEFAULT_VCARD_MY_INFO.showCall),
      showText: asBool(o.showText, DEFAULT_VCARD_MY_INFO.showText),
      showEmail: asBool(o.showEmail, DEFAULT_VCARD_MY_INFO.showEmail),
      callLabel: asString(o.callLabel, DEFAULT_VCARD_MY_INFO.callLabel),
      textLabel: asString(o.textLabel, DEFAULT_VCARD_MY_INFO.textLabel),
      emailLabel: asString(o.emailLabel, DEFAULT_VCARD_MY_INFO.emailLabel),
      phone: asString(o.phone, ''),
      whatsapp: asString(o.whatsapp, ''),
      email: asString(o.email, ''),
    }
  } catch {
    return { ...DEFAULT_VCARD_MY_INFO }
  }
}

/** Always persist JSON so defaults save even if the editor tab was never opened. */
export function mapMyInfoToApiSettings(myInfo?: VCardMyInfo, personal?: VCardPersonal): Record<string, string> {
  return {
    [MY_INFO_SETTING_KEY]: JSON.stringify({
      ...DEFAULT_VCARD_MY_INFO,
      ...myInfo,
      phone: personal?.phone?.trim() || myInfo?.phone || '',
      whatsapp: personal?.whatsapp?.trim() || myInfo?.whatsapp || '',
      email: personal?.email?.trim() || myInfo?.email || '',
    }),
  }
}

/** Live Personal fields first; fall back to the last saved My Info snapshot. */
export function resolveMyInfoContact(personal?: VCardPersonal | null, myInfo?: VCardMyInfo | null) {
  const phone = (personal?.phone || myInfo?.phone || '').trim()
  const whatsapp = (personal?.whatsapp || myInfo?.whatsapp || '').trim()
  const email = (personal?.email || myInfo?.email || '').trim()
  return { phone, whatsapp, email, smsNumber: phone || whatsapp }
}

/** My Info contact buttons always mirror Personal Info. */
export function syncMyInfoFromPersonal<T extends { personal?: VCardPersonal | null; myInfo?: VCardMyInfo | null }>(
  data: T
): T {
  const personal = data.personal
  const contact = resolveMyInfoContact(personal, data.myInfo)
  return {
    ...data,
    myInfo: {
      ...DEFAULT_VCARD_MY_INFO,
      ...data.myInfo,
      phone: contact.phone,
      whatsapp: contact.whatsapp || contact.phone,
      email: contact.email,
    },
  }
}
