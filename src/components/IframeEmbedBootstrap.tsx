import Script from 'next/script'

/** Sets `data-vbiz-iframe-embed` before React hydrates so live-agent chrome stays hidden in iframes. */
export function IframeEmbedBootstrap() {
  return (
    <Script
      id="vbiz-iframe-embed-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(window.self!==window.top||window.frameElement){document.documentElement.dataset.vbizIframeEmbed='';}}catch(e){document.documentElement.dataset.vbizIframeEmbed='';}})();`,
      }}
    />
  )
}
