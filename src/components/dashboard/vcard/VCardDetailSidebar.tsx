'use client'

import { AlertModal } from '@/components/AlertModal'
import { buildEditorSectionPath } from '@/lib/vcardEditorRoutes'
import {
  useGetContactsQuery,
  useGetSocialClicksQuery,
  useGetWeeklyEngagementQuery,
  type WeeklyEngagementDay,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { getVCardPublicPath, getVCardPublicUrl } from '@/utils/vcard'
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Mail,
  MessageSquare,
  MousePointerClick,
  PanelRight,
  Phone,
  Save,
  Share2,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ContactSaveChip, SocialClickChip } from './SocialClickChip'
import { getCardSocialClickStats } from './socialStats'

const EMPTY_WEEKLY: WeeklyEngagementDay[] = [
  { day: 'Mon', fullDay: 'Monday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Tue', fullDay: 'Tuesday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Wed', fullDay: 'Wednesday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Thu', fullDay: 'Thursday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Fri', fullDay: 'Friday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Sat', fullDay: 'Saturday', views: 0, clicks: 0, ctr: 0 },
  { day: 'Sun', fullDay: 'Sunday', views: 0, clicks: 0, ctr: 0 },
]

type Props = {
  card: VCardRecord | null
  onClose: () => void
  onEmail?: (card: VCardRecord) => void
  onCall?: (card: VCardRecord) => void
  onSchedule?: (card: VCardRecord) => void
  onNotice?: (card: VCardRecord) => void
  onDuplicate?: (card: VCardRecord) => void
  onToggleStatus?: (card: VCardRecord, status: string) => void
  canDuplicate?: boolean
  duplicateDisabledReason?: string
}

function Section({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon?: typeof Mail
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function VCardDetailSidebar({
  card,
  onClose,
  onEmail,
  onCall,
  onSchedule,
  onNotice,
  onDuplicate,
  onToggleStatus,
  canDuplicate = false,
  duplicateDisabledReason = 'Single card owners can create only one vCard',
}: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [alertState, setAlertState] = useState<{ title: string; description: string } | null>(null)

  const { data: socialClickRows = [] } = useGetSocialClicksQuery({ profileId: card?.id }, { skip: !card?.id })
  const { data: contactSaves = [] } = useGetContactsQuery(card?.id, { skip: !card?.id })
  const { data: weekly, isFetching: weeklyLoading } = useGetWeeklyEngagementQuery(
    { profileId: card?.id },
    { skip: !card?.id }
  )
  const weeklyDays = weekly?.days ?? EMPTY_WEEKLY

  const socials = useMemo(() => (card ? getCardSocialClickStats(card, socialClickRows) : []), [card, socialClickRows])

  if (!card || typeof document === 'undefined') return null

  const views = Number(card.views) || 0
  const clicks = socialClickRows.reduce((sum, row) => sum + (Number(row.clickCount) || 0), 0)
  const saves = contactSaves.length
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0'
  const status = card.isActive ? 'active' : 'inactive'
  const slug = card.slug?.trim() || 'profile'
  const publicPath = getVCardPublicPath(slug)
  const publicUrl = getVCardPublicUrl(slug) || publicPath
  const activeNotice = typeof window !== 'undefined' ? localStorage.getItem(`notice_${card.id}`) : null
  const department =
    typeof (card.personal as { department?: unknown } | undefined)?.department === 'string'
      ? String((card.personal as { department?: string }).department).trim()
      : ''
  const avatarSrc = card.avatarImageUrl?.trim() || null
  const initials =
    card.personal?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'VC'

  const handleEdit = () => {
    onClose()
    router.push(buildEditorSectionPath('/vcards/edit', 'home', card.id))
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const handlePauseToggle = () => {
    onToggleStatus?.(card, status === 'active' ? 'inactive' : 'active')
  }

  const panel = (
    <div className="fixed inset-0 z-9999 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="animate-in slide-in-from-right relative z-1 flex h-dvh w-full max-w-105 flex-col border-l border-slate-200 bg-white shadow-2xl duration-300 sm:max-w-110 dark:border-white/10 dark:bg-[#0a0e17]">
        <div className="shrink-0 border-b border-slate-100 bg-white dark:border-white/10 dark:bg-[#0a0e17]">
          <div className="h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-emerald-400" />
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 text-sm font-black text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/15 dark:text-indigo-300">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={card.personal?.fullName || 'Avatar'}
                  className="h-full w-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-violet-600 uppercase dark:text-violet-400">
                <PanelRight className="h-3 w-3" /> Card panel
              </p>
              <h2 className="truncate text-lg leading-tight font-black text-slate-900 dark:text-white">
                {card.personal?.fullName || 'Unnamed'}
              </h2>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.personal?.designation || 'Team'}
                {card.personal?.company ? ` · ${card.personal.company}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-black uppercase',
                    status === 'active' &&
                      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
                    status === 'inactive' &&
                      'border-slate-200 bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
                  )}
                >
                  {status}
                </span>
                {department ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase dark:border-white/10 dark:bg-white/5">
                    <Briefcase className="h-3 w-3" />
                    {department}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 px-5 pb-4">
            {[
              { label: 'Views', value: views, icon: Eye, tone: 'text-indigo-500' },
              { label: 'Clicks', value: clicks, icon: MousePointerClick, tone: 'text-sky-500' },
              { label: 'Saves', value: saves, icon: Save, tone: 'text-emerald-500' },
              { label: 'CTR', value: `${ctr}%`, icon: TrendingUp, tone: 'text-violet-500' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5 text-center dark:border-white/5 dark:bg-white/4"
              >
                <m.icon className={cn('mx-auto mb-1 h-3.5 w-3.5', m.tone)} />
                <p className="text-sm leading-none font-black text-slate-900 tabular-nums dark:text-white">
                  {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                </p>
                <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-5">
          <Section title="Contact details" icon={Mail}>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 dark:divide-white/5 dark:border-white/10">
              <div className="flex items-center gap-3 bg-white px-3.5 py-3 dark:bg-white/2">
                <Mail className="h-4 w-4 shrink-0 text-indigo-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {card.personal?.email || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-3.5 py-3 dark:bg-white/2">
                <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {card.personal?.phone || card.personal?.whatsapp || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-3.5 py-3 dark:bg-white/2">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Company</p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {card.personal?.company || '—'}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Socials & contact saves" icon={Share2}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {socials.map((s) => (
                <SocialClickChip key={s.key} stat={s} compact />
              ))}
              <ContactSaveChip count={saves} compact />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/10">
              <div className="border-b border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-white/5 dark:bg-white/3">
                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Social links ({socials.length})
                </p>
              </div>
              {socials.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-white/5">
                  {socials.map((s) => (
                    <li
                      key={s.key}
                      className="flex min-w-0 items-center justify-between gap-2 bg-white px-3.5 py-3 dark:bg-white/2"
                    >
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <SocialClickChip stat={s} />
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-slate-500 tabular-nums">
                        {s.clickCount.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-4 text-xs font-semibold text-slate-400">No social links on this card.</p>
              )}

              <div className="flex items-center justify-between border-y border-emerald-100/80 bg-emerald-50/80 px-3.5 py-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/10">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  <Save className="h-3.5 w-3.5" /> Contact saves ({saves})
                </p>
              </div>
              {contactSaves.length > 0 ? (
                <ul className="max-h-60 divide-y divide-slate-100 overflow-x-hidden overflow-y-auto dark:divide-white/5">
                  {contactSaves.map((person) => (
                    <li key={person.id} className="flex min-w-0 items-start gap-3 bg-white px-3.5 py-3 dark:bg-white/2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/15">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {person.name || 'Unknown'}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11px] font-semibold text-slate-500">
                          <Mail className="h-3 w-3 text-indigo-400" />
                          {person.email || 'No email'}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11px] font-semibold text-slate-500">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          {person.phone || 'No phone'}
                        </p>
                      </div>
                      <span title="Saved contact" className="mt-1 shrink-0">
                        <Save className="h-3.5 w-3.5 text-emerald-500" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-4 text-xs font-semibold text-slate-400">Nobody has saved this contact yet.</p>
              )}
            </div>
          </Section>

          <Section title="Manage card" icon={Edit2}>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-black tracking-wider text-white uppercase dark:bg-white dark:text-slate-900"
              >
                <ExternalLink className="h-4 w-4" /> View live card
              </a>
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-black text-white uppercase"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 uppercase dark:border-white/10 dark:text-slate-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              {onDuplicate && (
                <button
                  type="button"
                  disabled={!canDuplicate}
                  title={canDuplicate ? 'Duplicate this card' : duplicateDisabledReason}
                  onClick={() => {
                    if (canDuplicate) onDuplicate(card)
                    else setAlertState({ title: 'Cannot duplicate', description: duplicateDisabledReason })
                  }}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 uppercase dark:border-white/10 dark:text-slate-200',
                    !canDuplicate && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              )}
              {onToggleStatus && (
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 uppercase dark:border-white/10 dark:text-slate-200"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {status === 'active' ? 'Pause' : 'Activate'}
                </button>
              )}
            </div>
          </Section>

          {(onEmail || onCall || onSchedule || onNotice) && (
            <Section title="Quick actions" icon={ShieldAlert}>
              <div className="flex flex-wrap gap-2">
                {onEmail && (
                  <button
                    type="button"
                    onClick={() => onEmail(card)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700 uppercase dark:bg-indigo-500/15 dark:text-indigo-300"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </button>
                )}
                {onCall && (
                  <button
                    type="button"
                    onClick={() => onCall(card)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 uppercase dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call
                  </button>
                )}
                {onSchedule && (
                  <button
                    type="button"
                    onClick={() => onSchedule(card)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700 uppercase dark:bg-violet-500/15 dark:text-violet-300"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Schedule
                  </button>
                )}
                {onNotice && (
                  <button
                    type="button"
                    onClick={() => onNotice(card)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 uppercase dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" /> Notice
                  </button>
                )}
                {card.personal?.whatsapp && (
                  <a
                    href={`https://wa.me/${String(card.personal.whatsapp).replace(/[+\s-]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 uppercase dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            </Section>
          )}

          <Section title="7-day analytics" icon={TrendingUp}>
            <div
              className={cn(
                'rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/2',
                weeklyLoading && 'opacity-60'
              )}
            >
              <div className="h-37.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyDays} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sideViewsClean" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="url(#sideViewsClean)"
                    />
                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {activeNotice && (
                <div className="mt-3 rounded-xl border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-[10px] font-black text-amber-600 uppercase">Active notice</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{activeNotice}</p>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-white/10 dark:bg-[#070a12]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-[11px] font-black tracking-wider text-white uppercase dark:bg-white dark:text-slate-900"
          >
            Close panel
          </button>
        </div>
      </aside>
    </div>
  )

  return (
    <>
      {createPortal(panel, document.body)}
      {alertState && (
        <AlertModal
          open
          title={alertState.title}
          description={alertState.description}
          onClose={() => setAlertState(null)}
        />
      )}
    </>
  )
}

/** Small trends popup for CTR / stats click */
export function VCardTrendsPopup({ card, onClose }: { card: VCardRecord | null; onClose: () => void }) {
  const { data: socialClickRows = [] } = useGetSocialClicksQuery({ profileId: card?.id }, { skip: !card?.id })
  const { data: weekly, isFetching: weeklyLoading } = useGetWeeklyEngagementQuery(
    { profileId: card?.id },
    { skip: !card?.id }
  )
  const weeklyDays = weekly?.days ?? EMPTY_WEEKLY

  if (!card || typeof document === 'undefined') return null
  const views = Number(card.views) || 0
  const clicks = socialClickRows.reduce((sum, row) => sum + (Number(row.clickCount) || 0), 0)
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0'

  return createPortal(
    <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-indigo-500 uppercase">
              <TrendingUp className="h-3.5 w-3.5" /> 7-day trend
            </p>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{card.personal?.fullName}</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Views {views.toLocaleString()} · Clicks {clicks.toLocaleString()} · CTR {ctr}%
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div
          className={cn(
            'h-50 w-full rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-white/5 dark:bg-slate-900/60',
            weeklyLoading && 'opacity-60'
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyDays} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendViewsClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={2.5} fill="url(#trendViewsClean)" />
              <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>,
    document.body
  )
}
