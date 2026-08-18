'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { resolveShareUrl } from '@/profile-app/lib/shareProfile'
import {
  buildShareProfileTitle,
  formatShareDisplayName,
  generateShareQrDataUrl,
  resolveShareQrCenterSources,
} from '@/profile-app/lib/shareQrCode'
import {
  Check,
  Download,
  Facebook,
  Link2,
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
import { motion } from 'motion/react'
import React, { useEffect, useMemo, useState } from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { design, personal, homeMedia, field, isVisible } = useProfileDisplay()
  const accentColor = design?.accentColor ?? '#eab308'

  const profileName = formatShareDisplayName(isVisible('MyInfo section Name') ? personal.fullName?.trim() || '' : '')
  const profileTitle = buildShareProfileTitle(personal, isVisible)
  const phone = isVisible('MyInfo Phone') ? personal.phone?.trim() || '' : ''
  const email = isVisible('MyInfo Email') ? personal.email?.trim() || '' : ''
  const companyIconUrl = field('Company/Office Icon').customValue
  const centerSources = useMemo(
    () => resolveShareQrCenterSources(companyIconUrl, homeMedia.profileMedia, homeMedia.introVideo),
    [companyIconUrl, homeMedia.profileMedia, homeMedia.introVideo]
  )
  const shareUrl = useMemo(() => {
    if (!isOpen) return ''
    const url = resolveShareUrl()
    return url.split('?')[0]
  }, [isOpen])
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrColor, setQrColor] = useState<'classic' | 'amber'>('classic')

  useEffect(() => {
    if (!isOpen || !shareUrl) return

    let cancelled = false
    const foregroundColor = qrColor === 'amber' ? accentColor : '#09090b'

    void generateShareQrDataUrl({
      url: shareUrl,
      foregroundColor,
      centerImageUrl: centerSources.imageUrl,
      centerVideoUrl: centerSources.videoUrl,
    })
      .then((url) => {
        if (!cancelled) setQrCodeUrl(url)
      })
      .catch(() => {
        /* ignore */
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, shareUrl, qrColor, accentColor, centerSources])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${(profileName || 'profile').toLowerCase().replace(/\s+/g, '_')}_qr_code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <h3 className="text-[calc(0.70rem*1.75)] font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-100">
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
              <div className="mb-1 hidden min-h-0 sm:mt-2 sm:mb-1 sm:min-h-[2.5rem]">
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

              <div className="relative flex h-auto w-full max-w-[260px] items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-2 shadow-inner sm:rounded-2xl sm:p-3">
                {qrCodeUrl ? (
                  <motion.img
                    key={qrCodeUrl}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={qrCodeUrl}
                    alt="Profile QR Code"
                    className="pointer-events-none h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-[#eab308] sm:h-12 sm:w-12" />
                )}
              </div>
            </div>

            <div className="mt-2 flex w-full items-center justify-center gap-2 px-1 sm:mt-2 sm:gap-4 sm:px-2">
              <button
                onClick={handleDownloadQr}
                className="flex items-center gap-1.5 text-base font-bold text-[#eab308] transition-all hover:text-[#ca8a04] active:scale-95"
              >
                <Download size={14} /> Download PNG
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="!mb-2 block text-[calc(0.65rem*1.75)] font-bold text-zinc-900 dark:text-white">
              Share with Social Media
            </label>
            <div className="grid grid-cols-6 gap-1">
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
                  <span className="mt-1 hidden text-[calc(9px*1.2)] font-bold text-zinc-900 group-hover:text-white sm:mt-1.5 dark:text-zinc-900">
                    {platform.name}
                  </span>
                </a>
              ))}
              <button
                type="button"
                onClick={handleCopyLink}
                title={copied ? 'Link copied' : 'Copy link'}
                aria-label={copied ? 'Link copied' : 'Copy link'}
                className={`group flex flex-col items-center justify-center rounded-xl border p-2 transition-all duration-300 active:scale-95 sm:p-3 ${
                  copied
                    ? 'border-emerald-500/50 bg-emerald-500 text-white'
                    : 'border-zinc-200/60 bg-zinc-50/50 text-zinc-700 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:text-zinc-300 dark:hover:bg-zinc-100 dark:hover:text-zinc-950'
                }`}
              >
                {copied ? (
                  <Check size={24} className="stroke-3" />
                ) : (
                  <Link2 size={26} className="opacity-80 transition-opacity group-hover:opacity-100" />
                )}
                <span className="mt-1 hidden text-[calc(9px*1.2)] font-bold sm:mt-1.5">
                  {copied ? 'Copied' : 'Link'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="!mb-2 block text-[calc(0.65rem*1.75)] font-bold text-zinc-900 dark:text-white">
              Direct Contact Shortcuts
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contactLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-[calc(11px*1.3)] font-medium transition-all duration-200 active:scale-95 sm:px-2.5 sm:py-3 ${link.color}`}
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
