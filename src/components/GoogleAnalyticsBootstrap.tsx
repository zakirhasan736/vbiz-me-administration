'use client'

import Script from 'next/script'

/**
 * GA4 + optional GTM — only injects when env IDs are set (Search Console / Analytics ready).
 * Reads NEXT_PUBLIC_* literals so Next can inline them for the client bundle.
 */
export function GoogleAnalyticsBootstrap() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ''
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || ''

  if (!gaId && !gtmId) return null

  return (
    <>
      {gtmId ? (
        <Script id="gtm-init" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}</Script>
      ) : null}
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true, send_page_view: true });
          `}</Script>
        </>
      ) : null}
    </>
  )
}
