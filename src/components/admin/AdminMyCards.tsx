'use client'

import VCardTeamCard from '@/components/admin/AdminDirectoryVCardTeamCard'
import VCardDetailSidebar, { VCardTrendsPopup } from '@/components/admin/AdminVCardDetailSidebar'
import VCardQrModal from '@/components/admin/AdminVCardQrModal'
import { VCardWeeklyEngagement } from '@/components/admin/VCardWeeklyEngagement'
import { PromptModal } from '@/components/PromptModal'
import { useAppSelector } from '@/hooks/redux'
import { toAdminCardShape, type AdminCard } from '@/lib/admin/adminCardShape'
import { useVCard } from '@/lib/admin/AdminVCardListContext'
import { getContactSavesForOwner } from '@/lib/contactSaves'
import { notify } from '@/lib/toast/toast'
import { buildEditorSectionPath } from '@/lib/vcardEditorRoutes'
import { useAuth } from '@/providers/AuthProvider'
import {
  mapApiProfileToVCardRecord,
  useGetDashboardStatsQuery,
  useGetProfilesQuery,
  type DashboardSocialChannel,
} from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import {
  CreditCard,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Pin,
  Plus,
  Radio,
  Save,
  Share2,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const CHANNEL_UI: Record<DashboardSocialChannel, { icon: LucideIcon; tone: string }> = {
  facebook: { icon: Facebook, tone: 'text-[#1877F2]' },
  twitter: { icon: Twitter, tone: 'text-sky-500' },
  instagram: { icon: Instagram, tone: 'text-pink-500' },
  whatsapp: { icon: MessageCircle, tone: 'text-emerald-500' },
  linkedin: { icon: Linkedin, tone: 'text-[#0A66C2]' },
  youtube: { icon: Youtube, tone: 'text-red-500' },
  tiktok: { icon: Music2, tone: 'text-slate-900 dark:text-white' },
  truth: { icon: Radio, tone: 'text-[#5415D0]' },
  rumble: { icon: Radio, tone: 'text-[#85C742]' },
  pinterest: { icon: Pin, tone: 'text-[#E60023]' },
  website: { icon: Globe, tone: 'text-purple-500' },
}

export default function AdminMyCards() {
  const { user } = useAuth()
  const reduxUser = useAppSelector((s) => s.user.user)
  const ownerId = reduxUser?.id || user?.uid
  const router = useRouter()
  const { vCardsList, createCorporateCard, setCurrentEditingCardId, deleteCorporateCard } = useVCard()
  const { data: createdProfiles = [] } = useGetProfilesQuery({ scope: 'created' })
  const { data: stats } = useGetDashboardStatsQuery({ period: 'all', scope: 'created' })

  const [panelCard, setPanelCard] = useState<AdminCard | null>(null)
  const [trendsCard, setTrendsCard] = useState<AdminCard | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedVCardUrl, setSelectedVCardUrl] = useState('')
  const [qrModalTitle, setQrModalTitle] = useState('vCard QR Code')
  const [noticeCardId, setNoticeCardId] = useState<string | null>(null)

  const openQrModal = (url: string, name?: string) => {
    setSelectedVCardUrl(url)
    setQrModalTitle(name ? `${name} · QR` : 'vCard QR Code')
    setIsQrModalOpen(true)
  }

  const handleEmailCard = (card: AdminCard) => {
    const email = card.personal?.email
    if (!email) {
      notify.info('No email on this card.')
      return
    }
    window.open(`mailto:${email}`, '_blank')
  }

  const handleCallCard = (card: AdminCard) => {
    const phone = card.personal?.phone || card.personal?.whatsapp
    if (!phone) {
      notify.info('No phone on this card.')
      return
    }
    window.open(`tel:${String(phone).replace(/\s/g, '')}`, '_self')
  }

  const handleScheduleCard = (card: AdminCard) => {
    const name = card.personal?.fullName || 'Contact'
    const title = encodeURIComponent(`Meeting with ${name}`)
    const details = encodeURIComponent(
      `vBiz card: ${typeof window !== 'undefined' ? window.location.origin : ''}/v/${card.slug || ''}`
    )
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      '_blank'
    )
  }

  const myCards = useMemo(() => {
    const apiCards = createdProfiles.map((p) => toAdminCardShape(mapApiProfileToVCardRecord(p), ownerId))
    // Only local mock portfolio cards — do not pull unscoped API cards from context
    const mockMine = vCardsList.filter(
      (c) => Boolean((c as { adminPortfolio?: boolean }).adminPortfolio) && String(c.id || '').startsWith('admin_')
    )
    const byId = new Map<string, (typeof apiCards)[number]>()
    for (const c of [...mockMine, ...apiCards]) {
      if (c.id) byId.set(c.id, c)
    }
    return Array.from(byId.values())
  }, [createdProfiles, vCardsList, ownerId])

  const socialChannels = useMemo(() => {
    if (stats?.socialChannels?.length) return stats.socialChannels
    return (Object.keys(CHANNEL_UI) as DashboardSocialChannel[]).map((channel) => ({
      channel,
      label:
        channel === 'whatsapp'
          ? 'WhatsApp'
          : channel === 'youtube'
            ? 'YouTube'
            : channel === 'tiktok'
              ? 'TikTok'
              : channel === 'truth'
                ? 'Truth Social'
                : channel === 'website'
                  ? 'Website'
                  : channel.charAt(0).toUpperCase() + channel.slice(1),
      count: 0,
      trendPercent: 0,
    }))
  }, [stats])

  const socialTotal = socialChannels.reduce((sum, row) => sum + (row.count || 0), 0) || Number(stats?.shares || 0)

  const handleCreate = async () => {
    await createCorporateCard({
      personal: {
        fullName: 'Admin Team Member',
        email: user?.email || reduxUser?.email || 'team@vbiz.me',
        dob: '',
        gender: 'Male',
        relationship: 'Single',
        profession: 'Administration',
        designation: 'Team Member',
        company: 'vBiz Admin',
        phone: '',
        whatsapp: '',
        address: '',
        about: '',
        department: 'Admin',
      },
      slug: `admin-card-${String(createdProfiles.length + myCards.length + 1).padStart(4, '0')}`,
    })
  }

  const handleDuplicate = async (card: AdminCard) => {
    const suffix = String(myCards.length + 1).padStart(4, '0')
    await createCorporateCard({
      slug: `${card.slug || 'card'}-${suffix}`,
      personal: {
        ...card.personal,
        fullName: `${card.personal?.fullName || 'Member'} (Copy)`,
      },
      services: card.services,
      portfolio: card.portfolio,
      socials: card.socials,
    })
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-4 duration-300 sm:p-6 lg:p-8">
      <div className="border-b border-slate-100 pb-6 dark:border-white/5">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
          <CreditCard className="h-7 w-7 text-indigo-500" />
          My Cards
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Cards you created — stats and engagement for your admin portfolio only. Full directory lives under vCards.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">My cards</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats?.cards ?? myCards.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Eye className="h-3.5 w-3.5" /> Total views
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {(stats?.totalViews ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] font-bold text-slate-400">
            Unique {(stats?.uniqueViews ?? stats?.viewsLast30Days ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Share2 className="h-3.5 w-3.5" /> Shares
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {(stats?.shares ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Save className="h-3.5 w-3.5" /> Contact saves
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {(stats?.contactsLast30Days ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0b0f19]">
          <p className="flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            <Share2 className="h-3.5 w-3.5" /> Social clicks
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{socialTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Share2 className="h-4 w-4 text-indigo-500" />
            Social analytics (my cards)
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {socialChannels.map((row) => {
            const ui = CHANNEL_UI[row.channel] ?? { icon: Globe, tone: 'text-slate-500' }
            const Icon = ui.icon
            return (
              <div
                key={row.channel}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"
              >
                <Icon className={cn('mb-2 h-4 w-4', ui.tone)} />
                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">{row.label}</p>
                <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {(row.count || 0).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {myCards.length > 0 && <VCardWeeklyEngagement vCardsList={myCards} aggregateAll scope="created" />}

      <div>
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <h2 className="text-sm font-black tracking-wider text-slate-400 uppercase">Card list</h2>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black tracking-wider text-white uppercase hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create card
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {myCards.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 p-12 text-center md:col-span-2 lg:col-span-3 xl:col-span-4 dark:border-white/10">
              <p className="mb-4 text-sm font-semibold text-slate-500">
                No admin portfolio cards yet. Create a team member card to get started.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white uppercase"
              >
                Create first card
              </button>
            </div>
          ) : (
            myCards.map((card) => {
              const contactSaves =
                getContactSavesForOwner(ownerId || card.ownerId, 'admin', card.id).length || Number(card.saveCount || 0)

              return (
                <VCardTeamCard
                  key={card.id}
                  card={card}
                  badgeLabel="My card"
                  badgeTone="violet"
                  contactSaves={contactSaves}
                  showDragHandle={false}
                  showNotice
                  onNotice={() => setNoticeCardId(card.id || null)}
                  onCardClick={() => setPanelCard(card)}
                  onTrends={() => setTrendsCard(card)}
                  onEmail={() => handleEmailCard(card)}
                  onCall={() => handleCallCard(card)}
                  onSchedule={() => handleScheduleCard(card)}
                  onEdit={() => {
                    setCurrentEditingCardId(card.id || null)
                    router.push(buildEditorSectionPath('/vcards/edit', 'home', card.id))
                  }}
                  onView={() => window.open(`/v/${card.slug || 'profile'}`, '_blank')}
                  onPanel={() => setPanelCard(card)}
                  onQr={() =>
                    openQrModal(
                      `${window.location.origin}/v/${card.slug || 'profile'}`,
                      String((card.personal as { fullName?: string })?.fullName || '')
                    )
                  }
                  onDuplicate={() => void handleDuplicate(card)}
                  onDeleted={async (id) => {
                    await deleteCorporateCard(id)
                    if (panelCard?.id === id) setPanelCard(null)
                    if (trendsCard?.id === id) setTrendsCard(null)
                    notify.info('Card deleted successfully.')
                  }}
                />
              )
            })
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="group flex min-h-87.5 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-all hover:border-indigo-500/30 hover:bg-slate-100 dark:border-white/10 dark:bg-[#070a13] dark:hover:bg-white/2"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Create New Card</h3>
            <p className="mt-1 max-w-50 text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
              Add a team member card to your admin portfolio.
            </p>
          </button>
        </div>
      </div>

      <VCardDetailSidebar
        card={panelCard}
        mode="admin"
        onClose={() => setPanelCard(null)}
        onEmail={handleEmailCard}
        onCall={handleCallCard}
        onSchedule={handleScheduleCard}
        onDuplicate={handleDuplicate}
      />
      <VCardTrendsPopup card={trendsCard} onClose={() => setTrendsCard(null)} />

      <VCardQrModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={selectedVCardUrl}
        title={qrModalTitle}
      />

      <PromptModal
        open={!!noticeCardId}
        title="Card notice"
        description="Shown on the public vCard"
        label="Notice text"
        defaultValue={
          noticeCardId && typeof window !== 'undefined' ? localStorage.getItem(`notice_${noticeCardId}`) || '' : ''
        }
        onConfirm={(value) => {
          if (!noticeCardId) return
          const key = `notice_${noticeCardId}`
          if (value.trim()) localStorage.setItem(key, value.trim())
          else localStorage.removeItem(key)
          setNoticeCardId(null)
        }}
        onCancel={() => setNoticeCardId(null)}
      />
    </div>
  )
}
