/** Browser storage for the AI card-builder session (create flow). */

export const AI_CARD_JOB_STORAGE_KEY = 'vbiz-ai-card-job-id'
export const AI_CARD_DRAFT_STORAGE_KEY = 'vbiz-ai-card-wizard-draft'

/** Wipe prior AI builder job + draft so a new create always starts at website intake. */
export function clearAiCardWizardSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(AI_CARD_JOB_STORAGE_KEY)
    window.localStorage.removeItem(AI_CARD_DRAFT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
