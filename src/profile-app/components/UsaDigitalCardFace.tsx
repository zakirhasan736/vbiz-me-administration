'use client'

import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'

function ContactlessMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" aria-hidden>
      <path
        d="M10 8.5c2.4 2.1 3.8 5 3.8 8.1S12.4 20.6 10 22.7"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M13.6 6c3.2 2.8 5.1 6.6 5.1 10.6S16.8 24.4 13.6 27.2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17.2 3.4c4 3.5 6.4 8.3 6.4 13.6s-2.4 10.1-6.4 13.6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

type UsaDigitalCardFaceProps = {
  holderName: string
  designation?: string
  company?: string
  accentColor?: string
  logoUrl?: string | null
  cardSlug?: string
}

export function UsaDigitalCardFace({
  holderName,
  designation,
  company,
  accentColor = '#C9A24A',
  logoUrl,
  cardSlug,
}: UsaDigitalCardFaceProps) {
  const holder = holderName.trim() || 'Cardholder'
  const roleLine = [designation?.trim(), company?.trim()].filter(Boolean).join(' | ')
  const stillLogo = logoUrl && !isVideoAvatarSrc(logoUrl) ? logoUrl : ''
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
      margin: 1,
      width: 280,
      color: { dark: '#ffffff', light: '#0a0a0a' },
    }).then((url) => {
      if (!cancelled) setQrSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [qrValue])

  return (
    <div
      className="relative aspect-[1.586/1] w-full rounded-[18px] bg-black p-[7px]"
      style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}
    >
      <div className="h-full w-full rounded-[14px] p-[6px]" style={{ border: `1.5px solid ${accentColor}` }}>
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[10px] px-4 py-3.5"
          style={{
            border: `1px solid ${accentColor}`,
            background: 'linear-gradient(160deg, #141414 0%, #0a0a0a 50%, #050505 100%)',
          }}
        >
          <div className="flex min-h-0 flex-1 justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full p-[3px] sm:h-16 sm:w-16"
                style={{ border: `2px solid ${accentColor}` }}
              >
                <div
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-full"
                  style={{ border: `1px solid ${accentColor}`, background: '#111' }}
                >
                  {stillLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stillLogo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-serif text-lg tracking-wide" style={{ color: accentColor }}>
                      {initialsFromName(holder)}
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0 pr-2">
                <p
                  className="truncate font-serif text-[17px] leading-tight sm:text-[20px]"
                  style={{ color: accentColor }}
                >
                  {holder}
                </p>
                {roleLine ? <p className="mt-1 truncate text-[11px] text-white sm:text-xs">{roleLine}</p> : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end justify-between">
              <ContactlessMark color={accentColor} />
              <div className="flex flex-col items-center">
                <p className="mb-1 text-[8px] tracking-[0.14em] sm:text-[9px]" style={{ color: accentColor }}>
                  Scan to Connect
                </p>
                <div className="bg-black p-[3px]" style={{ border: `1px solid ${accentColor}` }}>
                  {qrSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrSrc} alt="" className="h-[4.4rem] w-[4.4rem] sm:h-20 sm:w-20" />
                  ) : (
                    <div className="h-[4.4rem] w-[4.4rem] bg-zinc-900 sm:h-20 sm:w-20" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-center border-t pt-2" style={{ borderColor: accentColor }}>
            <p className="text-[8px] tracking-[0.16em] sm:text-[9px]" style={{ color: accentColor }}>
              Apple Wallet & Google Wallet Ready
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
