import Script from 'next/script'

/** Hardcoded production IDs (env overrides when set). */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-0CE42MRLY8'
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || 'GTM-KBWWG4QM'

/**
 * GA4 + GTM in the initial HTML (beforeInteractive).
 * Google Tag Assistant / install checks read SSR markup — client-only afterInteractive
 * scripts are often reported as “not found”.
 *
 * Must be imported from the root server layout (not a Client Component).
 */
export function GoogleAnalyticsBootstrap() {
  const gaId = GA_MEASUREMENT_ID
  const gtmId = GTM_CONTAINER_ID

  if (!gaId && !gtmId) return null

  return (
    <>
      {gtmId ? (
        <Script id="google-tag-manager" strategy="beforeInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
        `}</Script>
      ) : null}

      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="beforeInteractive" />
          <Script id="google-analytics-ga4" strategy="beforeInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { send_page_view: true });
          `}</Script>
        </>
      ) : null}
    </>
  )
}

/** Google’s required GTM noscript iframe — place as the first child of <body>. */
export function GoogleTagManagerNoscript() {
  const gtmId = GTM_CONTAINER_ID
  if (!gtmId) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}

export function getGoogleAnalyticsIds() {
  return { gaId: GA_MEASUREMENT_ID, gtmId: GTM_CONTAINER_ID }
}
