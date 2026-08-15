import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import { resolveWalletCardBrand, WALLET_ART_SIZE, type WalletArtFormat } from '@/lib/pwa/walletCardBrand'
import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'

function Contactless({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
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

/** Owner wallet pass art — black luxury card layout; accent/logo/name come from the vCard. */
export async function renderWalletCardArt(slug: string, origin?: string, format: WalletArtFormat = 'card') {
  const card = await fetchMyCardBySlug(slug)
  const brand = resolveWalletCardBrand(card, slug, origin)
  const { width, height } = WALLET_ART_SIZE[format]
  const scale = height / WALLET_ART_SIZE.card.height
  const pad = Math.max(16, Math.round(28 * scale))
  const logo = Math.max(52, Math.round(118 * scale))
  const qr = Math.max(72, Math.round(168 * scale))
  const nameSize = Math.max(22, Math.round(42 * scale))
  const roleSize = Math.max(12, Math.round(20 * scale))
  const footerSize = Math.max(9, Math.round(14 * scale))
  const scanSize = Math.max(9, Math.round(13 * scale))
  const initialSize = Math.max(18, Math.round(36 * scale))

  let qrSrc = ''
  try {
    qrSrc = await QRCode.toDataURL(brand.cardUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: qr * 2,
      color: { dark: '#ffffff', light: '#0a0a0a' },
    })
  } catch {
    qrSrc = ''
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#050505',
        padding: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          border: `1.5px solid ${brand.accent}`,
          borderRadius: 22,
          padding: 8,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${brand.accent}`,
            borderRadius: 16,
            padding: `${pad}px ${pad + 6}px ${Math.round(pad * 0.7)}px`,
            background: 'linear-gradient(160deg, #141414 0%, #0a0a0a 48%, #050505 100%)',
            color: brand.accent,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                minWidth: 0,
                paddingRight: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: logo,
                  height: logo,
                  borderRadius: logo / 2,
                  border: `2px solid ${brand.accent}`,
                  padding: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    borderRadius: logo / 2,
                    border: `1px solid ${brand.accent}`,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#111',
                  }}
                >
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logoUrl}
                      alt=""
                      width={logo - 12}
                      height={logo - 12}
                      style={{ width: logo - 12, height: logo - 12, objectFit: 'cover', borderRadius: logo / 2 }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        fontSize: initialSize,
                        fontWeight: 700,
                        letterSpacing: 2,
                        color: brand.accent,
                      }}
                    >
                      {brand.initials}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: 'Georgia, Times New Roman, serif',
                    fontSize: nameSize,
                    lineHeight: 1.15,
                    color: brand.accent,
                  }}
                >
                  {brand.name}
                </div>
                {brand.roleLine ? (
                  <div
                    style={{ display: 'flex', marginTop: 8, fontSize: roleSize, color: '#ffffff', letterSpacing: 0.3 }}
                  >
                    {brand.roleLine}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <Contactless color={brand.accent} size={Math.max(22, Math.round(36 * scale))} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    marginBottom: 8,
                    fontSize: scanSize,
                    letterSpacing: 1.2,
                    color: brand.accent,
                  }}
                >
                  Scan to Connect
                </div>
                <div
                  style={{
                    display: 'flex',
                    padding: 6,
                    border: `1px solid ${brand.accent}`,
                    background: '#0a0a0a',
                  }}
                >
                  {qrSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrSrc} alt="" width={qr} height={qr} />
                  ) : (
                    <div style={{ display: 'flex', width: qr, height: qr, background: '#111' }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: Math.round(14 * scale),
              paddingTop: Math.round(10 * scale),
              borderTop: `1px solid ${brand.accent}`,
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', fontSize: footerSize, letterSpacing: 1.4, color: brand.accent }}>
              Apple Wallet & Google Wallet Ready
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width,
      height,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    }
  )
}
