import { api } from '@/redux/api/api'
import type {
  ActiveAnnouncementPayload,
  Announcement,
  AnnouncementListPage,
  AnnouncementListQuery,
  ClearLiveAnnouncementResult,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '@/types/announcement'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
  inbox?: Announcement[]
}

function isInboxOnlyMeta(meta?: Record<string, string>) {
  return meta?.channel === 'inbox'
}

/** True for { banner, inbox } payloads or accidental envelope-as-data — never treat as a row. */
function isActivePayloadShape(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  if ('banner' in row || ('inbox' in row && !('id' in row))) return true
  if ('success' in row && 'data' in row) return true
  return false
}

/** Any well-formed announcement row (banner or inbox-only). */
function isAnnouncementRow(value: unknown): value is Announcement {
  if (!value || typeof value !== 'object') return false
  if (isActivePayloadShape(value)) return false
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || !row.id.trim()) return false
  if (typeof row.title !== 'string' || !row.title.trim()) return false
  if (typeof row.body !== 'string' || !row.body.trim()) return false
  return true
}

function isBannerAnnouncement(value: unknown): value is Announcement {
  return isAnnouncementRow(value) && !isInboxOnlyMeta(value.meta)
}

function normalizeActiveAnnouncementResponse(
  res: Envelope<Announcement | ActiveAnnouncementPayload | null>
): ActiveAnnouncementPayload {
  const payload = res.data
  const topInbox = Array.isArray(res.inbox) ? res.inbox.filter(isAnnouncementRow) : []

  // Nested { banner, inbox } (brief mid-deploy shape) or accidental envelope-as-data
  if (isActivePayloadShape(payload)) {
    const nested = payload as Record<string, unknown>
    const nestedBannerCandidate = nested.banner ?? nested.data
    const nestedInbox = Array.isArray(nested.inbox) ? nested.inbox.filter(isAnnouncementRow) : []
    return {
      banner: isBannerAnnouncement(nestedBannerCandidate) ? nestedBannerCandidate : null,
      inbox: nestedInbox.length ? nestedInbox : topInbox,
    }
  }

  const banner = isBannerAnnouncement(payload) ? payload : null
  const legacyInbox = isAnnouncementRow(payload) ? [payload] : []
  return {
    banner,
    inbox: topInbox.length ? topInbox : legacyInbox,
  }
}

const adminAnnouncementsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAnnouncements: builder.query<AnnouncementListPage, AnnouncementListQuery | void>({
      query: (params) => {
        const search = new URLSearchParams()
        search.set('skip', String(params?.skip ?? 0))
        search.set('limit', String(params?.limit ?? 50))
        if (params?.status) search.set('status', params.status)
        if (params?.kind) search.set('kind', params.kind)
        return `/admin/announcements?${search.toString()}`
      },
      transformResponse: (res: Envelope<AnnouncementListPage>) => res.data,
      providesTags: (result) =>
        result
          ? [
              { type: 'adminAnnouncements' as const, id: 'LIST' },
              { type: 'adminAnnouncements' as const, id: 'ACTIVE' },
              ...result.items.map((a) => ({ type: 'adminAnnouncements' as const, id: a.id })),
            ]
          : [
              { type: 'adminAnnouncements' as const, id: 'LIST' },
              { type: 'adminAnnouncements' as const, id: 'ACTIVE' },
            ],
    }),
    getAnnouncement: builder.query<Announcement, string>({
      query: (id) => `/admin/announcements/${id}`,
      transformResponse: (res: Envelope<Announcement>) => res.data,
      providesTags: (_result, _error, id) => [{ type: 'adminAnnouncements', id }],
    }),
    getActiveAnnouncement: builder.query<ActiveAnnouncementPayload, void>({
      query: () => '/announcements/active',
      transformResponse: (res: Envelope<Announcement | ActiveAnnouncementPayload | null>) =>
        normalizeActiveAnnouncementResponse(res),
      providesTags: [{ type: 'adminAnnouncements', id: 'ACTIVE' }],
    }),
    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementPayload>({
      query: (body) => ({ url: '/admin/announcements', method: 'POST', body }),
      transformResponse: (res: Envelope<Announcement>) => res.data,
      invalidatesTags: [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
      ],
    }),
    updateAnnouncement: builder.mutation<Announcement, { id: string; body: UpdateAnnouncementPayload }>({
      query: ({ id, body }) => ({
        url: `/admin/announcements/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<Announcement>) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
        { type: 'adminAnnouncements', id },
      ],
    }),
    deleteAnnouncement: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admin/announcements/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
        { type: 'adminAnnouncements', id },
      ],
    }),
    clearLiveAnnouncement: builder.mutation<ClearLiveAnnouncementResult, void>({
      query: () => ({ url: '/admin/announcements/clear-live', method: 'POST' }),
      transformResponse: (res: Envelope<ClearLiveAnnouncementResult>) => res.data,
      invalidatesTags: [
        { type: 'adminAnnouncements', id: 'LIST' },
        { type: 'adminAnnouncements', id: 'ACTIVE' },
      ],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useGetAnnouncementQuery,
  useGetActiveAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useClearLiveAnnouncementMutation,
} = adminAnnouncementsApi

/** Optimistically hide the live banner after the user dismisses it (inbox unchanged). */
export function clearActiveAnnouncementBannerCache() {
  return (
    api.util.updateQueryData as unknown as (
      endpointName: 'getActiveAnnouncement',
      endpointArgs: void,
      updateRecipe: (draft: ActiveAnnouncementPayload) => void
    ) => ReturnType<typeof api.util.updateQueryData>
  )('getActiveAnnouncement', undefined, (draft) => {
    draft.banner = null
  })
}

export default adminAnnouncementsApi
