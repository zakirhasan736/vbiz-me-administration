import { api } from '@/redux/api/api'

export type GoogleFontItem = {
  family: string
  category: string
}

type FontsListResponse = {
  success: boolean
  statusCode: number
  message: string
  data: GoogleFontItem[]
  totalDoc?: number
}

const fontsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getGoogleFonts: builder.query<GoogleFontItem[], { q?: string; limit?: number } | void>({
      query: (args) => {
        const params = new URLSearchParams()
        const q = args?.q?.trim()
        if (q) params.set('q', q)
        if (args?.limit) params.set('limit', String(args.limit))
        const qs = params.toString()
        return qs ? `/fonts?${qs}` : '/fonts'
      },
      transformResponse: (response: FontsListResponse) => response.data ?? [],
    }),
  }),
})

export const { useGetGoogleFontsQuery } = fontsApi
