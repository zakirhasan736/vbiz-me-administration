'use client'

import { BlogEditorPanel } from '@/components/vcard/BlogEditorPanel'
import { useVCard } from '@/lib/VCardContext'

export function TabBlog() {
  const { vCardData, updateData } = useVCard()

  return <BlogEditorPanel posts={vCardData.generalPosts} onPostsChange={(next) => updateData('generalPosts', next)} />
}
