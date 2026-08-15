import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import {
  resolveWalletPassModel,
  WALLET_ART_SIZE,
  WALLET_TEMPLATE_VERSION,
  type WalletArtFormat,
} from '@/lib/pwa/walletCardBrand'
import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'

function ContactlessMark({ color, size }: { color: string; size: number }) {
  const stroke = Math.max(2, Math.round(size * 0.08))
  const ringStyle = (ratio: number) => ({
    display: 'flex' as const,
    width: Math.round(size * ratio),
    height: Math.round(size * ratio),
    borderRadius: 999,
    borderTop: `${stroke}px solid ${color}`,
    borderRight: `${stroke}px solid ${color}`,
    borderBottom: `${stroke}px solid transparent`,
    borderLeft: `${stroke}px solid transparent`,
    alignItems: 'center',
    justifyContent: 'center',
  })
  return (
    <div style={{ display: 'flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', transform: 'rotate(-45deg)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={ringStyle(0.92)}>
          <div style={ringStyle(0.62)}>
            <div style={ringStyle(0.32)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function nameFontSize(name: string, base: number): number {
  if (name.length > 32) return Math.round(base * 0.68)
  if (name.length > 24) return Math.round(base * 0.8)
  return base
}

async function loadSerifFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@5.2.6/latin-700-normal.ttf',
      { cache: 'force-cache' }
    )
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

/** Master vBiz Wallet template — metal card, owner data + brand colors. */
export async function renderWalletCardArt(slug: string, origin?: string, format: WalletArtFormat = 'card') {
  const card = await fetchMyCardBySlug(slug)
  const model = resolveWalletPassModel(card, slug, origin)
  const canvas = WALLET_ART_SIZE[format]
  const source = WALLET_ART_SIZE.card
  const fit = Math.min(canvas.width / source.width, canvas.height / source.height)
  const drawW = Math.round(source.width * fit)
  const drawH = Math.round(source.height * fit)
  const scale = drawH / source.height
  const outerPad = Math.max(10, Math.round(16 * scale))
  const innerPad = Math.max(18, Math.round(28 * scale))
  const radius = Math.max(22, Math.round(32 * scale))
  const innerRadius = Math.max(16, Math.round(22 * scale))
  const photo = Math.max(72, Math.round(128 * scale))
  const qr = Math.max(88, Math.round(150 * scale))
  const nfc = Math.max(28, Math.round(44 * scale))
  const nameSize = nameFontSize(model.name, Math.max(26, Math.round(42 * scale)))
  const titleSize = Math.max(13, Math.round(18 * scale))
  const scanSize = Math.max(10, Math.round(13 * scale))
  const initialSize = Math.max(18, Math.round(32 * scale))
  const textColWidth = Math.round(drawW * 0.52)
  const border = Math.max(2, Math.round(3 * scale))
  const footerH = Math.max(10, Math.round(16 * scale))
  const serif = await loadSerifFont()

  let qrSrc = ''
  try {
    qrSrc = await QRCode.toDataURL(model.cardUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: qr * 2,
      color: { dark: model.theme.qrDark, light: model.theme.qrLight },
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
        alignItems: 'center',
        justifyContent: 'center',
        background: model.theme.primary,
      }}
    >
      <div
        style={{
          width: drawW,
          height: drawH,
          display: 'flex',
          padding: outerPad,
          background: model.theme.primary,
          borderRadius: radius,
          border: `${border}px solid ${model.theme.secondary}`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `${innerPad}px ${innerPad + 4}px ${Math.round(innerPad * 0.7)}px`,
            borderRadius: innerRadius,
            border: `${Math.max(1, border - 1)}px solid ${model.theme.secondary}`,
            background: model.theme.primary,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'flex',
                width: photo,
                height: photo,
                borderRadius: photo / 2,
                overflow: 'hidden',
                border: `${Math.max(2, Math.round(3 * scale))}px solid ${model.theme.secondary}`,
                background: model.theme.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {model.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={model.photoUrl}
                  alt=""
                  width={photo}
                  height={photo}
                  style={{ width: photo, height: photo, objectFit: 'cover', borderRadius: photo / 2 }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    fontSize: initialSize,
                    fontWeight: 700,
                    color: model.theme.primary,
                  }}
                >
                  {model.initials}
                </div>
              )}
            </div>
            <ContactlessMark color={model.theme.secondary} size={nfc} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: textColWidth, paddingRight: 12 }}>
              <div
                style={{
                  display: 'flex',
                  fontFamily: serif ? 'Playfair Display' : 'serif',
                  fontSize: nameSize,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: model.theme.secondary,
                }}
              >
                {model.name}
              </div>
              {model.designation ? (
                <div
                  style={{
                    display: 'flex',
                    marginTop: 8,
                    fontSize: titleSize,
                    lineHeight: 1.25,
                    color: model.theme.mutedText,
                  }}
                >
                  {model.designation}
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  marginBottom: 8,
                  fontSize: scanSize,
                  letterSpacing: 0.4,
                  color: model.theme.secondary,
                }}
              >
                Scan to Connect
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: 6,
                  background: model.theme.qrLight,
                  borderRadius: 4,
                }}
              >
                {qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrSrc} alt="" width={qr} height={qr} />
                ) : (
                  <div style={{ display: 'flex', width: qr, height: qr, background: model.theme.qrLight }} />
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              width: '100%',
              height: footerH,
              marginTop: Math.max(10, Math.round(14 * scale)),
              borderRadius: 4,
              background: model.theme.footer,
            }}
          />
        </div>
      </div>
    </div>,
    {
      width: canvas.width,
      height: canvas.height,
      fonts: serif ? [{ name: 'Playfair Display', data: serif, weight: 700, style: 'normal' }] : undefined,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': `public, max-age=300, stale-while-revalidate=86400`,
        'X-Wallet-Template': String(WALLET_TEMPLATE_VERSION),
      },
    }
  )
}
