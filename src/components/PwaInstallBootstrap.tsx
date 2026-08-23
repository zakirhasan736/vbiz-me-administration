import Script from 'next/script'

/**
 * Register the existing `/sw.js` on public cards and watch install events.
 * Capture the native install event early so card actions can trigger it later.
 */
export function PwaInstallBootstrap() {
  return (
    <Script
      id="vbiz-pwa-install-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{window.__vbizPwa=window.__vbizPwa||{prompt:null,installed:false,available:false};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__vbizPwa.available=true;window.__vbizPwa.prompt=e;});window.addEventListener('appinstalled',function(){window.__vbizPwa.installed=true;window.__vbizPwa.prompt=null;});if('serviceWorker'in navigator&&location.pathname.indexOf('/v/')===0){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}}catch(e){}})();`,
      }}
    />
  )
}
