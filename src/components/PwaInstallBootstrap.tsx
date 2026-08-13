import Script from 'next/script'

/**
 * Capture `beforeinstallprompt` before React hydrates so Add to Home Screen
 * can still call the native install sheet. No extra packages or secrets.
 */
export function PwaInstallBootstrap() {
  return (
    <Script
      id="vbiz-pwa-install-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{window.__vbizPwa=window.__vbizPwa||{prompt:null,installed:false};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__vbizPwa.prompt=e;});window.addEventListener('appinstalled',function(){window.__vbizPwa.installed=true;window.__vbizPwa.prompt=null;});}catch(e){}})();`,
      }}
    />
  )
}
