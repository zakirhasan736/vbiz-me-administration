import Script from 'next/script'

const PWA_INSTALL_BOOTSTRAP = `(function(){try{window.__vbizPwa=window.__vbizPwa||{prompt:null,installed:false,available:false};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__vbizPwa.available=true;window.__vbizPwa.prompt=e;window.dispatchEvent(new Event('vbiz-pwa-prompt'));});window.addEventListener('appinstalled',function(){window.__vbizPwa.installed=true;window.__vbizPwa.prompt=null;});var path=location.pathname;if('serviceWorker'in navigator&&(path.indexOf('/vCard/')===0||path.indexOf('/v/')===0)){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(function(reg){if(reg.waiting){try{reg.waiting.postMessage({type:'SKIP_WAITING'});}catch(err){}}});}}catch(e){}})();`

/**
 * Capture Chrome's install event before React hydrates, and register `/sw.js`
 * on public cards so Add to Home Screen can appear on Android / desktop.
 */
export function PwaInstallBootstrap() {
  return (
    <Script
      id="vbiz-pwa-install-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: PWA_INSTALL_BOOTSTRAP,
      }}
    />
  )
}
