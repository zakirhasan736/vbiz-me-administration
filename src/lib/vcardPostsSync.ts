import { TAB_REGISTRY } from '@/lib/tabRegistry'
import { persistableFaqs, persistableGeneralPosts, persistableSectionPosts } from '@/lib/vcardAutosave'
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

type ListBlogsFn = (args: string) => { unwrap: () => Promise<ApiPost[]> }
type CreateBlogFn = (args: { id: string; body: Record<string, unknown> }) => { unwrap: () => Promise<ApiPost> }
type UpdateBlogFn = (args: { id: string; blogId: string; body: Record<string, unknown> }) => {
  unwrap: () => Promise<ApiPost>
}
type DeleteBlogFn = (args: { id: string; blogId: string }) => { unwrap: () => Promise<unknown> }

type ListTabItemsFn = (args: { id: string; tabKey: string }) => { unwrap: () => Promise<ApiPost[]> }
type CreateTabItemFn = (args: { id: string; tabKey: string; body: Record<string, unknown> }) => {
  unwrap: () => Promise<ApiPost>
}
type UpdateTabItemFn = (args: { id: string; tabKey: string; itemId: string; body: Record<string, unknown> }) => {
  unwrap: () => Promise<ApiPost>
}
type DeleteTabItemFn = (args: { id: string; tabKey: string; itemId: string }) => { unwrap: () => Promise<unknown> }

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

function publicSectionNameToTabKey(postTypeName: string): string | null {
  const needle = postTypeName.trim().toLowerCase()
  if (needle === 'faq' || needle === 'faqs') return 'faqs'
  if (needle === 'mission' || needle === 'mission statement' || needle === 'company mission statement') {
    return 'mission_statement'
  }
  for (const tab of Object.values(TAB_REGISTRY)) {
    if (tab.publicSectionName.toLowerCase() === needle || tab.key.toLowerCase() === needle) return tab.key
  }
  return null
}

function syncItemSignature(item: SyncItem) {
  return JSON.stringify({
    title: item.title || '',
    description: item.description || '',
    url: item.url || '',
    featuredImage: item.featuredImage || '',
    status: String(item.status ?? '1'),
    sortOrder: item.sortOrder ?? 0,
    metas: item.metas || {},
  })
}

function unchangedSavedPost(item: SyncItem): ApiPost {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    featuredImage: item.featuredImage,
    status: item.status,
    sortOrder: item.sortOrder,
  } as ApiPost
}

function idsAsExisting(items: Array<{ id: string }> | undefined): ApiPost[] {
  return (items || []).filter((item) => item.id && !isLocalTempId(item.id)).map((item) => ({ id: item.id }) as ApiPost)
}

function stableJson(value: unknown) {
  return JSON.stringify(value ?? null)
}

export type PostsSnapshot = {
  generalPosts?: VCardGeneralPost[]
  faqs?: VCardFaqEntry[]
  sectionPosts?: Record<string, VCardSectionPostItem[]>
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
  previousItems?: SyncItem[]
  createPost: CreatePostFn
  updatePost: UpdatePostFn
  deletePost: DeletePostFn
}): Promise<ApiPost[]> {
  const { profileId, postTypeName, existing, items, previousItems, createPost, updatePost, deletePost } = options
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const previousById = new Map((previousItems || []).map((item) => [item.id, item]))
  const keptIds = new Set(items.filter((i) => existingById.has(i.id) && !isLocalTempId(i.id)).map((i) => i.id))

  await Promise.all(
    existing.filter((p) => !keptIds.has(p.id)).map((p) => deletePost({ id: profileId, postId: p.id }).unwrap())
  )

  const saved: ApiPost[] = []
  for (const item of items) {
    const hasContent = Boolean(
      item.title?.trim() || item.description?.trim() || item.url?.trim() || item.featuredImage?.trim()
    )
    if (!hasContent && (isLocalTempId(item.id) || !existingById.has(item.id))) continue
    const payload = {
      title: item.title,
      description: item.description,
      url: item.url,
      featuredImage: item.featuredImage,
      status: item.status,
      documents: item.documents,
    }
    if (existingById.has(item.id) && !isLocalTempId(item.id)) {
      const prev = previousById.get(item.id)
      if (prev && syncItemSignature(prev) === syncItemSignature(item)) {
        saved.push(unchangedSavedPost(item))
        continue
      }
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

async function syncDirectBlogs(options: {
  profileId: string
  existing: ApiPost[]
  items: SyncItem[]
  previousItems?: SyncItem[]
  createBlog: CreateBlogFn
  updateBlog: UpdateBlogFn
  deleteBlog: DeleteBlogFn
}): Promise<ApiPost[]> {
  const { profileId, existing, items, previousItems, createBlog, updateBlog, deleteBlog } = options
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const previousById = new Map((previousItems || []).map((item) => [item.id, item]))
  const keptIds = new Set(items.filter((i) => existingById.has(i.id) && !isLocalTempId(i.id)).map((i) => i.id))

  await Promise.all(
    existing.filter((p) => !keptIds.has(p.id)).map((p) => deleteBlog({ id: profileId, blogId: p.id }).unwrap())
  )

  const saved: ApiPost[] = []
  for (const item of items) {
    const hasContent = Boolean(
      item.title?.trim() || item.description?.trim() || item.url?.trim() || item.featuredImage?.trim()
    )
    if (!hasContent && (isLocalTempId(item.id) || !existingById.has(item.id))) continue
    const body = {
      title: item.title,
      description: item.description,
      url: item.url,
      featuredImage: item.featuredImage,
      status: item.status,
      sortOrder: item.sortOrder,
      metas: item.metas,
      category: item.metas?.category,
      date: item.metas?.date,
    }
    if (existingById.has(item.id) && !isLocalTempId(item.id)) {
      const prev = previousById.get(item.id)
      if (prev && syncItemSignature(prev) === syncItemSignature(item)) {
        saved.push(unchangedSavedPost(item))
        continue
      }
      saved.push(await updateBlog({ id: profileId, blogId: item.id, body }).unwrap())
    } else {
      saved.push(await createBlog({ id: profileId, body }).unwrap())
    }
  }
  return saved
}

async function syncDirectTabItems(options: {
  profileId: string
  tabKey: string
  existing: ApiPost[]
  items: SyncItem[]
  previousItems?: SyncItem[]
  createTabItem: CreateTabItemFn
  updateTabItem: UpdateTabItemFn
  deleteTabItem: DeleteTabItemFn
}): Promise<ApiPost[]> {
  const { profileId, tabKey, existing, items, previousItems, createTabItem, updateTabItem, deleteTabItem } = options
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const previousById = new Map((previousItems || []).map((item) => [item.id, item]))
  const keptIds = new Set(items.filter((i) => existingById.has(i.id) && !isLocalTempId(i.id)).map((i) => i.id))

  await Promise.all(
    existing
      .filter((p) => !keptIds.has(p.id))
      .map((p) => deleteTabItem({ id: profileId, tabKey, itemId: p.id }).unwrap())
  )

  const saved: ApiPost[] = []
  for (const item of items) {
    const hasContent = Boolean(
      item.title?.trim() || item.description?.trim() || item.url?.trim() || item.featuredImage?.trim()
    )
    if (!hasContent && (isLocalTempId(item.id) || !existingById.has(item.id))) continue
    const body = {
      title: item.title,
      description: item.description,
      url: item.url,
      featuredImage: item.featuredImage,
      status: item.status,
      sortOrder: item.sortOrder,
      metas: item.metas,
    }
    if (existingById.has(item.id) && !isLocalTempId(item.id)) {
      const prev = previousById.get(item.id)
      if (prev && syncItemSignature(prev) === syncItemSignature(item)) {
        saved.push(unchangedSavedPost(item))
        continue
      }
      saved.push(await updateTabItem({ id: profileId, tabKey, itemId: item.id, body }).unwrap())
    } else {
      saved.push(await createTabItem({ id: profileId, tabKey, body }).unwrap())
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
    featuredImage: f.featuredImage || undefined,
    url: f.url || undefined,
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
      clientKey: p.id,
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
  snapshot?: PostsSnapshot
  listPosts: ListPostsFn
  createPost: CreatePostFn
  updatePost: UpdatePostFn
  deletePost: DeletePostFn
  listBlogs?: ListBlogsFn
  createBlog?: CreateBlogFn
  updateBlog?: UpdateBlogFn
  deleteBlog?: DeleteBlogFn
  listTabItems?: ListTabItemsFn
  createTabItem?: CreateTabItemFn
  updateTabItem?: UpdateTabItemFn
  deleteTabItem?: DeleteTabItemFn
}): Promise<{ blog?: ApiPost[]; faqs?: ApiPost[]; sectionPosts: Record<string, ApiPost[]> }> {
  const snapshot = options.snapshot || {}
  const schemas = Object.values(VCARD_SECTION_SCHEMAS)
  const useDirectBlogs = Boolean(options.createBlog && options.updateBlog && options.deleteBlog)
  const useDirectTabs = Boolean(options.createTabItem && options.updateTabItem && options.deleteTabItem)

  const blogsDirty =
    stableJson(persistableGeneralPosts(options.blogPosts)) !==
    stableJson(persistableGeneralPosts(snapshot.generalPosts || []))
  const faqsDirty = stableJson(persistableFaqs(options.faqs)) !== stableJson(persistableFaqs(snapshot.faqs || []))
  const persistableCurrent = persistableSectionPosts(options.sectionPosts)
  const persistableSnapshot = persistableSectionPosts(snapshot.sectionPosts)
  const dirtySchemas = schemas.filter(
    (schema) =>
      stableJson(persistableCurrent[schema.postTypeName] || []) !==
      stableJson(persistableSnapshot[schema.postTypeName] || [])
  )

  let blog: ApiPost[] | undefined
  if (blogsDirty) {
    const items = generalPostsToSyncItems(options.blogPosts)
    const previousItems = generalPostsToSyncItems(snapshot.generalPosts || [])
    const existing = idsAsExisting(snapshot.generalPosts)
    blog = useDirectBlogs
      ? await syncDirectBlogs({
          profileId: options.profileId,
          existing,
          items,
          previousItems,
          createBlog: options.createBlog!,
          updateBlog: options.updateBlog!,
          deleteBlog: options.deleteBlog!,
        })
      : await syncProfilePosts({
          profileId: options.profileId,
          postTypeName: BLOG_POST_TYPE,
          existing,
          items,
          previousItems,
          createPost: options.createPost,
          updatePost: options.updatePost,
          deletePost: options.deletePost,
        })
  }

  let faqs: ApiPost[] | undefined
  if (faqsDirty) {
    const items = faqsToSyncItems(options.faqs)
    const previousItems = faqsToSyncItems(snapshot.faqs || [])
    const existing = idsAsExisting(snapshot.faqs)
    faqs =
      useDirectTabs && TAB_REGISTRY.faqs?.architecture === 'direct'
        ? await syncDirectTabItems({
            profileId: options.profileId,
            tabKey: 'faqs',
            existing,
            items,
            previousItems,
            createTabItem: options.createTabItem!,
            updateTabItem: options.updateTabItem!,
            deleteTabItem: options.deleteTabItem!,
          })
        : await syncProfilePosts({
            profileId: options.profileId,
            postTypeName: FAQ_POST_TYPE,
            existing,
            items,
            previousItems,
            createPost: options.createPost,
            updatePost: options.updatePost,
            deletePost: options.deletePost,
          })
  }

  const sectionPosts: Record<string, ApiPost[]> = {}
  await Promise.all(
    dirtySchemas.map(async (schema) => {
      const tabKey = publicSectionNameToTabKey(schema.postTypeName)
      const items = sectionPostsToSyncItems(options.sectionPosts?.[schema.postTypeName] || [])
      const previousItems = sectionPostsToSyncItems(snapshot.sectionPosts?.[schema.postTypeName] || [])
      const existing = idsAsExisting(snapshot.sectionPosts?.[schema.postTypeName])
      sectionPosts[schema.postTypeName] =
        useDirectTabs && tabKey && TAB_REGISTRY[tabKey]?.architecture === 'direct'
          ? await syncDirectTabItems({
              profileId: options.profileId,
              tabKey,
              existing,
              items,
              previousItems,
              createTabItem: options.createTabItem!,
              updateTabItem: options.updateTabItem!,
              deleteTabItem: options.deleteTabItem!,
            })
          : await syncProfilePosts({
              profileId: options.profileId,
              postTypeName: schema.postTypeName,
              existing,
              items,
              previousItems,
              createPost: options.createPost,
              updatePost: options.updatePost,
              deletePost: options.deletePost,
            })
    })
  )

  return { blog, faqs, sectionPosts }
}
