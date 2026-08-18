export type SavedNote = {
  id: string
  profile_id: string
  content: string
  author_name: string
  created_at: string
  updated_at: string
  reply: string | null
  reply_at: string | null
}

export type PublicProfileNote = SavedNote
