import { fetchMyCardBySlug } from '@/lib/api/myCard/fetchMyCardBySlug'
import {
  resolveWalletPassModel,
  WALLET_ART_SIZE,
  WALLET_TEMPLATE_VERSION,
  type WalletArtFormat,
} from '@/lib/pwa/walletCardBrand'
import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'

function HelloMark({ color, size }: { color: string; size: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size / 2,
        border: `1.5px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', fontSize: Math.max(9, Math.round(size * 0.28)), letterSpacing: 0.6, color }}>
        hello
      </div>
    </div>
  )
}

function nameFontSize(name: string, base: number): number {
  if (name.length > 32) return Math.round(base * 0.68)
  if (name.length > 24) return Math.round(base * 0.8)
  return base
}

/** Master vBiz Wallet template — locked layout, owner data + brand colors. */
export async function renderWalletCardArt(slug: string, origin?: string, format: WalletArtFormat = 'card') {
  const card = await fetchMyCardBySlug(slug)
  const model = resolveWalletPassModel(card, slug, origin)
  const canvas = WALLET_ART_SIZE[format]
  const source = WALLET_ART_SIZE.card
  const fit = Math.min(canvas.width / source.width, canvas.height / source.height)
  const drawW = Math.round(source.width * fit)
  const drawH = Math.round(source.height * fit)
  const scale = drawH / source.height
  const pad = Math.max(22, Math.round(36 * scale))
  const photo = Math.max(72, Math.round(128 * scale))
  const qr = Math.max(96, Math.round(168 * scale))
  const hello = Math.max(36, Math.round(52 * scale))
  const nameSize = nameFontSize(model.name, Math.max(26, Math.round(40 * scale)))
  const titleSize = Math.max(14, Math.round(20 * scale))
  const initialSize = Math.max(18, Math.round(32 * scale))
  const textColWidth = Math.round(drawW * 0.55)

  let qrSrc = ''
  try {
    qrSrc = await QRCode.toDataURL(model.cardUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
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
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: model.theme.primary,
          borderRadius: Math.max(18, Math.round(28 * scale)),
          padding: `${pad}px ${pad + 4}px`,
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
              border: `2px solid ${model.theme.secondary}`,
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
              <div style={{ display: 'flex', fontSize: initialSize, fontWeight: 700, color: model.theme.primary }}>
                {model.initials}
              </div>
            )}
          </div>
          <HelloMark color={model.theme.text} size={hello} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: textColWidth, paddingRight: 16 }}>
            <div
              style={{
                display: 'flex',
                fontSize: nameSize,
                fontWeight: 700,
                lineHeight: 1.15,
                color: model.theme.text,
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
          <div
            style={{
              display: 'flex',
              padding: 8,
              background: model.theme.qrLight,
              borderRadius: 8,
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
    </div>,
    {
      width: canvas.width,
      height: canvas.height,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': `public, max-age=300, stale-while-revalidate=86400`,
        'X-Wallet-Template': String(WALLET_TEMPLATE_VERSION),
      },
    }
  )
}
