'use client'

import { buildProfilePath } from '@/lib/profileRoutes'
import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { formatWalletTitle, resolveWalletFaceFromBrand } from '@/lib/pwa/walletCardBrand'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

function ContactlessMark({ color }: { color: string }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center sm:h-10 sm:w-10" aria-hidden>
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
      className="relative aspect-[1.586/1] w-full max-w-full overflow-hidden rounded-[18px] p-[5px] sm:rounded-[22px] sm:p-[7px]"
      style={{
        background: face.background,
        border: `2px solid ${face.accent}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
      }}
    >
      <div
        className="box-border flex h-full min-h-0 flex-col justify-between gap-1.5 overflow-hidden rounded-[12px] px-3 py-2.5 sm:gap-2 sm:rounded-[16px] sm:px-5 sm:py-5"
        style={{ border: `1.5px solid ${face.accent}` }}
      >
        <div className="flex shrink-0 items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full sm:h-24 sm:w-24"
            style={{ border: `2px solid ${face.accent}`, background: face.accent }}
          >
            {stillLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stillLogo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold tracking-wide sm:text-sm" style={{ color: face.background }}>
                {initialsFromName(holder)}
              </span>
            )}
          </div>
          <ContactlessMark color={face.accent} />
        </div>

        <div className="flex min-h-0 flex-1 items-end justify-between gap-2 sm:gap-3">
          <div className="max-w-[56%] min-w-0 pr-1 sm:max-w-[58%] sm:pr-2">
            <p
              className="truncate font-serif text-[15px] leading-tight font-bold sm:text-[21px]"
              style={{ color: face.accent }}
            >
              {holder}
            </p>
            {title ? (
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug sm:mt-1 sm:text-sm" style={{ color: muted }}>
                {title}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <p className="mb-1 text-[8px] tracking-wide sm:mb-1.5 sm:text-[10px]" style={{ color: face.accent }}>
              Scan to Connect
            </p>
            <div className="rounded-sm bg-white p-0.5 sm:p-1">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="" className="h-12 w-12 sm:h-[4.75rem] sm:w-[4.75rem]" />
              ) : (
                <div className="h-12 w-12 bg-zinc-100 sm:h-[4.75rem] sm:w-[4.75rem]" />
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-0.5 hidden h-2.5 w-full shrink-0 rounded-sm sm:mt-1 sm:block"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
      </div>
    </div>
  )
}
