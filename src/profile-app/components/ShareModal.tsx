'use client'

import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { notify } from '@/lib/toast/toast'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import {
  buildFacebookShareHref,
  buildShareCopy,
  openShareWindow,
  resolveShareUrl,
  shareToFacebook,
  shareToInstagram,
  toAbsoluteShareUrl,
} from '@/profile-app/lib/shareProfile'
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
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  QrCode as QrIcon,
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
  const { design, personal, homeMedia, field, isVisible, avatarImageUrl, cardOwnerId, cardSlug, seo } =
    useProfileDisplay()
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
    return toAbsoluteShareUrl(resolveShareUrl(cardSlug))
  }, [isOpen, cardSlug])

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
  const [instagramTip, setInstagramTip] = useState(false)

  // Reset ephemeral QR state when the modal opens/closes (avoid sync setState in effects).
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    setCopied(false)
    setInstagramTip(false)
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

  const { title: shareTitle, message: shareMessage } = buildShareCopy({
    metaTitle: seo?.metaTitle,
    metaDescription: seo?.metaDescription,
    fallbackName: profileName || personal.fullName?.trim() || '',
  })

  const socialShares = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`,
      // Light theme: tinted brand hover (keep brand icon). Dark: solid brand + white icon.
      color: 'hover:border-[#25D366]/50 hover:bg-[#25D366]/15 dark:hover:border-[#25D366]/50 dark:hover:bg-[#25D366]',
      textColor: 'text-[#25D366] dark:group-hover:text-white',
      onClick: undefined as undefined | ((e: React.MouseEvent<HTMLAnchorElement>) => void),
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:border-[#0077B5]/50 hover:bg-[#0077B5]/15 dark:hover:border-[#0077B5]/50 dark:hover:bg-[#0077B5]',
      textColor: 'text-[#0077B5] dark:group-hover:text-white',
      onClick: undefined as undefined | ((e: React.MouseEvent<HTMLAnchorElement>) => void),
    },
    {
      name: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`,
      color: 'hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/15 dark:hover:border-[#1DA1F2]/50 dark:hover:bg-[#1DA1F2]',
      textColor: 'text-[#1DA1F2] dark:group-hover:text-white',
      onClick: undefined as undefined | ((e: React.MouseEvent<HTMLAnchorElement>) => void),
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: 'https://www.instagram.com/',
      color: 'hover:border-[#E4405F]/50 hover:bg-[#E4405F]/15 dark:hover:border-[#E4405F]/50 dark:hover:bg-[#E4405F]',
      textColor: 'text-[#E4405F] dark:group-hover:text-white',
      hint: 'Copies link, then opens Instagram',
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        void (async () => {
          const result = await shareToInstagram(shareUrl, shareMessage)
          if (result === 'copied_opened') {
            setCopied(true)
            setInstagramTip(true)
            window.setTimeout(() => setCopied(false), 2500)
            notify.success('Link copied — paste it in Instagram Story, Reel, DM, or post.')
            return
          }
          if (result === 'opened_only') {
            setInstagramTip(true)
            notify.info('Instagram opened — copy the card link above, then paste it in Instagram.')
            return
          }
          notify.error('Could not open Instagram. Copy the card link above and paste it there.')
        })()
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: buildFacebookShareHref(shareUrl, shareMessage, {
        mobile: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent),
      }),
      color: 'hover:border-[#1877F2]/50 hover:bg-[#1877F2]/15 dark:hover:border-[#1877F2]/50 dark:hover:bg-[#1877F2]',
      textColor: 'text-[#1877F2] dark:group-hover:text-white',
      hint: 'Opens Facebook create post with your card link',
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        if (!shareUrl) {
          notify.error('Card link is still loading. Try Facebook again in a moment.')
          return
        }
        void (async () => {
          const result = await shareToFacebook(shareUrl, shareMessage, shareTitle)
          if (result === 'shared' || result === 'cancelled') return
          if (result === 'opened') {
            // iPhone navigates away immediately; toast may not show — clipboard is still primed.
            notify.info('Opening Facebook — paste the link if the post is empty.')
            return
          }
          notify.error('Could not open Facebook share. Copy the card link above and paste it there.')
        })()
      },
    },
  ]

  const contactLinks = [
    ...(email
      ? [
          {
            name: 'Email',
            icon: Mail,
            href: `mailto:${email}?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareMessage + '\n' + shareUrl)}`,
            color:
              'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
          },
        ]
      : []),
    {
      name: 'SMS / Text',
      icon: MessageSquare,
      href: `sms:?&body=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`,
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
                  onClick={(e) => {
                    if (platform.onClick) {
                      platform.onClick(e)
                      return
                    }
                    e.preventDefault()
                    openShareWindow(platform.href)
                  }}
                  className={`group flex flex-col items-center justify-center rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-2 transition-all duration-300 sm:p-3 dark:border-zinc-800/80 dark:bg-zinc-900/30 ${platform.color} active:scale-95`}
                  title={'hint' in platform && platform.hint ? platform.hint : `Share on ${platform.name}`}
                  aria-label={
                    'hint' in platform && platform.hint
                      ? `${platform.name}: ${platform.hint}`
                      : `Share on ${platform.name}`
                  }
                >
                  <platform.icon
                    size={26}
                    className={`opacity-90 transition-colors [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 ${platform.textColor}`}
                  />
                  <span className="mt-1 hidden text-[10.8px] font-bold text-zinc-700 sm:mt-1.5 dark:text-zinc-200 dark:[@media(hover:hover)_and_(pointer:fine)]:group-hover:text-white">
                    {platform.name}
                  </span>
                </a>
              ))}
            </div>
            {instagramTip ? (
              <p className="rounded-xl border border-[#E4405F]/25 bg-[#E4405F]/10 px-3 py-2 text-[11px] leading-snug font-medium text-zinc-700 dark:text-zinc-200">
                Instagram tip: your card link is on the clipboard. In Instagram, open a Story / Reel / DM / new post and
                paste it.
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                Instagram copies your link first, then opens the app — paste it into a Story, Reel, DM, or post.
              </p>
            )}
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
      backdropClassName="vbiz-modal-backdrop fixed inset-0 z-100 flex items-center justify-center overflow-y-auto px-[max(0.75rem,env(safe-area-inset-left,0px))] pt-[max(5dvh,env(safe-area-inset-top,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-[max(5dvh,env(safe-area-inset-bottom,0px))] backdrop-blur-md"
      panelClassName="flex max-h-[90dvh] w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:max-w-[460px] dark:border-zinc-900 dark:bg-zinc-950"
    >
      {body}
    </ProfileModalShell>
  )
}
