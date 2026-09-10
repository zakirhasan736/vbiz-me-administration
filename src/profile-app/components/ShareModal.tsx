'use client'

import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { resolveShareUrl } from '@/profile-app/lib/shareProfile'
import {
  buildShareProfileTitle,
  buildShareQrInitialsDataUrl,
  formatShareDisplayName,
  generateShareQrDataUrl,
  resolveShareQrCenterSources,
} from '@/profile-app/lib/shareQrCode'
import { useGetAboutMeQuery } from '@/redux/features/sections/aboutMe.api'
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  QrCode as QrIcon,
  Send,
  Twitter,
  X,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import React, { useEffect, useMemo, useState } from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { design, personal, homeMedia, field, isVisible, avatarImageUrl, cardOwnerId } = useProfileDisplay()
  const accentColor = design?.accentColor ?? '#eab308'
  const profileId = cardOwnerId?.trim() || ''
  const { data: aboutMe } = useGetAboutMeQuery(profileId, {
    skip: !isOpen || !profileId,
  })

  const profileName = formatShareDisplayName(isVisible('MyInfo section Name') ? personal.fullName?.trim() || '' : '')
  const profileTitle = buildShareProfileTitle(personal, isVisible)
  const phone = isVisible('MyInfo Phone') ? personal.phone?.trim() || '' : ''
  const email = isVisible('MyInfo Email') ? personal.email?.trim() || '' : ''
  const companyIconUrl = field('Company/Office Icon').customValue
  const profileAreaUrl = field('Profile Image/Video').customValue?.trim() || homeMedia.profileMedia || ''
  const aboutMeMediaUrl =
    aboutMe?.items?.find((item) => item.featuredImage?.trim())?.featuredImage?.trim() ||
    field('About Me').customValue?.trim() ||
    ''
  const ownerLabel = personal.fullName?.trim() || profileName || 'VB'
  const centerSources = useMemo(
    () =>
      resolveShareQrCenterSources({
        avatarUrl: avatarImageUrl,
        profileMediaUrl: profileAreaUrl || homeMedia.profileMedia,
        aboutMeMediaUrl,
        introVideoUrl: homeMedia.introVideo,
        companyIconUrl,
      }),
    [avatarImageUrl, homeMedia.profileMedia, profileAreaUrl, aboutMeMediaUrl, homeMedia.introVideo, companyIconUrl]
  )
  const shareUrl = useMemo(() => {
    if (!isOpen) return ''
    const url = resolveShareUrl()
    return url.split('?')[0]
  }, [isOpen])

  // Same strategy as dashboard QrCodeModal: still image → QRCodeCanvas imageSettings;
  // video → generated canvas QR; no photo → initials (e.g. Zakir Hosen → ZH).
  const initialsCenterUrl = useMemo(() => (isOpen ? buildShareQrInitialsDataUrl(ownerLabel) : ''), [isOpen, ownerLabel])
  const videoCenterUrl = centerSources.videoUrl
  const stillImageCandidates = useMemo(
    () => centerSources.imageUrls.filter((url) => url && !isVideoAvatarSrc(url)),
    [centerSources.imageUrls]
  )
  const needsGeneratedQr = Boolean(isOpen && shareUrl && videoCenterUrl && stillImageCandidates.length === 0)

  const [wasOpen, setWasOpen] = useState(isOpen)
  const [generatedQr, setGeneratedQr] = useState<{ key: string; dataUrl: string } | null>(null)
  const [proxiedCenter, setProxiedCenter] = useState<{ key: string; url: string } | null>(null)
  const [videoQrFailed, setVideoQrFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset ephemeral QR state when the modal opens/closes (avoid sync setState in effects).
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    setCopied(false)
    setGeneratedQr(null)
    setProxiedCenter(null)
    setVideoQrFailed(false)
  }

  const generationKey =
    isOpen && needsGeneratedQr && shareUrl && !videoQrFailed
      ? JSON.stringify([shareUrl, videoCenterUrl, centerSources.videoUrls, ownerLabel])
      : ''
  const visibleGeneratedQr = generatedQr?.key === generationKey ? generatedQr.dataUrl : ''

  const centerKey =
    isOpen && shareUrl && (!needsGeneratedQr || videoQrFailed)
      ? JSON.stringify([stillImageCandidates, initialsCenterUrl])
      : ''
  const visibleStaticCenter = !centerKey
    ? ''
    : stillImageCandidates.length === 0
      ? initialsCenterUrl
      : proxiedCenter?.key === centerKey
        ? proxiedCenter.url
        : ''

  useEffect(() => {
    if (!generationKey || !shareUrl) return

    let cancelled = false
    void generateShareQrDataUrl({
      url: shareUrl,
      foregroundColor: '#09090b',
      centerVideoUrl: videoCenterUrl,
      centerVideoUrls: centerSources.videoUrls,
      fallbackInitials: ownerLabel,
    })
      .then((url) => {
        if (!cancelled) setGeneratedQr({ key: generationKey, dataUrl: url })
      })
      .catch(() => {
        if (!cancelled) {
          setGeneratedQr(null)
          setVideoQrFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [generationKey, shareUrl, videoCenterUrl, centerSources.videoUrls, ownerLabel])

  useEffect(() => {
    if (!centerKey || stillImageCandidates.length === 0) return

    let cancelled = false

    const toAbsolute = (src: string) => {
      const trimmed = src.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('//')) return `https:${trimmed}`
      if (trimmed.startsWith('/') && typeof window !== 'undefined') return `${window.location.origin}${trimmed}`
      return trimmed
    }

    const loadViaProxy = async (httpsUrl: string): Promise<string> => {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(httpsUrl)}`)
      if (!response.ok) throw new Error('proxy failed')
      const payload = (await response.json()) as { base64?: string; type?: string }
      if (!payload.base64) throw new Error('empty proxy')
      const mime =
        payload.type === 'PNG'
          ? 'image/png'
          : payload.type === 'WEBP'
            ? 'image/webp'
            : payload.type === 'GIF'
              ? 'image/gif'
              : 'image/jpeg'
      return `data:${mime};base64,${payload.base64}`
    }

    void (async () => {
      for (const candidate of stillImageCandidates) {
        const absolute = toAbsolute(candidate)
        if (!absolute) continue
        try {
          if (absolute.startsWith('data:')) {
            if (!cancelled) setProxiedCenter({ key: centerKey, url: absolute })
            return
          }
          if (absolute.startsWith('http://') || absolute.startsWith('https://')) {
            const dataUrl = await loadViaProxy(absolute)
            if (!cancelled) setProxiedCenter({ key: centerKey, url: dataUrl })
            return
          }
          if (!cancelled) setProxiedCenter({ key: centerKey, url: absolute })
          return
        } catch {
          /* try next candidate */
        }
      }
      if (!cancelled) setProxiedCenter({ key: centerKey, url: initialsCenterUrl })
    })()

    return () => {
      cancelled = true
    }
  }, [centerKey, stillImageCandidates, initialsCenterUrl])

  const showVideoSpinner = Boolean(generationKey && !visibleGeneratedQr)
  const showImageSpinner = Boolean(centerKey && !visibleStaticCenter && !visibleGeneratedQr)
  const useCanvasQr = Boolean(shareUrl && !visibleGeneratedQr && !showVideoSpinner && visibleStaticCenter)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const shareText = profileName
    ? `Check out ${profileName}'s digital business card profile here:`
    : 'Check out this digital business card profile here:'

  const socialShares = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color: 'hover:bg-[#25D366] hover:border-[#25D366]/50 hover:text-white',
      textColor: 'text-[#25D366]',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-[#0077B5] hover:border-[#0077B5]/50 hover:text-white',
      textColor: 'text-[#0077B5]',
    },
    {
      name: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-[#1DA1F2] hover:border-[#1DA1F2]/50 hover:text-white',
      textColor: 'text-[#1DA1F2]',
    },
    {
      name: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-[#0088cc] hover:border-[#0088cc]/50 hover:text-white',
      textColor: 'text-[#0088cc]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-[#1877F2] hover:border-[#1877F2]/50 hover:text-white',
      textColor: 'text-[#1877F2]',
    },
  ]

  const contactLinks = [
    ...(email
      ? [
          {
            name: 'Email',
            icon: Mail,
            href: `mailto:${email}?subject=${encodeURIComponent('Digital Profile: ' + profileName)}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
            color:
              'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
          },
        ]
      : []),
    {
      name: 'SMS / Text',
      icon: MessageSquare,
      href: `sms:?&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color:
        'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
    },
    ...(phone
      ? [
          {
            name: 'Call',
            icon: Phone,
            href: `tel:${phone.replace(/\D/g, '')}`,
            color:
              'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
          },
        ]
      : []),
  ]

  const body = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 pt-3 pb-0 sm:px-6 sm:pt-4 sm:pb-2 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-amber-500/20 bg-black p-1.5 text-white sm:p-2">
            <QrIcon size={18} />
          </div>
          <div>
            <h3 className="text-[1.2249999999999999rem] font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-100">
              Share Profile
            </h3>
            <p className="text-[11px] font-medium text-zinc-500 sm:text-xs">Generate QR & connect instantly</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-full border border-zinc-200 bg-zinc-100 p-1.5 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-5 sm:px-6 sm:pt-1 sm:pb-6">
        <div className="flex min-h-full flex-col justify-start gap-2 sm:min-h-0 sm:justify-start sm:gap-2">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900/80 dark:bg-zinc-900/40">
            <div className="group relative flex w-full flex-col items-center text-center text-zinc-950">
              <div className="mb-1 hidden min-h-0 sm:mt-2 sm:mb-1 sm:min-h-10">
                {profileName ? (
                  <h4 className="notranslate text-md font-bold tracking-tight text-black sm:text-sm">{profileName}</h4>
                ) : null}
                {profileTitle ? (
                  <p
                    className="notranslate text-[9px] font-semibold tracking-wide uppercase sm:text-[10px]"
                    style={{ color: accentColor }}
                  >
                    {profileTitle}
                  </p>
                ) : null}
              </div>

              <div className="relative flex h-auto w-full max-w-65 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-white p-3 shadow-inner sm:rounded-2xl sm:p-4">
                {!shareUrl || showVideoSpinner || showImageSpinner ? (
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-[#eab308] sm:h-12 sm:w-12" />
                ) : visibleGeneratedQr ? (
                  // eslint-disable-next-line @next/next/no-img-element -- generated QR data URL
                  <img
                    src={visibleGeneratedQr}
                    alt="Profile QR Code"
                    className="pointer-events-none h-full w-full max-w-[260px] object-contain"
                  />
                ) : useCanvasQr ? (
                  <QRCodeCanvas
                    value={shareUrl}
                    size={260}
                    fgColor="#09090b"
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={false}
                    imageSettings={{ src: visibleStaticCenter, height: 58, width: 58, excavate: true }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2! block text-[1.1375rem] font-bold text-zinc-900 dark:text-white">
              Share your vCard Link
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-2 dark:border-zinc-800/80 dark:bg-zinc-900/30">
              <p className="min-w-0 flex-1 truncate px-1.5 text-[14.3px] font-medium text-zinc-700 dark:text-zinc-300">
                {shareUrl || '…'}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                disabled={!shareUrl}
                title={copied ? 'Link copied' : 'Copy link'}
                aria-label={copied ? 'Link copied' : 'Copy link'}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[13.2px] font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  copied
                    ? 'border-emerald-500/50 bg-emerald-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-100 dark:hover:text-zinc-950'
                }`}
              >
                {copied ? <Check size={14} className="stroke-[2.5]" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2! block text-[1.1375rem] font-bold text-zinc-900 dark:text-white">
              Share with Social Media
            </label>
            <div className="grid grid-cols-5 gap-1">
              {socialShares.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex flex-col items-center justify-center rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-2 transition-all duration-300 sm:p-3 dark:border-zinc-800/80 dark:bg-zinc-900/30 ${platform.color} active:scale-95`}
                  title={`Share on ${platform.name}`}
                >
                  <platform.icon
                    size={26}
                    className={`opacity-80 transition-opacity group-hover:opacity-100 ${platform.textColor} group-hover:text-white`}
                  />
                  <span className="mt-1 hidden text-[10.799999999999999px] font-bold text-zinc-900 group-hover:text-white sm:mt-1.5 dark:text-zinc-900">
                    {platform.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2! block text-[1.1375rem] font-bold text-zinc-900 dark:text-white">
              Direct Contact Shortcuts
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contactLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-[14.3px] font-medium transition-all duration-200 active:scale-95 sm:px-2.5 sm:py-3 ${link.color}`}
                >
                  <link.icon size={20} />
                  <span className="truncate font-bold text-zinc-900 dark:text-zinc-900">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <ProfileModalShell
      isOpen={isOpen}
      onClose={onClose}
      backdropId="share_modal_backdrop"
      backdropClassName="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-zinc-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
      panelClassName="flex h-[calc(100dvh-30px)] max-h-[calc(100dvh-30px)] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-[460px] sm:rounded-2xl dark:border-zinc-900 dark:bg-zinc-950"
    >
      {body}
    </ProfileModalShell>
  )
}
