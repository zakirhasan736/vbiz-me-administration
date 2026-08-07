export type SavedGuestUser = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  profile_id: string
  profile_slug: string | null
  owner_name: string | null
  meta?: unknown
  created_at: string
}
