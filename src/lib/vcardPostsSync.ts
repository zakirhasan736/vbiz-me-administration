import { VCARD_SECTION_SCHEMAS } from '@/lib/vcardSectionSchemas'
import type { ApiPost } from '@/redux/features/profiles/profiles.api'
import { BLOG_POST_TYPE, FAQ_POST_TYPE, isLocalTempId } from '@/redux/features/profiles/profiles.api'
import type { VCardFaqEntry, VCardGeneralPost, VCardSectionPostItem } from '@/types/vcard'

export { isLocalTempId }

type CreatePostFn = (args: {
  id: string
  body: {
    title?: string
    description?: string
    postTypeName?: string
    url?: string
    featuredImage?: string
    status?: string
    metas?: Record<string, string>
  }
}) => { unwrap: () => Promise<ApiPost> }

type UpdatePostFn = (args: {
  id: string
  postId: string
  body: {
    title?: string
    description?: string
    url?: string
    featuredImage?: string
    status?: string
    sortOrder?: number
  }
}) => { unwrap: () => Promise<ApiPost> }

type DeletePostFn = (args: { id: string; postId: string }) => { unwrap: () => Promise<unknown> }

type ListPostsFn = (args: { id: string; postType?: string }) => { unwrap: () => Promise<ApiPost[]> }

/**
 * Sync local blog/FAQ editor items with authenticated `/profiles/:id/posts`.
 * Creates new rows, patches existing, soft-deletes removed.
 */
export async function syncProfilePosts(options: {
  profileId: string
  postTypeName: string
  existing: ApiPost[]
  items: Array<{
    id: string
    title: string
    description: string
    url?: string
    featuredImage?: string
    status: string
    metas?: Record<string, string>
    sortOrder: number
  }>
  createPost: CreatePostFn
  updatePost: UpdatePostFn
  deletePost: DeletePostFn
}): Promise<ApiPost[]> {
  const { profileId, postTypeName, existing, items, createPost, updatePost, deletePost } = options
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const keptIds = new Set(items.filter((i) => existingById.has(i.id) && !isLocalTempId(i.id)).map((i) => i.id))

  await Promise.all(
    existing.filter((p) => !keptIds.has(p.id)).map((p) => deletePost({ id: profileId, postId: p.id }).unwrap())
  )

  const saved: ApiPost[] = []
  for (const item of items) {
    const payload = {
      title: item.title,
      description: item.description,
      url: item.url,
      featuredImage: item.featuredImage,
      status: item.status,
    }
    if (existingById.has(item.id) && !isLocalTempId(item.id)) {
      const updated = await updatePost({
        id: profileId,
        postId: item.id,
        body: { ...payload, sortOrder: item.sortOrder },
      }).unwrap()
      saved.push(updated)
    } else {
      const created = await createPost({
        id: profileId,
        body: {
          ...payload,
          postTypeName,
          metas: item.metas,
        },
      }).unwrap()
      if (item.sortOrder > 0) {
        const ordered = await updatePost({
          id: profileId,
          postId: created.id,
          body: { sortOrder: item.sortOrder },
        }).unwrap()
        saved.push(ordered)
      } else {
        saved.push(created)
      }
    }
  }
  return saved
}

export function generalPostsToSyncItems(posts: VCardGeneralPost[]) {
  return posts.map((p, index) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.customUrl || undefined,
    featuredImage: p.featuredImage || undefined,
    status: p.active ? '1' : '0',
    metas: {
      ...(p.category ? { category: p.category } : {}),
      ...(p.date ? { date: p.date } : {}),
    },
    sortOrder: index,
  }))
}

export function faqsToSyncItems(faqs: VCardFaqEntry[]) {
  return faqs.map((f, index) => ({
    id: f.id,
    title: f.question,
    description: f.answer,
    status: f.active ? '1' : '0',
    sortOrder: index,
  }))
}

export function sectionPostsToSyncItems(items: VCardSectionPostItem[]) {
  return items.map((p, index) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.url || undefined,
    featuredImage: p.featuredImage || undefined,
    status: p.active ? '1' : '0',
    metas: {
      ...(p.date ? { date: p.date } : {}),
      ...(p.rating ? { rating: p.rating } : {}),
      ...(p.location ? { location: p.location } : {}),
      ...(p.metas || {}),
    },
    sortOrder: index,
  }))
}

function metaMap(metas?: ApiPost['metas']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of metas || []) {
    if (m.metaKey) out[m.metaKey] = m.metaValue ?? ''
  }
  return out
}

export function mapApiPostsToSectionPosts(posts: ApiPost[]): VCardSectionPostItem[] {
  return posts.map((p) => {
    const metas = metaMap(p.metas)
    const { date = '', rating = '', location = '', ...rest } = metas
    return {
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      url: p.url || '',
      featuredImage: p.featuredImage || '',
      date,
      rating,
      location,
      active: p.status !== '0' && p.status !== 'false',
      ...(Object.keys(rest).length ? { metas: rest } : {}),
    }
  })
}

export async function loadAndSyncSectionPosts(options: {
  profileId: string
  blogPosts: VCardGeneralPost[]
  faqs: VCardFaqEntry[]
  sectionPosts?: Record<string, VCardSectionPostItem[]>
  listPosts: ListPostsFn
  createPost: CreatePostFn
  updatePost: UpdatePostFn
  deletePost: DeletePostFn
}): Promise<{ blog: ApiPost[]; faqs: ApiPost[]; sectionPosts: Record<string, ApiPost[]> }> {
  const schemas = Object.values(VCARD_SECTION_SCHEMAS)
  const sectionPostTypeNames = schemas.map((s) => s.postTypeName)

  const [existingBlog, existingFaq, ...existingSections] = await Promise.all([
    options.listPosts({ id: options.profileId, postType: BLOG_POST_TYPE }).unwrap(),
    options.listPosts({ id: options.profileId, postType: FAQ_POST_TYPE }).unwrap(),
    ...sectionPostTypeNames.map((postType) =>
      options
        .listPosts({ id: options.profileId, postType })
        .unwrap()
        .catch(() => [] as ApiPost[])
    ),
  ])

  const [blog, faqs, ...syncedSections] = await Promise.all([
    syncProfilePosts({
      profileId: options.profileId,
      postTypeName: BLOG_POST_TYPE,
      existing: existingBlog,
      items: generalPostsToSyncItems(options.blogPosts),
      createPost: options.createPost,
      updatePost: options.updatePost,
      deletePost: options.deletePost,
    }),
    syncProfilePosts({
      profileId: options.profileId,
      postTypeName: FAQ_POST_TYPE,
      existing: existingFaq,
      items: faqsToSyncItems(options.faqs),
      createPost: options.createPost,
      updatePost: options.updatePost,
      deletePost: options.deletePost,
    }),
    ...schemas.map((schema, index) =>
      syncProfilePosts({
        profileId: options.profileId,
        postTypeName: schema.postTypeName,
        existing: existingSections[index] || [],
        items: sectionPostsToSyncItems(options.sectionPosts?.[schema.postTypeName] || []),
        createPost: options.createPost,
        updatePost: options.updatePost,
        deletePost: options.deletePost,
      })
    ),
  ])

  const sectionPosts: Record<string, ApiPost[]> = {}
  schemas.forEach((schema, index) => {
    sectionPosts[schema.postTypeName] = syncedSections[index] || []
  })

  return { blog, faqs, sectionPosts }
}
