import { getAboutMeDraft } from '@/lib/aboutMeDraft'
import { notify } from '@/lib/toast/toast'
import { aboutMeAuthApi } from '@/redux/features/sections/aboutMe.api'
import type { AppDispatch } from '@/redux/store'

const DEBOUNCE_MS = 3000

let timer: ReturnType<typeof setTimeout> | null = null
let pendingProfileId: string | null = null
let inflight: Promise<void> | null = null
let lastSuccessToastAt = 0
let lastErrorToast: { message: string; at: number } | null = null

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string; requestId?: string; errorMessages?: { message?: string }[] } })
      .data
    const withReference = (message: string) => (data?.requestId ? `${message} (Reference: ${data.requestId})` : message)
    const details = data?.errorMessages
      ?.map((item) => item.message)
      .filter((message): message is string => Boolean(message))
    if (details?.length) return withReference(details.join('. '))
    if (data?.message) return withReference(data.message)
  }
  if (err instanceof Error && err.message) return err.message
  return 'Failed to save About Me'
}

function toastAboutMeSaved() {
  const now = Date.now()
  if (now - lastSuccessToastAt < 1800) return
  lastSuccessToastAt = now
  notify.success('About Me saved.')
}

function toastAboutMeError(message: string) {
  const now = Date.now()
  if (lastErrorToast && lastErrorToast.message === message && now - lastErrorToast.at < 4000) return
  lastErrorToast = { message, at: now }
  notify.error(message)
}

function buildUpsertBody() {
  const draft = getAboutMeDraft()
  return {
    title: draft.title.trim(),
    description: draft.descriptionHtml,
    featuredMediaUrl: draft.featuredMediaUrl || '',
  }
}

async function runUpsert(dispatch: AppDispatch, profileId: string): Promise<void> {
  await dispatch(
    aboutMeAuthApi.endpoints.upsertAboutMe.initiate({
      id: profileId,
      body: buildUpsertBody(),
    })
  ).unwrap()
}

/** Debounced About Me PUT when the editor draft changes. */
export function scheduleAboutMeUpsert(dispatch: AppDispatch, profileId: string): void {
  if (!profileId.trim()) return
  pendingProfileId = profileId.trim()
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void flushAboutMeUpsert(dispatch)
  }, DEBOUNCE_MS)
}

/**
 * Immediately persist the current About Me draft.
 * - With `profileId`: force a save for that profile (e.g. quick-fill apply after an edit).
 * - Without: only flush a previously scheduled (pending) upsert — never invent a save
 *   from an untouched empty draft (would wipe migrated data on card autosave).
 */
export async function flushAboutMeUpsert(dispatch: AppDispatch, profileId?: string | null): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  // Force path requires an explicit id from an edit/apply path.
  // Pending path only runs when scheduleAboutMeUpsert was called.
  const id = profileId?.trim() ? profileId.trim() : pendingProfileId?.trim() || null
  pendingProfileId = null
  if (!id) return

  if (inflight) {
    try {
      await inflight
    } catch {
      /* previous attempt failed — still try with latest draft */
    }
  }

  const task = runUpsert(dispatch, id)
    .then(() => {
      toastAboutMeSaved()
    })
    .catch((err) => {
      toastAboutMeError(errorMessage(err))
      throw err
    })
    .finally(() => {
      if (inflight === task) inflight = null
    })
  inflight = task
  await task
}
