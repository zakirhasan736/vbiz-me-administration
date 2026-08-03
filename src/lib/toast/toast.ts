/**
 * Global, event-based toast system shared across the whole site.
 *
 * Call `notify.success(...)` / `notify.error(...)` / `notify.info(...)` from anywhere
 * (React components, plain async helpers, RTK Query, etc.). A single <ToastViewport />
 * mounted at the root layout renders the pills (top-right).
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type ToastPayload = {
  id: string
  variant: ToastVariant
  title?: string
  message: string
  /** Auto-dismiss delay in ms. Defaults to 4500. */
  duration?: number
}

export type ToastOptions = {
  title?: string
  duration?: number
}

export const TOAST_EVENT = 'vbiz_toast'

let counter = 0

function nextId(): string {
  counter += 1
  return `toast_${Date.now().toString(36)}_${counter}`
}

function emit(variant: ToastVariant, message: string, options?: ToastOptions): string {
  const id = nextId()
  if (typeof window === 'undefined') return id

  const detail: ToastPayload = {
    id,
    variant,
    message,
    title: options?.title,
    duration: options?.duration,
  }
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail }))
  return id
}

export const notify = {
  success: (message: string, options?: ToastOptions) => emit('success', message, options),
  error: (message: string, options?: ToastOptions) => emit('error', message, options),
  info: (message: string, options?: ToastOptions) => emit('info', message, options),
  warning: (message: string, options?: ToastOptions) => emit('warning', message, options),
}
