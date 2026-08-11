import { MAX_FILES, MAX_UPLOAD_BYTES } from '@/lib/ai/openai'
import mammoth from 'mammoth'

export type ExtractedSource = {
  label: string
  text: string
  images: Array<{ mimeType: string; base64: string }>
}

export type UploadedPart = {
  name: string
  mimeType: string
  buffer: Buffer
}

function truncate(text: string, max = 24000): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n[Truncated…]`
}

export async function extractTextFromBuffer(file: UploadedPart): Promise<ExtractedSource> {
  const mime = (file.mimeType || '').toLowerCase()
  const name = file.name || 'upload'

  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    return { label: name, text: truncate(file.buffer.toString('utf8')), images: [] }
  }

  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer })
    return { label: name, text: truncate(result.value || ''), images: [] }
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    // pdf-parse v2 ESM default export varies; load dynamically
    const pdfParseMod = await import('pdf-parse')
    const pdfParse = (pdfParseMod as { default?: (b: Buffer) => Promise<{ text: string }> }).default || pdfParseMod
    const parsed = await (pdfParse as (b: Buffer) => Promise<{ text: string }>)(file.buffer)
    return { label: name, text: truncate(parsed.text || ''), images: [] }
  }

  if (mime.startsWith('image/')) {
    return {
      label: name,
      text: `[Image attached: ${name}. Use vision to OCR / extract business details.]`,
      images: [{ mimeType: mime || 'image/jpeg', base64: file.buffer.toString('base64') }],
    }
  }

  // Fallback: try utf8
  return { label: name, text: truncate(file.buffer.toString('utf8')), images: [] }
}

export async function fetchWebsiteText(url: string): Promise<string> {
  const normalized = url.startsWith('http') ? url : `https://${url}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'vBizCardAgent/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`Website fetch failed (${res.status})`)
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return truncate(text, 20000)
  } finally {
    clearTimeout(timer)
  }
}

export function assertUploadLimits(files: UploadedPart[]) {
  if (files.length > MAX_FILES) {
    throw new Error(`Too many files (max ${MAX_FILES}).`)
  }
  for (const f of files) {
    if (f.buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error(`File “${f.name}” exceeds ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit.`)
    }
  }
}

export async function parseMultipartFiles(form: FormData): Promise<UploadedPart[]> {
  const files: UploadedPart[] = []
  for (const [key, value] of form.entries()) {
    if (key !== 'files' && key !== 'file') continue
    if (typeof value === 'string') continue
    const file = value as File
    const buffer = Buffer.from(await file.arrayBuffer())
    files.push({
      name: file.name || 'upload',
      mimeType: file.type || 'application/octet-stream',
      buffer,
    })
  }
  assertUploadLimits(files)
  return files
}
