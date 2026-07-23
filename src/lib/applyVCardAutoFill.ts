import type { VCardAutoFillResult } from '@/lib/vcardAutoFillDemo'

type UpdateDataFn = (path: string, value: unknown) => void

/** Applies flat demo keys like `personal.fullName` via VCard context `updateData`. */
export function applyVCardContextAutoFill(updateData: UpdateDataFn, fields: VCardAutoFillResult) {
  for (const [path, value] of Object.entries(fields)) {
    if (value !== undefined && value !== '') {
      updateData(path, value)
    }
  }
}
