/** Trigger a same-tab file download from a Blob / object URL. */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}

function extensionForKind(kind: 'image' | 'pdf' | 'file', url: string, mimeType?: string): string {
  const fromUrl = url.match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i)?.[1]?.toLowerCase()
  if (fromUrl && /^[a-z0-9]+$/i.test(fromUrl)) return fromUrl
  if (kind === 'pdf' || mimeType?.includes('pdf')) return 'pdf'
  if (kind === 'image') {
    if (mimeType?.includes('png')) return 'png'
    if (mimeType?.includes('webp')) return 'webp'
    if (mimeType?.includes('gif')) return 'gif'
    return 'jpg'
  }
  if (mimeType?.includes('word') || mimeType?.includes('msword')) return 'docx'
  if (mimeType?.includes('text')) return 'txt'
  return 'bin'
}

export function resumeDownloadFilename(label: string, kind: 'image' | 'pdf' | 'file', url: string, mimeType?: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ext = extensionForKind(kind, url, mimeType)
  return `${slug || 'resume-document'}.${ext}`
}

/**
 * Force a download for resume / media URLs.
 * Cross-origin links ignore the HTML `download` attribute, so we fetch via
 * `/api/proxy-media` (or directly for blob/data URLs) and save the blob.
 */
export async function downloadResumeFile(options: {
  url: string
  label: string
  kind: 'image' | 'pdf' | 'file'
}): Promise<void> {
  const href = options.url.trim()
  if (!href) throw new Error('Missing file URL')

  if (href.startsWith('blob:') || href.startsWith('data:')) {
    const response = await fetch(href)
    if (!response.ok) throw new Error('Failed to read file')
    const blob = await response.blob()
    triggerBlobDownload(blob, resumeDownloadFilename(options.label, options.kind, href, blob.type))
    return
  }

  const filename = resumeDownloadFilename(options.label, options.kind, href)
  const proxyUrl = `/api/proxy-media?url=${encodeURIComponent(href)}&download=${encodeURIComponent(filename)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) {
    throw new Error('Download failed. Please try again.')
  }
  const blob = await response.blob()
  if (blob.type.includes('application/json')) {
    throw new Error('Download failed. Please try again.')
  }
  triggerBlobDownload(blob, resumeDownloadFilename(options.label, options.kind, href, blob.type))
}
