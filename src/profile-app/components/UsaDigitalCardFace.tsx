'use client'

import { buildProfilePath } from '@/lib/profileRoutes'
import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { formatWalletTitle, resolveWalletFaceFromBrand } from '@/lib/pwa/walletCardBrand'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

function ContactlessMark({ color }: { color: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10" aria-hidden>
      <div
        className="flex h-[85%] w-[85%] rotate-[-45deg] items-center justify-center rounded-full border-t-2 border-r-2 border-b-transparent border-l-transparent"
        style={{ borderTopColor: color, borderRightColor: color }}
      >
        <div
          className="flex h-[62%] w-[62%] items-center justify-center rounded-full border-t-2 border-r-2 border-b-transparent border-l-transparent"
          style={{ borderTopColor: color, borderRightColor: color }}
        >
          <div
            className="h-1/2 w-1/2 rounded-full border-t-2 border-r-2 border-b-transparent border-l-transparent"
            style={{ borderTopColor: color, borderRightColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

type WalletPassFaceProps = {
  holderName: string
  designation?: string
  company?: string
  primaryColor?: string
  secondaryColor?: string
  pageBackground?: string | null
  logoUrl?: string | null
  cardSlug?: string
}

/** Locked vBiz Wallet front: metal card, owner brand colors. */
export function UsaDigitalCardFace({
  holderName,
  designation,
  company,
  primaryColor = '#C9A24A',
  secondaryColor = '#C9A24A',
  pageBackground,
  logoUrl,
  cardSlug,
}: WalletPassFaceProps) {
  const holder = holderName.trim() || 'Cardholder'
  const title = formatWalletTitle(designation, company)
  const stillLogo = logoUrl && !isVideoAvatarSrc(logoUrl) ? logoUrl : ''
  const face = resolveWalletFaceFromBrand(primaryColor, secondaryColor, pageBackground)
  const muted = 'rgba(255,255,255,0.88)'
  const [qrSrc, setQrSrc] = useState('')

  const qrValue = useMemo(() => {
    const slug = cardSlug?.trim()
    if (!slug || typeof window === 'undefined') return ''
    return `${window.location.origin}${buildProfilePath(slug)}`
  }, [cardSlug])

  useEffect(() => {
    if (!qrValue) return
    let cancelled = false
    void QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
      color: { dark: '#111111', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setQrSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [qrValue])

  return (
    <div
      className="relative aspect-[1.586/1] w-full overflow-hidden rounded-[22px] p-[7px]"
      style={{
        background: face.background,
        border: `2px solid ${face.accent}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
      }}
    >
      <div
        className="flex h-full flex-col justify-between rounded-[16px] px-4 py-4 sm:px-5 sm:py-5"
        style={{ border: `1.5px solid ${face.accent}` }}
      >
        <div className="flex items-start justify-between">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full sm:h-24 sm:w-24"
            style={{ border: `2px solid ${face.accent}`, background: face.accent }}
          >
            {stillLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stillLogo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold tracking-wide" style={{ color: face.background }}>
                {initialsFromName(holder)}
              </span>
            )}
          </div>
          <ContactlessMark color={face.accent} />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="max-w-[58%] min-w-0 pr-2">
            <p
              className="truncate font-serif text-[17px] leading-tight font-bold sm:text-[21px]"
              style={{ color: face.accent }}
            >
              {holder}
            </p>
            {title ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug sm:text-sm" style={{ color: muted }}>
                {title}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <p className="mb-1.5 text-[9px] tracking-wide sm:text-[10px]" style={{ color: face.accent }}>
              Scan to Connect
            </p>
            <div className="rounded-sm bg-white p-1">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="" className="h-[4.2rem] w-[4.2rem] sm:h-[4.75rem] sm:w-[4.75rem]" />
              ) : (
                <div className="h-[4.2rem] w-[4.2rem] bg-zinc-100 sm:h-[4.75rem] sm:w-[4.75rem]" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full rounded-sm" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    </div>
  )
}
