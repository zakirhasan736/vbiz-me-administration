'use client'

import { BlogEditorPanel } from '@/components/vcard/BlogEditorPanel'
import { useVCard } from '@/lib/VCardContext'

export function TabBlog() {
  const { cardId, vCardData, updateData } = useVCard()

  return (
    <BlogEditorPanel
      profileId={cardId}
      posts={vCardData.generalPosts}
      onPostsChange={(next) => updateData('generalPosts', next)}
    />
  )
}
