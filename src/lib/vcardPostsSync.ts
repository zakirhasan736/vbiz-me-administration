import { VCARD_SECTION_SCHEMAS } from '@/lib/vcardSectionSchemas'
import type { ApiPost, PostDocumentPayload } from '@/redux/features/profiles/profiles.api'
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
    documents?: PostDocumentPayload[]
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
    metas?: Record<string, string>
    documents?: PostDocumentPayload[]
  }
}) => { unwrap: () => Promise<ApiPost> }

type DeletePostFn = (args: { id: string; postId: string }) => { unwrap: () => Promise<unknown> }

type ListPostsFn = (args: { id: string; postType?: string }) => { unwrap: () => Promise<ApiPost[]> }

type SyncItem = {
  id: string
  title: string
  description: string
  url?: string
  featuredImage?: string
  status: string
  metas?: Record<string, string>
  documents?: PostDocumentPayload[]
  sortOrder: number
}

/**
 * Sync local blog/FAQ editor items with authenticated `/profiles/:id/posts`.
 * Creates new rows, patches existing, soft-deletes removed.
 */
export async function syncProfilePosts(options: {
  profileId: string
  postTypeName: string
  existing: ApiPost[]
  items: SyncItem[]
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
      documents: item.documents,
    }
    if (existingById.has(item.id) && !isLocalTempId(item.id)) {
      const updated = await updatePost({
        id: profileId,
        postId: item.id,
        body: { ...payload, sortOrder: item.sortOrder, metas: item.metas },
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
          body: { sortOrder: item.sortOrder, metas: item.metas },
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
      category: p.category || '',
      date: p.date || '',
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

function parseDocumentsMeta(raw: unknown): PostDocumentPayload[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return parseDocumentsMeta(JSON.parse(raw))
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const doc = entry as Record<string, unknown>
      const url = typeof doc.url === 'string' ? doc.url.trim() : ''
      if (!url) return null
      return {
        url,
        name: typeof doc.name === 'string' ? doc.name : undefined,
        type: typeof doc.type === 'string' ? doc.type : undefined,
      } satisfies PostDocumentPayload
    })
    .filter(Boolean) as PostDocumentPayload[]
}

export function sectionPostsToSyncItems(items: VCardSectionPostItem[]): SyncItem[] {
  return items.map((p, index) => {
    const metas = { ...(p.metas || {}) }
    const documentsFromMeta = parseDocumentsMeta(metas.documents)
    delete metas.documents

    const documents =
      documentsFromMeta.length > 0
        ? documentsFromMeta
        : p.featuredImage?.trim()
          ? [{ url: p.featuredImage.trim(), name: 'document' }]
          : undefined

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      url: p.url || undefined,
      featuredImage: p.featuredImage || documents?.[0]?.url || undefined,
      status: p.active ? '1' : '0',
      metas: {
        date: p.date || '',
        rating: p.rating || '',
        location: p.location || '',
        ...metas,
      },
      documents,
      sortOrder: index,
    }
  })
}

function metaMap(metas?: ApiPost['metas']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of metas || []) {
    if (m.metaKey) out[m.metaKey] = m.metaValue ?? ''
  }
  return out
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10)
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getUTCFullYear()
  const m = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const d = String(parsed.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function attachmentsToDocumentsJson(post: ApiPost): string | undefined {
  const docs: Array<{ id: string; name: string; url: string; type: string; size: number }> = []
  for (const [index, a] of (post.attachments || []).entries()) {
    const url = a.url?.trim()
    if (!url) continue
    docs.push({
      id: a.id || `att_${index}`,
      name: a.docName || 'Document',
      url,
      type: a.mimeType || 'application/octet-stream',
      size: 0,
    })
  }
  if (!docs.length && post.featuredImage?.trim()) {
    docs.push({
      id: 'featured',
      name: 'Document',
      url: post.featuredImage.trim(),
      type: 'application/octet-stream',
      size: 0,
    })
  }
  return docs.length ? JSON.stringify(docs) : undefined
}

export function mapApiPostsToSectionPosts(posts: ApiPost[]): VCardSectionPostItem[] {
  return posts.map((p) => {
    const metas = metaMap(p.metas)
    const { date = '', rating = '', location = '', ...rest } = metas
    const documentsJson = attachmentsToDocumentsJson(p)
    if (documentsJson && !rest.documents) {
      rest.documents = documentsJson
    }
    return {
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      url: p.url || '',
      featuredImage: p.featuredImage || '',
      date: toDateInputValue(date),
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
