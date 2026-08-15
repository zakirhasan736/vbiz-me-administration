'use client'

import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

function HelloMark({ color }: { color: string }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
      style={{ border: `1.5px solid ${color}` }}
    >
      <span className="text-[9px] tracking-wide sm:text-[10px]" style={{ color }}>
        hello
      </span>
    </div>
  )
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function hexLuminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = Number.parseInt(h.slice(0, 2), 16) / 255
  const g = Number.parseInt(h.slice(2, 4), 16) / 255
  const b = Number.parseInt(h.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

type WalletPassFaceProps = {
  holderName: string
  designation?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string | null
  cardSlug?: string
}

/** Locked vBiz Wallet front: photo / hello / name / title / QR, owner brand colors. */
export function UsaDigitalCardFace({
  holderName,
  designation,
  primaryColor = '#0B1F3A',
  secondaryColor = '#C9A24A',
  logoUrl,
  cardSlug,
}: WalletPassFaceProps) {
  const holder = holderName.trim() || 'Cardholder'
  const title = designation?.trim() || ''
  const stillLogo = logoUrl && !isVideoAvatarSrc(logoUrl) ? logoUrl : ''
  const darkBg = hexLuminance(primaryColor) <= 0.55
  const text = darkBg ? '#FFFFFF' : '#111111'
  const muted = darkBg ? 'rgba(255,255,255,0.82)' : 'rgba(17,17,17,0.72)'
  const [qrSrc, setQrSrc] = useState('')

  const qrValue = useMemo(() => {
    const slug = cardSlug?.trim()
    if (!slug || typeof window === 'undefined') return ''
    return `${window.location.origin}/v/${encodeURIComponent(slug)}`
  }, [cardSlug])

  useEffect(() => {
    if (!qrValue) return
    let cancelled = false
    void QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: 'M',
      margin: 2,
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
      className="relative aspect-[1.586/1] w-full overflow-hidden rounded-[22px] p-5 sm:p-6"
      style={{ background: primaryColor, boxShadow: '0 16px 40px rgba(0,0,0,0.28)' }}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-[4.5rem] sm:w-[4.5rem]"
            style={{ border: `2px solid ${secondaryColor}`, background: secondaryColor }}
          >
            {stillLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stillLogo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold tracking-wide" style={{ color: primaryColor }}>
                {initialsFromName(holder)}
              </span>
            )}
          </div>
          <HelloMark color={text} />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="max-w-[58%] min-w-0 pr-2">
            <p className="truncate text-[17px] leading-tight font-bold sm:text-[21px]" style={{ color: text }}>
              {holder}
            </p>
            {title ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug sm:text-sm" style={{ color: muted }}>
                {title}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-md bg-white p-1.5">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="" className="h-[4.2rem] w-[4.2rem] sm:h-[4.75rem] sm:w-[4.75rem]" />
            ) : (
              <div className="h-[4.2rem] w-[4.2rem] bg-zinc-100 sm:h-[4.75rem] sm:w-[4.75rem]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
