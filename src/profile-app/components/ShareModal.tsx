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
  Copy,
  Download,
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
      .catch((err) => {
        console.error('Error generating QR code:', err)
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
    } catch (err) {
      console.error('Failed to copy text: ', err)
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
            name: 'Email Profile',
            icon: Mail,
            href: `mailto:${email}?subject=${encodeURIComponent('Digital Profile: ' + profileName)}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
            color:
              'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
          },
        ]
      : []),
    {
      name: 'SMS / Text Link',
      icon: MessageSquare,
      href: `sms:?&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color:
        'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#eab308]',
    },
    ...(phone
      ? [
          {
            name: 'Direct Call',
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
      {/* Header section */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-2 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-500 sm:p-2">
            <QrIcon size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-100">
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

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:p-6">
        <div className="flex min-h-full flex-col justify-between gap-5 sm:min-h-0 sm:justify-start sm:gap-5">
          {/* Virtual Scan Card Container */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 p-3 sm:p-5 dark:border-zinc-900/80 dark:bg-zinc-900/40">
            {/* Physical-style Badge Card with QR code */}
            <div className="group relative flex w-full max-w-[180px] flex-col items-center rounded-xl border border-zinc-200/50 bg-white p-2.5 text-center text-zinc-950 shadow-lg sm:max-w-[260px] sm:rounded-2xl sm:p-5">
              {/* Small card accents */}
              <div className="absolute top-2 left-2 flex gap-1 sm:top-3 sm:left-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              </div>
              <span className="absolute top-2 right-2 font-mono text-[7px] font-bold tracking-wider text-zinc-400 sm:top-3 sm:right-3 sm:text-[8px]">
                vBIZ PASS
              </span>

              {/* Portrait Mini Profile */}
              <div className="mt-1 mb-1.5 min-h-0 sm:mt-2 sm:mb-3 sm:min-h-[2.5rem]">
                {profileName ? (
                  <h4 className="notranslate text-xs font-bold tracking-tight text-zinc-900 sm:text-sm">
                    {profileName}
                  </h4>
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

              {/* QR Image Frame — center logo is baked into the QR canvas so the
                    on-screen preview matches the downloaded PNG exactly. */}
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50 p-1.5 shadow-inner sm:h-40 sm:w-40 sm:rounded-xl sm:p-2.5">
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
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-[#eab308] sm:h-12 sm:w-12" />
                )}
              </div>

              {/* Bottom Verification Mark */}
              <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-zinc-400 sm:mt-3 sm:text-[10px]">
                <span className="inline-block h-1 w-1 rounded-full bg-green-500" />
                Scan to view digital card
              </div>
            </div>

            {/* QR Config buttons */}
            <div className="mt-3 flex w-full items-center justify-between gap-2 px-1 sm:mt-4 sm:gap-4 sm:px-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Color:</span>
                <button
                  onClick={() => setQrColor('classic')}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all ${
                    qrColor === 'classic'
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setQrColor('amber')}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all ${
                    qrColor === 'amber'
                      ? 'border-amber-500 bg-amber-500 font-black text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  Amber
                </button>
              </div>

              <button
                onClick={handleDownloadQr}
                className="flex items-center gap-1.5 text-xs font-bold text-[#eab308] transition-all hover:text-[#ca8a04] active:scale-95"
              >
                <Download size={14} /> Download PNG
              </button>
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="space-y-2">
            <label className="text-[calc(0.75rem*1.35)] font-bold text-zinc-900 dark:text-white">
              Copy Direct Link
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 pl-3.5 transition-colors focus-within:border-[#eab308]/50 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex-1 truncate font-mono text-xs text-zinc-400 select-all">{shareUrl}</span>
              <button
                onClick={handleCopyLink}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold tracking-tight text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                {copied ? (
                  <>
                    <Check size={13} className="stroke-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Media Share Platforms */}
          <div className="space-y-2">
            <label className="text-[calc(0.75rem*1.35)] font-bold text-zinc-900 dark:text-white">
              Share with Social Media
            </label>
            <div className="grid grid-cols-5 gap-2">
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
                    size={18}
                    className={`opacity-80 transition-opacity group-hover:opacity-100 ${platform.textColor} group-hover:text-white`}
                  />
                  <span className="mt-1 text-[calc(9px*1.2)] font-medium text-zinc-400 group-hover:text-white sm:mt-1.5 dark:text-zinc-300">
                    {platform.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Direct Quick Contact Links */}
          <div className="space-y-2">
            <label className="text-[calc(0.75rem*1.35)] font-bold text-zinc-900 dark:text-white">
              Direct Contact Shortcuts
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contactLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-[calc(11px*1.2)] font-medium transition-all duration-200 active:scale-95 sm:px-2.5 sm:py-3 ${link.color}`}
                >
                  <link.icon size={13} />
                  <span className="truncate font-medium text-zinc-500 dark:text-zinc-300">{link.name}</span>
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
