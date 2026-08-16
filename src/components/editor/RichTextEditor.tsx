'use client'

import { cn } from '@/utils/cn'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Underline } from '@tiptap/extension-underline'
import { Youtube } from '@tiptap/extension-youtube'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignLeft,
  Bold,
  ChevronDown,
  Code2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Outdent,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Type,
  Underline as UnderlineIcon,
  Video,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export type RichTextEditorProps = {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
  disabled?: boolean
}

type ToolbarBtnProps = {
  active?: boolean
  disabled?: boolean
  title: string
  onClick: () => void
  children: ReactNode
}

function ToolbarBtn({ active, disabled, title, onClick, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors dark:text-slate-300',
        active
          ? 'bg-slate-200 text-slate-900 dark:bg-white/15 dark:text-white'
          : 'hover:bg-slate-100 dark:hover:bg-white/10',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" aria-hidden />
}

const HEADING_OPTIONS: { label: string; level: 0 | 1 | 2 | 3 | 4 }[] = [
  { label: 'Paragraph', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
  { label: 'Heading 4', level: 4 },
]

const TEXT_COLORS = ['#0f172a', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777']
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#a5f3fc', '#ddd6fe', '#fecdd3', '#e2e8f0']

function currentHeadingLabel(editor: Editor): string {
  for (const opt of HEADING_OPTIONS) {
    if (opt.level === 0) {
      if (editor.isActive('paragraph')) return opt.label
    } else if (editor.isActive('heading', { level: opt.level })) {
      return opt.label
    }
  }
  return 'Paragraph'
}

function RichTextToolbar({ editor }: { editor: Editor }) {
  const [, setTick] = useState(0)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rerender = () => setTick((n) => n + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (headingRef.current && !headingRef.current.contains(t)) setHeadingOpen(false)
      if (colorRef.current && !colorRef.current.contains(t)) setColorOpen(false)
      if (highlightRef.current && !highlightRef.current.contains(t)) setHighlightOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL', prev || 'https://')
    if (url === null) return
    const trimmed = url.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL', 'https://')
    if (!url?.trim()) return
    editor.chain().focus().setImage({ src: url.trim() }).run()
  }, [editor])

  const addVideo = useCallback(() => {
    const url = window.prompt('YouTube or video URL', 'https://')
    if (!url?.trim()) return
    const trimmed = url.trim()
    if (/youtu(\.be|be\.com)/i.test(trimmed)) {
      editor.commands.setYoutubeVideo({ src: trimmed })
      return
    }
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${trimmed.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p>`
      )
      .run()
  }, [editor])

  const cycleAlign = useCallback(() => {
    if (editor.isActive({ textAlign: 'left' }) || !editor.isActive('textAlign')) {
      editor.chain().focus().setTextAlign('center').run()
    } else if (editor.isActive({ textAlign: 'center' })) {
      editor.chain().focus().setTextAlign('right').run()
    } else if (editor.isActive({ textAlign: 'right' })) {
      editor.chain().focus().setTextAlign('justify').run()
    } else {
      editor.chain().focus().setTextAlign('left').run()
    }
  }, [editor])

  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-200/80 bg-slate-50/80 px-2 py-2 dark:border-white/10 dark:bg-white/3">
      <div className="flex flex-wrap items-center gap-0.5">
        <div className="relative" ref={headingRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setHeadingOpen((o) => !o)}
            className="inline-flex h-8 min-w-28 items-center justify-between gap-1 rounded-lg px-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-1.5">
              <Heading3 className="h-3.5 w-3.5" />
              {currentHeadingLabel(editor)}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          {headingOpen ? (
            <div className="absolute top-full left-0 z-30 mt-1 min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]">
              {HEADING_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (opt.level === 0) editor.chain().focus().setParagraph().run()
                    else editor.chain().focus().toggleHeading({ level: opt.level }).run()
                    setHeadingOpen(false)
                  }}
                  className={cn(
                    'block w-full px-3 py-1.5 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5',
                    opt.level === 0
                      ? editor.isActive('paragraph') && 'bg-slate-100 dark:bg-white/10'
                      : editor.isActive('heading', { level: opt.level }) && 'bg-slate-100 dark:bg-white/10'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <ToolbarDivider />

        <ToolbarBtn
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Bulleted list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Subscript"
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Superscript"
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          title="Decrease indent"
          onClick={() => {
            if (editor.can().liftListItem('listItem')) editor.chain().focus().liftListItem('listItem').run()
            else editor.chain().focus().setTextAlign('left').run()
          }}
        >
          <Outdent className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Increase indent"
          onClick={() => {
            if (editor.can().sinkListItem('listItem')) editor.chain().focus().sinkListItem('listItem').run()
          }}
        >
          <Indent className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn title="Text alignment" onClick={cycleAlign}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>

        <div className="relative" ref={colorRef}>
          <ToolbarBtn title="Text color" active={colorOpen} onClick={() => setColorOpen((o) => !o)}>
            <Type className="h-4 w-4" />
          </ToolbarBtn>
          {colorOpen ? (
            <div className="absolute top-full left-0 z-30 mt-1 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run()
                    setColorOpen(false)
                  }}
                  className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                title="Reset color"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetColor().run()
                  setColorOpen(false)
                }}
                className="px-1 text-[10px] font-bold text-slate-500"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={highlightRef}>
          <ToolbarBtn
            title="Highlight"
            active={editor.isActive('highlight') || highlightOpen}
            onClick={() => setHighlightOpen((o) => !o)}
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarBtn>
          {highlightOpen ? (
            <div className="absolute top-full left-0 z-30 mt-1 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: c }).run()
                    setHighlightOpen(false)
                  }}
                  className="h-5 w-5 rounded-md border border-slate-200 dark:border-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                type="button"
                title="Clear highlight"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run()
                  setHighlightOpen(false)
                }}
                className="px-1 text-[10px] font-bold text-slate-500"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarBtn title="Insert link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert video" onClick={addVideo}>
          <Video className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarBtn>
      </div>
    </div>
  )
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write a detailed description…',
  className,
  minHeightClassName = 'min-h-48',
  disabled = false,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({
        modestBranding: true,
        HTMLAttributes: { class: 'vcard-rich-youtube' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current?.(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'vcard-rich-editor px-4 py-3 text-[14px] leading-relaxed text-slate-900 focus:outline-none dark:text-white',
          minHeightClassName
        ),
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (next !== current && next !== '<p></p>') {
      // Avoid fighting the caret while typing the same content.
      if (stripEmpty(next) !== stripEmpty(current)) {
        editor.commands.setContent(next, { emitUpdate: false })
      }
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f19]',
          className
        )}
      >
        <div className={cn('animate-pulse bg-slate-50 dark:bg-white/5', minHeightClassName)} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function stripEmpty(html: string): string {
  return html
    .replace(/\s/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br\/?><\/p>/g, '')
}
