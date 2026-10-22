import Script from 'next/script'

const PWA_INSTALL_BOOTSTRAP = `(function(){try{window.__vbizPwa=window.__vbizPwa||{prompt:null,installed:false,available:false};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__vbizPwa.installed=false;window.__vbizPwa.available=true;window.__vbizPwa.prompt=e;window.dispatchEvent(new Event('vbiz-pwa-prompt'));});try{localStorage.removeItem('vbiz_home_screen_added');}catch(err){}window.addEventListener('appinstalled',function(){window.__vbizPwa.installed=true;window.__vbizPwa.prompt=null;});if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(function(reg){if(reg.waiting){try{reg.waiting.postMessage({type:'SKIP_WAITING'});}catch(err){}}});}}catch(e){}})();`

/**
 * Capture Chrome's install event before React hydrates, and register `/sw.js`
 * on every origin path so owner Web Push works after the first Allow even when
 * the backoffice tab is closed (not only on public `/vCard/` routes).
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
