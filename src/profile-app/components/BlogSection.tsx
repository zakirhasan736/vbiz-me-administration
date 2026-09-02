'use client'

import { BlogPostDetail } from '@/profile-app/components/BlogPostDetail'
import { DynamicPostsSection } from '@/profile-app/components/DynamicPostsSection'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { useState } from 'react'

type BlogSectionProps = {
  sectionName?: string
}

export const BlogSection = ({ sectionName = 'blog' }: BlogSectionProps) => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const resolvedSectionName = sectionName.trim() || 'blog'
  const [selectedPostId, setSelectedPostId] = useState<number | string | null>(null)

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: resolvedSectionName },
    { skip: !profileId || !resolvedSectionName }
  )

  const sectionTitle = useResolvedSectionTitle(data?.sectionTitle, resolvedSectionName)

  if (!profileId) return null

  const selectedPost = data?.posts.find((post) => post.id === selectedPostId)

  if (selectedPost) {
    return <BlogPostDetail post={selectedPost} sectionTitle={sectionTitle} onBack={() => setSelectedPostId(null)} />
  }

  return (
    <DynamicPostsSection
      sectionTitle={sectionTitle}
      posts={data?.posts ?? []}
      isLoading={isLoading}
      isError={isError}
      badgeLabel="Blog"
      emptyMessage="No blog posts have been published yet."
      onPostClick={(post) => setSelectedPostId(post.id)}
    />
  )
}
