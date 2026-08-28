export const ADMIN_VCARDS_PATH = '/admin/vcards'
export const ADMIN_MY_CARDS_PATH = '/admin/mycards'
export const ADMIN_EDITOR_RETURN_KEY = 'admin_editor_return_path'

export type AdminEditorReturnPath = typeof ADMIN_VCARDS_PATH | typeof ADMIN_MY_CARDS_PATH

const RETURN_PATH_EVENT = 'admin-editor-return-path'

export function setAdminEditorReturnPath(path: AdminEditorReturnPath): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_EDITOR_RETURN_KEY, path)
  window.dispatchEvent(new Event(RETURN_PATH_EVENT))
}

export function readAdminEditorReturnPath(): AdminEditorReturnPath | null {
  if (typeof window === 'undefined') return null
  const value = sessionStorage.getItem(ADMIN_EDITOR_RETURN_KEY)
  if (value === ADMIN_VCARDS_PATH || value === ADMIN_MY_CARDS_PATH) return value
  return null
}

export function subscribeAdminEditorReturnPath(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(RETURN_PATH_EVENT, onStoreChange)
  return () => window.removeEventListener(RETURN_PATH_EVENT, onStoreChange)
}

export function getAdminEditorReturnPathSnapshot(): AdminEditorReturnPath {
  return readAdminEditorReturnPath() || ADMIN_MY_CARDS_PATH
}

export function getAdminEditorReturnPathServerSnapshot(): AdminEditorReturnPath {
  return ADMIN_MY_CARDS_PATH
}
