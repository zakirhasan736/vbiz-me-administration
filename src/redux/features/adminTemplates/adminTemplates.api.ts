import { api } from '@/redux/api/api'
import type { CardTemplate, UpdateCardTemplatePayload } from '@/types/template'

type Envelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
}

const adminTemplatesApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminTemplates: builder.query<CardTemplate[], void>({
      query: () => '/admin/templates',
      transformResponse: (res: Envelope<CardTemplate[]>) => res.data,
      providesTags: (result) =>
        result
          ? [
              { type: 'adminTemplates' as const, id: 'LIST' },
              { type: 'templates' as const, id: 'ACTIVE' },
              ...result.map((t) => ({ type: 'adminTemplates' as const, id: t.id })),
            ]
          : [
              { type: 'adminTemplates' as const, id: 'LIST' },
              { type: 'templates' as const, id: 'ACTIVE' },
            ],
    }),
    getActiveTemplates: builder.query<CardTemplate[], void>({
      query: () => '/templates',
      transformResponse: (res: Envelope<CardTemplate[]>) => res.data,
      providesTags: [{ type: 'templates', id: 'ACTIVE' }],
    }),
    updateAdminTemplate: builder.mutation<CardTemplate, { id: string; body: UpdateCardTemplatePayload }>({
      query: ({ id, body }) => ({
        url: `/admin/templates/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<CardTemplate>) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'adminTemplates', id: 'LIST' },
        { type: 'adminTemplates', id },
        { type: 'templates', id: 'ACTIVE' },
      ],
    }),
  }),
})

export const { useGetAdminTemplatesQuery, useGetActiveTemplatesQuery, useUpdateAdminTemplateMutation } =
  adminTemplatesApi

export default adminTemplatesApi
