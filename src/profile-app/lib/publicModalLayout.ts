/** Public-card popup layout: ~10% top/bottom inset, max 80% height, vertically centered. */
export const PUBLIC_MODAL_INSET_Y =
  'pt-[max(10dvh,env(safe-area-inset-top,0px))] pb-[max(10dvh,env(safe-area-inset-bottom,0px))]'
export const PUBLIC_MODAL_INSET_X =
  'pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]'

export const PUBLIC_MODAL_BACKDROP = `vbiz-modal-backdrop fixed inset-0 z-100 flex items-center justify-center ${PUBLIC_MODAL_INSET_X} ${PUBLIC_MODAL_INSET_Y} backdrop-blur-md`

export const PUBLIC_MODAL_PANEL =
  'flex max-h-[80dvh] w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border shadow-2xl'
