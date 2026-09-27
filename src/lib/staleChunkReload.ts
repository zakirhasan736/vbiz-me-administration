const RELOAD_KEY = 'vbiz-stale-chunk-reload'
const RELOAD_COOLDOWN_MS = 15_000

export const STALE_CHUNK_MESSAGE_PATTERNS = [
  'chunkloaderror',
  'failed to load chunk',
  'loading chunk .+\\sfailed',
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
] as const

function isChunkLoadErrorName(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const name = 'name' in value ? String((value as { name?: unknown }).name || '') : ''
  return /chunkloaderror/i.test(name)
}

export function staleChunkErrorText(reason: unknown): string {
  if (typeof reason === 'string') return reason
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`
  if (reason && typeof reason === 'object') {
    const row = reason as { message?: unknown; name?: unknown }
    const name = typeof row.name === 'string' ? row.name : ''
    const message = typeof row.message === 'string' ? row.message : ''
    return [name, message].filter(Boolean).join(': ')
  }
  return String(reason || '')
}

/** Deploy / browser cache left the tab on an old Next chunk map. */
export function isStaleChunkLoadError(reason: unknown): boolean {
  if (isChunkLoadErrorName(reason)) return true
  const text = staleChunkErrorText(reason).trim()
  if (!text) return false
  return STALE_CHUNK_MESSAGE_PATTERNS.some((pattern) => new RegExp(pattern, 'i').test(text))
}

/** Reload at most once per cooldown so a bad network cannot loop. */
export function shouldReloadForStaleChunk(
  now = Date.now(),
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): boolean {
  if (!storage) return false
  try {
    const last = Number(storage.getItem(RELOAD_KEY) || 0)
    if (Number.isFinite(last) && last > 0 && now - last < RELOAD_COOLDOWN_MS) return false
    storage.setItem(RELOAD_KEY, String(now))
    return true
  } catch {
    return false
  }
}

export function reloadForStaleChunk(locationLike: { reload: () => void } = window.location): void {
  locationLike.reload()
}

/** Runs before React so uncaught turbopack/webpack chunk misses can recover. */
export const STALE_CHUNK_RELOAD_BOOTSTRAP = `(function(){try{var KEY=${JSON.stringify(RELOAD_KEY)};var COOLDOWN=${RELOAD_COOLDOWN_MS};var PATTERNS=${JSON.stringify([...STALE_CHUNK_MESSAGE_PATTERNS])};function isChunk(msg,err){var name=err&&err.name?String(err.name):'';var text=String(msg||(err?(err.name||'')+': '+(err.message||''):'')||'');if(/chunkloaderror/i.test(name))return true;for(var i=0;i<PATTERNS.length;i++){if(new RegExp(PATTERNS[i],'i').test(text))return true;}return false;}function reload(){try{var last=Number(sessionStorage.getItem(KEY)||0);if(last&&Date.now()-last<COOLDOWN)return;sessionStorage.setItem(KEY,String(Date.now()));location.reload();}catch(e){}}window.addEventListener('error',function(e){if(isChunk(e.message,e.error)){e.preventDefault();reload();}});window.addEventListener('unhandledrejection',function(e){if(isChunk('',e.reason)){e.preventDefault();reload();}});}catch(e){}})();`
